import React, { useContext, useMemo, useState } from "react";
import Headbar from "../../../components/client/Headbar";
import { AuthContext } from "../../../context/AuthContext";
import { T } from "../../../utils/translation";

/**
 * BookingsPage (Refined)
 * - Modern layout with responsive table (desktop) and cards (mobile)
 * - Client-side search + basic filters scaffolding
 * - Status chips, action menu, pagination skeleton
 * - Accessible labels, consistent spacing, dark-mode friendly classes
 * - Plug your data source into `bookings` (array) or fetch via effect
 */
const BookingsPage = ({ rootUrl = "/", initialBookings = [] }) => {
  const { user } = useContext(AuthContext);

  // Ingest bookings from props or state. Replace with a fetch if needed.
  const [bookings, setBookings] = useState(initialBookings);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | confirmed | pending | cancelled
  const [typeFilter, setTypeFilter] = useState("all"); // all | flight | hotel | car | other

  // Simple filters
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesQ = !q
        || String(b.client_name || "").toLowerCase().includes(q)
        || String(b.booking_id || "").toLowerCase().includes(q)
        || String(b.pnr || "").toLowerCase().includes(q);
      const sOk = statusFilter === "all" || String(b.status || "").toLowerCase() === statusFilter;
      const tOk = typeFilter === "all" || String(b.type || "").toLowerCase() === typeFilter;
      return matchesQ && sOk && tOk;
    });
  }, [bookings, query, statusFilter, typeFilter]);

  const StatusChip = ({ value }) => {
    const v = String(value || "").toLowerCase();
    const map = {
      confirmed: "bg-green-100 text-green-700 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
      failed: "bg-red-100 text-red-700 border-red-200",
      refunded: "bg-purple-100 text-purple-700 border-purple-200",
    };
    const cls = map[v] || "bg-gray-100 text-gray-600 border-gray-200";
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
        {value || "—"}
      </span>
    );
  };

  const currency = (num, curr = "USD") => {
    const n = Number(num);
    if (Number.isNaN(n)) return num ?? "";
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: curr }).format(n);
    } catch {
      return `${n.toLocaleString()} ${curr}`;
    }
  };

  return (
    <div>
      <Headbar T={T} rootUrl={rootUrl} user={user} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{T.bookings || "Bookings"}</h1>
            <p className="text-sm text-gray-600">{T.bookings_subtitle || "Manage and track your bookings across products."}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
              onClick={() => {/* TODO: open create booking or import flow */}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/></svg>
              {T.add_booking || "Add Booking"}
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="q" className="sr-only">{T.search || "Search"}</label>
              <div className="relative">
                <input
                  id="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={T.search_placeholder || "Search by client, booking ID, PNR"}
                  className="block w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pl-10 px-3 py-2.5"
                />
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">{T.status || "Status"}</label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">{T.all || "All"}</option>
                <option value="confirmed">{T.confirmed || "Confirmed"}</option>
                <option value="pending">{T.pending || "Pending"}</option>
                <option value="cancelled">{T.cancelled || "Cancelled"}</option>
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">{T.type || "Type"}</label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">{T.all || "All"}</option>
                <option value="flight">{T.flight || "Flight"}</option>
                <option value="hotel">{T.hotel || "Hotel"}</option>
                <option value="car">{T.car || "Car"}</option>
                <option value="other">{T.other || "Other"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400"><path d="M12 1a9 9 0 019 9c0 7-9 13-9 13S3 17 3 10a9 9 0 019-9zm0 4a5 5 0 100 10 5 5 0 000-10z"/></svg>
              </div>
              <h3 className="text-base font-medium">{T.no_results || "No bookings found"}</h3>
              <p className="text-sm text-gray-600 mt-1">{T.adjust_filters || "Try adjusting your filters or search term."}</p>
            </div>
          ) : (
            <div className="-mx-4 sm:mx-0">
              {/* Table (desktop) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-3 px-3 w-10">
                        <input type="checkbox" aria-label="Select all" className="h-4 w-4 rounded border-gray-300" />
                      </th>
                      <th className="py-3 pr-3">{T.client_name || "Client Name"}</th>
                      <th className="py-3 pr-3">{T.booking_id || "Booking ID"}</th>
                      <th className="py-3 pr-3">PNR</th>
                      <th className="py-3 pr-3">{T.type || "Type"}</th>
                      <th className="py-3 pr-3">{T.price || "Price"}</th>
                      <th className="py-3 pr-3">{T.status || "Status"}</th>
                      <th className="py-3 pl-3">{T.actions || "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => (
                      <tr key={b.booking_id || b.id} className="border-b last:border-b-0">
                        <td className="py-3 px-3"><input type="checkbox" className="h-4 w-4 rounded border-gray-300" aria-label={`Select booking ${b.booking_id || b.id}`} /></td>
                        <td className="py-3 pr-3 font-medium text-gray-900">{b.client_name || "—"}</td>
                        <td className="py-3 pr-3">{b.booking_id || b.id || "—"}</td>
                        <td className="py-3 pr-3">{b.pnr || "—"}</td>
                        <td className="py-3 pr-3 capitalize">{b.type || "—"}</td>
                        <td className="py-3 pr-3">{currency(b.price, b.currency || "USD")}</td>
                        <td className="py-3 pr-3"><StatusChip value={b.status} /></td>
                        <td className="py-3 pl-3">
                          <div className="flex items-center gap-2">
                            <button className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => {/* TODO: show */}}>{T.show || "Show"}</button>
                            <button className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => {/* TODO: edit */}}>{T.edit || "Edit"}</button>
                            <button className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-gray-50 text-red-600" onClick={() => {/* TODO: delete */}}>{T.delete || "Delete"}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards (mobile) */}
              <div className="md:hidden space-y-3 p-4">
                {filtered.map((b) => (
                  <div key={b.booking_id || b.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{b.client_name || "—"}</div>
                      <StatusChip value={b.status} />
                    </div>
                    <div className="mt-2 text-sm text-gray-700">{b.booking_id || b.id || "—"} · PNR: {b.pnr || "—"}</div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-500">{T.type || "Type"}</div>
                        <div className="font-medium capitalize">{b.type || "—"}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">{T.price || "Price"}</div>
                        <div className="font-medium">{currency(b.price, b.currency || "USD")}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-gray-500">{T.actions || "Actions"}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <button className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => {/* TODO */}}>{T.show || "Show"}</button>
                          <button className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => {/* TODO */}}>{T.edit || "Edit"}</button>
                          <button className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-gray-50 text-red-600" onClick={() => {/* TODO */}}>{T.delete || "Delete"}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagination (skeleton) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-4 text-sm text-gray-600">
          <div>
            {T.pagination_showing || "Showing"} <span className="font-medium">{Math.min(filtered.length, 1)}–{Math.min(filtered.length, 10)}</span> {T.of || "of"} <span className="font-medium">{filtered.length}</span>
          </div>
          <div className="inline-flex items-center gap-1">
            <button className="rounded-lg border px-3 py-1.5 hover:bg-gray-50" aria-label="Previous">‹</button>
            <button className="rounded-lg border px-3 py-1.5 bg-gray-100">1</button>
            <button className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">2</button>
            <button className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">…</button>
            <button className="rounded-lg border px-3 py-1.5 hover:bg-gray-50" aria-label="Next">›</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;
