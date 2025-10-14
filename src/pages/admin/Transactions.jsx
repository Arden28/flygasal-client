// src/pages/admin/Transactions.jsx
import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CreditCardIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiService from "../../api/apiService";

/* ---------------- Small UI helpers (minimalist look) ---------------- */
const cx = (...c) => c.filter(Boolean).join(" ");
const money = (n, c = "USD") => {
  const x = Number(n);
  if (!isFinite(x)) return `${c} 0.00`;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(x);
  } catch {
    return `${c} ${x.toFixed(2)}`;
  }
};
const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
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
const normalizeType = (val) => {
  const s = safeStr(val).toLowerCase().trim();
  if (["wallet deposit", "wallet_deposit", "wallet topup", "wallet-topup", "topup", "deposit"].includes(s))
    return "wallet_topup";
  if (s === "bookings") return "booking";
  if (s === "refunds") return "refund";
  return s || "booking";
};
const normalizeStatus = (val) => {
  const s = safeStr(val).toLowerCase().trim();
  if (s.startsWith("comp") || s === "approved") return "completed";
  if (s.startsWith("pend")) return "pending";
  if (s.startsWith("fail") || s === "rejected" || s === "cancelled" || s === "canceled") return "failed";
  return s || "pending";
};

function Badge({ tone = "gray", children }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    gray: "bg-gray-50 text-gray-700 ring-gray-200",
    indigo: "bg-blue-50 text-blue-700 ring-blue-200",
  };
  return <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1", tones[tone])}>{children}</span>;
}
function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "min-w-[110px] px-3 py-2 rounded-full text-xs font-medium border transition-colors",
        active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      )}
    >
      {children}
    </button>
  );
}
function Modal({ open, title, onClose, footer, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white ring-1 ring-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <button className="p-1 rounded hover:bg-gray-50" onClick={onClose} aria-label="Close">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">{footer}</div>}
      </div>
    </div>
  );
}
function TableSkeleton() {
  return (
    <div className="bg-white ring-1 ring-gray-200 rounded-xl overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>{Array.from({ length: 11 }).map((_, i) => <th key={i} className="p-3 text-left text-xs text-gray-600" />)}</tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, r) => (
            <tr key={r} className="border-t border-gray-100">
              {Array.from({ length: 11 }).map((__, c) => (
                <td key={c} className="p-3">
                  <div className="h-3 w-full max-w-[180px] bg-gray-100 animate-pulse rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------- Component -------------------------------- */
export default function Transactions() {
  const navigate = useNavigate();

  // search / filters
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

  // sort/pagination/density
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [density, setDensity] = useState("comfortable"); // 'comfortable' | 'compact'

  // selection
  const [selectedIds, setSelectedIds] = useState([]);

  // data
  const [transactions, setTransactions] = useState([]);
  const [auditLog, setAuditLog] = useState([]);

  // modals
  const [editTransaction, setEditTransaction] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("dateRange");
  const [reportMonth, setReportMonth] = useState("");
  const [reportDateRange, setReportDateRange] = useState({ start: "", end: "" });
  const [approveTx, setApproveTx] = useState(null);
  const [approveAmount, setApproveAmount] = useState("");
  const [approveNote, setApproveNote] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);

  // ui
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // column visibility (persisted)
  const COLS = [
    { key: "id", label: "Transaction ID", always: true },
    { key: "date", label: "Date" },
    { key: "type", label: "Type" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
    { key: "traveller", label: "Traveller" },
    { key: "email", label: "Email" },
    { key: "bookingId", label: "Booking ID" },
    { key: "paymentMethod", label: "Payment Method" },
    { key: "actions", label: "Actions", always: true },
  ];
  const defaultVisible = () => {
    const obj = {};
    COLS.forEach((c) => (obj[c.key] = c.always || ["date", "type", "amount", "status", "traveller", "email", "paymentMethod"].includes(c.key)));
    return obj;
  };
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tx_col_vis_v1") || "null") || defaultVisible();
    } catch {
      return defaultVisible();
    }
  });
  useEffect(() => {
    localStorage.setItem("tx_col_vis_v1", JSON.stringify(visibleCols));
  }, [visibleCols]);

  // debounce search
  const qTimer = useRef();
  useEffect(() => {
    clearTimeout(qTimer.current);
    qTimer.current = setTimeout(() => setDebouncedQ(query.trim().toLowerCase()), 300);
    return () => clearTimeout(qTimer.current);
  }, [query]);

  // fetch
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiService.get("/transactions");
        const rows = res?.data?.data || [];
        const formatted = rows.map((t) => {
          const type = normalizeType(t.type || t.transaction_type);
          const status = normalizeStatus(t.status);
          return {
            id: safeStr(t.trx_id || ""),        // human id / code
            dbId: t.id ?? "",                   // internal id for backend
            date: safeStr(t.date || t.created_at || ""),
            type,
            amount: Number(t.amount) || 0,
            currency: safeStr(t.currency || "USD"),
            status,
            traveller: safeStr(t.name || t.traveller || "N/A"),
            email: safeStr(t.email || "N/A"),
            bookingId: safeStr(t.booking_num || "N/A"),
            paymentMethod: safeStr(t.payment_gateway || t.paymentMethod || "bank"),
          };
        });
        if (!cancel) setTransactions(formatted);
      } catch (e) {
        console.error(e);
        if (!cancel) setError("We couldn’t load transactions. Please try again.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // sort
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

  // filter
  const startD = useMemo(() => (dateFilter.start ? parseD(dateFilter.start) : null), [dateFilter.start]);
  const endD = useMemo(() => (dateFilter.end ? parseD(dateFilter.end) : null), [dateFilter.end]);

  const baseForStatusCounts = useMemo(() => {
    return sorted.filter((t) => {
      const q = debouncedQ;
      const qMatch =
        !q ||
        safeStr(t.id).toLowerCase().includes(q) ||
        safeStr(t.traveller).toLowerCase().includes(q) ||
        safeStr(t.email).toLowerCase().includes(q);
      const typeOk = !typeFilter || t.type === typeFilter;
      const dOk = inRange(parseD(t.date), startD, endD);
      return qMatch && typeOk && dOk;
    });
  }, [sorted, debouncedQ, typeFilter, startD, endD]);

  const filtered = useMemo(() => {
    return baseForStatusCounts.filter((t) => !statusFilter || t.status === statusFilter);
  }, [baseForStatusCounts, statusFilter]);

  // pagination & selection resets
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageStart = (currentPage - 1) * perPage;
  const pageRows = useMemo(() => filtered.slice(pageStart, pageStart + perPage), [filtered, pageStart, perPage]);
  useEffect(() => {
    setSelectedIds([]);
    setCurrentPage(1);
  }, [debouncedQ, typeFilter, statusFilter, dateFilter, perPage]);

  // summary (for insights)
  const summary = useMemo(() => {
    const sum = (arr) => arr.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const completed = baseForStatusCounts.filter((t) => t.status === "completed");
    const pending = baseForStatusCounts.filter((t) => t.status === "pending");
    const failed = baseForStatusCounts.filter((t) => t.status === "failed");
    const ccy = baseForStatusCounts[0]?.currency || "USD";
    return {
      currency: ccy,
      totals: {
        completed: sum(completed),
        pending: sum(pending),
        failed: sum(failed),
        all: sum(baseForStatusCounts),
      },
      counts: {
        all: baseForStatusCounts.length,
        completed: completed.length,
        pending: pending.length,
        failed: failed.length,
      },
    };
  }, [baseForStatusCounts]);

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
    const toStatus = action === "complete" ? "completed" : "failed";
    setTransactions((rows) => rows.map((r) => (selectedIds.includes(r.id) ? { ...r, status: toStatus } : r)));
    setAuditLog((l) => [...l, { action: `Bulk ${action} (${selectedIds.length})`, timestamp: new Date().toISOString() }]);
    toast.success(`Marked ${selectedIds.length} as ${titleCase(toStatus)}.`);
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

  const handleInvoice = async (t) => {
    if (t.type === "booking") {
      navigate(`/flight/booking/invoice/${t.bookingId || t.order_num}`);
    } else {
      generateInvoicePDF(t);
    }
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
        ["Status", titleCase(t.status)],
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

  const exportExcel = (dataset, filename = "transactions.xlsx") => {
    const exportData = dataset.map((t) => ({
      "Transaction ID": t.id,
      Date: t.date,
      Type: t.type,
      Amount: t.amount,
      Currency: t.currency,
      Status: t.status,
      Traveller: t.traveller,
      Email: t.email,
      "Booking ID": t.bookingId || "N/A",
      "Payment Method": t.paymentMethod,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = Object.keys(exportData[0] || {}).map((k) => ({
      wch: Math.max(k.length, ...exportData.map((r) => String(r[k] || "").length)) + 2,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, filename);
  };
  const exportCSV = (dataset, filename = "transactions.csv") => {
    const headers = ["Transaction ID", "Date", "Type", "Amount", "Currency", "Status", "Traveller", "Email", "Booking ID", "Payment Method"];
    const rows = dataset.map((t) => [
      t.id,
      t.date,
      t.type,
      t.amount,
      t.currency,
      t.status,
      t.traveller,
      t.email,
      t.bookingId || "N/A",
      t.paymentMethod,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // approval flow
  const openApproveModal = (t) => {
    setApproveTx(t);
    setApproveAmount(String(t.amount || ""));
    setApproveNote("");
  };
  const submitTopupDecision = async (decision /* 'approved' | 'rejected' */) => {
    if (!approveTx) return;
    const amt = Number(approveAmount);
    if (!isFinite(amt) || amt < 0) return toast.error("Enter a valid amount.");

    const txIdForApi =
      approveTx?.dbId != null
        ? approveTx.dbId
        : Number(approveTx?.id) && !isNaN(Number(approveTx.id))
        ? Number(approveTx.id)
        : null;
    if (!txIdForApi) return toast.error("Cannot proceed: missing internal transaction id.");

    setDecisionLoading(true);
    try {
      const res = await apiService.post("/transactions/approve", {
        transaction_id: txIdForApi,
        amount: amt,
        status: decision,
        note: approveNote,
      });

      if (!(res && (res.status === 200 || res.status === 201))) throw new Error(res?.data?.message || "Request failed");

      const serverStatus = safeStr(res?.data?.data?.status).toLowerCase();
      let normalized = normalizeStatus(serverStatus);
      if (normalized === "pending") normalized = decision === "approved" ? "completed" : "failed";

      const newAmount = Number(res?.data?.data?.amount) || amt;
      const newCurrency = safeStr(res?.data?.data?.currency) || approveTx.currency;

      setTransactions((rows) => rows.map((r) => (r.id === approveTx.id ? { ...r, status: normalized, amount: newAmount, currency: newCurrency } : r)));
      setAuditLog((l) => [
        ...l,
        {
          action: decision === "approved" ? `Approved wallet top-up ${approveTx.id} (${money(newAmount, newCurrency)})` : `Declined wallet top-up ${approveTx.id}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      toast.success(decision === "approved" ? "Top-up approved & credited." : "Top-up declined.");
      setApproveTx(null);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Action failed.");
    } finally {
      setDecisionLoading(false);
    }
  };

  // ui helpers
  const densityRowPad = density === "compact" ? "py-2" : "py-3";

  return (
    <div className="p-3 sm:p-4">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm">Search, filter, export, and manage approvals.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Generate Report
          </button>
          <Link to="/admin" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Back
          </Link>
        </div>
      </div>

      {/* Command bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {/* search */}
        <div className="col-span-2">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transaction ID, traveller, or email…"
              className="w-full h-10 rounded-lg bg-white text-gray-900 text-sm placeholder:text-gray-500 pl-10 pr-28 outline-none ring-1 ring-gray-200 focus:ring-gray-300"
              aria-label="Search transactions"
            />
            <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <div className="absolute inset-y-0 right-2 flex items-center gap-2">
              <button
                onClick={() => {
                  setQuery("");
                  setTypeFilter("");
                  setStatusFilter("");
                  setDateFilter({ start: "", end: "" });
                }}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
              <details className="relative">
                <summary className="list-none rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer">
                  Columns
                </summary>
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white ring-1 ring-gray-200 p-2 z-10">
                  {COLS.map((c) => (
                    <label key={c.key} className={cx("flex items-center gap-2 px-2 py-1 rounded", c.always ? "opacity-60" : "hover:bg-gray-50")}>
                      <input
                        type="checkbox"
                        checked={!!visibleCols[c.key]}
                        disabled={c.always}
                        onChange={(e) => setVisibleCols((v) => ({ ...v, [c.key]: e.target.checked }))}
                      />
                      <span className="text-sm text-gray-700">{c.label}</span>
                    </label>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* density */}
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

        {/* exports */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              exportExcel(filtered, "transactions.xlsx");
              toast.success("Exported to Excel.");
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Excel
          </button>
          <button
            onClick={() => {
              exportCSV(filtered, "transactions.csv");
              toast.success("Exported to CSV.");
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            CSV
          </button>
        </div>
      </div>

      {/* Quick type & status chips + summary */}
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="bg-white ring-1 ring-gray-200 rounded-xl p-3">
          <div className="flex overflow-x-auto gap-2">
            {[
              { label: "All Types", value: "" },
              { label: "Booking", value: "booking_payment" },
              { label: "Refund", value: "refund" },
              { label: "Wallet Deposit", value: "wallet_topup" },
            ].map(({ label, value }) => (
              <Pill key={value || "all"} active={typeFilter === value} onClick={() => setTypeFilter(value)}>
                {label}
              </Pill>
            ))}
          </div>
          <div className="mt-2 flex overflow-x-auto gap-2">
            {[
              { label: "All", value: "" },
              { label: "Completed", value: "completed", tone: "green" },
              { label: "Pending", value: "pending", tone: "amber" },
              { label: "Failed", value: "failed", tone: "red" },
            ].map(({ label, value, tone }) => (
              <Pill key={label} active={statusFilter === value} onClick={() => setStatusFilter(value)}>
                <span className="mr-1">{label}</span>
                <Badge tone={statusFilter === value ? "indigo" : tone || "gray"}>
                  {value ? summary.counts[value] : summary.counts.all}
                </Badge>
              </Pill>
            ))}
          </div>
        </div>

        {/* Summary numbers */}
        <div className="bg-white ring-1 ring-gray-200 rounded-xl p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500">Total (filtered)</div>
              <div className="text-sm font-semibold text-gray-900">{money(summary.totals.all, summary.currency)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Completed</div>
              <div className="text-sm font-semibold text-gray-900">{money(summary.totals.completed, summary.currency)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Pending</div>
              <div className="text-sm font-semibold text-gray-900">{money(summary.totals.pending, summary.currency)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Failed</div>
              <div className="text-sm font-semibold text-gray-900">{money(summary.totals.failed, summary.currency)}</div>
            </div>
          </div>
        </div>

        {/* Date filters */}
        <div className="bg-white ring-1 ring-gray-200 rounded-xl p-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600">From</label>
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter((d) => ({ ...d, start: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600">To</label>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter((d) => ({ ...d, end: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading / error / empty */}
      <div className="mt-4">
        {loading && <TableSkeleton />}
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
        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
            <div className="text-gray-900 font-medium">No transactions found</div>
            <div className="text-gray-500 text-sm">Try adjusting search or filters.</div>
            <div className="mt-3">
              <button
                onClick={() => {
                  setQuery("");
                  setTypeFilter("");
                  setStatusFilter("");
                  setDateFilter({ start: "", end: "" });
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Reset filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="hidden md:block bg-white ring-1 ring-gray-200 rounded-xl overflow-x-auto mt-4">
          <table className="min-w-[1000px] table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="w-10 p-3">
                  <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAllPage} aria-label="Select all on page" />
                </th>

                {/* dynamic columns */}
                {visibleCols.id && (
                  <th className="p-3 text-left text-xs font-semibold text-gray-600" onClick={() => handleSort("id")}>
                    <span className="inline-flex items-center gap-1 cursor-pointer select-none">
                      Transaction ID <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />
                    </span>
                  </th>
                )}
                {visibleCols.date && (
                  <th className="p-3 text-left text-xs font-semibold text-gray-600" onClick={() => handleSort("date")}>
                    <span className="inline-flex items-center gap-1 cursor-pointer select-none">
                      Date <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />
                    </span>
                  </th>
                )}
                {visibleCols.type && (
                  <th className="p-3 text-left text-xs font-semibold text-gray-600" onClick={() => handleSort("type")}>
                    <span className="inline-flex items-center gap-1 cursor-pointer select-none">
                      Type <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />
                    </span>
                  </th>
                )}
                {visibleCols.amount && (
                  <th className="p-3 text-left text-xs font-semibold text-gray-600" onClick={() => handleSort("amount")}>
                    <span className="inline-flex items-center gap-1 cursor-pointer select-none">
                      Amount <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />
                    </span>
                  </th>
                )}
                {visibleCols.status && <th className="p-3 text-left text-xs font-semibold text-gray-600">Status</th>}
                {visibleCols.traveller && <th className="p-3 text-left text-xs font-semibold text-gray-600">Traveller</th>}
                {visibleCols.email && <th className="p-3 text-left text-xs font-semibold text-gray-600">Email</th>}
                {visibleCols.bookingId && <th className="p-3 text-left text-xs font-semibold text-gray-600">Booking ID</th>}
                {visibleCols.paymentMethod && <th className="p-3 text-left text-xs font-semibold text-gray-600">Payment Method</th>}
                <th className="p-3 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {pageRows.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className={cx("px-3", densityRowPad)}>
                    <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} aria-label={`Select ${t.id}`} />
                  </td>
                  {visibleCols.id && (
                    <td className={cx("px-3 text-sm text-gray-900", densityRowPad)}>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(t.id);
                          toast.success("Transaction ID copied.");
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        title="Copy ID"
                      >
                        <ClipboardDocumentCheckIcon className="h-4 w-4 text-gray-500" />
                        {t.id}
                      </button>
                    </td>
                  )}
                  {visibleCols.date && <td className={cx("px-3 text-sm text-gray-700", densityRowPad)}>{t.date || "—"}</td>}
                  {visibleCols.type && <td className={cx("px-3 text-sm text-gray-700", densityRowPad)}>{t.type}</td>}
                  {visibleCols.amount && (
                    <td className={cx("px-3 text-sm text-gray-900", densityRowPad)}>
                      <strong>{money(t.amount, t.currency)}</strong>
                    </td>
                  )}
                  {visibleCols.status && (
                    <td className={cx("px-3", densityRowPad)}>
                      <Badge tone={t.status === "completed" ? "green" : t.status === "failed" ? "red" : "amber"}>{titleCase(t.status)}</Badge>
                    </td>
                  )}
                  {visibleCols.traveller && <td className={cx("px-3 text-sm text-gray-900 truncate", densityRowPad)}>{t.traveller}</td>}
                  {visibleCols.email && <td className={cx("px-3 text-sm text-gray-700 truncate", densityRowPad)} title={t.email}>{t.email}</td>}
                  {visibleCols.bookingId && <td className={cx("px-3 text-sm text-gray-700", densityRowPad)}>{t.bookingId || "N/A"}</td>}
                  {visibleCols.paymentMethod && <td className={cx("px-3 text-sm text-gray-700", densityRowPad)}>{t.paymentMethod}</td>}

                  <td className={cx("px-3", densityRowPad)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      {t.type === "wallet_topup" && t.status === "pending" && (
                        <button
                          onClick={() => openApproveModal(t)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          <CheckIcon className="h-4 w-4" />
                          Approve / Decline
                        </button>
                      )}
                      <button
                        onClick={() => handleInvoice(t)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                        Invoice
                      </button>
                      <button
                        onClick={() => setEditTransaction({ ...t })}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(t.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
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
                        value={perPage}
                        onChange={(e) => setPerPage(parseInt(e.target.value, 10))}
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
      {!loading && !error && filtered.length > 0 && (
        <div className="md:hidden space-y-3 mt-4">
          {pageRows.map((t) => (
            <div key={t.id} className="rounded-xl bg-white ring-1 ring-gray-200 p-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(t.id)}
                  onChange={() => toggleSelect(t.id)}
                  className="mr-2"
                  aria-label={`Select ${t.id}`}
                />
                <CreditCardIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div className="font-medium text-sm text-gray-900">{t.id}</div>
              </div>
              <div className="mt-1 text-xs text-gray-600">Date: {t.date || "—"}</div>
              <div className="mt-1 text-xs text-gray-600">Type: {t.type}</div>
              <div className="mt-1 text-xs text-gray-600">Amount: {money(t.amount, t.currency)}</div>
              <div className="mt-1 text-xs text-gray-600">
                Status: <Badge tone={t.status === "completed" ? "green" : t.status === "failed" ? "red" : "amber"}>{titleCase(t.status)}</Badge>
              </div>
              <div className="mt-1 text-xs text-gray-600">Traveller: {t.traveller}</div>
              <div className="mt-1 text-xs text-gray-600 break-all" title={t.email}>
                Email: {t.email}
              </div>
              {t.bookingId && <div className="mt-1 text-xs text-gray-600">Booking ID: {t.bookingId}</div>}
              <div className="mt-1 text-xs text-gray-600">Payment Method: {t.paymentMethod}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {t.type === "wallet_topup" && t.status === "pending" && (
                  <button
                    onClick={() => openApproveModal(t)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <CheckIcon className="h-4 w-4" />
                    Approve / Decline
                  </button>
                )}
                <button
                  onClick={() => handleInvoice(t)}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <DocumentTextIcon className="h-4 w-4" />
                  Invoice
                </button>
                <button
                  onClick={() => setEditTransaction({ ...t })}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(t.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}

          {/* mobile pagination */}
          <div className="flex items-center justify-between pt-1">
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
      {selectedIds.length > 0 && (
        <div className="fixed bottom-3 left-3 right-3 z-20">
          <div className="mx-auto max-w-7xl rounded-xl bg-white ring-1 ring-gray-200 px-3 py-2 flex items-center justify-between">
            <div className="text-sm text-gray-700">{selectedIds.length} selected</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulk("complete")}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Mark Completed
              </button>
              <button
                onClick={() => handleBulk("fail")}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Mark Failed
              </button>
              <button
                onClick={() => {
                  const selected = transactions.filter((t) => selectedIds.includes(t.id));
                  if (!selected.length) return toast.info("No selected rows to export.");
                  exportExcel(selected, "transactions_selected.xlsx");
                  toast.success("Selected exported.");
                }}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Export Selected
              </button>
              <button onClick={() => setSelectedIds([])} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit log */}
      {!loading && !error && auditLog.length > 0 && (
        <details className="mt-6 rounded-xl bg-white ring-1 ring-gray-200">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-gray-900 border-b border-gray-200">Audit Log</summary>
          <ul className="p-4 space-y-2">
            {auditLog.map((log, i) => (
              <li key={i} className="text-xs text-gray-700">
                {log.timestamp}: {log.action}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Edit Modal */}
      <Modal
        open={!!editTransaction}
        onClose={() => setEditTransaction(null)}
        title="Edit Transaction"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditTransaction(null)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={saveEdit} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
              Save
            </button>
          </div>
        }
      >
        {editTransaction && (
          <form onSubmit={saveEdit} className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Amount</label>
              <input
                type="number"
                step="0.01"
                value={editTransaction.amount}
                onChange={(e) => setEditTransaction({ ...editTransaction, amount: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Currency</label>
              <select
                value={editTransaction.currency}
                onChange={(e) => setEditTransaction({ ...editTransaction, currency: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
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
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Payment Method</label>
              <select
                value={editTransaction.paymentMethod}
                onChange={(e) => setEditTransaction({ ...editTransaction, paymentMethod: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              >
                <option>bank</option>
                <option>Visa</option>
                <option>MasterCard</option>
                <option>PayPal</option>
              </select>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        title="Delete Transaction"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowDeleteModal(null)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={() => handleDelete(showDeleteModal)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700">
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-700">Are you sure you want to delete this transaction?</p>
      </Modal>

      {/* Approve/Decline Top-up Modal */}
      <Modal
        open={!!approveTx}
        onClose={() => setApproveTx(null)}
        title="Approve or Decline Wallet Top-up"
        footer={
          <div className="flex justify-between items-center w-full">
            <button
              type="button"
              onClick={() => setApproveTx(null)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              disabled={decisionLoading}
            >
              Close
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => submitTopupDecision("rejected")}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700 disabled:opacity-60"
                disabled={decisionLoading}
              >
                {decisionLoading ? "Processing..." : "Decline"}
              </button>
              <button
                type="button"
                onClick={() => submitTopupDecision("approved")}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                disabled={decisionLoading}
              >
                {decisionLoading ? "Processing..." : "Approve & Credit"}
              </button>
            </div>
          </div>
        }
      >
        {approveTx && (
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              Transaction <span className="font-mono">{approveTx.id}</span> • {approveTx.email || "N/A"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-700 mb-1">Type</label>
                <div className="text-xs font-medium">Wallet Deposit</div>
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Status</label>
                <div className="text-xs font-medium">{titleCase(approveTx.status)}</div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">Amount ({approveTx.currency})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={approveAmount}
                onChange={(e) => setApproveAmount(e.target.value)}
                className="w-full h-10 rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              />
              <p className="mt-1 text-[11px] text-gray-500">Adjust if bank deposit differs from requested amount.</p>
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">Note (optional)</label>
              <textarea
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                rows={3}
                className="w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2 py-2"
                placeholder="Reference / bank slip / internal note"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Report Modal */}
      <Modal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Generate Report"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowReportModal(false)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => {
                // build dataset
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
                exportExcel(rangeFiltered, `transactions_report_${reportType === "dateRange" ? "range" : reportMonth}.xlsx`);
                toast.success("Report exported.");
                setShowReportModal(false);
              }}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
            >
              Excel
            </button>
            <button
              onClick={() => {
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
                    ["Completed", String(rangeFiltered.filter((t) => t.status === "completed").length)],
                    ["Pending", String(rangeFiltered.filter((t) => t.status === "pending").length)],
                    ["Failed", String(rangeFiltered.filter((t) => t.status === "failed").length)],
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
                    doc.text(`${t.id} | ${t.date} | ${t.type} | ${money(t.amount, t.currency)} | ${titleCase(t.status)}`, 14, y);
                    y += 6;
                    if (y > 280) {
                      doc.addPage();
                      y = 20;
                    }
                  });
                  const fname = `transactions_report_${reportType === "dateRange" ? "range" : reportMonth}.pdf`;
                  doc.save(fname);
                  toast.success("Report downloaded.");
                } catch {
                  toast.error("Failed to generate PDF.");
                }
                setShowReportModal(false);
              }}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            >
              PDF
            </button>
          </div>
        }
      >
        <form className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
            >
              <option value="dateRange">Date Range</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          {reportType === "dateRange" ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={reportDateRange.start}
                  onChange={(e) => setReportDateRange((r) => ({ ...r, start: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={reportDateRange.end}
                  onChange={(e) => setReportDateRange((r) => ({ ...r, end: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
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
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              />
            </div>
          )}
        </form>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
