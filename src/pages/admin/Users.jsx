// src/pages/admin/Users.jsx
import { useState, useMemo, useEffect, useRef } from "react";
import {
  UserCircleIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowsUpDownIcon,
  FunnelIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiService from "../../api/apiService";

/* ----------------------------- small helpers ----------------------------- */
const cx = (...c) => c.filter(Boolean).join(" ");
const asNumber = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
const toCurrency = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n || 0));

/* ----------------------------- UI subcomponents ----------------------------- */
function Badge({ children, tone = "gray" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    gray: "bg-gray-50 text-gray-700 ring-gray-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
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
        active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      )}
    >
      {children}
    </button>
  );
}

function Modal({ open, title, onClose, children, footer }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        ref={ref}
        className="relative z-10 w-full max-w-md sm:max-w-lg rounded-2xl bg-white ring-1 ring-gray-200 flex max-h-[90vh] flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (fixed) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-50" aria-label="Close">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {/* Footer (fixed) */}
        {footer && <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">{footer}</div>}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="p-3">
          <div className="h-3 w-full max-w-[160px] animate-pulse rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  );
}

/* ---------------------------------- Page ---------------------------------- */
export default function Users() {
  // query / filters / view
  const [rawSearch, setRawSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState({ min: "", max: "" });
  const [density, setDensity] = useState("comfortable"); // 'comfortable' | 'compact'

  // sorting & paging
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  // selection
  const [selectedUsers, setSelectedUsers] = useState([]);

  // data
  const [users, setUsers] = useState([]);
  const [auditLog, setAuditLog] = useState([]);

  // modals/sheets
  const [editUser, setEditUser] = useState(null);
  const [addUser, setAddUser] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(null);
  const [showDeclineModal, setShowDeclineModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // ui states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ------------------------------- data fetch ------------------------------ */
  useEffect(() => {
    let cancelled = false;
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.get("/admin/users");
        const apiUsers = response?.data?.data?.data || [];
        const formatted = apiUsers.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          type: u.roles?.[0]?.name ?? "N/A",
          status: u.is_active ? "Active" : "Inactive",
          walletBalance: Number(u.wallet_balance ?? 0),

          // agency fields if present
          agency_license: u.agency_license || "",
          agency_country: u.agency_country || "",
          agency_city: u.agency_city || "",
          agency_address: u.agency_address || "",
        }));
        if (!cancelled) setUsers(formatted);
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to fetch users:", e);
          setError("We couldn’t load users. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------------------- debounced search ------------------------------ */
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(rawSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [rawSearch]);

  /* ----------------------------- reset page on filter/sort/search ----------------------------- */
  useEffect(() => setCurrentPage(1), [searchTerm, typeFilter, statusFilter, usersPerPage]);

  /* --------------------------------- sorting --------------------------------- */
  const sortedUsers = useMemo(() => {
    const list = [...users];
    const { key, direction } = sortConfig;
    if (!key) return list;
    return list.sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      const av = typeof va === "string" ? va.toLowerCase() : va;
      const bv = typeof vb === "string" ? vb.toLowerCase() : vb;
      if (av < bv) return direction === "asc" ? -1 : 1;
      if (av > bv) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [users, sortConfig]);

  /* -------------------------------- filtering -------------------------------- */
  const filteredUsers = useMemo(() => {
    const min = asNumber(balanceFilter.min);
    const max = asNumber(balanceFilter.max);
    return sortedUsers.filter((u) => {
      const matchesSearch =
        !searchTerm ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || u.type === typeFilter;
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      const val = Number(u.walletBalance || 0);
      const matchesBalance = (min === null || val >= min) && (max === null || val <= max);
      return matchesSearch && matchesType && matchesStatus && matchesBalance;
    });
  }, [sortedUsers, searchTerm, typeFilter, statusFilter, balanceFilter]);

  /* -------------------------------- pagination -------------------------------- */
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const paginatedUsers = useMemo(
    () => filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage),
    [filteredUsers, currentPage, usersPerPage]
  );

  /* ---------------------------------- export --------------------------------- */
  const exportToExcel = () => {
    const exportData = filteredUsers.map((u) => ({
      Name: u.name,
      Email: u.email,
      Type: u.type,
      Status: u.status,
      "Wallet Balance": u.walletBalance,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "users_export.xlsx");
    toast.success("Exported to Excel.");
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Type", "Status", "Wallet Balance"];
    const rows = filteredUsers.map((u) => [u.name, u.email, u.type, u.status, u.walletBalance]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_export.csv";
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

  const handleSelectUser = (id) => {
    setSelectedUsers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAllOnPage = () => {
    const pageIds = paginatedUsers.map((u) => u.id);
    const allSelected = pageIds.every((id) => selectedUsers.includes(id));
    setSelectedUsers((prev) => (allSelected ? prev.filter((id) => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])] ));
  };

  const resetFilters = () => {
    setRawSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setBalanceFilter({ min: "", max: "" });
    setDensity("comfortable");
    setSelectedUsers([]);
  };

  // bulk action
  const handleBulkAction = (action) => {
    setUsers((list) =>
      list.map((u) => (selectedUsers.includes(u.id) ? { ...u, status: action === "approve" ? "Active" : "Inactive" } : u))
    );
    setAuditLog((log) => [
      ...log,
      { action: `Bulk ${action} for ${selectedUsers.length} users`, timestamp: new Date().toISOString() },
    ]);
    toast.success(`Bulk ${action} done for ${selectedUsers.length} users.`);
    setSelectedUsers([]);
  };

  // specific actions
  const handleApprove = async (userId) => {
    try {
      setUsers((list) => list.map((u) => (u.id === userId ? { ...u, status: "Active" } : u)));
      setAuditLog((log) => [...log, { action: `Approved user ${userId}`, timestamp: new Date().toISOString() }]);
      setShowApprovalModal(null);
      await apiService.post(`/admin/users/${userId}/approve`);
      toast.success("User approved.");
    } catch (e) {
      console.error("Approval failed:", e);
      toast.error("Could not approve user.");
    }
  };

  const handleDecline = (userId) => {
    setUsers((list) => list.map((u) => (u.id === userId ? { ...u, status: "Inactive" } : u)));
    setAuditLog((log) => [...log, { action: `Declined user ${userId}`, timestamp: new Date().toISOString() }]);
    toast.success("User declined.");
    setShowDeclineModal(null);
  };

  const handleDelete = async (userId) => {
    try {
      setUsers((list) => list.filter((u) => u.id !== userId));
      setAuditLog((log) => [...log, { action: `Deleted user ${userId}`, timestamp: new Date().toISOString() }]);
      setShowDeleteModal(null);
      await apiService.delete(`/admin/users/${userId}`);
      toast.success("User deleted.");
    } catch (e) {
      console.error("Delete failed:", e);
      toast.error("Could not delete user.");
    }
  };

  const handleEdit = (user) => setEditUser({ ...user });

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const u = editUser;
    if (!u?.name || !u?.email || !u?.type || !u?.status || Number(u?.walletBalance) < 0) {
      toast.error("Please fill all fields correctly.");
      return;
    }
    if (u.type === "agent" && (!u.agency_license || !u.agency_country || !u.agency_city || !u.agency_address)) {
      toast.error("Please complete all agency details for agents.");
      return;
    }

    try {
      setUsers((list) => list.map((x) => (x.id === u.id ? u : x)));
      setAuditLog((log) => [...log, { action: `Edited user ${u.id}`, timestamp: new Date().toISOString() }]);
      setEditUser(null);
      await apiService.put(`/admin/users/${u.id}`, u);
      toast.success("User updated.");
    } catch (e) {
      console.error("Update failed:", e);
      toast.error("Could not update user.");
    }
  };

  const handleAdd = () => {
    setAddUser({
      id: "",
      name: "",
      email: "",
      phone: "",
      password: "",
      type: "Client",
      status: "Active",
      walletBalance: 0,
      agency_license: "",
      agency_country: "",
      agency_city: "",
      agency_address: "",
    });
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    const u = addUser;
    if (!u?.name || !u?.email || !u?.type || !u?.status || Number(u?.walletBalance) < 0) {
      toast.error("Please fill all fields correctly.");
      return;
    }
    if (u.type === "agent" && (!u.agency_license || !u.agency_country || !u.agency_city || !u.agency_address)) {
      toast.error("Please complete all agency details for agents.");
      return;
    }

    try {
      const newUser = { ...u, id: `user_${Date.now()}` };
      setUsers((list) => [...list, newUser]);
      setAuditLog((log) => [...log, { action: `Added user ${newUser.id}`, timestamp: new Date().toISOString() }]);
      setAddUser(null);
      await apiService.post("/admin/users", newUser);
      toast.success("User added.");
    } catch (e) {
      console.error("Add failed:", e);
      toast.error("Could not add user.");
    }
  };

  /* ---------------------------------- options --------------------------------- */
  const uniqueTypes = useMemo(() => {
    const set = new Set(users.map((u) => u.type).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [users]);

  /* ---------------------------------- layout ---------------------------------- */
  const rowPad = density === "compact" ? "py-2" : "py-3";

  return (
    <div className="relative p-3 sm:p-4">
      {/* Header / Toolbar */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Users</h1>
            <p className="text-gray-500 text-sm">Manage accounts, roles and balances.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
            >
              Add User
            </button>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Back
            </Link>
          </div>
        </div>

        {/* Command bar */}
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-2">
            <label className="sr-only" htmlFor="search">Search</label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Search by name or email…"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="w-full h-10 rounded-lg bg-white text-gray-900 text-sm placeholder:text-gray-500 pl-10 pr-24 outline-none ring-1 ring-gray-200 focus:ring-gray-300"
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
      </div>

      {/* Quick Status Chips */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-4 border-b border-gray-200">
        {[
          { label: "All", value: "all", count: filteredUsers.length },
          { label: "Active", value: "Active", count: filteredUsers.filter((u) => u.status === "Active").length },
          { label: "Inactive", value: "Inactive", count: filteredUsers.filter((u) => u.status === "Inactive").length },
          { label: "Pending", value: "Pending", count: filteredUsers.filter((u) => u.status === "Pending").length },
        ].map(({ label, value, count }) => (
          <Pill key={value} active={statusFilter === value} onClick={() => setStatusFilter(value)}>
            <span className="mr-1">{label}</span>
            <Badge tone={statusFilter === value ? "blue" : "gray"}>{count}</Badge>
          </Pill>
        ))}
      </div>

      {/* Loading / Error / Empty */}
      {loading && (
        <div className="bg-white ring-1 ring-gray-200 rounded-xl overflow-hidden">
          <table className="min-w-full table-fixed">
            <thead className="bg-gray-50">
              <tr>
                {["", "Name", "Email", "Type", "Status", "Balance", "Actions"].map((h) => (
                  <th key={h} className="p-3 text-left text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
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

      {!loading && !error && filteredUsers.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          <div className="text-gray-900 font-medium">No users found</div>
          <div className="text-gray-500 text-sm">Try adjusting filters or search.</div>
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

      {/* Desktop Table */}
      {!loading && !error && filteredUsers.length > 0 && (
        <div className="hidden md:block bg-white ring-1 ring-gray-200 rounded-xl overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="w-12 p-3">
                  <input
                    type="checkbox"
                    checked={paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUsers.includes(u.id))}
                    onChange={toggleSelectAllOnPage}
                    aria-label="Select all users on this page"
                  />
                </th>
                {[
                  { key: "name", label: "Name" },
                  { key: "email", label: "Email" },
                  { key: "type", label: "Type" },
                  { key: "status", label: "Status" },
                  { key: "walletBalance", label: "Balance" },
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
                <th className="w-40 p-3 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className={cx("px-3", rowPad)}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => handleSelectUser(u.id)}
                      aria-label={`Select ${u.name}`}
                    />
                  </td>
                  <td className={cx("px-3", rowPad)}>
                    <div className="flex items-center">
                      <UserCircleIcon className="h-6 w-6 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 truncate">{u.name}</span>
                    </div>
                  </td>
                  <td className={cx("px-3 text-sm text-gray-700 truncate", rowPad)}>{u.email}</td>
                  <td className={cx("px-3 text-sm text-gray-700", rowPad)}>{u.type}</td>
                  <td className={cx("px-3", rowPad)}>
                    <Badge tone={u.status === "Active" ? "green" : u.status === "Inactive" ? "red" : "amber"}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className={cx("px-3 text-sm text-gray-900", rowPad)}>{toCurrency(u.walletBalance)}</td>
                  <td className={cx("px-3", rowPad)}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/admin/users/${u.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        aria-label={`View ${u.name}`}
                      >
                        <EyeIcon className="h-4 w-4" />
                        View
                      </Link>
                      <button
                        onClick={() => handleEdit(u)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        aria-label={`Edit ${u.name}`}
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </button>
                      {u.status !== "Active" && (
                        <button
                          onClick={() => setShowApprovalModal(u.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                          aria-label={`Approve ${u.name}`}
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => setShowDeleteModal(u.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        aria-label={`Delete ${u.name}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer / Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Rows</span>
              <select
                value={usersPerPage}
                onChange={(e) => setUsersPerPage(parseInt(e.target.value))}
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
        </div>
      )}

      {/* Mobile Cards */}
      {!loading && !error && filteredUsers.length > 0 && (
        <div className="md:hidden space-y-3">
          {paginatedUsers.map((u) => (
            <div key={u.id} className="rounded-xl bg-white ring-1 ring-gray-200 p-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(u.id)}
                  onChange={() => handleSelectUser(u.id)}
                  aria-label={`Select ${u.name}`}
                />
                <UserCircleIcon className="h-5 w-5 text-gray-400" />
                <div className="font-medium text-sm text-gray-900 truncate">{u.name}</div>
              </div>
              <div className="mt-2 text-xs text-gray-600 truncate">Email: {u.email}</div>
              <div className="mt-1 text-xs text-gray-600">Type: {u.type}</div>
              <div className="mt-1 text-xs text-gray-600">
                Status:{" "}
                <Badge tone={u.status === "Active" ? "green" : u.status === "Inactive" ? "red" : "amber"}>
                  {u.status}
                </Badge>
              </div>
              <div className="mt-1 text-xs text-gray-600">Balance: {toCurrency(u.walletBalance)}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={`/admin/users/${u.id}`}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  aria-label={`View ${u.name}`}
                >
                  <EyeIcon className="h-4 w-4" />
                  View
                </Link>
                <button
                  onClick={() => handleEdit(u)}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  aria-label={`Edit ${u.name}`}
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </button>
                {u.status !== "Active" && (
                  <button
                    onClick={() => setShowApprovalModal(u.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                    aria-label={`Approve ${u.name}`}
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Approve
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteModal(u.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  aria-label={`Delete ${u.name}`}
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}

          {/* Pagination (mobile) */}
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

      {/* Sticky bulk bar when selected */}
      {selectedUsers.length > 0 && (
        <div className="fixed bottom-3 left-3 right-3 z-20 md:left-[calc(76px+12px)] md:right-3">
          <div className="mx-auto max-w-7xl rounded-xl bg-white ring-1 ring-gray-200 px-3 py-2 flex items-center justify-between">
            <div className="text-sm text-gray-700">{selectedUsers.length} selected</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction("approve")}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Approve
              </button>
              <button
                onClick={() => handleBulkAction("decline")}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Decline
              </button>
              <button
                onClick={() => setSelectedUsers([])}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log */}
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

      {/* Advanced Filters */}
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
            <label className="block text-xs font-medium text-gray-700">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
            >
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All Types" : t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
            >
              {["all", "Active", "Inactive", "Pending"].map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Statuses" : s}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700">Min Balance</label>
              <input
                type="number"
                value={balanceFilter.min}
                onChange={(e) => setBalanceFilter((b) => ({ ...b, min: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Max Balance</label>
              <input
                type="number"
                value={balanceFilter.max}
                onChange={(e) => setBalanceFilter((b) => ({ ...b, max: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                placeholder="1000"
                min="0"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Add User Modal */}
      <Modal
        open={!!addUser}
        onClose={() => setAddUser(null)}
        title="Add User"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAddUser(null)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAdd}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        }
      >
        {addUser && (
          <form onSubmit={handleSaveAdd} className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={addUser.name}
                onChange={(e) => setAddUser({ ...addUser, name: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={addUser.email}
                onChange={(e) => setAddUser({ ...addUser, email: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={addUser.phone}
                onChange={(e) => setAddUser({ ...addUser, phone: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={addUser.password}
                onChange={(e) => setAddUser({ ...addUser, password: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Type</label>
              <select
                value={addUser.type}
                onChange={(e) => setAddUser({ ...addUser, type: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              >
                <option value="Client">Client</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Agency fields (only when Agent) */}
            {addUser.type === "agent" && (
              <>
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-700 mb-2">Agency Details</div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Agency License</label>
                      <input
                        type="text"
                        value={addUser.agency_license}
                        onChange={(e) => setAddUser({ ...addUser, agency_license: e.target.value })}
                        className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Agency Country</label>
                        <input
                          type="text"
                          value={addUser.agency_country}
                          onChange={(e) => setAddUser({ ...addUser, agency_country: e.target.value })}
                          className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Agency City</label>
                        <input
                          type="text"
                          value={addUser.agency_city}
                          onChange={(e) => setAddUser({ ...addUser, agency_city: e.target.value })}
                          className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Agency Address</label>
                      <input
                        type="text"
                        value={addUser.agency_address}
                        onChange={(e) => setAddUser({ ...addUser, agency_address: e.target.value })}
                        className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700">Status</label>
              <select
                value={addUser.status}
                onChange={(e) => setAddUser({ ...addUser, status: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Wallet Balance</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={addUser.walletBalance}
                onChange={(e) => setAddUser({ ...addUser, walletBalance: parseFloat(e.target.value) || 0 })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit User"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditUser(null)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        }
      >
        {editUser && (
          <form onSubmit={handleSaveEdit} className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={editUser.name}
                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={editUser.email}
                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Type</label>
              <select
                value={editUser.type}
                onChange={(e) => setEditUser({ ...editUser, type: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              >
                <option value="Client">Client</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Agency fields (only when Agent) */}
            {editUser.type === "agent" && (
              <>
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-700 mb-2">Agency Details</div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Agency License</label>
                      <input
                        type="text"
                        value={editUser.agency_license || ""}
                        onChange={(e) => setEditUser({ ...editUser, agency_license: e.target.value })}
                        className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Agency Country</label>
                        <input
                          type="text"
                          value={editUser.agency_country || ""}
                          onChange={(e) => setEditUser({ ...editUser, agency_country: e.target.value })}
                          className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Agency City</label>
                        <input
                          type="text"
                          value={editUser.agency_city || ""}
                          onChange={(e) => setEditUser({ ...editUser, agency_city: e.target.value })}
                          className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Agency Address</label>
                      <input
                        type="text"
                        value={editUser.agency_address || ""}
                        onChange={(e) => setEditUser({ ...editUser, agency_address: e.target.value })}
                        className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700">Status</label>
              <select
                value={editUser.status}
                onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Wallet Balance</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editUser.walletBalance}
                onChange={(e) => setEditUser({ ...editUser, walletBalance: parseFloat(e.target.value) || 0 })}
                className="mt-1 h-10 w-full rounded-lg bg-white text-gray-900 text-sm ring-1 ring-gray-200 focus:ring-gray-300 px-2"
                required
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Confirm Approve */}
      <Modal
        open={!!showApprovalModal}
        onClose={() => setShowApprovalModal(null)}
        title="Approve User"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowApprovalModal(null)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleApprove(showApprovalModal)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
            >
              Approve
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-700">Are you sure you want to approve this user?</p>
      </Modal>

      {/* Confirm Decline */}
      <Modal
        open={!!showDeclineModal}
        onClose={() => setShowDeclineModal(null)}
        title="Decline User"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDeclineModal(null)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDecline(showDeclineModal)}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700"
            >
              Decline
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-700">Are you sure you want to decline this user?</p>
      </Modal>

      {/* Confirm Delete */}
      <Modal
        open={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        title="Delete User"
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
        <p className="text-sm text-gray-700">This action cannot be undone. Delete this user?</p>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
