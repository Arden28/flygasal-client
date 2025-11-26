import React, { useContext, useEffect, useState } from "react";
import Headbar from "../../../components/client/Headbar";
import { AuthContext } from "../../../context/AuthContext";
import { T } from "../../../utils/translation";
import apiService from "../../../api/apiService";
import { Building2, FileText, MapPin, DollarSign, Save, CheckCircle2 } from "lucide-react";

// --- FIX: Component Defined Outside ---
const InputGroup = ({ label, icon: Icon, children }) => (
  <div className="mb-6">
     <label className="block text-sm font-bold text-slate-700 mb-2.5 flex items-center gap-2">
        {Icon && <Icon size={16} className="text-slate-400" />} 
        {label}
     </label>
     {children}
  </div>
);

const AgencyPage = ({ rootUrl = "/" }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({});
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (user) setFormData({
       agency_name: user.agency_name || "",
       agency_license: user.agency_license || "",
       agency_city: user.agency_city || "",
       agency_address: user.agency_address || "",
       agency_markup: user.agency_markup || 0
    });
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

  const inputClass = "w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#EB7313] focus:ring-4 focus:ring-[#EB7313]/10 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400";

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      <Headbar T={T} rootUrl={rootUrl} user={user} />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
         <div className="mb-10 pb-6 border-b border-slate-200">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Agency Settings</h1>
            <p className="text-slate-500 mt-2 text-lg">Manage your business profile and operational configurations.</p>
         </div>

         <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Context */}
            <div className="lg:col-span-1 space-y-6">
               <div>
                  <h3 className="text-lg font-bold text-slate-900">General Details</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                     This information appears on customer invoices and booking confirmations. Keep it up to date to ensure compliance.
                  </p>
               </div>
               <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100/50">
                  <h4 className="text-blue-800 font-bold text-sm mb-1">Pro Tip</h4>
                  <p className="text-blue-600 text-xs leading-relaxed">Your markup is applied globally but can be overridden on individual bookings.</p>
               </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 lg:p-10">
               
               <InputGroup label="Agency Name" icon={Building2}>
                  <input 
                     type="text" 
                     value={formData.agency_name || ""} 
                     onChange={e => setFormData({...formData, agency_name: e.target.value})}
                     className={inputClass}
                     placeholder="e.g. FlyGasal Travels"
                  />
               </InputGroup>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="License Number" icon={FileText}>
                     <input 
                        type="text" 
                        readOnly
                        value={formData.agency_license || ""} 
                        className="w-full px-4 py-3.5 rounded-xl bg-slate-100 border border-transparent text-slate-500 font-mono cursor-not-allowed"
                     />
                  </InputGroup>
                  <InputGroup label="City" icon={MapPin}>
                     <input 
                        type="text" 
                        value={formData.agency_city || ""} 
                        onChange={e => setFormData({...formData, agency_city: e.target.value})}
                        className={inputClass}
                     />
                  </InputGroup>
               </div>

               <InputGroup label="Full Address">
                  <textarea 
                     rows="3"
                     value={formData.agency_address || ""} 
                     onChange={e => setFormData({...formData, agency_address: e.target.value})}
                     className={inputClass + " resize-none"}
                  />
               </InputGroup>

               <div className="pt-8 border-t border-slate-100 mt-8">
                  <InputGroup label="Global Markup (%)" icon={DollarSign}>
                     <div className="relative max-w-[200px]">
                        <input 
                           type="number" 
                           value={formData.agency_markup || ""} 
                           onChange={e => setFormData({...formData, agency_markup: e.target.value})}
                           className="w-full pl-5 pr-12 py-3.5 rounded-xl bg-white border-2 border-slate-200 focus:border-[#EB7313] focus:ring-4 focus:ring-[#EB7313]/10 transition-all outline-none font-bold text-xl text-slate-900"
                           placeholder="0.0"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                     </div>
                  </InputGroup>
               </div>

               <div className="flex justify-end mt-10">
                  <button 
                     type="submit" 
                     disabled={status === 'saving'}
                     className={`px-10 py-4 rounded-xl text-white font-bold shadow-xl transition-all flex items-center gap-2 transform active:scale-95 text-sm ${
                        status === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 
                        status === 'saving' ? 'bg-slate-400 cursor-wait' : 
                        'bg-[#EB7313] hover:bg-[#d6660f] shadow-orange-500/20'
                     }`}
                  >
                     {status === 'saving' && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
                     {status === 'success' ? (
                        <><CheckCircle2 size={20} /> Saved Successfully</>
                     ) : (
                        <><Save size={20} /> Save Changes</>
                     )}
                  </button>
               </div>

            </div>
         </form>
      </div>
    </div>
  );
};

export default AgencyPage;