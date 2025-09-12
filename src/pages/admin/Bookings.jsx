// src/pages/admin/Bookings.jsx
import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  TicketIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ArrowsUpDownIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiService from "../../api/apiService";
import { formatBookingDate } from "../../utils/dateFormatter";

/* --------------------------------- helpers -------------------------------- */
const cx = (...c) => c.filter(Boolean).join(" ");
const asNumber = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
const safeDate = (d) => {
  const t = Date.parse(d);
  return Number.isNaN(t) ? null : new Date(t);
};
const toMoney = (amount, currency = "USD") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount || 0));

function Badge({ children, tone = "gray" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    gray: "bg-gray-50 text-gray-700 ring-gray-200",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1", tones[tone])}>
      {children}
    </span>
  );
}

function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "min-w-[96px] sm:min-w-[112px] px-3 py-2 rounded-full text-xs font-medium border transition-colors",
        active ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      )}
    >
      {children}
    </button>
  );
}

function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl bg-white ring-1 ring-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-50" aria-label="Close">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">{footer}</div>}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 12 }).map((_, i) => (
        <td key={i} className="p-3">
          <div className="h-3 w-full max-w-[160px] animate-pulse rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  );
}

/* ---------------------------------- page ---------------------------------- */
export default function Bookings() {
  // query / filters
  const [rawSearch, setRawSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState(""); // All by default
  const [bookingStatusFilter, setBookingStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountFilter, setAmountFilter] = useState({ min: "", max: "" });
  const [density, setDensity] = useState("comfortable"); // 'comfortable' | 'compact'

  // sort & pagination
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [bookingsPerPage, setBookingsPerPage] = useState(10);

  // selection
  const [selectedBookings, setSelectedBookings] = useState([]);

  // data
  const [bookings, setBookings] = useState([]);
  const [auditLog, setAuditLog] = useState([]);

  // modals
  const [editBooking, setEditBooking] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // ui
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ------------------------------- data fetch ------------------------------ */
  useEffect(() => {
    let cancelled = false;
    async function fetchBookings() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.get("/bookings");
        const apiBookings = response?.data?.data?.data || [];

        const formatted = apiBookings.map((booking) => {
          const segments = Array.isArray(booking.segments) ? booking.segments : [];

          const passengerNames = (booking.passengers || [])
            .map((p) => `${p.firstName} ${p.lastName}`)
            .join(", ");

          const flightSegments = segments.map((segment) => ({
            airline: segment.airline || "N/A",
            airlineName: segment.airlineName || segment.airline || "Unknown Airline",
            flightNumber: segment.flightNumber || "N/A",
            origin: segment.origin || "N/A",
            destination: segment.destination || "N/A",
            departureTime: segment.departureTime || "N/A",
            arrivalTime: segment.arrivalTime || "N/A",
            cabin: segment.cabin || "Economy",
            baggage: segment.baggage || "N/A",
          }));

          // derive route (first origin → last destination)
          const route =
            flightSegments.length > 0
              ? `${flightSegments[0].origin} → ${flightSegments[flightSegments.length - 1].destination}`
              : "N/A";

          return {
            id: booking.id,
            date: booking.booking_date || booking.created_at || booking.date || null,
            module: "Flights",
            orderNum: booking.order_num || "N/A",
            flightNum: flightSegments.map((seg) => seg.flightNumber).filter(Boolean).join(" / ") || "N/A",
            supplier: flightSegments.map((seg) => seg.airlineName).filter(Boolean).join(" / ") || "Unknown Airline",
            traveller: passengerNames || "Unknown Traveller",
            email: booking.contactEmail || "unknown@example.com",
            bookingStatus: booking.status || "Pending",
            paymentStatus: booking.payment_status || "Unpaid",
            total: Number(booking.total_amount || 0),
            agentFee: Number(booking.agent_fee || 0),
            currency: booking.currency || "USD",
            pnr: booking.pnr || "",
            paymentMethod: booking.payment_method || "N/A",
            stops: Math.max(0, flightSegments.length - 1),
            stopoverAirportCodes: flightSegments.slice(1).map((seg) => seg.origin),
            refundable: Boolean(booking.refundable),
            flightDetails: flightSegments,
            route,
          };
        });

        if (!cancelled) setBookings(formatted);
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to fetch bookings:", e);
          setError("We couldn’t load bookings. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchBookings();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------------------- debounced search ------------------------------ */
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(rawSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [rawSearch]);

  /* ----------------------------- reset page on filter/sort ----------------------------- */
  useEffect(() => setCurrentPage(1), [searchTerm, moduleFilter, bookingStatusFilter, paymentStatusFilter, dateFrom, dateTo, amountFilter, bookingsPerPage]);

  /* --------------------------------- sorting --------------------------------- */
  const sortedBookings = useMemo(() => {
    const list = [...bookings];
    const { key, direction } = sortConfig;
    if (!key) return list;
    return list.sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      const av = typeof va === "string" ? va.toLowerCase() : va;
      const bv = typeof vb === "string" ? vb.toLowerCase() : vb;
      return av < bv ? (direction === "asc" ? -1 : 1) : av > bv ? (direction === "asc" ? 1 : -1) : 0;
    });
  }, [bookings, sortConfig]);

  /* -------------------------------- filtering -------------------------------- */
  const filteredBookings = useMemo(() => {
    const min = asNumber(amountFilter.min);
    const max = asNumber(amountFilter.max);
    const fromD = dateFrom ? safeDate(dateFrom) : null;
    const toD = dateTo ? safeDate(dateTo) : null;

    return sortedBookings.filter((b) => {
      const matchesSearch =
        !searchTerm ||
        String(b.orderNum).toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.traveller?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.pnr?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesModule = !moduleFilter || b.module === moduleFilter;
      const matchesBookingStatus = !bookingStatusFilter || b.bookingStatus === bookingStatusFilter;
      const matchesPaymentStatus = !paymentStatusFilter || b.paymentStatus === paymentStatusFilter;

      const amount = Number(b.total || 0);
      const matchesAmount = (min === null || amount >= min) && (max === null || amount <= max);

      let matchesDate = true;
      if (fromD || toD) {
        const d = safeDate(b.date);
        if (!d) {
          matchesDate = false;
        } else {
          if (fromD && d < fromD) matchesDate = false;
          if (toD && d > new Date(toD.getFullYear(), toD.getMonth(), toD.getDate(), 23, 59, 59, 999)) matchesDate = false;
        }
      }

      return matchesSearch && matchesModule && matchesBookingStatus && matchesPaymentStatus && matchesAmount && matchesDate;
    });
  }, [sortedBookings, searchTerm, moduleFilter, bookingStatusFilter, paymentStatusFilter, amountFilter, dateFrom, dateTo]);

  /* -------------------------------- pagination -------------------------------- */
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / bookingsPerPage));
  const paginatedBookings = useMemo(
    () => filteredBookings.slice((currentPage - 1) * bookingsPerPage, currentPage * bookingsPerPage),
    [filteredBookings, currentPage, bookingsPerPage]
  );

  /* ---------------------------------- export --------------------------------- */
  const exportToExcel = () => {
    const exportRows = filteredBookings.map((b) => ({
      "Order #": b.orderNum,
      "Booking Date": b.date ? formatBookingDate(b.date) : "N/A",
      Module: b.module,
      Supplier: b.supplier,
      Traveller: b.traveller,
      Email: b.email,
      "Booking Status": b.bookingStatus,
      "Payment Status": b.paymentStatus,
      "Agent Fee": b.agentFee,
      Total: b.total,
      Currency: b.currency,
      PNR: b.pnr || "N/A",
      "Flight Numbers": b.flightDetails.map((s) => s.flightNumber).join(" / "),
      Route: b.route,
      Stops: b.stops,
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, "bookings_export.xlsx");
    toast.success("Exported to Excel.");
  };

  const exportToCSV = () => {
    const headers = [
      "Order #",
      "Booking Date",
      "Module",
      "Supplier",
      "Traveller",
      "Email",
      "Booking Status",
      "Payment Status",
      "Agent Fee",
      "Total",
      "Currency",
      "PNR",
      "Flight Numbers",
      "Route",
      "Stops",
    ];
    const rows = filteredBookings.map((b) => [
      b.orderNum,
      b.date ? formatBookingDate(b.date) : "N/A",
      b.module,
      b.supplier,
      b.traveller,
      b.email,
      b.bookingStatus,
      b.paymentStatus,
      b.agentFee,
      b.total,
      b.currency,
      b.pnr || "N/A",
      b.flightDetails.map((s) => s.flightNumber).join(" / "),
      b.route,
      b.stops,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookings_export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV.");
  };

  /* --------------------------------- handlers -------------------------------- */
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectBooking = (id) => {
    setSelectedBookings((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAllOnPage = () => {
    const pageIds = paginatedBookings.map((b) => b.id);
    const allSelected = pageIds.every((id) => selectedBookings.includes(id));
    setSelectedBookings((prev) => (allSelected ? prev.filter((id) => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])] ));
  };

  const resetFilters = () => {
    setRawSearch("");
    setModuleFilter("");
    setBookingStatusFilter("");
    setPaymentStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setAmountFilter({ min: "", max: "" });
    setSelectedBookings([]);
    setDensity("comfortable");
  };

  // bulk actions
  const handleBulkAction = (action) => {
    setBookings((list) =>
      list.map((b) =>
        selectedBookings.includes(b.id) ? { ...b, bookingStatus: action === "confirm" ? "Confirmed" : "Cancelled" } : b
      )
    );
    setAuditLog((log) => [
      ...log,
      { action: `Bulk ${action} for ${selectedBookings.length} bookings`, timestamp: new Date().toISOString() },
    ]);
    toast.success(`Bulk ${action} done for ${selectedBookings.length} bookings.`);
    setSelectedBookings([]);
  };

  const handleConfirm = (id) => {
    setBookings((list) => list.map((b) => (b.id === id ? { ...b, bookingStatus: "Confirmed" } : b)));
    setAuditLog((log) => [...log, { action: `Confirmed booking ${id}`, timestamp: new Date().toISOString() }]);
    toast.success("Booking confirmed.");
    setShowConfirmModal(null);
  };

  const handleCancel = (id) => {
    setBookings((list) => list.map((b) => (b.id === id ? { ...b, bookingStatus: "Cancelled" } : b)));
    setAuditLog((log) => [...log, { action: `Cancelled booking ${id}`, timestamp: new Date().toISOString() }]);
    toast.success("Booking cancelled.");
    setShowCancelModal(null);
  };

  const handleDelete = (id) => {
    setBookings((list) => list.filter((b) => b.id !== id));
    setAuditLog((log) => [...log, { action: `Deleted booking ${id}`, timestamp: new Date().toISOString() }]);
    toast.success("Booking deleted.");
    setShowDeleteModal(null);
  };

  const handleIssuePNR = (id) => {
    const pnr = `PNR${Math.floor(100000 + Math.random() * 900000)}`;
    setBookings((list) => list.map((b) => (b.id === id ? { ...b, pnr } : b)));
    setAuditLog((log) => [...log, { action: `Issued PNR for ${id}`, timestamp: new Date().toISOString() }]);
    toast.success("PNR issued.");
  };

  const copyPNR = async (pnr) => {
    try {
      await navigator.clipboard.writeText(pnr || "");
      toast.success("PNR copied.");
    } catch {
      toast.error("Could not copy PNR.");
    }
  };

  const handleEdit = (b) => setEditBooking({ ...b });

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const b = editBooking;
    if (!b?.traveller || !(b?.email || "").includes("@") || Number(b?.total) < 0) {
      toast.error("Please fill all fields correctly.");
      return;
    }
    setBookings((list) => list.map((x) => (x.id === b.id ? b : x)));
    setAuditLog((log) => [...log, { action: `Edited booking ${b.id}`, timestamp: new Date().toISOString() }]);
    setEditBooking(null);
    toast.success("Booking updated.");
  };

  /* ---------------------------------- layout ---------------------------------- */
  const rowPad = density === "compact" ? "py-2" : "py-3";

  const paymentChips = [
    { label: "All", value: "" },
    { label: "Paid", value: "Paid" },
    { label: "Refunded", value: "Refunded" },
    { label: "Disputed", value: "Disputed" },
    { label: "Failed", value: "Unpaid" },
    { label: "Uncaptured", value: "Uncaptured" },
  ].map((chip) => ({
    ...chip,
    count: filteredBookings.filter((b) => (chip.value ? b.paymentStatus === chip.value : true)).length,
  }));

  return (
    <div className="relative p-3 sm:p-4">
      {/* Title & actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Bookings</h1>
          <p className="text-gray-500 text-sm">Search, filter, confirm, cancel, and export.</p>
        </div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      {/* Command bar */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {/* Search + open filters */}
        <div className="col-span-2">
          <div className="relative">
            <input
              type="text"
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              placeholder="Search order #, traveller, email, or PNR…"
              className="w-full h-10 rounded-lg bg-white text-gray-900 text-sm placeholder:text-gray-500 pl-10 pr-28 outline-none ring-1 ring-gray-200 focus:ring-gray-300"
              aria-label="Search bookings"
            />
            <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <div className="absolute inset-y-0 right-2 flex items-center gap-2">
              <button
                onClick={() => setShowFilterModal(true)}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Filters
              </button>
              <button
                onClick={resetFilters}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Density */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Density</label>
          <select
            value={density}
            onChange={(e) => setDensity(e.target.value)}
            className="h-10 rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </div>

        {/* Exports */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Excel
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            CSV
          </button>
        </div>
      </div>

      {/* Quick payment chips */}
      <div className="flex overflow-x-auto gap-2 pb-2 mt-3 mb-4 border-b border-gray-200">
        {paymentChips.map(({ label, value, count }) => (
          <Pill key={label} active={paymentStatusFilter === value} onClick={() => setPaymentStatusFilter(value)}>
            <span className="mr-1">{label}</span>
            <Badge tone={paymentStatusFilter === value ? "indigo" : "gray"}>{count}</Badge>
          </Pill>
        ))}
      </div>

      {/* Loading / error / empty */}
      {loading && (
        <div className="bg-white ring-1 ring-gray-200 rounded-xl overflow-hidden">
          <table className="min-w-full table-fixed">
            <thead className="bg-gray-50">
              <tr>
                {["", "Order #", "Date", "Traveller", "Email", "Status", "Payment", "Agent Fee", "Total", "PNR", "Route", "Actions"].map((h) => (
                  <th key={h} className="p-3 text-left text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>{Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
          </table>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <div className="font-medium">Something went wrong</div>
          <div className="text-sm">{error}</div>
          <div className="mt-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && filteredBookings.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          <div className="text-gray-900 font-medium">No bookings found</div>
          <div className="text-gray-500 text-sm">Try adjusting search or filters.</div>
          <div className="mt-3">
            <button
              onClick={resetFilters}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Reset filters
            </button>
          </div>
        </div>
      )}

      {/* Desktop table */}
      {!loading && !error && filteredBookings.length > 0 && (
        <div className="hidden md:block bg-white ring-1 ring-gray-200 rounded-xl overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    checked={paginatedBookings.length > 0 && paginatedBookings.every((b) => selectedBookings.includes(b.id))}
                    onChange={toggleSelectAllOnPage}
                    aria-label="Select all bookings on this page"
                  />
                </th>
                {[
                  { key: "orderNum", label: "Order #" },
                  { key: "date", label: "Booking Date" },
                  { key: "traveller", label: "Traveller" },
                  { key: "email", label: "Email" },
                  { key: "bookingStatus", label: "Status" },
                  { key: "paymentStatus", label: "Payment" },
                  { key: "agentFee", label: "Agent Fee" },
                  { key: "total", label: "Total" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="p-3 text-left text-xs font-semibold text-gray-600 cursor-pointer select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />
                    </span>
                  </th>
                ))}
                <th className="w-28 p-3 text-left text-xs font-semibold text-gray-600">PNR</th>
                <th className="w-32 p-3 text-left text-xs font-semibold text-gray-600">Route</th>
                <th className="w-44 p-3 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {paginatedBookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className={cx("px-3", rowPad)}>
                    <input
                      type="checkbox"
                      checked={selectedBookings.includes(b.id)}
                      onChange={() => handleSelectBooking(b.id)}
                      aria-label={`Select booking ${b.orderNum}`}
                    />
                  </td>
                  <td className={cx("px-3 text-sm text-gray-900", rowPad)}>{b.orderNum}</td>
                  <td className={cx("px-3 text-sm text-gray-700", rowPad)}>
                    {b.date ? formatBookingDate(b.date) : "N/A"}
                  </td>
                  <td className={cx("px-3 text-sm text-gray-900 truncate", rowPad)}>{b.traveller}</td>
                  <td className={cx("px-3 text-sm text-gray-700 truncate", rowPad)}>{b.email}</td>
                  <td className={cx("px-3", rowPad)}>
                    <Badge tone={b.bookingStatus === "Confirmed" ? "green" : b.bookingStatus === "Cancelled" ? "red" : "amber"}>
                      {b.bookingStatus}
                    </Badge>
                  </td>
                  <td className={cx("px-3", rowPad)}>
                    <Badge tone={b.paymentStatus === "Paid" ? "green" : b.paymentStatus === "Unpaid" ? "red" : "amber"}>
                      {b.paymentStatus}
                    </Badge>
                  </td>
                  <td className={cx("px-3 text-sm text-gray-900", rowPad)}>{toMoney(b.agentFee, b.currency)}</td>
                  <td className={cx("px-3 text-sm text-gray-900", rowPad)}>{toMoney(b.total, b.currency)}</td>

                  <td className={cx("px-3 text-sm", rowPad)}>
                    {b.pnr ? (
                      <button
                        onClick={() => copyPNR(b.pnr)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        title="Copy PNR"
                      >
                        <ClipboardDocumentCheckIcon className="h-4 w-4 text-gray-500" />
                        {b.pnr}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleIssuePNR(b.id)}
                        className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Issue PNR
                      </button>
                    )}
                  </td>

                  <td className={cx("px-3 text-sm text-gray-700 truncate", rowPad)}>{b.route}</td>

                  <td className={cx("px-3", rowPad)}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/admin/flights/bookings/${b.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        aria-label={`View ${b.orderNum}`}
                      >
                        <EyeIcon className="h-4 w-4" />
                        View
                      </Link>
                      <button
                        onClick={() => handleEdit(b)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        aria-label={`Edit ${b.orderNum}`}
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </button>
                      {b.bookingStatus === "Pending" && (
                        <>
                          <button
                            onClick={() => setShowConfirmModal(b.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            <CheckIcon className="h-4 w-4" />
                            Confirm
                          </button>
                          <button
                            onClick={() => setShowCancelModal(b.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            <XMarkIcon className="h-4 w-4" />
                            Cancel
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setShowDeleteModal(b.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        aria-label={`Delete ${b.orderNum}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* footer / pagination */}
            <tfoot>
              <tr>
                <td colSpan={12} className="p-3 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Rows</span>
                      <select
                        value={bookingsPerPage}
                        onChange={(e) => setBookingsPerPage(parseInt(e.target.value))}
                        className="h-8 rounded bg-white text-gray-900 text-xs ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                      >
                        {[10, 25, 50].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-gray-600">per page</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {!loading && !error && filteredBookings.length > 0 && (
        <div className="md:hidden space-y-3">
          {paginatedBookings.map((b) => (
            <div key={b.id} className="rounded-xl bg-white ring-1 ring-gray-200 p-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedBookings.includes(b.id)}
                  onChange={() => handleSelectBooking(b.id)}
                  aria-label={`Select booking ${b.orderNum}`}
                />
                <TicketIcon className="h-5 w-5 text-gray-400" />
                <div className="font-medium text-sm text-gray-900 truncate">{b.orderNum}</div>
              </div>
              <div className="mt-1 text-xs text-gray-600">Date: {b.date ? formatBookingDate(b.date) : "N/A"}</div>
              <div className="mt-1 text-xs text-gray-600 truncate">Traveller: {b.traveller}</div>
              <div className="mt-1 text-xs text-gray-600 break-all">Email: {b.email}</div>
              <div className="mt-1 text-xs text-gray-600">Route: {b.route}</div>
              <div className="mt-1 text-xs text-gray-600">Agent Fee: {toMoney(b.agentFee, b.currency)}</div>
              <div className="mt-1 text-xs text-gray-600">Total: {toMoney(b.total, b.currency)}</div>
              <div className="mt-1 text-xs text-gray-600">
                Status:{" "}
                <Badge tone={b.bookingStatus === "Confirmed" ? "green" : b.bookingStatus === "Cancelled" ? "red" : "amber"}>
                  {b.bookingStatus}
                </Badge>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Payment:{" "}
                <Badge tone={b.paymentStatus === "Paid" ? "green" : b.paymentStatus === "Unpaid" ? "red" : "amber"}>
                  {b.paymentStatus}
                </Badge>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                PNR:{" "}
                {b.pnr ? (
                  <button
                    onClick={() => copyPNR(b.pnr)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
                    title="Copy PNR"
                  >
                    <ClipboardDocumentCheckIcon className="h-4 w-4 text-gray-500" />
                    {b.pnr}
                  </button>
                ) : (
                  <button
                    onClick={() => handleIssuePNR(b.id)}
                    className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
                  >
                    Issue PNR
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  to={`/admin/flights/bookings/${b.id}`}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <EyeIcon className="h-4 w-4" />
                  View
                </Link>
                <button
                  onClick={() => handleEdit(b)}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </button>
                {b.bookingStatus === "Pending" && (
                  <>
                    <button
                      onClick={() => setShowConfirmModal(b.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowCancelModal(b.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDeleteModal(b.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>

              {/* pagination (mobile) */}
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Sticky bulk bar */}
      {selectedBookings.length > 0 && (
        <div className="fixed bottom-3 left-3 right-3 z-20 md:left-[calc(76px+12px)] md:right-3">
          <div className="mx-auto max-w-7xl rounded-xl bg-white ring-1 ring-gray-200 px-3 py-2 flex items-center justify-between">
            <div className="text-sm text-gray-700">{selectedBookings.length} selected</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction("confirm")}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Confirm
              </button>
              <button
                onClick={() => handleBulkAction("cancel")}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setSelectedBookings([])}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit log */}
      {!loading && !error && auditLog.length > 0 && (
        <details className="mt-6 rounded-xl bg-white ring-1 ring-gray-200">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-gray-900 border-b border-gray-200">
            Audit Log
          </summary>
          <ul className="p-4 space-y-2">
            {auditLog.map((log, i) => (
              <li key={i} className="text-xs text-gray-700">
                {log.timestamp}: {log.action}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Advanced Filters Modal */}
      <Modal
        open={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Advanced Filters"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowFilterModal(false)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">Module</label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
            >
              <option value="">All Modules</option>
              <option value="Flights">Flights</option>
              <option value="Hotels">Hotels</option>
              <option value="Tours">Tours</option>
              <option value="Cars">Cars</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700">Booking Status</label>
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
              >
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Payment Status</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
              >
                <option value="">All</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Refunded">Refunded</option>
                <option value="Disputed">Disputed</option>
                <option value="Uncaptured">Uncaptured</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700">Min Total</label>
              <input
                type="number"
                value={amountFilter.min}
                onChange={(e) => setAmountFilter((f) => ({ ...f, min: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Max Total</label>
              <input
                type="number"
                value={amountFilter.max}
                onChange={(e) => setAmountFilter((f) => ({ ...f, max: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                placeholder="1000"
                min="0"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm / Cancel / Delete Modals */}
      <Modal
        open={!!showConfirmModal}
        onClose={() => setShowConfirmModal(null)}
        title="Confirm Booking"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowConfirmModal(null)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleConfirm(showConfirmModal)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
            >
              Confirm
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-700">Are you sure you want to confirm this booking?</p>
      </Modal>

      <Modal
        open={!!showCancelModal}
        onClose={() => setShowCancelModal(null)}
        title="Cancel Booking"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCancelModal(null)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => handleCancel(showCancelModal)}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700"
            >
              Cancel Booking
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-700">Are you sure you want to cancel this booking?</p>
      </Modal>

      <Modal
        open={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        title="Delete Booking"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDeleteModal(null)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(showDeleteModal)}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700"
            >
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-700">This action cannot be undone. Delete this booking?</p>
      </Modal>

      <Modal
        open={!!editBooking}
        onClose={() => setEditBooking(null)}
        title="Edit Booking"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditBooking(null)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        }
      >
        {editBooking && (
          <form onSubmit={handleSaveEdit} className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Traveller</label>
              <input
                type="text"
                value={editBooking.traveller}
                onChange={(e) => setEditBooking({ ...editBooking, traveller: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={editBooking.email}
                onChange={(e) => setEditBooking({ ...editBooking, email: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Module</label>
              <select
                value={editBooking.module}
                onChange={(e) => setEditBooking({ ...editBooking, module: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              >
                <option value="Flights">Flights</option>
                <option value="Hotels">Hotels</option>
                <option value="Tours">Tours</option>
                <option value="Cars">Cars</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700">Booking Status</label>
                <select
                  value={editBooking.bookingStatus}
                  onChange={(e) => setEditBooking({ ...editBooking, bookingStatus: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Payment Status</label>
                <select
                  value={editBooking.paymentStatus}
                  onChange={(e) => setEditBooking({ ...editBooking, paymentStatus: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                  required
                >
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Refunded">Refunded</option>
                  <option value="Disputed">Disputed</option>
                  <option value="Uncaptured">Uncaptured</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700">Total</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editBooking.total}
                  onChange={(e) => setEditBooking({ ...editBooking, total: parseFloat(e.target.value) || 0 })}
                  className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Currency</label>
                <select
                  value={editBooking.currency}
                  onChange={(e) => setEditBooking({ ...editBooking, currency: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                  required
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
