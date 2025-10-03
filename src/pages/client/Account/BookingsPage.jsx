import React, { useContext, useEffect, useMemo, useState } from "react";
import Headbar from "../../../components/client/Headbar";
import { AuthContext } from "../../../context/AuthContext";
import { T } from "../../../utils/translation";
import apiService from "../../../api/apiService";
import { useNavigate } from "react-router-dom";


/* ======================= small utils ======================= */
const currency = (num, curr = "USD") => {
  const n = Number(num);
  if (Number.isNaN(n)) return num ?? "";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: curr }).format(n);
  } catch {
    return `${n.toLocaleString()} ${curr}`;
  }
};

const parseDate = (v) => (v ? new Date(v) : null);
const getDateField = (b) => b?.date || b?.booking_date || b?.created_at || b?.createdAt || b?.created_time;

const StatusChip = ({ value }) => {
  const v = String(value || "").toLowerCase();
  const map = {
    confirmed: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    canceled: "bg-red-100 text-red-700 border-red-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    refunded: "bg-purple-100 text-purple-700 border-purple-200",
    ticketed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  const cls = map[v] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {value || "—"}
    </span>
  );
};

const isCancelled = (s) => ["cancelled", "canceled", "voided"].includes(String(s || "").toLowerCase());
const isCancelable = (s) => !isCancelled(s); // adjust if more rules are needed

/* ======================= skeletons ======================= */
const TableSkeleton = ({ rows = 8 }) => (
  <div className="animate-pulse">
    <div className="h-10 bg-gray-50 border-b" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 border-b px-3 py-3">
        <div className="h-4 w-4 rounded bg-gray-100" />
        <div className="h-4 w-40 rounded bg-gray-100" />
        <div className="h-4 w-28 rounded bg-gray-100" />
        <div className="h-4 w-20 rounded bg-gray-100" />
        <div className="h-4 w-16 rounded bg-gray-100" />
        <div className="h-4 w-24 rounded bg-gray-100 ml-auto" />
      </div>
    ))}
  </div>
);

