import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiService from "../../api/apiService";
import { 
  Search, Filter, Download, Plus, MoreHorizontal, 
  CheckCircle2, XCircle, Trash2, Edit2, Wallet, 
  Shield, User, MapPin, Mail, Phone, RefreshCcw,
  ArrowDown, ArrowUp
} from "lucide-react";

// Keep your existing modal imports
import TopUpWalletModal from "../../components/admin/Account/TopUpWalletModal";
import DeductWalletModal from "../../components/admin/Account/DeductWalletModal";

/* --- Utils --- */
const cx = (...c) => c.filter(Boolean).join(" ");
const toCurrency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0));

const getInitials = (name) => (name || "U").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

/* --- UI Components --- */

const StatusBadge = ({ status }) => {
  const config = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    inactive: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
    pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  };
  const s = status?.toLowerCase() || "inactive";
  const theme = config[s] || config.inactive;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-transparent ${theme.bg} ${theme.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
      <span className="capitalize">{status}</span>
    </span>
  );
};

const RoleBadge = ({ role }) => {
    const r = role?.toLowerCase() || "client";
    const icons = {
        admin: <Shield size={12} />,
        agent: <MapPin size={12} />,
        client: <User size={12} />
    };
    const themes = {
        admin: "bg-purple-50 text-purple-700 border-purple-100",
        agent: "bg-blue-50 text-blue-700 border-blue-100",
        client: "bg-slate-50 text-slate-600 border-slate-100"
    };
    
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${themes[r] || themes.client}`}>
            {icons[r] || icons.client}
            <span className="capitalize">{role}</span>
        </span>
    );
};

const Modal = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200/50 text-slate-500 transition-colors">
            <XCircle size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">{footer}</div>}
      </div>
    </div>
  );
};

/* --- Main Page --- */
export default function Users() {
  // State
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [activeModal, setActiveModal] = useState({ type: null, data: null }); // edit, add, delete, approve
  const [topUpFor, setTopUpFor] = useState(null);
  const [deductFor, setDeductFor] = useState(null);

  // Form State (for Add/Edit)
  const [formData, setFormData] = useState({});

  // Fetch
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiService.get("/admin/users");
      const raw = res?.data?.data?.data || [];
      const clean = raw.map(u => ({
         id: u.id,
         name: u.name,
         email: u.email,
         phone: u.phone_number || "N/A",
         role: u.roles?.[0]?.name || "Client",
         status: u.is_active ? "Active" : "Inactive",
         walletBalance: Number(u.wallet_balance || 0),
         agency: u.agency_name ? {
             name: u.agency_name,
             license: u.agency_license,
             city: u.agency_city
         } : null
      }));
      setUsers(clean);
    } catch (e) { toast.error("Failed to load users."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Filters
  const filteredData = useMemo(() => {
    return users.filter(u => {
      const q = query.toLowerCase();
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || u.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Handlers
  const handleSaveUser = async (e) => {
      e.preventDefault();
      // Simple validation
      if(!formData.name || !formData.email) return toast.error("Name and Email are required");

      try {
          if(activeModal.type === 'edit') {
              await apiService.put(`/admin/users/${formData.id}`, formData);
              setUsers(prev => prev.map(u => u.id === formData.id ? { ...u, ...formData } : u));
              toast.success("User updated successfully");
          } else {
              // Add Logic
              await apiService.post("/admin/users", formData);
              toast.success("User added successfully");
              fetchUsers(); // Refresh for ID
          }
          setActiveModal({ type: null, data: null });
      } catch(e) { toast.error("Operation failed"); }
  };

  const handleDelete = async () => {
      try {
          await apiService.delete(`/admin/users/${activeModal.data.id}`);
          setUsers(prev => prev.filter(u => u.id !== activeModal.data.id));
          toast.success("User deleted");
          setActiveModal({ type: null, data: null });
      } catch(e) { toast.error("Delete failed"); }
  };

  const handleStatusChange = async (id, newStatus) => {
      try {
         // API Call here
         if(newStatus === 'Active') await apiService.post(`/admin/users/${id}/approve`);
         // Optimistic Update
         setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
         toast.success(`User marked as ${newStatus}`);
      } catch(e) { toast.error("Status update failed"); }
  };

  const exportExcel = () => {
      const ws = XLSX.utils.json_to_sheet(filteredData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Users");
      XLSX.writeFile(wb, "users_list.xlsx");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-900">
      <ToastContainer position="bottom-right" theme="colored" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Users & Accounts</h1>
                <p className="text-slate-500 mt-1">Manage access, roles, and wallet balances.</p>
            </div>
            <div className="flex gap-3">
                <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition-all">
                    <Download size={16} /> Export
                </button>
                <button 
                    onClick={() => { setFormData({ type: 'Client', status: 'Active', walletBalance: 0 }); setActiveModal({ type: 'add', data: null }); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#EB7313] hover:bg-[#d6660f] text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all transform active:scale-95"
                >
                    <Plus size={18} /> Add User
                </button>
            </div>
        </div>

        {/* Command Bar */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search Name, Email, Phone..." 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border-transparent focus:border-[#EB7313] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 transition-all outline-none"
                />
            </div>
            
            <div className="h-8 w-px bg-slate-200 hidden lg:block self-center mx-1"></div>

            {/* Role Filters */}
            <div className="flex items-center bg-slate-100/50 p-1 rounded-xl overflow-x-auto scrollbar-none gap-1">
                {['all', 'client', 'agent', 'admin'].map(r => (
                    <button 
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                            roleFilter === r 
                                ? 'bg-white text-[#EB7313] shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                    >
                        {r}
                    </button>
                ))}
            </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
               <div className="p-8 space-y-4">
                  {[...Array(5)].map((_,i) => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}
               </div>
            ) : filteredData.length === 0 ? (
               <div className="p-20 text-center text-slate-400">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Filter size={24} />
                   </div>
                   <h3 className="text-slate-900 font-semibold">No users found</h3>
               </div>
            ) : (
               <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                       <thead className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase text-slate-500 font-semibold tracking-wide">
                           <tr>
                               <th className="px-6 py-4 pl-8">User</th>
                               <th className="px-6 py-4">Role</th>
                               <th className="px-6 py-4">Status</th>
                               <th className="px-6 py-4">Wallet</th>
                               <th className="px-6 py-4">Contact</th>
                               <th className="px-6 py-4 text-right pr-8">Actions</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                           {paginatedData.map((u) => (
                               <tr key={u.id} className="group hover:bg-[#FFF7ED]/30 transition-colors">
                                   <td className="px-6 py-4 pl-8">
                                       <div className="flex items-center gap-3">
                                           <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 border-2 border-white shadow-sm">
                                               {getInitials(u.name)}
                                           </div>
                                           <div>
                                               <div className="font-bold text-slate-900">{u.name}</div>
                                               {/* <div className="text-xs text-slate-400">{u.id}</div> */}
                                           </div>
                                       </div>
                                   </td>
                                   <td className="px-6 py-4">
                                       <RoleBadge role={u.role} />
                                       {u.role === 'agent' && u.agency && (
                                          <div className="mt-1 text-[10px] text-slate-500 flex items-center gap-1">
                                              <MapPin size={10} /> {u.agency.city}
                                          </div>
                                       )}
                                   </td>
                                   <td className="px-6 py-4">
                                       <StatusBadge status={u.status} />
                                   </td>
                                   <td className="px-6 py-4">
                                       <div className="font-mono font-bold text-slate-700">
                                          {toCurrency(u.walletBalance)}
                                       </div>
                                       <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                           <button onClick={() => setTopUpFor(u)} className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-0.5">
                                              <ArrowUp size={10} /> Top Up
                                           </button>
                                           <button onClick={() => setDeductFor(u)} className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-0.5">
                                              <ArrowDown size={10} /> Deduct
                                           </button>
                                       </div>
                                   </td>
                                   <td className="px-6 py-4">
                                       <div className="flex flex-col gap-1 text-xs text-slate-600">
                                           <span className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400"/> {u.email}</span>
                                           <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400"/> {u.phone}</span>
                                       </div>
                                   </td>
                                   <td className="px-6 py-4 text-right pr-8">
                                       <div className="flex justify-end gap-2">
                                           <button 
                                              onClick={() => { setFormData(u); setActiveModal({ type: 'edit', data: u }); }} 
                                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                           >
                                              <Edit2 size={16} />
                                           </button>
                                           <button 
                                              onClick={() => setActiveModal({ type: 'delete', data: u })} 
                                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            
            {/* Pagination */}
            {!loading && filteredData.length > 0 && (
               <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500">
                  <span>Page {currentPage} of {totalPages}</span>
                  <div className="flex gap-1">
                     <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 rounded-md bg-white border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-50">Prev</button>
                     <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 rounded-md bg-white border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-50">Next</button>
                  </div>
               </div>
            )}
        </div>

      </div>

      {/* --- Modals --- */}

      {/* Add/Edit Modal */}
      <Modal
         open={activeModal.type === 'add' || activeModal.type === 'edit'}
         title={activeModal.type === 'edit' ? "Edit User" : "Add New User"}
         onClose={() => setActiveModal({ type: null, data: null })}
         footer={
            <>
               <button onClick={() => setActiveModal({ type: null })} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
               <button onClick={handleSaveUser} className="px-4 py-2 text-sm font-semibold text-white bg-[#EB7313] hover:bg-[#d6660f] rounded-lg shadow-lg shadow-orange-500/20">Save User</button>
            </>
         }
      >
         <form className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                    <input type="text" value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313] text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                    <input type="email" value={formData.email || ""} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313] text-sm" />
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                <input type="tel" value={formData.phone || ""} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313] text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                    <select value={formData.role || "Client"} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313] text-sm">
                        <option value="client">Client</option>
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                    <select value={formData.status || "Active"} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313] text-sm">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>
            </div>
            {activeModal.type === 'add' && (
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                    <input type="password" value={formData.password || ""} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313] text-sm" />
                </div>
            )}
         </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
         open={activeModal.type === 'delete'}
         title="Delete User"
         onClose={() => setActiveModal({ type: null })}
         footer={
            <>
               <button onClick={() => setActiveModal({ type: null })} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
               <button onClick={handleDelete} className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-lg shadow-rose-500/20">Delete User</button>
            </>
         }
      >
         <p className="text-slate-600">Are you sure you want to delete <span className="font-bold text-slate-900">{activeModal.data?.name}</span>? This cannot be undone.</p>
      </Modal>

      {/* Wallet Modals (Using your existing components logic) */}
      {topUpFor && (
        <TopUpWalletModal 
            open={true} 
            userId={topUpFor.id} 
            userName={topUpFor.name} 
            onClose={() => setTopUpFor(null)} 
            onSuccess={() => { toast.success("Wallet topped up"); fetchUsers(); setTopUpFor(null); }} 
        />
      )}
      
      {deductFor && (
        <DeductWalletModal 
            open={true} 
            userId={deductFor.id} 
            userName={deductFor.name} 
            onClose={() => setDeductFor(null)} 
            onSuccess={() => { toast.success("Amount deducted"); fetchUsers(); setDeductFor(null); }} 
        />
      )}

    </div>
  );
}