import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiService from "../../api/apiService";
import { 
  Search, Filter, Download, Calendar, XCircle, Trash2, 
  FileText, Edit2, RefreshCcw, 
  Wallet, CreditCard, ArrowUpRight, ArrowDownLeft,
  Printer, CheckIcon, MoreVertical
} from "lucide-react";

/* --- Utils & Helpers --- */
const cx = (...c) => c.filter(Boolean).join(" ");

const money = (n, c = "USD") => {
  const x = Number(n);
  if (!isFinite(x)) return `${c} 0.00`;
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(x); } 
  catch { return `${c} ${x.toFixed(2)}`; }
};

const formatDate = (d) => {
    if(!d) return "—";
    return new Date(d).toLocaleDateString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
};

const normalizeType = (val) => {
  const s = String(val || "").toLowerCase().trim();
  if (["wallet deposit", "wallet_topup", "topup", "deposit"].some(x => s.includes(x))) return "wallet_topup";
  if (s === "bookings") return "booking";
  if (s === "refunds") return "refund";
  return s || "booking";
};

/* --- Components --- */

const StatusBadge = ({ status }) => {
  const s = String(status || "").toLowerCase();
  const config = {
    completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    approved: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    failed: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
    cancelled: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  };
  const theme = config[s] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-transparent ${theme.bg} ${theme.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
      <span className="capitalize">{status}</span>
    </span>
  );
};

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