/* ======================= main ======================= */
const BookingsPage = ({ rootUrl = "/", initialBookings = [] }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [bookings, setBookings] = useState(initialBookings);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null); // order_num currently being canceled

  // filters
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [statusSet, setStatusSet] = useState(new Set()); // multi-select via chips
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // table state
  const [selected, setSelected] = useState(new Set());
  const [sortBy, setSortBy] = useState("created_at"); // booking_id | contact_name | price | created_at
  const [sortDir, setSortDir] = useState("desc"); // asc | desc
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // derived constants
  const STATUS_OPTIONS = useMemo(() => {
    const uniq = new Set(bookings.map((b) => String(b.status || "").toLowerCase()).filter(Boolean));
    const common = ["confirmed", "pending", "cancelled", "failed", "refunded", "ticketed"];
    const rest = [...uniq].filter((v) => !common.includes(v));
    return [...common.filter((v) => uniq.has(v)), ...rest];
  }, [bookings]);

  const TYPE_OPTIONS = useMemo(() => {
    const uniq = new Set(bookings.map((b) => String(b.type || "").toLowerCase()).filter(Boolean));
    const common = ["flight", "hotel", "car", "other"];
    const rest = [...uniq].filter((v) => !common.includes(v));
    return ["all", ...common.filter((v) => uniq.has(v)), ...rest];
  }, [bookings]);

  const canFetch = !!user?.id;

  // fetch list
  useEffect(() => {
    if (!canFetch) return;
    const fetchBookings = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await apiService.get("/bookings");
        console.info("Fetch bookings response:", res);
        const ok = res?.data?.status === "true" || res?.success === true || res?.data?.success === true;
        const rows =
          res?.data?.data?.data ??
          res?.data?.bookings ??
          res?.data?.data ??
          [];
        if (ok) setBookings(Array.isArray(rows) ? rows : []);
        else setError(res?.data?.message || res?.message || "Failed to fetch bookings");
      } catch (e) {
        console.error("Fetch bookings error:", e);
        setError(T.fetch_error || "Error fetching bookings");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, [canFetch, user]);

  // debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [query]);

  // filters + sorting
  const filtered = useMemo(() => {
    const q = debouncedQ;
    const sActive = statusSet.size > 0;
    const from = fromDate ? parseDate(fromDate) : null;
    const to = toDate ? parseDate(toDate) : null;
    const min = minAmount !== "" ? Number(minAmount) : null;
    const max = maxAmount !== "" ? Number(maxAmount) : null;

    const pass = (b) => {
      if (q) {
        const hay =
          String(b.contact_name || "").toLowerCase() +
          " " +
          String(b.booking_id || b.id || "").toLowerCase() +
          " " +
          String(b.pnr || "").toLowerCase() +
          " " +
          String(b.order_num || "").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (sActive) {
        const v = String(b.status || "").toLowerCase();
        if (!statusSet.has(v)) return false;
      }
      if (typeFilter !== "all") {
        const t = String(b.type || "").toLowerCase();
        if (t !== typeFilter) return false;
      }
      const dRaw = getDateField(b);
      if (from || to) {
        const d = dRaw ? new Date(dRaw) : null;
        if (!d) return false;
        if (from && d < from) return false;
        if (to) {
          const end = new Date(to);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
      }
      if (min !== null || max !== null) {
        const amt = Number(b.total_amount ?? b.amount ?? b.price_total);
        if (Number.isFinite(amt)) {
          if (min !== null && amt < min) return false;
          if (max !== null && amt > max) return false;
        }
      }
      return true;
    };

    const base = bookings.filter(pass);

    const cmp = (a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const by = sortBy;
      let av, bv;
      switch (by) {
        case "contact_name":
          av = (a.contact_name || "").toString().toLowerCase();
          bv = (b.contact_name || "").toString().toLowerCase();
          break;
        case "price":
          av = Number(a.total_amount ?? a.amount ?? a.price_total) || 0;
          bv = Number(b.total_amount ?? b.amount ?? b.price_total) || 0;
          break;
        case "booking_id":
          av = (a.booking_id || a.id || "").toString().toLowerCase();
          bv = (b.booking_id || b.id || "").toString().toLowerCase();
          break;
        case "created_at":
        default:
          av = new Date(getDateField(a) || 0).getTime();
          bv = new Date(getDateField(b) || 0).getTime();
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    };

    return base.sort(cmp);
  }, [bookings, debouncedQ, statusSet, typeFilter, fromDate, toDate, minAmount, maxAmount, sortBy, sortDir]);

  // pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = filtered.slice(start, end);

  // selections
  const toggleAll = (checked) => {
    if (checked) {
      setSelected(new Set(pageItems.map((b) => b.booking_id || b.id)));
    } else {
      setSelected(new Set());
    }
  };
  const toggleOne = (id) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setSelected(n);
  };

  const activeFilters =
    query ||
    statusSet.size > 0 ||
    typeFilter !== "all" ||
    fromDate ||
    toDate ||
    minAmount !== "" ||
    maxAmount !== "";

  const resetFilters = () => {
    setQuery("");
    setStatusSet(new Set());
    setTypeFilter("all");
    setFromDate("");
    setToDate("");
    setMinAmount("");
    setMaxAmount("");
    setPage(1);
  };

  const toggleStatus = (v) => {
    const c = new Set(statusSet);
    if (c.has(v)) c.delete(v);
    else c.add(v);
    setStatusSet(c);
    setPage(1);
  };

  const setSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const exportCSV = () => {
    const headers = ["Client", "Booking ID", "Order #", "PNR", "Type", "Price", "Currency", "Status", "Date"];
    const rows = filtered.map((b) => [
      b.contact_name ?? "",
      b.booking_id ?? b.id ?? "",
      b.order_num ?? "",
      b.pnr ?? "",
      b.type ?? "",
      b.total_amount ?? b.amount ?? b.price_total ?? "",
      b.currency ?? "USD",
      b.status ?? "",
      getDateField(b) ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookings.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ======================= actions ======================= */
  const handleShow = (b) => {
    if (b?.order_num) {
      navigate(`/flight/booking/invoice/${b.order_num}`);
    } else {
      alert("This booking does not have an order number yet.");
    }
  };

  const fetchOne = async (orderNum) => {
    try {
      const r = await apiService.get(`/bookings/${encodeURIComponent(orderNum)}`);
      return r?.data?.booking || r?.data?.data?.booking || r?.data?.data || r?.data;
    } catch (e) {
      return null;
    }
  };

  const handleCancel = async (b) => {
    const order = b?.order_num;
    if (!order) {
      alert("Missing order number for this booking.");
      return;
    }

    // Refresh status first to avoid double-cancel
    setBusy(order);
    try {
      const latest = await fetchOne(order);
      const current = latest?.status ?? b.status;
      if (!isCancelable(current)) {
        // already cancelled; update row and exit
        if (latest) {
          setBookings((prev) => prev.map((x) => (x.order_num === order ? { ...x, ...latest } : x)));
        }
        return;
      }

      const ok = window.confirm(T.cancel_confirm || "Are you sure you want to cancel this booking?");
      if (!ok) return;

      const resp = await apiService.post(`/bookings/${encodeURIComponent(order)}/cancel`);
      const updated =
        resp?.data?.booking ||
        resp?.data?.data?.booking ||
        resp?.data?.data ||
        resp?.data ||
        { status: "cancelled" };

      setBookings((prev) => prev.map((x) => (x.order_num === order ? { ...x, ...updated } : x)));
    } catch (e) {
      const msg =
        e?.response?.data?.errorMsg ||
        e?.response?.data?.message ||
        e?.message ||
        (T.cancel_failed || "We couldn’t cancel this booking right now.");
      alert(msg);
      // soft refresh row
      const latest = await fetchOne(order);
      if (latest) {
        setBookings((prev) => prev.map((x) => (x.order_num === order ? { ...x, ...latest } : x)));
      }
    } finally {
      setBusy(null);
    }
  };

  /* ======================= render ======================= */
  return (
    <div>
      <Headbar T={T} rootUrl={rootUrl} user={user} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{T.bookings || "Bookings"}</h1>
            <p className="text-sm text-gray-600">
              {T.bookings_subtitle || "Manage and track your bookings across products."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
              onClick={() => {/* placeholder for create/import flow */}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />
              </svg>
              {T.add_booking || "Add Booking"}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 hover:bg-gray-50"
              onClick={exportCSV}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3h6v2H9zM5 7h14v2H5zm0 4h14v2H5zm0 4h14v2H5zm4 4h6v2H9z"/></svg>
              {T.export || "Export CSV"}
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* search */}
            <div>
              <label htmlFor="q" className="sr-only">{T.search || "Search"}</label>
              <div className="relative">
                <input
                  id="q"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  placeholder={T.search_placeholder || "Search by client, booking ID, PNR or Order #"}
                  className="block w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pl-10 px-3 py-2.5"
                />
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>
                </span>
              </div>
            </div>

            {/* status chips */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">{T.status || "Status"}</label>
                {statusSet.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusSet(new Set())}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {T.clear || "Clear"}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.length === 0 ? (
                  <span className="text-sm text-gray-500">—</span>
                ) : (
                  STATUS_OPTIONS.map((s) => {
                    const lbl = s || "—";
                    const on = statusSet.has(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleStatus(s)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                          on
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                        aria-pressed={on}
                      >
                        {lbl.charAt(0).toUpperCase() + lbl.slice(1)}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">{T.type || "Type"}</label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{(T[opt] || opt).toString().charAt(0).toUpperCase() + (T[opt] || opt).toString().slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* advanced */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{T.from || "From date"}</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{T.to || "To date"}</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{T.min_amount || "Min amount"}</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={minAmount}
                onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{T.max_amount || "Max amount"}</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="9999"
                value={maxAmount}
                onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {activeFilters ? (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {T.filters_active || "Filters active"} · {filtered.length} {T.results || "results"}
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:underline"
              >
                {T.reset_filters || "Reset filters"}
              </button>
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {error && !isLoading ? (
            <div className="text-center py-16">
              <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                  <path d="M11 7h2v6h-2zM11 15h2v2h-2z"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10
                    10-4.48 10-10S17.52 2 12 2zM12 20c-4.41 0-8-3.59-8-8s3.59-8 
                    8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
              </div>
              <h3 className="text-base font-medium">{T.error || "Error"}</h3>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="-mx-4 sm:mx-0 p-4">
              <TableSkeleton rows={8} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                  <path d="M12 1a9 9 0 019 9c0 7-9 13-9 13S3 17 3 10a9 9 0 019-9zm0 4a5 5 0 100 10 5 5 0 000-10z"/>
                </svg>
              </div>
              <h3 className="text-base font-medium">{T.no_results || "No bookings found"}</h3>
              <p className="text-sm text-gray-600 mt-1">{T.adjust_filters || "Try adjusting your filters or search term."}</p>
            </div>
          ) : (
            <div className="-mx-4 sm:mx-0">
              {/* Table (desktop) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-3 px-3 w-10">
                        <input
                          type="checkbox"
                          aria-label="Select all"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={pageItems.every((b) => selected.has(b.booking_id || b.id)) && pageItems.length > 0}
                          onChange={(e) => toggleAll(e.target.checked)}
                        />
                      </th>
                      <Th label={T.contact_name || "Client Name"} sortKey="contact_name" sortBy={sortBy} sortDir={sortDir} onSort={setSort} />
                      {/* <Th label={T.booking_id || "Booking ID"} sortKey="booking_id" sortBy={sortBy} sortDir={sortDir} onSort={setSort} /> */}
                      <th className="py-3 pr-3">Order #</th>
                      <th className="py-3 pr-3">PNR</th>
                      <th className="py-3 pr-3">{T.type || "Type"}</th>
                      <Th label={T.price || "Price"} sortKey="price" sortBy={sortBy} sortDir={sortDir} onSort={setSort} />
                      <Th label={T.status || "Status"} />
                      <Th label={T.date || "Date"} sortKey="created_at" sortBy={sortBy} sortDir={sortDir} onSort={setSort} />
                      <th className="py-3 pl-3">{T.actions || "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((b) => {
                      const id = b.booking_id || b.id;
                      const isChecked = selected.has(id);
                      const order = b.order_num;
                      const cancelDisabled = !isCancelable(b.status) || busy === order || !order;
                      return (
                        <tr key={`${id}-${order ?? ""}`} className="border-b last:border-b-0 hover:bg-gray-50/40">
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300"
                              aria-label={`Select booking ${id}`}
                              checked={isChecked}
                              onChange={() => toggleOne(id)}
                            />
                          </td>
                          <td className="py-3 pr-3 font-medium text-gray-900">{b.contact_name || "—"}</td>
                          {/* <td className="py-3 pr-3">{id || "—"}</td> */}
                          <td className="py-3 pr-3">{order || "—"}</td>
                          <td className="py-3 pr-3">{b.pnr || "—"}</td>
                          <td className="py-3 pr-3 capitalize">{b.type || "—"}</td>
                          <td className="py-3 pr-3">{currency(b.total_amount ?? b.amount ?? b.price_total, b.currency || "USD")}</td>
                          <td className="py-3 pr-3"><StatusChip value={b.status} /></td>
                          <td className="py-3 pr-3">{getDateField(b) ? new Date(getDateField(b)).toLocaleString() : "—"}</td>
                          <td className="py-3 pl-3">
                            <div className="flex items-center gap-2">
                              <button
                                className="rounded-lg flex gap-2 border px-2.5 py-1.5 text-xs hover:bg-gray-50"
                                onClick={() => handleShow(b)}
                                title="Show invoice"
                              >
                                <i className="bi bi-file-earmark-text-fill"></i>
                                <span>{T.show || "Show"}</span>
                              </button>
                              <button
                                className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                                  cancelDisabled
                                    ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                                    : "text-red-600 hover:bg-gray-50"
                                }`}
                                disabled={cancelDisabled}
                                onClick={() => handleCancel(b)}
                              >
                                {busy === order ? (T.cancelling || "Cancelling…") : (T.cancel || "Cancel")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards (mobile) */}
              <div className="md:hidden space-y-3 p-4">
                {pageItems.map((b) => {
                  const id = b.booking_id || b.id;
                  const order = b.order_num;
                  const isChecked = selected.has(id);
                  const cancelDisabled = !isCancelable(b.status) || busy === order || !order;
                  return (
                    <div key={`${id}-${order ?? ""}`} className="rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={isChecked}
                            onChange={() => toggleOne(id)}
                            aria-label={`Select booking ${id}`}
                          />
                          <div className="font-medium">{b.contact_name || "—"}</div>
                        </div>
                        <StatusChip value={b.status} />
                      </div>
                      <div className="mt-2 text-sm text-gray-700">
                        {(T.booking_id || "Booking ID")}: {id || "—"} · Order: {order || "—"} · PNR: {b.pnr || "—"}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-gray-500">{T.type || "Type"}</div>
                          <div className="font-medium capitalize">{b.type || "—"}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">{T.price || "Price"}</div>
                          <div className="font-medium">{currency(b.total_amount ?? b.amount ?? b.price_total, b.currency || "USD")}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-gray-500">{T.date || "Date"}</div>
                          <div className="font-medium">{getDateField(b) ? new Date(getDateField(b)).toLocaleString() : "—"}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-gray-500">{T.actions || "Actions"}</div>
                          <div className="mt-1 flex items-center gap-2">
                            <button
                              className="rounded-lg d-flex gap-2 border px-2.5 py-1.5 text-xs hover:bg-gray-50"
                              onClick={() => handleShow(b)}
                            >
                              <i className="bi bi-file-earmark-text-fill"></i>
                              <span>{T.show || "Show"}</span>
                            </button>
                            <button
                              className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                                cancelDisabled
                                  ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                                  : "text-red-600 hover:bg-gray-50"
                              }`}
                              disabled={cancelDisabled}
                              onClick={() => handleCancel(b)}
                            >
                              {busy === order ? (T.cancelling || "Cancelling…") : (T.cancel || "Cancel")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer: bulk + pagination */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-4 text-sm text-gray-600">
          {/* bulk actions */}
          <div className="flex items-center gap-2">
            <span>
              {(T.selected || "Selected")}: <span className="font-medium">{selected.size}</span>
            </span>
            <button
              className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
              disabled={selected.size === 0}
              onClick={() => {/* bulk actions placeholder */}}
            >
              {T.bulk_actions || "Bulk actions"}
            </button>
            {activeFilters && (
              <span className="ml-2 hidden md:inline text-gray-400">•</span>
            )}
            {activeFilters && (
              <button className="md:ml-2 text-blue-600 hover:underline" onClick={resetFilters}>
                {T.reset_filters || "Reset filters"}
              </button>
            )}
          </div>

          {/* pagination */}
          <div className="flex items-center gap-2">
            <span>
              {T.pagination_showing || "Showing"}{" "}
              <span className="font-medium">
                {total === 0 ? 0 : start + 1}–{Math.min(end, total)}
              </span>{" "}
              {T.of || "of"} <span className="font-medium">{total}</span>
            </span>
            <select
              className="ml-2 rounded-lg border px-2 py-1.5"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              {[10, 20, 50].map((n) => <option key={n} value={n}>{n}/page</option>)}
            </select>
            <div className="inline-flex items-center gap-1 ml-2">
              <button
                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                aria-label="Previous"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              <span className="px-2">{safePage} / {totalPages}</span>
              <button
                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                aria-label="Next"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ======================= header cell w/ sorting ======================= */
const Th = ({ label, sortKey, sortBy, sortDir, onSort }) => {
  const sortable = !!sortKey && !!onSort;
  const active = sortable && sortBy === sortKey;
  return (
    <th className="py-3 pr-3">
      <button
        type="button"
        className={`group inline-flex items-center gap-1 ${sortable ? "hover:text-gray-900" : "cursor-default"}`}
        onClick={sortable ? () => onSort(sortKey) : undefined}
        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      >
        <span className="font-medium text-gray-700">{label}</span>
        {sortable && (
          <svg
            width="14" height="14" viewBox="0 0 20 20" fill="currentColor"
            className={`text-gray-400 group-hover:text-gray-700 transition ${active ? "opacity-100" : "opacity-50"}`}
          >
            {active && sortDir === "asc"
              ? <path d="M10 6l-4 4h8l-4-4z" />
              : <path d="M10 14l4-4H6l4 4z" />
            }
          </svg>
        )}
      </button>
    </th>
  );
};

export default BookingsPage;
