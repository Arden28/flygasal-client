import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  CreditCardIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiService from "../../api/apiService";

/* ---------------- Utils ---------------- */
const safeStr = (v) => (v == null ? "" : String(v));
const parseD = (s) => {
  const d = new Date(s);
  return isNaN(d) ? null : d;
};
const inRange = (d, start, end) => {
  if (!d) return false;
  const t = d.getTime();
  if (start && t < start.getTime()) return false;
  if (end && t > end.getTime()) return false;
  return true;
};
const money = (n, c = "USD") => {
  const x = Number(n);
  if (!isFinite(x)) return `${c} 0.00`;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(x);
  } catch {
    return `${c} ${x.toFixed(2)}`;
  }
};

export default function Transactions() {
  /* ---------------- State ---------------- */
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const qTimer = useRef();

  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);

  const [transactions, setTransactions] = useState([]);
  const [auditLog, setAuditLog] = useState([]);

  const [editTransaction, setEditTransaction] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("dateRange");
  const [reportMonth, setReportMonth] = useState("");
  const [reportDateRange, setReportDateRange] = useState({ start: "", end: "" });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------- Fetch ---------------- */
  useEffect(() => {
    let cancel = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiService.get("/transactions");
        console.info("Fetched transactions:", response?.data);
        const rows = response?.data?.data || [];

        const formatted = rows.map((t) => ({
          id: safeStr(t.trx_id || t.id || ""),
          date: safeStr(t.date || ""), // Expect ISO or YYYY-MM-DD
          type: safeStr(t.type || "booking"),
          amount: Number(t.amount) || 0,
          currency: safeStr(t.currency || "USD"),
          status: safeStr(t.status || "pending"),
          traveller: safeStr(t.name || "N/A"),
          email: safeStr(t.email || "john.doe@example.com"),
          bookingId: safeStr(t.booking_id || t.bookingId || "AT9002"),
          paymentMethod: safeStr(t.payment_gateway || t.paymentMethod || "Bank"),
        }));

        if (!cancel) setTransactions(formatted);
      } catch (e) {
        console.error("Failed to fetch transactions:", e);
        if (!cancel) setError("Failed to load transactions.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, []);

  /* ---------------- Debounce search ---------------- */
  useEffect(() => {
    clearTimeout(qTimer.current);
    qTimer.current = setTimeout(() => setDebouncedQ(query.trim().toLowerCase()), 250);
    return () => clearTimeout(qTimer.current);
  }, [query]);

  /* ---------------- Sorting ---------------- */
  const sorted = useMemo(() => {
    const arr = [...transactions];
    const dir = sortConfig.direction === "asc" ? 1 : -1;

    arr.sort((a, b) => {
      const k = sortConfig.key;
      if (k === "amount") {
        const A = Number(a.amount) || 0;
        const B = Number(b.amount) || 0;
        return A === B ? 0 : A > B ? dir : -dir;
      }
      if (k === "date") {
        const A = parseD(a.date)?.getTime() || 0;
        const B = parseD(b.date)?.getTime() || 0;
        return A === B ? 0 : A > B ? dir : -dir;
      }
      const A = safeStr(a[k]).toLowerCase();
      const B = safeStr(b[k]).toLowerCase();
      return A === B ? 0 : A > B ? dir : -dir;
    });
    return arr;
  }, [transactions, sortConfig]);

  /* ---------------- Filtering ---------------- */
  const startD = useMemo(() => (dateFilter.start ? parseD(dateFilter.start) : null), [dateFilter.start]);
  const endD = useMemo(() => (dateFilter.end ? parseD(dateFilter.end) : null), [dateFilter.end]);

  const baseForStatusCounts = useMemo(() => {
    // For status chip counts, ignore statusFilter so chips show available counts with other filters applied
    return sorted.filter((t) => {
      const qMatch =
        !debouncedQ ||
        safeStr(t.id).toLowerCase().includes(debouncedQ) ||
        safeStr(t.traveller).toLowerCase().includes(debouncedQ) ||
        safeStr(t.email).toLowerCase().includes(debouncedQ);
      const typeOk = !typeFilter || t.type === typeFilter;
      const dOk = inRange(parseD(t.date), startD, endD);
      return qMatch && typeOk && dOk;
    });
  }, [sorted, debouncedQ, typeFilter, startD, endD]);

  const filtered = useMemo(() => {
    return baseForStatusCounts.filter((t) => !statusFilter || t.status === statusFilter);
  }, [baseForStatusCounts, statusFilter]);

  /* ---------------- Pagination ---------------- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageStart = (currentPage - 1) * perPage;
  const pageEnd = pageStart + perPage;
  const pageRows = filtered.slice(pageStart, pageEnd);

  useEffect(() => {
    // Reset selection when page/filter set changes
    setSelectedIds([]);
    setCurrentPage(1);
  }, [debouncedQ, typeFilter, statusFilter, dateFilter, perPage]);

  /* ---------------- Actions ---------------- */
  const handleSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selectedIds.includes(r.id));
  const toggleSelectAllPage = () => {
    setSelectedIds((prev) =>
      allOnPageSelected ? prev.filter((id) => !pageRows.some((r) => r.id === id)) : [...new Set([...prev, ...pageRows.map((r) => r.id)])]
    );
  };
  const toggleSelect = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleBulk = (action) => {
    if (!selectedIds.length) return;
    const toStatus = action === "complete" ? "Completed" : "Failed";
    setTransactions((rows) => rows.map((r) => (selectedIds.includes(r.id) ? { ...r, status: toStatus } : r)));
    setAuditLog((l) => [...l, { action: `Bulk ${action} (${selectedIds.length})`, timestamp: new Date().toISOString() }]);
    toast.success(`Marked ${selectedIds.length} as ${toStatus}.`);
    setSelectedIds([]);
  };

  const handleDelete = (id) => {
    setTransactions((rows) => rows.filter((r) => r.id !== id));
    setAuditLog((l) => [...l, { action: `Deleted transaction ${id}`, timestamp: new Date().toISOString() }]);
    toast.success("Transaction deleted.");
    setShowDeleteModal(null);
  };

  const saveEdit = (e) => {
    e.preventDefault();
    const a = Number(editTransaction?.amount);
    if (!isFinite(a) || a < 0) return toast.error("Enter a valid amount.");
    setTransactions((rows) => rows.map((r) => (r.id === editTransaction.id ? { ...editTransaction, amount: a } : r)));
    setAuditLog((l) => [...l, { action: `Edited transaction ${editTransaction.id}`, timestamp: new Date().toISOString() }]);
    toast.success("Transaction updated.");
    setEditTransaction(null);
  };

  /* ---------------- Export / Reports ---------------- */
  const exportToExcel = () => {
    const exportData = filtered.map((t) => ({
      "Transaction ID": t.id,
      Date: t.date,
      Type: t.type,
      Amount: money(t.amount, t.currency),
      Status: t.status,
      Traveller: t.traveller,
      Email: t.email,
      "Booking ID": t.bookingId || "N/A",
      "Payment Method": t.paymentMethod,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    // Auto width
    const colWidths = Object.keys(exportData[0] || {}).map((k) => ({
      wch: Math.max(k.length, ...exportData.map((r) => String(r[k] || "").length)) + 2,
    }));
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "transactions.xlsx");
    toast.success("Exported to Excel.");
  };

  const generateInvoicePDF = (t) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Transaction Invoice", 14, 18);
      doc.setFontSize(11);
      const rows = [
        ["Transaction ID", t.id],
        ["Date", t.date],
        ["Type", t.type],
        ["Amount", money(t.amount, t.currency)],
        ["Status", t.status],
        ["Traveller", t.traveller],
        ["Email", t.email],
        ["Booking ID", t.bookingId || "N/A"],
        ["Payment Method", t.paymentMethod],
      ];
      let y = 30;
      rows.forEach(([k, v]) => {
        doc.text(`${k}:`, 14, y);
        doc.text(String(v), 70, y);
        y += 8;
      });
      doc.save(`invoice_${t.id}.pdf`);
      toast.success("Invoice downloaded.");
    } catch {
      toast.error("Failed to generate PDF.");
    }
  };

  const generateReport = (format) => {
    let rangeFiltered = [];
    if (reportType === "dateRange") {
      const s = reportDateRange.start ? parseD(reportDateRange.start) : null;
      const e = reportDateRange.end ? parseD(reportDateRange.end) : null;
      if (!s || !e) return toast.error("Pick start and end dates.");
      rangeFiltered = transactions.filter((t) => inRange(parseD(t.date), s, e));
    } else {
      if (!reportMonth) return toast.error("Pick a month.");
      rangeFiltered = transactions.filter((t) => safeStr(t.date).startsWith(reportMonth));
    }

    if (!rangeFiltered.length) return toast.info("No data for the chosen period.");

    if (format === "excel") {
      const data = rangeFiltered.map((t) => ({
        ID: t.id,
        Date: t.date,
        Type: t.type,
        Amount: money(t.amount, t.currency),
        Status: t.status,
        Traveller: t.traveller,
        Email: t.email,
        "Booking ID": t.bookingId || "N/A",
        "Payment Method": t.paymentMethod,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = Object.keys(data[0] || {}).map((k) => ({
        wch: Math.max(k.length, ...data.map((r) => String(r[k] || "").length)) + 2,
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `transactions_report_${reportType === "dateRange" ? "range" : reportMonth}.xlsx`);
      toast.success("Report exported.");
    } else {
      try {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Transactions Report", 14, 18);
        doc.setFontSize(11);
        const total = rangeFiltered.reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const ccy = rangeFiltered[0]?.currency || "USD";
        const summary = [
          ["Transactions", String(rangeFiltered.length)],
          ["Total Amount", money(total, ccy)],
          ["Completed", String(rangeFiltered.filter((t) => t.status === "Completed").length)],
          ["Pending", String(rangeFiltered.filter((t) => t.status === "Pending").length)],
          ["Failed", String(rangeFiltered.filter((t) => t.status === "Failed").length)],
        ];
        let y = 30;
        summary.forEach(([k, v]) => {
          doc.text(`${k}:`, 14, y);
          doc.text(String(v), 70, y);
          y += 7;
        });
        y += 6;
        doc.text("Rows:", 14, y);
        y += 6;
        rangeFiltered.slice(0, 40).forEach((t) => {
          doc.text(`${t.id}  |  ${t.date}  |  ${t.type}  |  ${money(t.amount, t.currency)}  |  ${t.status}`, 14, y);
          y += 6;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        });
        doc.save(`transactions_report_${reportType === "dateRange" ? "range" : reportMonth}.pdf`);
        toast.success("Report downloaded.");
      } catch {
        toast.error("Failed to generate PDF.");
      }
    }
    setShowReportModal(false);
  };

  /* ---------------- UI ---------------- */
  const chipCounts = {
    all: baseForStatusCounts.length,
    completed: baseForStatusCounts.filter((t) => t.status === "Completed").length,
    pending: baseForStatusCounts.filter((t) => t.status === "Pending").length,
    failed: baseForStatusCounts.filter((t) => t.status === "Failed").length,
  };

  const headerCell = (label, key) => (
    <th
      className="p-2 text-left text-xs font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-100"
      onClick={() => handleSort(key)}
      title={`Sort by ${label}`}
    >
      {label} {sortConfig.key === key ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
    </th>
  );

  const TableSkeleton = () => (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[1000px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 w-8" />
              {Array.from({ length: 10 }).map((_, i) => (
                <th key={i} className="p-2" />
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, r) => (
              <tr key={r} className="border-b">
                {Array.from({ length: 11 }).map((__, c) => (
                  <td key={c} className="p-2">
                    <div className="h-4 w-full max-w-[160px] bg-gray-100 animate-pulse rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="relative max-w-screen-xl mx-auto p-2 xs:p-3 sm:p-4 md:p-6 overflow-x-hidden">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-4 bg-white rounded-lg shadow p-4">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Transactions</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-xs"
          >
            Generate Report
          </button>
          <Link to="/" className="bg-slate-700 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs">
            Back
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative col-span-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
              placeholder="Transaction ID, Traveller, or Email"
              aria-label="Search"
            />
            {query && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
              aria-label="Type"
            >
              <option value="">All Types</option>
              <option value="booking">Booking</option>
              <option value="refund">Refund</option>
              <option value="wallet_topup">Wallet Deposit</option>
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
              aria-label="Status"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter((d) => ({ ...d, start: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
              aria-label="Start date"
            />
          </div>
          <div>
            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter((d) => ({ ...d, end: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
              aria-label="End date"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportToExcel}
            className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-xs"
          >
            <DocumentArrowDownIcon className="w-4 h-4 inline-block mr-1" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setTypeFilter("");
              setStatusFilter("");
              setDateFilter({ start: "", end: "" });
            }}
            className="px-3 py-1.5 rounded-lg border text-xs hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Status chips (scrollable on mobile, no page overflow) */}
      <div className="flex overflow-x-auto mb-4 gap-2 py-2 -mx-1 px-1">
        {[
          { label: "All", value: "", count: chipCounts.all },
          { label: "Completed", value: "Completed", count: chipCounts.completed },
          { label: "Pending", value: "Pending", count: chipCounts.pending },
          { label: "Failed", value: "Failed", count: chipCounts.failed },
        ].map(({ label, value, count }) => {
          const active = statusFilter === value;
          return (
            <button
              key={label}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-2 rounded-lg border text-xs flex-shrink-0 min-w-[110px] ${
                active ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-300 bg-white"
              }`}
              aria-label={`Filter ${label}`}
            >
              <span className="mr-2">{label}</span>
              <strong className={active ? "text-indigo-700" : "text-gray-800"}>{count}</strong>
            </button>
          );
        })}
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="mb-3 flex gap-2 flex-wrap">
          <button
            onClick={() => handleBulk("complete")}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs"
          >
            Complete Selected
          </button>
          <button
            onClick={() => handleBulk("fail")}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs"
          >
            Fail Selected
          </button>
        </div>
      )}

      {/* Loading / Error */}
      {loading && <TableSkeleton />}
      {!loading && error && <div className="p-4 bg-red-100 text-red-800 rounded-lg mb-4">{error}</div>}

      {/* Desktop table */}
      {!loading && !error && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 w-8">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAllPage}
                      aria-label="Select all on page"
                    />
                  </th>
                  {headerCell("Transaction ID", "id")}
                  {headerCell("Date", "date")}
                  {headerCell("Type", "type")}
                  {headerCell("Amount", "amount")}
                  {headerCell("Status", "status")}
                  <th className="p-2 text-left text-xs font-semibold text-gray-600">Traveller</th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-600">Email</th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-600">Booking ID</th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-600">Payment Method</th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pageRows.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(t.id)}
                        onChange={() => toggleSelect(t.id)}
                        aria-label={`Select ${t.id}`}
                      />
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <span className="font-medium">{t.id}</span>
                    </td>
                    <td className="p-2 whitespace-nowrap">{t.date || "—"}</td>
                    <td className="p-2 whitespace-nowrap">{t.type}</td>
                    <td className="p-2 whitespace-nowrap">
                      <strong>{money(t.amount, t.currency)}</strong>
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center ${
                          t.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : t.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {t.status === "Completed" && <CheckIcon className="w-4 h-4 mr-1" />}
                        {t.status === "Pending" && <CheckIcon className="w-4 h-4 mr-1" />}
                        {t.status === "Failed" && <XMarkIcon className="w-4 h-4 mr-1" />}
                        {t.status}
                      </span>
                    </td>
                    <td className="p-2 whitespace-nowrap">{t.traveller}</td>
                    <td className="p-2 whitespace-nowrap max-w-[180px] truncate" title={t.email}>
                      {t.email}
                    </td>
                    <td className="p-2 whitespace-nowrap">{t.bookingId || "N/A"}</td>
                    <td className="p-2 whitespace-nowrap">{t.paymentMethod}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generateInvoicePDF(t)}
                          className="flex items-center px-2 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs"
                        >
                          <DocumentTextIcon className="w-4 h-4 mr-1" />
                          Invoice
                        </button>
                        <button
                          onClick={() => setEditTransaction({ ...t })}
                          className="flex items-center px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(t.id)}
                          className="flex items-center px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs"
                        >
                          <TrashIcon className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pageRows.length === 0 && <div className="p-4 text-center text-gray-500">No transactions found.</div>}
          </div>
        </div>
      )}

      {/* Mobile cards */}
      {!loading && !error && (
        <div className="md:hidden space-y-3 mt-3">
          {pageRows.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(t.id)}
                  onChange={() => toggleSelect(t.id)}
                  className="mr-2"
                  aria-label={`Select ${t.id}`}
                />
                <CreditCardIcon className="w-5 h-5 text-gray-400 mr-2" />
                <span className="font-medium text-sm">{t.id}</span>
              </div>
              <p className="text-xs text-gray-600">Date: {t.date || "—"}</p>
              <p className="text-xs text-gray-600">Type: {t.type}</p>
              <p className="text-xs text-gray-600">Amount: {money(t.amount, t.currency)}</p>
              <p className="text-xs text-gray-600">
                Status:{" "}
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center ${
                    t.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : t.status === "Pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {t.status === "Completed" && <CheckIcon className="w-3 h-3 mr-1" />}
                  {t.status === "Pending" && <CheckIcon className="w-3 h-3 mr-1" />}
                  {t.status === "Failed" && <XMarkIcon className="w-3 h-3 mr-1" />}
                  {t.status}
                </span>
              </p>
              <p className="text-xs text-gray-600">Traveller: {t.traveller}</p>
              <p className="text-xs text-gray-600 truncate" title={t.email}>
                Email: {t.email}
              </p>
              <p className="text-xs text-gray-600">Booking ID: {t.bookingId || "N/A"}</p>
              <p className="text-xs text-gray-600">Payment Method: {t.paymentMethod}</p>
              <div className="mt-2 flex gap-2 flex-wrap">
                <button
                  onClick={() => generateInvoicePDF(t)}
                  className="flex items-center px-2 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs"
                >
                  <DocumentTextIcon className="w-3 h-3 mr-1" />
                  Invoice
                </button>
                <button
                  onClick={() => setEditTransaction({ ...t })}
                  className="flex items-center px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
                >
                  <PencilIcon className="w-3 h-3 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(t.id)}
                  className="flex items-center px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs"
                >
                  <TrashIcon className="w-3 h-3 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
          {pageRows.length === 0 && <div className="p-4 text-center text-gray-500 text-sm">No transactions found.</div>}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Show</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(parseInt(e.target.value, 10))}
              className="p-2 border rounded-lg text-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-xs text-gray-600">per page</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 text-xs"
            >
              Previous
            </button>
            <span className="text-xs text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 text-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Audit Log */}
      {!loading && !error && auditLog.length > 0 && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-sm font-semibold mb-3">Audit Log</h2>
          <ul className="space-y-1">
            {auditLog.map((log, i) => (
              <li key={i} className="text-xs text-gray-600">
                {log.timestamp}: {log.action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Edit Modal */}
      {editTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-sm font-semibold mb-4">Edit Transaction</h3>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={editTransaction.amount}
                  onChange={(e) =>
                    setEditTransaction({ ...editTransaction, amount: e.target.value })
                  }
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Currency</label>
                <select
                  value={editTransaction.currency}
                  onChange={(e) => setEditTransaction({ ...editTransaction, currency: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  required
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Status</label>
                <select
                  value={editTransaction.status}
                  onChange={(e) => setEditTransaction({ ...editTransaction, status: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Payment Method</label>
                <select
                  value={editTransaction.paymentMethod}
                  onChange={(e) => setEditTransaction({ ...editTransaction, paymentMethod: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  required
                >
                  <option>Bank</option>
                  <option>Visa</option>
                  <option>MasterCard</option>
                  <option>PayPal</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditTransaction(null)}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-sm font-semibold mb-4">Delete Transaction</h3>
            <p className="text-xs text-gray-600 mb-4">Are you sure you want to delete this transaction?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-sm font-semibold mb-4">Generate Report</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                >
                  <option value="dateRange">Date Range</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {reportType === "dateRange" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      value={reportDateRange.start}
                      onChange={(e) => setReportDateRange((r) => ({ ...r, start: e.target.value }))}
                      className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      value={reportDateRange.end}
                      onChange={(e) => setReportDateRange((r) => ({ ...r, end: e.target.value }))}
                      className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-700">Month</label>
                  <input
                    type="month"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => generateReport("excel")}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs"
                >
                  Excel
                </button>
                <button
                  type="button"
                  onClick={() => generateReport("pdf")}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
                >
                  PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