export default function Transactions() {
  const navigate = useNavigate();

  // --- State ---
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Fixed spacing issue

  // Modals
  const [activeModal, setActiveModal] = useState({ type: null, data: null });
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [approveNote, setApproveNote] = useState("");
  const [editData, setEditData] = useState(null);

  // --- Fetch ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiService.get("/transactions");
        const raw = res?.data?.data || [];
        const clean = raw.map(t => ({
            ...t,
            id: t.id,
            trx_id: t.trx_id,
            type: normalizeType(t.type || t.transaction_type),
            amount: Number(t.amount),
            date: t.date || t.created_at,
            paymentMethod: t.payment_gateway || t.paymentMethod || "System"
        }));
        setTransactions(clean);
      } catch (e) { 
         toast.error("Failed to load transactions."); 
      } finally { 
         setLoading(false); 
      }
    };
    fetchData();
  }, []);

  // --- Filtering ---
  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      const q = query.toLowerCase();
      const matchesSearch = !q || 
        String(t.id).toLowerCase().includes(q) || 
        String(t.email || "").toLowerCase().includes(q) || 
        String(t.traveller || "").toLowerCase().includes(q);

      const matchesType = !typeFilter || t.type === typeFilter;
      const matchesStatus = !statusFilter || t.status === statusFilter;
      
      let matchesDate = true;
      if (dateRange.start) matchesDate = new Date(t.date) >= new Date(dateRange.start);
      if (dateRange.end) {
          const end = new Date(dateRange.end);
          end.setHours(23, 59, 59);
          matchesDate = matchesDate && new Date(t.date) <= end;
      }

      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
  }, [transactions, query, typeFilter, statusFilter, dateRange]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // --- Handlers ---
  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkAction = (action) => {
     setTransactions(prev => prev.map(t => selectedIds.includes(t.id) ? { ...t, status: action === 'complete' ? 'completed' : 'failed' } : t));
     toast.success(`${selectedIds.length} transactions updated.`);
     setSelectedIds([]);
  };

  const handleDelete = (id) => {
     setTransactions(prev => prev.filter(t => t.id !== id));
     toast.success("Transaction deleted.");
     setActiveModal({ type: null, data: null });
  };

  const handleSaveEdit = (e) => {
      e.preventDefault();
      setTransactions(prev => prev.map(t => t.id === editData.id ? { ...editData } : t));
      toast.success("Transaction updated.");
      setActiveModal({ type: null, data: null });
  };

  const handleApproveDecision = async (decision) => {
      if(!activeModal.data) return;
      setDecisionLoading(true);
      console.log("Decision:", activeModal.data.id, "Note:", approveNote);
      try {
          await apiService.post("/transactions/approve", {
              transaction_id: activeModal.data.id,
              amount: activeModal.data.amount,
              status: decision,
              note: approveNote
          });
          setTransactions(prev => prev.map(t => t.id === activeModal.data.id ? { ...t, status: decision === 'approved' ? 'completed' : 'failed' } : t));
          toast.success(`Top-up ${decision === 'approved' ? 'Approved' : 'Rejected'}`);
          setActiveModal({ type: null, data: null });
      } catch(e) {
          toast.error("Action failed. Please try again.");
      } finally {
          setDecisionLoading(false);
      }
  };

  // --- Invoice PDF ---
  const generatePDF = (t) => {
      try {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Transaction Invoice", 14, 22);
        doc.setFontSize(11);
        doc.text(`Transaction ID: ${t.id}`, 14, 40);
        doc.text(`Date: ${new Date(t.date).toLocaleString()}`, 14, 50);
        doc.text(`Amount: ${money(t.amount, t.currency)}`, 14, 60);
        doc.text(`Status: ${t.status}`, 14, 70);
        doc.text(`Payment Method: ${t.paymentMethod}`, 14, 80);
        
        doc.save(`invoice_${t.id}.pdf`);
        toast.success("Invoice downloaded");
      } catch(e) {
          toast.error("Could not generate PDF");
      }
  };

  const exportExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, filename);
    toast.success("Excel exported successfully");
  };

  // --- Render Helper: Action Buttons ---
  const ActionButtons = ({ t, mobile = false }) => (
    <div className={`flex ${mobile ? 'flex-wrap gap-2 mt-3' : 'justify-end gap-1'}`}>
        {/* Approve Button (Special) */}
        {t.type === 'wallet_topup' && t.status === 'pending' && (
            <button 
                onClick={() => setActiveModal({ type: 'approve', data: t })} 
                className={`flex items-center gap-1 px-2.5 py-1.5 bg-[#EB7313] hover:bg-[#d6660f] text-white text-xs font-bold rounded-lg shadow-sm transition-all ${mobile ? 'w-full justify-center py-2' : ''}`}
                title="Approve or Reject"
            >
                <CheckIcon size={14} />
                <span>Review</span>
            </button>
        )}
        
        {/* Standard Actions */}
        <button onClick={() => generatePDF(t)} className="p-2 text-slate-400 hover:text-[#EB7313] hover:bg-orange-50 rounded-lg transition-colors" title="Download Invoice">
            {t.type === 'booking' ? <ArrowUpRight size={16} /> : <Printer size={16} />}
        </button>
        
        <button onClick={() => { setEditData(t); setActiveModal({ type: 'edit', data: t }); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
            <Edit2 size={16} />
        </button>
        
        <button onClick={() => setActiveModal({ type: 'delete', data: t })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
            <Trash2 size={16} />
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-900">
      <ToastContainer position="bottom-right" theme="colored" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Transactions</h1>
                <p className="text-slate-500 mt-1">Financial overview, wallet top-ups, and audit logs.</p>
            </div>
            <div className="flex gap-3">
                <button onClick={() => setActiveModal({ type: 'report', data: null })} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition-all">
                    <FileText size={16} /> Reports
                </button>
                <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition-all">
                    Back
                </Link>
            </div>
        </div>

        {/* Command Bar */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search ID, Email, Amount..." 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border-transparent focus:border-[#EB7313] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 transition-all outline-none"
                />
            </div>
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-3 rounded-xl border border-transparent hover:border-slate-200 transition-colors">
                <Calendar size={16} className="text-slate-500" />
                <input 
                    type="date" 
                    className="bg-transparent border-none text-sm text-slate-600 focus:ring-0 p-0"
                    onChange={e => setDateRange({...dateRange, start: e.target.value})}
                />
            </div>
            <div className="h-8 w-px bg-slate-200 hidden lg:block self-center mx-1"></div>
            <div className="flex items-center bg-slate-100/50 p-1 rounded-xl overflow-x-auto scrollbar-none">
                {['all', 'wallet_topup', 'booking', 'refund'].map(t => (
                    <button 
                        key={t}
                        onClick={() => setTypeFilter(t === 'all' ? '' : t)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                            (typeFilter === t || (t === 'all' && !typeFilter))
                                ? 'bg-white text-[#EB7313] shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                    >
                        {t === 'all' ? 'All Types' : t.replace('_', ' ')}
                    </button>
                ))}
            </div>
        </div>

        {/* Data Content */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {filteredData.length} Transactions
                </div>
                <div className="flex gap-2">
                    <button onClick={() => exportExcel(filteredData, "transactions.xlsx")} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-[#EB7313] transition-colors" title="Export Excel">
                        <Download size={16} />
                    </button>
                    <button onClick={() => {setQuery(""); setTypeFilter(""); setStatusFilter("");}} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-[#EB7313] transition-colors" title="Reset Filters">
                        <RefreshCcw size={16} />
                    </button>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-semibold tracking-wide">
                        <tr>
                            <th className="w-10 p-4">
                               <input type="checkbox" className="rounded border-slate-300 text-[#EB7313] focus:ring-[#EB7313]" />
                            </th>
                            <th className="px-6 py-4">ID / Date</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Details</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                           [...Array(5)].map((_,i) => <tr key={i}><td colSpan="7" className="h-16 animate-pulse bg-slate-50/30" /></tr>)
                        ) : paginatedData.length === 0 ? (
                           <tr><td colSpan="7" className="p-12 text-center text-slate-400">No transactions found.</td></tr>
                        ) : (
                           paginatedData.map((t) => {
                               const isPositive = Number(t.amount) > 0 && t.type === 'wallet_topup';
                               return (
                                   <tr key={t.id} className="group hover:bg-[#FFF7ED]/30 transition-colors">
                                       <td className="p-4">
                                          <input 
                                             type="checkbox" 
                                             checked={selectedIds.includes(t.id)}
                                             onChange={() => handleSelect(t.id)}
                                             className="rounded border-slate-300 text-[#EB7313] focus:ring-[#EB7313]" 
                                          />
                                       </td>
                                       <td className="px-6 py-4">
                                           <div className="font-mono font-bold text-slate-900">{t.trx_id}</div>
                                           <div className="text-xs text-slate-400 mt-0.5">{formatDate(t.date)}</div>
                                       </td>
                                       <td className="px-6 py-4">
                                           <div className="flex items-center gap-2">
                                               <span className={`p-1.5 rounded-lg ${isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                   {t.type === 'wallet_topup' ? <Wallet size={14} /> : <CreditCard size={14} />}
                                               </span>
                                               <span className="capitalize font-medium text-slate-700">{(t.type || "").replace('_', ' ')}</span>
                                           </div>
                                       </td>
                                       <td className="px-6 py-4">
                                           <div className="font-medium text-slate-900">{t.traveller || "System"}</div>
                                           <div className="text-xs text-slate-400">{t.email}</div>
                                           <div className="text-[10px] text-slate-400 mt-0.5">{t.paymentMethod}</div>
                                       </td>
                                       <td className="px-6 py-4 text-center"><StatusBadge status={t.status} /></td>
                                       <td className={`px-6 py-4 text-right font-mono font-bold text-base ${isPositive ? 'text-emerald-600' : 'text-slate-900'}`}>
                                           {isPositive ? '+' : ''}{money(t.amount, t.currency)}
                                       </td>
                                       <td className="px-6 py-4 text-right">
                                           {/* Buttons are always visible (removed opacity-0) for better UX */}
                                           <ActionButtons t={t} mobile={false} />
                                       </td>
                                   </tr>
                               );
                           })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View (Responsive Fix) */}
            <div className="md:hidden divide-y divide-slate-100">
               {loading ? (
                  [...Array(3)].map((_,i) => <div key={i} className="p-4 h-24 bg-slate-50/30 animate-pulse" />)
               ) : paginatedData.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">No transactions found.</div>
               ) : (
                  paginatedData.map(t => {
                     const isPositive = Number(t.amount) > 0 && t.type === 'wallet_topup';
                     return (
                        <div key={t.id} className="p-4 bg-white hover:bg-slate-50 transition-colors">
                           <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-3">
                                 <div className={`p-2 rounded-lg ${isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {t.type === 'wallet_topup' ? <Wallet size={16} /> : <CreditCard size={16} />}
                                 </div>
                                 <div>
                                    <div className="font-bold text-slate-900 text-sm">{(t.type || "").replace('_', ' ')}</div>
                                    <div className="text-xs text-slate-400 font-mono">{t.id}</div>
                                 </div>
                              </div>
                              <StatusBadge status={t.status} />
                           </div>
                           
                           <div className="flex justify-between items-end mt-3">
                              <div className="text-xs text-slate-500">
                                 <div>{formatDate(t.date)}</div>
                                 <div>{t.email}</div>
                              </div>
                              <div className={`font-bold font-mono ${isPositive ? 'text-emerald-600' : 'text-slate-900'}`}>
                                 {isPositive ? '+' : ''}{money(t.amount, t.currency)}
                              </div>
                           </div>

                           <ActionButtons t={t} mobile={true} />
                        </div>
                     );
                  })
               )}
            </div>

            {/* Footer Pagination */}
            {!loading && filteredData.length > 0 && (
               <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500">
                  <span>Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries</span>
                  <div className="flex gap-1">
                     <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 rounded-md bg-white border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-50">Prev</button>
                     <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 rounded-md bg-white border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-50">Next</button>
                  </div>
               </div>
            )}
        </div>
        
        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
           <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 z-40 animate-in slide-in-from-bottom-4">
              <span className="text-sm font-bold">{selectedIds.length} selected</span>
              <div className="h-4 w-px bg-slate-700"></div>
              <div className="flex gap-2">
                 <button onClick={() => handleBulkAction('complete')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold transition-colors">Mark Completed</button>
                 <button onClick={() => handleBulkAction('fail')} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-bold transition-colors">Mark Failed</button>
              </div>
              <button onClick={() => setSelectedIds([])} className="ml-2 text-slate-400 hover:text-white"><XCircle size={18}/></button>
           </div>
        )}

      </div>

      {/* --- Modals --- */}

      {/* Report Modal */}
      <Modal
         open={activeModal.type === 'report'}
         title="Generate Report"
         onClose={() => setActiveModal({ type: null })}
         footer={
            <>
               <button onClick={() => setActiveModal({ type: null })} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
               <button onClick={() => { exportExcel(filteredData, "report.xlsx"); setActiveModal({ type: null }); }} className="px-4 py-2 text-sm font-semibold text-white bg-[#EB7313] hover:bg-[#d6660f] rounded-lg shadow-lg shadow-orange-500/20">Download Excel</button>
            </>
         }
      >
         <div className="space-y-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Report Type</label>
                <select className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313] text-sm">
                    <option>All Transactions</option>
                    <option>Wallet Deposits Only</option>
                    <option>Refunds Only</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date Range</label>
                <div className="flex gap-2">
                    <input type="date" className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] text-sm" />
                    <input type="date" className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] text-sm" />
                </div>
             </div>
         </div>
      </Modal>

      {/* Approve Modal */}
      <Modal
         open={activeModal.type === 'approve'}
         title="Process Top-up"
         onClose={() => setActiveModal({ type: null })}
         footer={
             <div className="flex justify-end gap-2 w-full">
                 <button onClick={() => handleApproveDecision('rejected')} disabled={decisionLoading} className="px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg">Reject</button>
                 <button onClick={() => handleApproveDecision('approved')} disabled={decisionLoading} className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm">
                    {decisionLoading ? 'Processing...' : 'Approve & Credit'}
                 </button>
             </div>
         }
      >
         <div className="space-y-4">
             <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                Reviewing transaction <span className="font-mono font-bold text-slate-900">{activeModal.data?.trx_id}</span> for <span className="font-bold">{money(activeModal.data?.amount, activeModal.data?.currency)}</span>.
             </p>
             <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Internal Note</label>
                 <textarea 
                    rows="3" 
                    value={approveNote}
                    onChange={e => setApproveNote(e.target.value)}
                    className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313] text-sm"
                    placeholder="Reason for approval/rejection..."
                 />
             </div>
         </div>
      </Modal>

      {/* Delete Modal */}
      <Modal 
         open={activeModal.type === 'delete'} 
         title="Delete Transaction" 
         onClose={() => setActiveModal({ type: null })}
         footer={
            <>
               <button onClick={() => setActiveModal({ type: null })} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
               <button onClick={() => handleDelete(activeModal.data?.id)} className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-lg shadow-rose-500/20">Delete</button>
            </>
         }
      >
         <p className="text-slate-600">Are you sure you want to delete transaction <span className="font-mono font-bold text-slate-900">{activeModal.data?.id}</span>? This action affects financial records.</p>
      </Modal>

      {/* Edit Modal */}
      <Modal
         open={activeModal.type === 'edit'}
         title="Edit Transaction"
         onClose={() => setActiveModal({ type: null })}
      >
         {editData && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount</label>
                      <input type="number" value={editData.amount} onChange={e => setEditData({...editData, amount: e.target.value})} className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313] text-sm" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Currency</label>
                      <select value={editData.currency} onChange={e => setEditData({...editData, currency: e.target.value})} className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313] text-sm">
                         <option value="USD">USD</option>
                         <option value="EUR">EUR</option>
                      </select>
                   </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                  <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})} className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313] text-sm">
                     <option value="pending">Pending</option>
                     <option value="completed">Completed</option>
                     <option value="failed">Failed</option>
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