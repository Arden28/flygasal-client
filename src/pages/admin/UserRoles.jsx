// src/components/admin/UserRoles.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheckIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiService from "../../api/apiService";

/* --------------------------------- Utils --------------------------------- */
const cx = (...c) => c.filter(Boolean).join(" ");
const safe = (v) => (v == null ? "" : String(v));
const byKey = (k, dir = "asc") => (a, b) => {
  const A = safe(a[k]).toLowerCase();
  const B = safe(b[k]).toLowerCase();
  if (A === B) return 0;
  const r = A > B ? 1 : -1;
  return dir === "asc" ? r : -r;
};

/* Permission presets (optional, tweak as needed) */
const PERMISSION_OPTIONS = [
  "manage_users",
  "manage_roles",
  "view_reports",
  "edit_transactions",
  "view_bookings",
  "edit_bookings",
  "view_transactions",
];
const PRESETS = [
  { label: "Admin", perms: PERMISSION_OPTIONS },
  { label: "Agent", perms: ["view_bookings", "edit_bookings", "view_transactions"] },
  { label: "Viewer", perms: ["view_bookings", "view_transactions", "view_reports"] },
];

export default function UserRoles() {
  /* ------------------------------- State -------------------------------- */
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const qTimer = useRef();

  const [statusFilter, setStatusFilter] = useState(""); // "" | "Active" | "Inactive"
  const [sort, setSort] = useState({ key: "name", direction: "asc" });

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [selectedIds, setSelectedIds] = useState([]);

  const [audit, setAudit] = useState([]);

  // Form modal (add/edit)
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // 'add' | 'edit'
  const [formRole, setFormRole] = useState({
    id: "",
    name: "",
    description: "",
    status: "Active",
    permissions: [],
  });
  const [formBusy, setFormBusy] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const searchRef = useRef(null);

  /* ------------------------------- Effects ------------------------------- */
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiService.get("/admin/roles");
        const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
        const normalized = rows.map((r) => ({
          id: r.id, // keep original; could be numeric or string
          name: safe(r.name),
          description: safe(r.description),
          status: r.status === "Inactive" ? "Inactive" : "Active",
          permissions: Array.isArray(r.permissions) ? r.permissions : [],
        }));
        if (!cancel) setRoles(normalized);
      } catch (e) {
        console.error(e);
        if (!cancel) setError("Failed to load user roles.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // Debounce search
  useEffect(() => {
    clearTimeout(qTimer.current);
    qTimer.current = setTimeout(() => setQDebounced(query.trim().toLowerCase()), 250);
    return () => clearTimeout(qTimer.current);
  }, [query]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if ((e.key === "n" || e.key === "N") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        openAdd();
      }
      if (e.key === "Escape") {
        setFormOpen(false);
        setDeleteId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ------------------------------- Derived ------------------------------- */
  const sorted = useMemo(() => {
    const arr = [...roles];
    return arr.sort(byKey(sort.key, sort.direction));
  }, [roles, sort]);

  const filteredBase = useMemo(() => {
    return sorted.filter((r) => {
      const q = qDebounced;
      const matchesQ =
        !q ||
        safe(r.name).toLowerCase().includes(q) ||
        safe(r.description).toLowerCase().includes(q) ||
        r.permissions.some((p) => p.toLowerCase().includes(q));
      const matchesStatus = !statusFilter || r.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [sorted, qDebounced, statusFilter]);

  const chipCounts = useMemo(
    () => ({
      all: filteredBase.length,
      Active: filteredBase.filter((r) => r.status === "Active").length,
      Inactive: filteredBase.filter((r) => r.status === "Inactive").length,
    }),
    [filteredBase]
  );

  const totalPages = Math.max(1, Math.ceil(filteredBase.length / perPage));
  const pageStart = (page - 1) * perPage;
  const pageRows = filteredBase.slice(pageStart, pageStart + perPage);

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selectedIds.includes(r.id));

  /* --------------------------------- UI ---------------------------------- */
  const setSortKey = (key) =>
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  const toggleSelectAllPage = () => {
    setSelectedIds((prev) =>
      allOnPageSelected ? prev.filter((id) => !pageRows.some((r) => r.id === id)) : [...new Set([...prev, ...pageRows.map((r) => r.id)])]
    );
  };
  const toggleSelect = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const bulkSet = (toStatus) => {
    if (!selectedIds.length) return;
    setRoles((rows) => rows.map((r) => (selectedIds.includes(r.id) ? { ...r, status: toStatus } : r)));
    setAudit((a) => [...a, { action: `Bulk ${toStatus.toLowerCase()} (${selectedIds.length})`, timestamp: new Date().toISOString() }]);
    toast.success(`Updated ${selectedIds.length} role${selectedIds.length > 1 ? "s" : ""}.`);
    setSelectedIds([]);
    // Optionally call backend bulk endpoint here
  };

  const openAdd = () => {
    setFormMode("add");
    setFormRole({ id: "", name: "", description: "", status: "Active", permissions: [] });
    setFormOpen(true);
  };
  const openEdit = (r) => {
    setFormMode("edit");
    setFormRole({ ...r });
    setFormOpen(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    const { name, description, status, permissions } = formRole;
    if (!name.trim() || !description.trim() || !permissions.length) {
      return toast.error("Please enter name, description and select at least one permission.");
    }
    setFormBusy(true);
    try {
      if (formMode === "add") {
        const payload = { name, description, status, permissions };
        const res = await apiService.post("/admin/roles", payload);
        const saved = res?.data?.data || { ...payload, id: `ROLE${Date.now()}` };
        setRoles((rows) => [...rows, saved]);
        setAudit((a) => [...a, { action: `Added role ${saved.name}`, timestamp: new Date().toISOString() }]);
        toast.success("Role added.");
      } else {
        const payload = { name, description, status, permissions };
        await apiService.put(`/admin/roles/${formRole.id}`, payload);
        setRoles((rows) => rows.map((r) => (r.id === formRole.id ? { ...r, ...payload } : r)));
        setAudit((a) => [...a, { action: `Edited role ${formRole.name}`, timestamp: new Date().toISOString() }]);
        toast.success("Role updated.");
      }
      setFormOpen(false);
    } catch (e1) {
      console.error(e1);
      toast.error("Failed to save role.");
    } finally {
      setFormBusy(false);
    }
  };

  const deleteRole = async (id) => {
    try {
      await apiService.delete(`/admin/roles/${id}`);
      setRoles((rows) => rows.filter((r) => r.id !== id));
      setAudit((a) => [...a, { action: `Deleted role ${id}`, timestamp: new Date().toISOString() }]);
      toast.success("Role deleted.");
    } catch (e) {
      console.error(e);
      toast.error("Could not delete role.");
    } finally {
      setDeleteId(null);
    }
  };

  const headerCell = (label, key, w = "") => (
    <th
      className={cx("p-2 text-left text-xs font-semibold text-gray-600 select-none", "cursor-pointer hover:bg-gray-50", w)}
      onClick={() => setSortKey(key)}
      title={`Sort by ${label}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span aria-hidden className="text-gray-400">
          {sort.key === key ? (sort.direction === "asc" ? "▲" : "▼") : ""}
        </span>
      </span>
    </th>
  );

  const StatusPill = ({ status }) => {
    const active = status === "Active";
    const cls = active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
    return (
      <span className={cx("px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center", cls)}>
        {active ? <CheckIcon className="w-4 h-4 mr-1" /> : <XMarkIcon className="w-4 h-4 mr-1" />}
        {status}
      </span>
    );
  };

  const PermChips = ({ perms = [] }) => {
    if (!perms.length) return <span className="text-xs text-gray-400">—</span>;
    const show = perms.slice(0, 3);
    const rest = perms.length - show.length;
    return (
      <div className="flex flex-wrap gap-1">
        {show.map((p) => (
          <span key={p} className="px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700">
            {p.replace(/_/g, " ")}
          </span>
        ))}
        {rest > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700" title={perms.join(", ")}>
            +{rest} more
          </span>
        )}
      </div>
    );
  };

  /* -------------------------------- Render -------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
          <div className="p-3 sm:p-4">

        {/* Top bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">User Roles</h1>
            <p className="text-xs text-gray-500">Create, edit and manage access across your team.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-3 py-2 text-xs hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4" />
              Add Role
            </button>
            <Link
              to="/"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
            >
              Back
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search roles, descriptions, permissions (/)"
                className="w-full h-10 rounded-lg border border-gray-300 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setQuery("");
                  setStatusFilter("");
                }}
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Status chips */}
          <div className="mt-3 flex gap-2 overflow-x-auto py-1">
            {[
              { label: "All", value: "", count: chipCounts.all },
              { label: "Active", value: "Active", count: chipCounts.Active },
              { label: "Inactive", value: "Inactive", count: chipCounts.Inactive },
            ].map(({ label, value, count }) => {
              const active = statusFilter === value;
              return (
                <button
                  key={label}
                  onClick={() => setStatusFilter(value)}
                  className={cx(
                    "px-3 py-2 rounded-lg border text-xs flex-shrink-0 min-w-[110px]",
                    active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-white"
                  )}
                >
                  <span className="mr-2">{label}</span>
                  <strong className={active ? "text-blue-700" : "text-gray-800"}>{count}</strong>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bulk actions */}
        {selectedIds.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              onClick={() => bulkSet("Active")}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs"
            >
              Activate Selected
            </button>
            <button
              onClick={() => bulkSet("Inactive")}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs"
            >
              Deactivate Selected
            </button>
          </div>
        )}

        {/* Loading / Error */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="animate-pulse space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 rounded bg-gray-100" />
              ))}
            </div>
          </div>
        )}
        {!loading && error && (
          <div className="p-4 bg-red-100 text-red-800 rounded-lg mb-4">{error}</div>
        )}

        {/* Desktop table */}
        {!loading && !error && (
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2 w-10">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={toggleSelectAllPage}
                        aria-label="Select all on page"
                      />
                    </th>
                    {headerCell("Role ID", "id", "w-32")}
                    {headerCell("Name", "name", "w-48")}
                    <th className="p-2 text-left text-xs font-semibold text-gray-600">Description</th>
                    {headerCell("Status", "status", "w-28")}
                    <th className="p-2 text-left text-xs font-semibold text-gray-600 w-[280px]">Permissions</th>
                    <th className="p-2 text-left text-xs font-semibold text-gray-600 w-48">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pageRows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          aria-label={`Select ${r.name}`}
                        />
                      </td>
                      <td className="p-2">{r.id}</td>
                      <td className="p-2">{r.name}</td>
                      <td className="p-2">{r.description}</td>
                      <td className="p-2">
                        <StatusPill status={r.status} />
                      </td>
                      <td className="p-2">
                        <PermChips perms={r.permissions} />
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openEdit(r)}
                            className="flex items-center px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(r.id)}
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
              {pageRows.length === 0 && (
                <div className="p-6 text-center text-gray-500">No roles match your filters.</div>
              )}
            </div>
          </div>
        )}

        {/* Mobile cards */}
        {!loading && !error && (
          <div className="md:hidden space-y-3">
            {pageRows.map((r) => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    className="mr-2"
                    aria-label={`Select ${r.name}`}
                  />
                  <ShieldCheckIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="font-medium text-sm">{r.name}</span>
                </div>
                <p className="text-xs text-gray-600">ID: {r.id}</p>
                <p className="text-xs text-gray-600">Description: {r.description}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Status: <StatusPill status={r.status} />
                </p>
                <div className="mt-1">
                  <PermChips perms={r.permissions} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => openEdit(r)}
                    className="flex items-center px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
                  >
                    <PencilIcon className="w-3 h-3 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(r.id)}
                    className="flex items-center px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs"
                  >
                    <TrashIcon className="w-3 h-3 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {pageRows.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">No roles match your filters.</div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && filteredBase.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Show</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(parseInt(e.target.value, 10))}
                className="p-2 border rounded-lg text-xs"
                aria-label="Rows per page"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-xs text-gray-600">per page</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 text-xs"
              >
                Previous
              </button>
              <span className="text-xs text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 text-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Audit Log */}
        {!loading && !error && audit.length > 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-3">Audit Log</h2>
            <ul className="space-y-1">
              {audit.map((log, i) => (
                <li key={i} className="text-xs text-gray-600">
                  {log.timestamp}: {log.action}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
            <div className="px-5 py-4 border-b">
              <div className="text-base font-semibold text-gray-900">
                {formMode === "add" ? "Add Role" : "Edit Role"}
              </div>
              <div className="text-xs text-gray-500">Fill the details below and save.</div>
            </div>
            <form onSubmit={submitForm} className="p-5 grid gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formRole.name}
                  onChange={(e) => setFormRole((r) => ({ ...r, name: e.target.value }))}
                  className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={formRole.description}
                  onChange={(e) => setFormRole((r) => ({ ...r, description: e.target.value }))}
                  className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Status</label>
                  <select
                    value={formRole.status}
                    onChange={(e) => setFormRole((r) => ({ ...r, status: e.target.value }))}
                    className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Apply Preset</label>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const preset = PRESETS.find((p) => p.label === e.target.value);
                      if (preset) setFormRole((r) => ({ ...r, permissions: preset.perms }));
                    }}
                    className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">—</option>
                    {PRESETS.map((p) => (
                      <option key={p.label} value={p.label}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Permissions</label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PERMISSION_OPTIONS.map((perm) => {
                    const checked = formRole.permissions.includes(perm);
                    return (
                      <label key={perm} className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setFormRole((r) => {
                              const next = e.target.checked
                                ? [...r.permissions, perm]
                                : r.permissions.filter((p) => p !== perm);
                              return { ...r, permissions: next };
                            })
                          }
                        />
                        {perm.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs hover:bg-gray-50"
                  disabled={formBusy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-60"
                  disabled={formBusy}
                >
                  {formBusy ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
            <div className="px-5 py-4 border-b">
              <div className="text-base font-semibold text-gray-900">Delete Role</div>
              <div className="text-xs text-gray-500">This action cannot be undone.</div>
            </div>
            <div className="p-5 text-sm text-gray-700">
              Are you sure you want to delete role <span className="font-medium">{deleteId}</span>?
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteRole(deleteId)}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
