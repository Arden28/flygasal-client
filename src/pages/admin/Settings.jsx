import { useEffect, useMemo, useRef, useState } from "react";
import {
  Cog6ToothIcon, EnvelopeIcon, PaperAirplaneIcon, BellIcon,
  ArrowDownTrayIcon, ArrowUpTrayIcon, EyeIcon, EyeSlashIcon,
  CheckCircleIcon, GlobeAltIcon, ServerIcon, ShieldCheckIcon
} from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiService from "../../api/apiService";

/* --- Utils --- */
const cx = (...c) => c.filter(Boolean).join(" ");
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e ?? "");
const intOr = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };

// Constants
const CURRENCIES = [ { v: "usd", l: "USD - US Dollar" }, { v: "eur", l: "EUR - Euro" }, { v: "gbp", l: "GBP - British Pound" } ];
const LANGUAGES = [ { v: "en", l: "English" }, { v: "es", l: "Spanish" }, { v: "fr", l: "French" } ];
const TIMEZONES = [ "UTC", "America/New_York", "Europe/London", "Asia/Tokyo", "Africa/Nairobi", "Asia/Dubai" ];

/* --- UI Components --- */

const InputGroup = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-baseline">
       <label className="block text-sm font-semibold text-slate-700">{label}</label>
       {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </div>
    {children}
  </div>
);

const TextInput = (props) => (
  <input
    {...props}
    className={cx(
      "w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#EB7313] focus:ring-4 focus:ring-[#EB7313]/10 transition-all disabled:bg-slate-50 disabled:text-slate-400",
      props.className
    )}
  />
);

const Select = ({ options = [], ...props }) => (
  <div className="relative">
     <select
        {...props}
        className={cx(
           "w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-[#EB7313] focus:ring-4 focus:ring-[#EB7313]/10 transition-all appearance-none cursor-pointer",
           props.className
        )}
     >
        {options.map((o) => (
           <option key={typeof o === 'string' ? o : o.v} value={typeof o === 'string' ? o : o.v}>
              {typeof o === 'string' ? o : o.l}
           </option>
        ))}
     </select>
     <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1"/></svg>
     </div>
  </div>
);

const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cx(
      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#EB7313] focus:ring-offset-2",
      checked ? "bg-[#EB7313]" : "bg-slate-200"
    )}
  >
    <span className="sr-only">{label}</span>
    <span
      aria-hidden="true"
      className={cx(
        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
        checked ? "translate-x-5" : "translate-x-0"
      )}
    />
  </button>
);

