import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiService from "../../api/apiService";
import { 
  Search, Filter, Download, Plus, 
  CheckCircle2, XCircle, Trash2, Edit2, 
  Shield, User, MapPin, Mail, Phone, 
  ArrowDownCircle, ArrowUpCircle
} from "lucide-react";

import TopUpWalletModal from "../../components/admin/Account/TopUpWalletModal";
import DeductWalletModal from "../../components/admin/Account/DeductWalletModal";

/* --- Predefined Data --- */
const PREDEFINED_COUNTRIES = [
  "Congo", "Kenya", "Rwanda", "Uganda", "Tanzania", 
  "South Africa", "Nigeria", "United Arab Emirates", 
  "United Kingdom", "United States"
];

const PREDEFINED_CITIES = {
  "Congo": ["Kinshasa", "Lubumbashi", "Goma", "Brazzaville", "Pointe-Noire"],
  "Kenya": ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Machakos"],
  "Rwanda": ["Kigali", "Butare", "Gisenyi"],
  "Uganda": ["Kampala", "Entebbe", "Jinja"],
  "Tanzania": ["Dar es Salaam", "Dodoma", "Arusha"],
  "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria"],
  "Nigeria": ["Lagos", "Abuja", "Kano", "Port Harcourt"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah"],
  "United Kingdom": ["London", "Manchester", "Birmingham"],
  "United States": ["New York", "Los Angeles", "Chicago", "Houston"]
};

/* --- Utils --- */
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

// Helper component for obvious validation
const InputError = ({ msg }) => {
  if (!msg) return null;
  // Handle array of strings from Laravel or simple string from frontend
  const message = Array.isArray(msg) ? msg[0] : msg;
  return <p className="text-rose-500 text-[10px] mt-1 font-medium">{message}</p>;
};

