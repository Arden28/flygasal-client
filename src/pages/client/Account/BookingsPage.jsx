import React, { useContext, useEffect, useMemo, useState } from "react";
import Headbar from "../../../components/client/Headbar";
import { AuthContext } from "../../../context/AuthContext";
import { T } from "../../../utils/translation";
import apiService from "../../../api/apiService";
import { useNavigate } from "react-router-dom";
import { 
  Search, Calendar, Filter, Download, Plus, 
  Plane, FileText, ChevronRight, MoreHorizontal 
} from "lucide-react";

// --- Utils ---
const currency = (num, curr = "USD") => { 
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: curr }).format(num); } 
  catch { return num; }
};
const getDateField = (b) => b?.date || b?.created_at || b?.createdAt;

const BookingsPage = ({ rootUrl = "/", initialBookings = [] }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(initialBookings);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch Logic (Preserved)
  useEffect(() => {
    if (!user) return;
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const res = await apiService.get("/bookings");
        const rows = res?.data?.data?.data ?? res?.data?.bookings ?? [];
        setBookings(Array.isArray(rows) ? rows : []);
      } catch (e) { console.error(e); } 
      finally { setIsLoading(false); }
    };
    fetchBookings();
  }, [user]);

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const matchesQ = query === "" || JSON.stringify(b).toLowerCase().includes(query.toLowerCase());
      const matchesS = statusFilter === "all" || b.status?.toLowerCase() === statusFilter;
      return matchesQ && matchesS;
    });
  }, [bookings, query, statusFilter]);

  const StatusBadge = ({ status }) => {
    const s = status?.toLowerCase();
    const config = {
      confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
      pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
      cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
      ticketed: { bg: "bg-[#EB7313]/10", text: "text-[#EB7313]", dot: "bg-[#EB7313]" },
    };
    const theme = config[s] || { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${theme.bg} ${theme.text} border border-opacity-10 border-current`}>
        <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}></span>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <Headbar T={T} rootUrl={rootUrl} user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
         {/* Header & Actions */}
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{T.bookings || "Bookings"}</h1>
               <p className="text-slate-500 text-sm mt-1">Track and manage your travel reservations.</p>
            </div>
            <div className="flex items-center gap-3">
               <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition-all">
                  <Download size={16} />
                  <span className="hidden sm:inline">{T.export || "Export"}</span>
               </button>
               <button 
                  onClick={() => navigate("/flight/availability")}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#EB7313] hover:bg-[#d6660f] text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all transform active:scale-95"
               >
                  <Plus size={18} />
                  {T.new_booking || "New Booking"}
               </button>
            </div>
         </div>

         {/* Command Bar (Filters) */}
         <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                  type="text" 
                  placeholder="Search PNR, Name, Order ID..." 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border-transparent focus:border-[#EB7313] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 transition-all outline-none"
               />
            </div>
            
            {/* Date Filter Mockup */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 rounded-xl border border-transparent hover:border-slate-200 transition-colors cursor-pointer text-slate-600">
                <Calendar size={16} />
                <span className="text-sm font-medium">All Dates</span>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center bg-slate-100/50 p-1 rounded-xl overflow-x-auto">
               {['all', 'confirmed', 'pending', 'cancelled'].map(s => (
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

         {/* Bookings Table */}
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase text-slate-500 font-semibold tracking-wide">
                     <tr>
                        <th className="px-6 py-4">Reference</th>
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Date</th>
                        <th className="px-6 py-4 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {isLoading ? (
                        [...Array(5)].map((_, i) => (
                           <tr key={i}><td colSpan="7" className="h-16 animate-pulse bg-slate-50/30" /></tr>
                        ))
                     ) : filtered.length === 0 ? (
                        <tr>
                           <td colSpan="7" className="p-16 text-center">
                              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <Filter className="text-slate-300" size={24} />
                              </div>
                              <h3 className="text-slate-900 font-semibold">No bookings found</h3>
                              <p className="text-slate-500 mt-1 text-sm">Try adjusting your filters to see more results.</p>
                           </td>
                        </tr>
                     ) : (
                        filtered.map((b) => (
                           <tr key={b.id} className="group hover:bg-[#FFF7ED]/40 transition-colors">
                              <td className="px-6 py-4">
                                 <div className="font-bold text-slate-900 group-hover:text-[#EB7313] transition-colors flex items-center gap-2">
                                    {b.order_num || b.id}
                                 </div>
                                 <div className="text-xs text-slate-400 font-mono mt-0.5">{b.pnr}</div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-600">
                                       {(b.contact_name?.[0] || "U").toUpperCase()}
                                    </div>
                                    <span className="font-medium text-slate-700">{b.contact_name || "Unknown"}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-2 text-slate-600">
                                    <Plane size={14} className="text-slate-400" />
                                    <span className="capitalize">{b.type || "Flight"}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                                 {currency(b.total_amount, b.currency)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <StatusBadge status={b.status} />
                              </td>
                              <td className="px-6 py-4 text-right text-slate-500 text-xs">
                                 {getDateField(b) ? new Date(getDateField(b)).toLocaleDateString() : "—"}
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <button 
                                    onClick={() => navigate(`/flight/booking/invoice/${b.order_num}`)} 
                                    className="p-2 rounded-lg hover:bg-white hover:shadow-sm hover:text-[#EB7313] text-slate-400 transition-all border border-transparent hover:border-slate-100"
                                    title="View Details"
                                 >
                                    <ChevronRight size={18} />
                                 </button>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
            
            {/* Simple Pagination Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500">
               <span>Showing {filtered.length} results</span>
               <div className="flex gap-1">
                  <button className="px-3 py-1 rounded-md bg-white border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-50" disabled>Prev</button>
                  <button className="px-3 py-1 rounded-md bg-white border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-50" disabled>Next</button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default BookingsPage;