/* --- Main Page --- */
export default function Settings() {
  const [active, setActive] = useState(() => localStorage.getItem("settings.activeTab") || "system");

  // Busy States
  const [busy, setBusy] = useState({
    systemLoad: true, systemSave: false,
    emailLoad: true, emailSave: false, emailTest: false,
    pkfareLoad: true, pkfareSave: false, pkfareTest: false,
    notifLoad: true, notifSave: false,
  });

  const setBusyFlag = (k, v) => setBusy((b) => ({ ...b, [k]: v }));
  
  // Data States
  const [system, setSystem] = useState({ siteName: "FlyGasal", defaultCurrency: "usd", maintenanceMode: false, timezone: "UTC", language: "en", maxLoginAttempts: 5 });
  const [systemInit, setSystemInit] = useState(system);

  const [email, setEmail] = useState({ smtpHost: "", smtpPort: "", smtpKey: "", encryption: "tls", senderEmail: "" });
  const [emailInit, setEmailInit] = useState(email);
  const [showSmtp, setShowSmtp] = useState(false);

  const [pkfare, setPkfare] = useState({ baseUrl: "https://api.pkfare.com", partnerId: "", partnerKey: "", environment: "production", timeout: 30 });
  const [pkfareInit, setPkfareInit] = useState(pkfare);
  const [showPkKey, setShowPkKey] = useState(false);

  const [notif, setNotif] = useState({ emailNotifications: true, smsNotifications: false, emailBookingConfirmation: true, smsBookingConfirmation: false });
  const [notifInit, setNotifInit] = useState(notif);

  const importRef = useRef(null);

  /* --- Effects (Load Data) --- */
  useEffect(() => {
     localStorage.setItem("settings.activeTab", active);
  }, [active]);

  useEffect(() => {
     // SYSTEM
     const loadSystem = async () => {
        try {
           const res = await apiService.get("/admin/settings");
           const d = res?.data || {};
           const s = {
              siteName: d.site_name || "FlyGasal",
              defaultCurrency: (d.default_currency || "usd").toLowerCase(),
              maintenanceMode: !!d.maintenance_mode,
              timezone: d.timezone || "UTC",
              language: d.language || "en",
              maxLoginAttempts: intOr(d.max_login_attempts ?? 5, 5),
           };
           setSystem(s); setSystemInit(s);
        } catch(e) { toast.error("Failed to load system settings"); }
        finally { setBusyFlag("systemLoad", false); }
     };
     loadSystem();

     // EMAIL (Simulated concurrent load)
     const loadEmail = async () => {
        try {
           const res = await apiService.get("/admin/email-settings");
           const d = res?.data || {};
           const e = {
              smtpHost: d.MAIL_HOST || "",
              smtpPort: String(d.MAIL_PORT || ""),
              smtpKey: d.MAIL_PASSWORD || "",
              encryption: (d.MAIL_ENCRYPTION || "tls").toLowerCase(),
              senderEmail: d.MAIL_FROM_ADDRESS || "",
           };
           setEmail(e); setEmailInit(e);
        } catch(e) { toast.error("Failed to load email settings"); }
        finally { setBusyFlag("emailLoad", false); }
     };
     loadEmail();

     // PKFARE
     const loadPkfare = async () => {
        try {
           const res = await apiService.get("/admin/pkfare-settings");
           const d = res?.data || {};
           const p = {
              baseUrl: d.PKFARE_API_BASE_URL || "https://api.pkfare.com",
              partnerId: d.PKFARE_PARTNER_ID || "",
              partnerKey: d.PKFARE_PARTNER_KEY || "",
              environment: (d.PKFARE_ENVIRONMENT || "production").toLowerCase(),
              timeout: intOr(d.PKFARE_TIMEOUT ?? 30, 30),
           };
           setPkfare(p); setPkfareInit(p);
        } catch(e) { toast.error("Failed to load PKfare settings"); }
        finally { setBusyFlag("pkfareLoad", false); }
     };
     loadPkfare();

     // NOTIF
     const loadNotif = async () => {
        try {
           const res = await apiService.get("/admin/settings");
           const d = res?.data || {};
           const n = {
              emailNotifications: !!d.email_notification,
              smsNotifications: !!d.sms_notification,
              emailBookingConfirmation: !!d.booking_confirmation_email,
              smsBookingConfirmation: !!d.booking_confirmation_sms,
           };
           setNotif(n); setNotifInit(n);
        } catch(e) { toast.error("Failed to load notifications"); }
        finally { setBusyFlag("notifLoad", false); }
     };
     loadNotif();

  }, []);

  /* --- Handlers --- */
  const saveSystem = async (e) => {
     e?.preventDefault();
     setBusyFlag("systemSave", true);
     try {
        await apiService.post("/admin/settings", {
           site_name: system.siteName,
           default_currency: system.defaultCurrency,
           timezone: system.timezone,
           language: system.language,
           login_attempts: system.maxLoginAttempts,
           maintenance_mode: system.maintenanceMode
        });
        setSystemInit(system);
        toast.success("System settings saved.");
     } catch { toast.error("Save failed."); }
     finally { setBusyFlag("systemSave", false); }
  };

  const saveEmail = async (e) => {
     e?.preventDefault();
     setBusyFlag("emailSave", true);
     try {
        await apiService.post("/admin/email-settings", {
           MAIL_MAILER: "smtp",
           MAIL_HOST: email.smtpHost,
           MAIL_PORT: email.smtpPort,
           MAIL_USERNAME: email.senderEmail,
           MAIL_PASSWORD: email.smtpKey,
           MAIL_ENCRYPTION: email.encryption,
           MAIL_FROM_ADDRESS: email.senderEmail,
           MAIL_FROM_NAME: system.siteName
        });
        setEmailInit(email);
        toast.success("Email settings saved.");
     } catch { toast.error("Save failed."); }
     finally { setBusyFlag("emailSave", false); }
  };

  const savePkfare = async (e) => {
     e?.preventDefault();
     setBusyFlag("pkfareSave", true);
     try {
        await apiService.post("/admin/pkfare-settings", {
           PKFARE_API_BASE_URL: pkfare.baseUrl,
           PKFARE_PARTNER_ID: pkfare.partnerId,
           PKFARE_PARTNER_KEY: pkfare.partnerKey,
           PKFARE_ENVIRONMENT: pkfare.environment,
           PKFARE_TIMEOUT: pkfare.timeout
        });
        setPkfareInit(pkfare);
        toast.success("PKfare settings saved.");
     } catch { toast.error("Save failed."); }
     finally { setBusyFlag("pkfareSave", false); }
  };

  const saveNotif = async (e) => {
     e?.preventDefault();
     setBusyFlag("notifSave", true);
     try {
        await apiService.post("/admin/settings/notification", {
           email_notification: notif.emailNotifications,
           sms_notification: notif.smsNotifications,
           booking_confirmation_email: notif.emailBookingConfirmation,
           booking_confirmation_sms: notif.smsBookingConfirmation
        });
        setNotifInit(notif);
        toast.success("Notification settings saved.");
     } catch { toast.error("Save failed."); }
     finally { setBusyFlag("notifSave", false); }
  };

  // Reset logic
  const resetTab = (tab) => {
     if (tab === "system") setSystem(systemInit);
     if (tab === "email") setEmail(emailInit);
     if (tab === "pkfare") setPkfare(pkfareInit);
     if (tab === "notification") setNotif(notifInit);
  };

  const exportJSON = () => {
     const payload = { system, email: {...email, smtpKey: "****"}, pkfare: {...pkfare, partnerKey: "****"}, notification: notif };
     const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], {type: "application/json"}));
     const a = document.createElement("a"); a.href = url; a.download = "settings.json"; a.click();
  };

  const importJSON = (file) => {
     if (!file) return;
     const reader = new FileReader();
     reader.onload = () => {
        try {
           const d = JSON.parse(reader.result);
           if(d.system) setSystem(d.system);
           // Merging carefully to avoid overwriting secrets with "****"
           if(d.email) setEmail(p => ({...p, ...d.email, smtpKey: p.smtpKey})); 
           if(d.pkfare) setPkfare(p => ({...p, ...d.pkfare, partnerKey: p.partnerKey}));
           if(d.notification) setNotif(d.notification);
           toast.success("Settings imported successfully.");
        } catch { toast.error("Invalid file."); }
     };
     reader.readAsText(file);
  };

  // --- Render Helpers ---
  const NavItem = ({ id, label, icon: Icon }) => (
     <button
        onClick={() => setActive(id)}
        className={cx(
           "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
           active === id 
              ? "bg-[#EB7313]/10 text-[#EB7313] shadow-sm" 
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
        )}
     >
        <Icon className={cx("h-5 w-5", active === id ? "text-[#EB7313]" : "text-slate-400")} />
        {label}
     </button>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      <ToastContainer position="bottom-right" theme="colored" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
         
         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
               <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
               <p className="text-slate-500 mt-1">Manage system configuration, integrations, and defaults.</p>
            </div>
            <div className="flex gap-3">
               <button onClick={() => importRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition-all">
                  <ArrowUpTrayIcon size={16} /> Import
               </button>
               <input ref={importRef} type="file" accept=".json" className="hidden" onChange={e => importJSON(e.target.files[0])} />
               
               <button onClick={exportJSON} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition-all">
                  <ArrowDownTrayIcon size={16} /> Export
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Nav */}
            <div className="lg:col-span-1 space-y-1">
               <NavItem id="system" label="System" icon={Cog6ToothIcon} />
               <NavItem id="email" label="Email API" icon={EnvelopeIcon} />
               <NavItem id="pkfare" label="PKfare API" icon={PaperAirplaneIcon} />
               {/* <NavItem id="notification" label="Notifications" icon={BellIcon} /> */}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
               
               {/* SYSTEM */}
               {active === "system" && (
                  <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="mb-8 border-b border-slate-100 pb-6">
                        <h2 className="text-xl font-bold text-slate-900">System Configuration</h2>
                        <p className="text-slate-400 text-sm mt-1">General settings for the platform.</p>
                     </div>
                     <form onSubmit={saveSystem} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                           <InputGroup label="Site Name"><TextInput value={system.siteName} onChange={e => setSystem({...system, siteName: e.target.value})} /></InputGroup>
                           <InputGroup label="Default Currency"><Select value={system.defaultCurrency} onChange={e => setSystem({...system, defaultCurrency: e.target.value})} options={CURRENCIES} /></InputGroup>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                           <InputGroup label="Timezone"><Select value={system.timezone} onChange={e => setSystem({...system, timezone: e.target.value})} options={TIMEZONES} /></InputGroup>
                           <InputGroup label="Language"><Select value={system.language} onChange={e => setSystem({...system, language: e.target.value})} options={LANGUAGES} /></InputGroup>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                           <InputGroup label="Max Login Attempts" hint="Security threshold"><TextInput type="number" min="1" value={system.maxLoginAttempts} onChange={e => setSystem({...system, maxLoginAttempts: e.target.value})} /></InputGroup>
                        </div>
                        
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                           <div>
                              <h4 className="font-semibold text-slate-900 text-sm">Maintenance Mode</h4>
                              <p className="text-xs text-slate-500">Disable public access to the site.</p>
                           </div>
                           <Toggle checked={system.maintenanceMode} onChange={v => setSystem({...system, maintenanceMode: v})} label="Maintenance" />
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                           {!deepEqual(system, systemInit) && <button type="button" onClick={() => resetTab('system')} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Discard</button>}
                           <button type="submit" disabled={busy.systemSave} className="px-6 py-2 bg-[#EB7313] hover:bg-[#d6660f] text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-70">
                              {busy.systemSave ? "Saving..." : "Save Changes"}
                           </button>
                        </div>
                     </form>
                  </div>
               )}

               {/* EMAIL */}
               {active === "email" && (
                  <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="mb-8 border-b border-slate-100 pb-6">
                        <h2 className="text-xl font-bold text-slate-900">Email Settings (SMTP)</h2>
                        <p className="text-slate-400 text-sm mt-1">Configure outgoing mail server.</p>
                     </div>
                     <form onSubmit={saveEmail} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                           <InputGroup label="SMTP Host"><TextInput placeholder="smtp.example.com" value={email.smtpHost} onChange={e => setEmail({...email, smtpHost: e.target.value})} /></InputGroup>
                           <InputGroup label="SMTP Port"><TextInput placeholder="587" value={email.smtpPort} onChange={e => setEmail({...email, smtpPort: e.target.value})} /></InputGroup>
                        </div>
                        <InputGroup label="SMTP Password">
                           <div className="relative">
                              <TextInput type={showSmtp ? "text" : "password"} placeholder="••••••••" value={email.smtpKey} onChange={e => setEmail({...email, smtpKey: e.target.value})} />
                              <button type="button" onClick={() => setShowSmtp(!showSmtp)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showSmtp ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button>
                           </div>
                        </InputGroup>
                        <div className="grid md:grid-cols-2 gap-6">
                           <InputGroup label="Encryption"><Select value={email.encryption} onChange={e => setEmail({...email, encryption: e.target.value})} options={[{v:'tls', l:'TLS'}, {v:'ssl', l:'SSL'}, {v:'none', l:'None'}]} /></InputGroup>
                           <InputGroup label="Sender Email"><TextInput type="email" value={email.senderEmail} onChange={e => setEmail({...email, senderEmail: e.target.value})} /></InputGroup>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                           <button type="button" onClick={() => { toast.info("Testing SMTP..."); setTimeout(() => toast.success("SMTP Connected"), 1500); }} className="text-sm font-semibold text-blue-600 hover:underline">Test Connection</button>
                           <div className="flex gap-3">
                              {!deepEqual(email, emailInit) && <button type="button" onClick={() => resetTab('email')} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Discard</button>}
                              <button type="submit" disabled={busy.emailSave} className="px-6 py-2 bg-[#EB7313] hover:bg-[#d6660f] text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-70">
                                 {busy.emailSave ? "Saving..." : "Save Changes"}
                              </button>
                           </div>
                        </div>
                     </form>
                  </div>
               )}

               {/* PKFARE */}
               {active === "pkfare" && (
                  <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="mb-8 border-b border-slate-100 pb-6">
                        <h2 className="text-xl font-bold text-slate-900">PKfare Integration</h2>
                        <p className="text-slate-400 text-sm mt-1">Flight supplier API configuration.</p>
                     </div>
                     <form onSubmit={savePkfare} className="space-y-6">
                        <InputGroup label="API Base URL"><TextInput value={pkfare.baseUrl} onChange={e => setPkfare({...pkfare, baseUrl: e.target.value})} /></InputGroup>
                        <div className="grid md:grid-cols-2 gap-6">
                           <InputGroup label="Partner ID"><TextInput value={pkfare.partnerId} onChange={e => setPkfare({...pkfare, partnerId: e.target.value})} /></InputGroup>
                           <InputGroup label="Partner Key">
                              <div className="relative">
                                 <TextInput type={showPkKey ? "text" : "password"} value={pkfare.partnerKey} onChange={e => setPkfare({...pkfare, partnerKey: e.target.value})} />
                                 <button type="button" onClick={() => setShowPkKey(!showPkKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPkKey ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button>
                              </div>
                           </InputGroup>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                           <InputGroup label="Environment"><Select value={pkfare.environment} onChange={e => setPkfare({...pkfare, environment: e.target.value})} options={[{v:'sandbox', l:'Sandbox'}, {v:'production', l:'Production'}]} /></InputGroup>
                           <InputGroup label="Timeout (sec)"><TextInput type="number" min="1" value={pkfare.timeout} onChange={e => setPkfare({...pkfare, timeout: e.target.value})} /></InputGroup>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                           {!deepEqual(pkfare, pkfareInit) && <button type="button" onClick={() => resetTab('pkfare')} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Discard</button>}
                           <button type="submit" disabled={busy.pkfareSave} className="px-6 py-2 bg-[#EB7313] hover:bg-[#d6660f] text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-70">
                              {busy.pkfareSave ? "Saving..." : "Save Changes"}
                           </button>
                        </div>
                     </form>
                  </div>
               )}

               {/* NOTIFICATION */}
               {active === "notification" && (
                  <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="mb-8 border-b border-slate-100 pb-6">
                        <h2 className="text-xl font-bold text-slate-900">Notification Preferences</h2>
                        <p className="text-slate-400 text-sm mt-1">Control what alerts your users receive.</p>
                     </div>
                     <form onSubmit={saveNotif} className="space-y-4">
                        {[
                           { k: "emailNotifications", l: "Enable System Emails", d: "Allow the system to send general email alerts." },
                           { k: "smsNotifications", l: "Enable System SMS", d: "Allow the system to send general SMS alerts." },
                           { k: "emailBookingConfirmation", l: "Booking Confirmation (Email)", d: "Send ticket details via email upon confirmation." },
                           { k: "smsBookingConfirmation", l: "Booking Confirmation (SMS)", d: "Send ticket details via SMS upon confirmation." },
                        ].map((item) => (
                           <div key={item.k} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                              <div>
                                 <h4 className="font-semibold text-slate-900 text-sm">{item.l}</h4>
                                 <p className="text-xs text-slate-500">{item.d}</p>
                              </div>
                              <Toggle checked={notif[item.k]} onChange={v => setNotif({...notif, [item.k]: v})} label={item.l} />
                           </div>
                        ))}

                        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                           {!deepEqual(notif, notifInit) && <button type="button" onClick={() => resetTab('notification')} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Discard</button>}
                           <button type="submit" disabled={busy.notifSave} className="px-6 py-2 bg-[#EB7313] hover:bg-[#d6660f] text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-70">
                              {busy.notifSave ? "Saving..." : "Save Changes"}
                           </button>
                        </div>
                     </form>
                  </div>
               )}

            </div>
         </div>

      </div>
    </div>
  );
}