/* --- Main Page --- */
export default function Users() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [activeModal, setActiveModal] = useState({ type: null, data: null });
  const [topUpFor, setTopUpFor] = useState(null);
  const [deductFor, setDeductFor] = useState(null);

  // Added errors state
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
      id: "",
      name: "",
      email: "",
      phone: "",
      password: "",
      type: "client",
      status: "Active",
      walletBalance: 0,
      agency_name: "",
      agency_license: "",
      agency_country: "",
      agency_city: "",
      agency_address: "",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiService.get("/admin/users");
      const raw = res?.data?.data?.data || [];
      
      const clean = raw.map(u => ({
         id: u.id,
         name: u.name,
         email: u.email,
         phone: u.phone_number || "",
         role: (u.roles?.[0]?.name || "client").toLowerCase(),
         status: u.is_active ? "Active" : "Inactive",
         walletBalance: Number(u.wallet_balance || 0),
         agency_license: u.agency_license || "",
         agency_name: u.agency_name || "",
         agency_country: u.agency_country || "",
         agency_city: u.agency_city || "",
         agency_address: u.agency_address || "",
         agency: u.agency_name ? { name: u.agency_name, city: u.agency_city } : null
      }));
      setUsers(clean);
    } catch (e) { toast.error("Failed to load users."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredData = useMemo(() => {
    return users.filter(u => {
      const q = query.toLowerCase();
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' || u.role === roleFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || u.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleSaveUser = async (e) => {
      e.preventDefault();
      setErrors({}); // Clear previous errors
      
      // Frontend Validation
      let newErrors = {};
      if (!formData.name) newErrors.name = "Name is required.";
      if (!formData.email) newErrors.email = "Email is required.";
      if (Number(formData.walletBalance) < 0) newErrors.walletBalance = "Balance cannot be negative.";
      
      if (formData.type.toLowerCase() === "agent") {
        if (!formData.agency_license) newErrors.agency_license = "License is required for agents.";
        if (!formData.agency_country) newErrors.agency_country = "Country is required.";
        if (!formData.agency_city) newErrors.agency_city = "City is required.";
      }

      if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return toast.error("Please fix the highlighted errors.");
      }

      try {
          if(activeModal.type === 'edit') {
              await apiService.put(`/admin/users/${formData.id}`, formData);
              toast.success("User updated successfully");
          } else {
              await apiService.post("/admin/users", formData);
              toast.success("User added successfully");
          }
          fetchUsers();
          setActiveModal({ type: null, data: null });
      } catch(e) { 
          // Catch Laravel 422 Validation Errors
          if (e.response?.status === 422) {
              setErrors(e.response.data.errors || {});
              toast.error(e.response.data.message || "Validation Error. Check inputs.");
          } else {
              toast.error("Operation failed."); 
          }
      }
  };

  const handleDelete = async () => {
      try {
          await apiService.delete(`/admin/users/${activeModal.data.id}`);
          setUsers(prev => prev.filter(u => u.id !== activeModal.data.id));
          toast.success("User deleted");
          setActiveModal({ type: null, data: null });
      } catch(e) { toast.error("Delete failed"); }
  };

  const handleApprove = async (id) => {
      try {
         await apiService.post(`/admin/users/${id}/approve`);
         setUsers(prev => prev.map(u => u.id === id ? { ...u, status: "Active" } : u));
         toast.success(`User approved successfully`);
      } catch(e) { toast.error("Approval failed"); }
  };

  const handleAddClick = () => {
      setErrors({});
      setFormData({
          id: "", name: "", email: "", phone: "", password: "",
          type: "client", status: "Active", walletBalance: 0,
          agency_name: "", agency_license: "", agency_country: "", 
          agency_city: "", agency_address: "",
      });
      setActiveModal({ type: 'add', data: null });
  };

  const handleEditClick = (u) => {
      setErrors({});
      setFormData({
          ...u,
          type: u.role.toLowerCase(), // Fixed: Keeps select bindings working
          password: "" // Blank password means don't update
      });
      setActiveModal({ type: 'edit', data: u });
  };

  const exportExcel = () => {
      const ws = XLSX.utils.json_to_sheet(filteredData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Users");
      XLSX.writeFile(wb, "users_list.xlsx");
  };

  // Safe wrapper for dynamic city lists
  const availableCities = formData.agency_country && PREDEFINED_CITIES[formData.agency_country] 
    ? PREDEFINED_CITIES[formData.agency_country] 
    : [];

  const ActionButtons = ({ u, mobile = false }) => (
    <div className={`flex ${mobile ? 'flex-wrap gap-2 mt-4 justify-end' : 'justify-end gap-1'}`}>
       {u.status !== 'Active' && (
          <button onClick={() => handleApprove(u.id)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title="Approve User">
             <CheckCircle2 size={18} />
          </button>
       )}
       <button onClick={() => setTopUpFor(u)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Top Up Wallet">
          <ArrowUpCircle size={18} />
       </button>
       <button onClick={() => setDeductFor(u)} className="p-1.5 text-[#EB7313] bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors" title="Deduct Balance">
          <ArrowDownCircle size={18} />
       </button>
       {!mobile && <div className="w-px h-4 bg-slate-200 mx-1 self-center"></div>}
       <button onClick={() => handleEditClick(u)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Edit Details">
          <Edit2 size={18} />
       </button>
       <button onClick={() => setActiveModal({ type: 'delete', data: u })} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete User">
          <Trash2 size={18} />
       </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-900">
      <ToastContainer position="bottom-right" theme="colored" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Header & Command Bar Omitted for brevity (same as your original) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Users & Accounts</h1>
                <p className="text-slate-500 mt-1">Manage access, roles, and wallet balances.</p>
            </div>
            <div className="flex gap-3">
                <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition-all">
                    <Download size={16} /> Export
                </button>
                <button onClick={handleAddClick} className="flex items-center gap-2 px-5 py-2.5 bg-[#EB7313] hover:bg-[#d6660f] text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all transform active:scale-95">
                    <Plus size={18} /> Add User
                </button>
            </div>
        </div>

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
            <div className="flex items-center bg-slate-100/50 p-1 rounded-xl overflow-x-auto scrollbar-none gap-1">
                {['all', 'client', 'agent', 'admin'].map(r => (
                    <button key={r} onClick={() => setRoleFilter(r)} className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${roleFilter === r ? 'bg-white text-[#EB7313] shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
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
                                               <div className="text-xs text-slate-400 font-mono">{u.agency_name || ""}</div>
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
                                       <div className="font-mono font-bold text-slate-700 flex items-center gap-1">
                                          {toCurrency(u.walletBalance)}
                                       </div>
                                   </td>
                                   <td className="px-6 py-4">
                                       <div className="flex flex-col gap-1 text-xs text-slate-600">
                                           <span className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400"/> {u.email}</span>
                                           <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400"/> {u.phone}</span>
                                       </div>
                                   </td>
                                   <td className="px-6 py-4 text-right pr-8">
                                       <ActionButtons u={u} mobile={false} />
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
            )}
            
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

      {/* --- Add/Edit Modal --- */}
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
                    <input type="text" value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full rounded-xl text-sm ${errors.name ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313]'}`} />
                    <InputError msg={errors.name} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                    <input type="email" value={formData.email || ""} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full rounded-xl text-sm ${errors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313]'}`} />
                    <InputError msg={errors.email} />
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                <input type="tel" value={formData.phone || ""} onChange={e => setFormData({...formData, phone: e.target.value})} className={`w-full rounded-xl text-sm ${errors.phone ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313]'}`} />
                <InputError msg={errors.phone} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                    <select value={formData.type || "client"} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313] text-sm">
                        <option value="client">Client</option>
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                    <select value={formData.status || "Active"} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full rounded-xl border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313] text-sm">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Pending">Pending</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Wallet Balance</label>
                <input 
                    type="number" step="0.01" min="0" 
                    value={formData.walletBalance || 0} 
                    onChange={e => setFormData({...formData, walletBalance: parseFloat(e.target.value) || 0})} 
                    className={`w-full rounded-xl text-sm ${errors.walletBalance ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313]'}`} 
                />
                <InputError msg={errors.walletBalance} />
            </div>
            
            {/* Always show password, placeholder handles context */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                <input 
                    type="password" 
                    placeholder={activeModal.type === 'edit' ? "Leave blank to keep current password" : "Enter new password"}
                    value={formData.password || ""} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    className={`w-full rounded-xl text-sm ${errors.password ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-[#EB7313] focus:ring-[#EB7313]'}`} 
                />
                <InputError msg={errors.password} />
            </div>
            
            {/* Agent Specifics */}
            {formData.type?.toLowerCase() === "agent" && (
                <div className="pt-4 mt-2 border-t border-slate-100">
                    <div className="text-xs font-bold text-[#EB7313] uppercase mb-3">Agency Details</div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Agency Name</label>
                                <input type="text" value={formData.agency_name || ""} onChange={e => setFormData({...formData, agency_name: e.target.value})} className={`w-full rounded-xl text-sm ${errors.agency_name ? 'border-rose-500' : 'border-slate-200 focus:border-[#EB7313]'}`} />
                                <InputError msg={errors.agency_name} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">License No.</label>
                                <input type="text" value={formData.agency_license || ""} onChange={e => setFormData({...formData, agency_license: e.target.value})} className={`w-full rounded-xl text-sm ${errors.agency_license ? 'border-rose-500' : 'border-slate-200 focus:border-[#EB7313]'}`} />
                                <InputError msg={errors.agency_license} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Country</label>
                                <select 
                                    value={formData.agency_country || ""} 
                                    onChange={e => setFormData({...formData, agency_country: e.target.value, agency_city: ""})} 
                                    className={`w-full rounded-xl text-sm ${errors.agency_country ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-[#EB7313]'}`}
                                >
                                    <option value="" disabled>Select Country</option>
                                    {PREDEFINED_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <InputError msg={errors.agency_country} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">City</label>
                                <select 
                                    value={formData.agency_city || ""} 
                                    onChange={e => setFormData({...formData, agency_city: e.target.value})} 
                                    disabled={!formData.agency_country}
                                    className={`w-full rounded-xl text-sm disabled:opacity-50 disabled:bg-slate-50 ${errors.agency_city ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-[#EB7313]'}`}
                                >
                                    <option value="" disabled>Select City</option>
                                    {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <InputError msg={errors.agency_city} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                            <input type="text" value={formData.agency_address || ""} onChange={e => setFormData({...formData, agency_address: e.target.value})} className={`w-full rounded-xl text-sm ${errors.agency_address ? 'border-rose-500' : 'border-slate-200 focus:border-[#EB7313]'}`} />
                            <InputError msg={errors.agency_address} />
                        </div>
                    </div>
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

      {/* Wallet Modals */}
      {topUpFor && (
        <TopUpWalletModal 
            open={true} userId={topUpFor.id} userName={topUpFor.name} 
            onClose={() => setTopUpFor(null)} 
            onSuccess={() => { toast.success("Wallet topped up"); fetchUsers(); setTopUpFor(null); }} 
        />
      )}
      
      {deductFor && (
        <DeductWalletModal 
            open={true} userId={deductFor.id} userName={deductFor.name} 
            onClose={() => setDeductFor(null)} 
            onSuccess={() => { toast.success("Amount deducted"); fetchUsers(); setDeductFor(null); }} 
        />
      )}

    </div>
  );
}