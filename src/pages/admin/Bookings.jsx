import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiService from "../../api/apiService";
import { formatBookingDate } from "../../utils/dateFormatter";
import { 
  Search, Filter, Download, Calendar, ChevronLeft, 
  MoreHorizontal, CheckCircle2, XCircle, Trash2, 
  Plane, FileText, Copy, Eye, Edit2, RefreshCcw, ArrowUpDown
} from "lucide-react";

/* --- UI Components --- */

// 1. Status Badge with Dot Indicator
const StatusBadge = ({ status, type = "booking" }) => {
  const s = status?.toLowerCase() || "";
  
  const configs = {
    booking: {
      confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
      pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
      cancelled: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
      ticketed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    },
    payment: {
      paid: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
      unpaid: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
      refunded: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
      failed: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
    }
  };

  const theme = configs[type]?.[s] || { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-transparent ${theme.bg} ${theme.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
      <span className="capitalize">{status}</span>
    </span>
  );
};

// 2. Modal Component (Glassmorphism)
const Modal = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200/50 text-slate-500 transition-colors">
            <XCircle size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};

// 3. Table Skeleton
const TableSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-16 bg-slate-50 rounded-xl w-full" />
    ))}
  </div>
);

/* --- Main Page --- */

export default function Bookings() {
  const navigate = useNavigate();
  
  // --- State ---
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [activeModal, setActiveModal] = useState({ type: null, id: null }); // type: 'confirm' | 'cancel' | 'delete' | 'edit'
  const [editData, setEditData] = useState(null);

  /* --- Fetch Data --- */
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await apiService.get("/bookings");
      // Adapt API response to flat structure if needed
      const raw = res?.data?.data?.data || res?.data?.bookings || [];
      
      const cleanData = raw.map(b => ({
        id: b.id,
        orderNum: b.order_num || "N/A",
        pnr: b.pnr || "",
        traveller: b.contact_name || "Guest", // Assuming contact_name exists or mapping passengers
        email: b.contact_email || b.email || "",
        date: b.booking_date || b.created_at,
        bookingStatus: b.status || "pending",
        paymentStatus: b.payment_status || "unpaid",
        total: Number(b.total_amount || 0),
        currency: b.currency || "USD",
        module: b.module || "Flight", // Default to Flight if missing
        route: b.route_description || "N/A" // Or derive from segments
      }));
      
      setBookings(cleanData);
    } catch (e) {
      toast.error("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  /* --- Filtering & Sorting logic --- */
  const filteredData = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = 
        query === "" || 
        b.orderNum.toLowerCase().includes(query.toLowerCase()) ||
        b.traveller.toLowerCase().includes(query.toLowerCase()) ||
        b.email.toLowerCase().includes(query.toLowerCase()) ||
        b.pnr.toLowerCase().includes(query.toLowerCase());

      const matchesStatus = statusFilter === "all" || b.bookingStatus.toLowerCase() === statusFilter;
      
      // Simple date check (expand if needed)
      let matchesDate = true;
      if (dateRange.start) matchesDate = new Date(b.date) >= new Date(dateRange.start);
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, query, statusFilter, dateRange]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  /* --- Handlers --- */
  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkAction = (action) => {
    toast.success(`${action} applied to ${selectedIds.length} bookings`);
    setSelectedIds([]);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleUpdateStatus = async (id, newStatus) => {
    // Optimistic update
    setBookings(prev => prev.map(b => b.id === id ? { ...b, bookingStatus: newStatus } : b));
    toast.success(`Booking marked as ${newStatus}`);
    setActiveModal({ type: null, id: null });
    // Call API here
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setBookings(prev => prev.map(b => b.id === editData.id ? { ...b, ...editData } : b));
    toast.success("Booking updated successfully");
    setActiveModal({ type: null, id: null });
  };

  // Exports
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, "bookings.xlsx");
  };

  /* --- Render --- */
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <ToastContainer position="bottom-right" theme="colored" />
      
      {/* Header Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Bookings</h1>
            <p className="text-slate-500 mt-1">Manage reservations, issue tickets, and track payments.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition-all">
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <Link to="/admin/flights/bookings/new" className="flex items-center gap-2 px-5 py-2.5 bg-[#EB7313] hover:bg-[#d6660f] text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all transform active:scale-95">
              <Plane size={18} />
              New Booking
            </Link>
          </div>
        </div>

        {/* Command Bar (Filters) */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-2">
           {/* Search Input */}
           <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                 type="text" 
                 placeholder="Search PNR, Order #, Email..." 
                 value={query}
                 onChange={e => setQuery(e.target.value)}
                 className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border-transparent focus:border-[#EB7313] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 transition-all outline-none"
              />
           </div>

           {/* Date Filter */}
           <div className="flex items-center gap-2 bg-slate-50 px-3 rounded-xl border border-transparent hover:border-slate-200 transition-colors">
              <Calendar size={16} className="text-slate-500" />
              <input 
                type="date" 
                className="bg-transparent border-none text-sm text-slate-600 focus:ring-0 p-0"
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
           </div>

           <div className="h-8 w-px bg-slate-200 hidden lg:block self-center mx-1"></div>

           {/* Status Pills */}
           <div className="flex items-center bg-slate-100/50 p-1 rounded-xl overflow-x-auto scrollbar-none">
              {['all', 'confirmed', 'pending', 'cancelled', 'ticketed'].map(s => (
                 <button 
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                       statusFilter === s 
                          ? 'bg-white text-[#EB7313] shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                 >
                    {s}
                 </button>
              ))}
           </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
           {loading ? (
              <div className="p-6"><TableSkeleton /></div>
           ) : filteredData.length === 0 ? (
              <div className="p-20 text-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Filter size={24} />
                 </div>
                 <h3 className="text-slate-900 font-semibold">No bookings found</h3>
                 <p className="text-slate-500 mt-1 text-sm">Try adjusting your filters to see results.</p>
                 <button onClick={() => {setQuery(""); setStatusFilter("all");}} className="mt-4 text-[#EB7313] text-sm font-semibold hover:underline">
                    Clear Filters
                 </button>
              </div>
           ) : (
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase text-slate-500 font-semibold tracking-wide">
                       <tr>
                          <th className="w-10 p-4">
                             <input type="checkbox" className="rounded border-slate-300 text-[#EB7313] focus:ring-[#EB7313]" />
                          </th>
                          <th className="px-6 py-4 cursor-pointer hover:text-[#EB7313] transition-colors group">
                             <div className="flex items-center gap-1">Order <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100"/></div>
                          </th>
                          <th className="px-6 py-4">Client</th>
                          <th className="px-6 py-4">Route / PNR</th>
                          <th className="px-6 py-4 text-center">Status</th>
                          <th className="px-6 py-4 text-right">Total</th>
                          <th className="px-6 py-4 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {paginatedData.map((b) => (
                          <tr key={b.id} className="group hover:bg-[#FFF7ED]/30 transition-colors">
                             <td className="p-4">
                                <input 
                                   type="checkbox" 
                                   checked={selectedIds.includes(b.id)}
                                   onChange={() => handleSelect(b.id)}
                                   className="rounded border-slate-300 text-[#EB7313] focus:ring-[#EB7313]" 
                                />
                             </td>
                             <td className="px-6 py-4">
                                <div className="font-bold text-slate-900">{b.orderNum}</div>
                                <div className="text-xs text-slate-400 mt-0.5">{new Date(b.date).toLocaleDateString()}</div>
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-white shadow-sm">
                                      {b.traveller.charAt(0).toUpperCase()}
                                   </div>
                                   <div>
                                      <div className="font-medium text-slate-900">{b.traveller}</div>
                                      <div className="text-xs text-slate-400 truncate max-w-[150px]">{b.email}</div>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                   {b.route}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                   <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 rounded">{b.pnr || "NO-PNR"}</span>
                                   {b.pnr && (
                                      <button onClick={() => copyToClipboard(b.pnr)} className="text-slate-400 hover:text-[#EB7313]">
                                         <Copy size={12} />
                                      </button>
                                   )}
                                </div>
                             </td>
                             <td className="px-6 py-4 text-center">
                                <div className="flex flex-col gap-1 items-center">
                                   <StatusBadge status={b.bookingStatus} type="booking" />
                                   <StatusBadge status={b.paymentStatus} type="payment" />
                                </div>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <div className="font-bold font-mono text-slate-900">
                                   {new Intl.NumberFormat('en-US', { style: 'currency', currency: b.currency }).format(b.total)}
                                </div>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => navigate(`/flight/booking/invoice/${b.orderNum}`)} className="p-2 text-slate-400 hover:text-[#EB7313] hover:bg-orange-50 rounded-lg transition-colors" title="View Invoice">
                                      <Eye size={16} />
                                   </button>
                                   <button 
                                      onClick={() => { setEditData(b); setActiveModal({ type: 'edit', id: b.id }); }}
                                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                      title="Edit"
                                   >
                                      <Edit2 size={16} />
                                   </button>
                                   <button 
                                      onClick={() => setActiveModal({ type: 'delete', id: b.id })}
                                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Delete"
                                   >
                                      <Trash2 size={16} />
                                   </button>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           )}
           
           {/* Footer Pagination */}
           {!loading && filteredData.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <span className="text-xs text-slate-500 font-medium">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                 </span>
                 <div className="flex gap-2">
                    <button 
                       disabled={currentPage === 1}
                       onClick={() => setCurrentPage(p => p - 1)}
                       className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 shadow-sm transition-colors"
                    >
                       Previous
                    </button>
                    <button 
                       disabled={currentPage === totalPages}
                       onClick={() => setCurrentPage(p => p + 1)}
                       className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 shadow-sm transition-colors"
                    >
                       Next
                    </button>
                 </div>
              </div>
           )}
        </div>

        {/* Bulk Actions Floating Bar */}
        {selectedIds.length > 0 && (
           <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 z-40 animate-in slide-in-from-bottom-4">
              <span className="text-sm font-bold">{selectedIds.length} selected</span>
              <div className="h-4 w-px bg-slate-700"></div>
              <div className="flex gap-2">
                 <button onClick={() => handleBulkAction('Confirmed')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold transition-colors">Confirm</button>
                 <button onClick={() => handleBulkAction('Cancelled')} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-bold transition-colors">Cancel</button>
              </div>
              <button onClick={() => setSelectedIds([])} className="ml-2 text-slate-400 hover:text-white"><XCircle size={18}/></button>
           </div>
        )}

      </div>

      {/* --- Modals --- */}
      
      {/* Delete Modal */}
      <Modal 
         open={activeModal.type === 'delete'} 
         title="Delete Booking" 
         onClose={() => setActiveModal({ type: null })}
         footer={
            <>
               <button onClick={() => setActiveModal({ type: null })} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
               <button onClick={() => { /* Delete Logic */ toast.success("Booking deleted"); setActiveModal({ type: null }); }} className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-lg shadow-rose-500/20">Delete</button>
            </>
         }
      >
         <p className="text-slate-600">Are you sure you want to delete this booking? This action cannot be undone.</p>
      </Modal>

      {/* Edit Modal */}
      <Modal
         open={activeModal.type === 'edit'}
         title="Edit Booking"
         onClose={() => setActiveModal({ type: null })}
      >
         {editData && (
            <form id="edit-form" onSubmit={handleSaveEdit} className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Traveller Name</label>
                  <input type="text" value={editData.traveller} onChange={e => setEditData({...editData, traveller: e.target.value})} className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313] text-sm" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                  <select value={editData.bookingStatus} onChange={e => setEditData({...editData, bookingStatus: e.target.value})} className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313] text-sm">
                     <option value="pending">Pending</option>
                     <option value="confirmed">Confirmed</option>
                     <option value="cancelled">Cancelled</option>
                  </select>
               </div>
               <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => setActiveModal({ type: null })} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-[#EB7313] hover:bg-[#d6660f] rounded-lg shadow-lg shadow-orange-500/20">Save Changes</button>
               </div>
            </form>
         )}
      </Modal>

    </div>
  );
}