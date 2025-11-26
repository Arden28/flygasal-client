import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import apiService from "../../../api/apiService";
import Headbar from "../../../components/client/Headbar";
import { getAllCountries } from "../../../api/countriesService";
import { User, Mail, Phone, Globe, MapPin, Save, Lock, CheckCircle2, ShieldCheck } from "lucide-react";

const ProfilePage = ({ rootUrl = "/" }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({});
  const [countries, setCountries] = useState([]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (user) setFormData({ ...user, password: "" });
    getAllCountries().then(setCountries).catch(console.error);
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("saving");
    try {
       await apiService.put(`/profile/${user.id}`, formData);
       setStatus("success");
       setTimeout(() => setStatus("idle"), 2000);
    } catch { setStatus("error"); }
  };

  const inputClass = "w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#EB7313] focus:ring-4 focus:ring-[#EB7313]/10 transition-all outline-none text-slate-900 placeholder:text-slate-400 font-medium";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2";

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      <Headbar rootUrl={rootUrl} user={user} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
         
         {/* Header & Avatar */}
         <div className="flex flex-col md:flex-row md:items-center gap-8 mb-12">
            <div className="relative">
               <div className="w-28 h-28 rounded-full bg-[#EB7313] text-white shadow-2xl shadow-orange-500/20 flex items-center justify-center text-4xl font-bold border-4 border-white">
                  {(formData.name?.[0] || "U").toUpperCase()}
               </div>
               <div className="absolute bottom-1 right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-green-500" title="Verified Agent">
                  <ShieldCheck size={16} fill="currentColor" className="text-green-100" />
               </div>
            </div>
            <div>
               <h1 className="text-4xl font-bold text-slate-900 tracking-tight">My Profile</h1>
               <p className="text-slate-500 mt-2 text-lg max-w-lg">Manage your personal details and security preferences.</p>
            </div>
         </div>

         <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Section 1: Personal */}
            <div className="p-8 lg:p-12 border-b border-slate-100">
               <div className="mb-8">
                  <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
                  <p className="text-slate-400 text-sm mt-1">Basic identification details.</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                     <label className={labelClass}><User size={14} /> Full Name</label>
                     <input type="text" value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} />
                  </div>
                  <div>
                     <label className={labelClass}><Mail size={14} /> Email Address</label>
                     <input type="email" readOnly value={formData.email || ""} className={`${inputClass} bg-slate-100/50 text-slate-500 cursor-not-allowed border-transparent`} />
                  </div>
                  <div className="md:col-span-2">
                     <label className={labelClass}><Phone size={14} /> Phone Number</label>
                     <div className="flex gap-3">
                        <input type="text" value={formData.phone_country_code || ""} onChange={e => setFormData({...formData, phone_country_code: e.target.value})} className={`${inputClass} w-32 text-center`} placeholder="+254" />
                        <input type="tel" value={formData.phone_number || ""} onChange={e => setFormData({...formData, phone_number: e.target.value})} className={inputClass} />
                     </div>
                  </div>
               </div>
            </div>

            {/* Section 2: Location */}
            <div className="p-8 lg:p-12 border-b border-slate-100 bg-slate-50/30">
               <div className="mb-8">
                  <h2 className="text-xl font-bold text-slate-900">Location</h2>
                  <p className="text-slate-400 text-sm mt-1">Where you are based.</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                     <label className={labelClass}><Globe size={14} /> Country</label>
                     <div className="relative">
                        <select value={formData.country_code || ""} onChange={e => setFormData({...formData, country_code: e.target.value})} className={`${inputClass} appearance-none cursor-pointer`}>
                           <option value="">Select Country</option>
                           {countries.map(c => <option key={c.alpha2Code || c.code} value={c.alpha2Code || c.code}>{c.name}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                     </div>
                  </div>
                  <div>
                     <label className={labelClass}><MapPin size={14} /> City / State</label>
                     <input type="text" value={formData.city || ""} onChange={e => setFormData({...formData, city: e.target.value})} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                     <label className={labelClass}>Address Line</label>
                     <input type="text" value={formData.address1 || ""} onChange={e => setFormData({...formData, address1: e.target.value})} className={inputClass} />
                  </div>
               </div>
            </div>

            {/* Section 3: Security */}
            <div className="p-8 lg:p-12 bg-slate-50/80">
               <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex-1 w-full">
                     <label className={labelClass}><Lock size={14} /> Change Password</label>
                     <input 
                        type="password" 
                        value={formData.password || ""} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        className={`${inputClass} bg-white`} 
                        placeholder="Leave blank to keep current password" 
                     />
                  </div>
                  
                  <button 
                     type="submit" 
                     disabled={status === 'saving'}
                     className={`w-full md:w-auto px-10 py-4 rounded-xl text-white font-bold shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-95 text-sm mt-6 md:mt-0 ${
                        status === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 
                        status === 'saving' ? 'bg-slate-400 cursor-wait' : 
                        'bg-[#EB7313] hover:bg-[#d6660f] shadow-orange-500/20'
                     }`}
                  >
                     {status === 'saving' && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
                     {status === 'success' ? <><CheckCircle2 size={20} /> Saved</> : <><Save size={20} /> Update Profile</>}
                  </button>
               </div>
            </div>

         </form>
      </div>
    </div>
  );
};

export default ProfilePage;