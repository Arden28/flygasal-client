// src/components/admin/Settings.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CogIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
  BellIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiService from "../../api/apiService";

/* --------------------------------- Utils --------------------------------- */
const cx = (...c) => c.filter(Boolean).join(" ");
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e ?? "");
const intOr = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

// Basic lists (short, tweak as needed)
const CURRENCIES = [
  { v: "usd", l: "USD" },
  { v: "eur", l: "EUR" },
  { v: "gbp", l: "GBP" },
];
const LANGUAGES = [
  { v: "en", l: "English" },
  { v: "es", l: "Spanish" },
  { v: "fr", l: "French" },
];
const TIMEZONES = [
  "UTC",
  "America/New_York",
  "Europe/London",
  "Asia/Tokyo",
  "Africa/Nairobi",
  "Asia/Dubai",
];

/* ------------------------------- Components ------------------------------ */
const Section = ({ title, icon: Icon, children, footer }) => (
  <section className="rounded-lg border border-gray-200 bg-white">
    <header className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
      {Icon && <Icon className="h-5 w-5 text-gray-500" />}
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
    </header>
    <div className="p-4">{children}</div>
    {footer && <div className="border-t border-gray-200 px-4 py-3">{footer}</div>}
  </section>
);

const Labeled = ({ label, hint, children }) => (
  <label className="block">
    <div className="mb-1 flex items-baseline justify-between">
      <span className="text-xs font-medium text-gray-700">{label}</span>
      {hint && <span className="text-[11px] text-gray-500">{hint}</span>}
    </div>
    {children}
  </label>
);

const TextInput = (props) => (
  <input
    {...props}
    className={cx(
      "w-full h-10 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500",
      props.className
    )}
  />
);

const Select = ({ options = [], ...props }) => (
  <select
    {...props}
    className={cx(
      "w-full h-10 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500",
      props.className
    )}
  >
    {options.map((o) =>
      typeof o === "string" ? (
        <option key={o} value={o}>
          {o}
        </option>
      ) : (
        <option key={o.v} value={o.v}>
          {o.l}
        </option>
      )
    )}
  </select>
);

const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    aria-pressed={checked}
    onClick={() => onChange(!checked)}
    className={cx(
      "relative inline-flex h-6 w-11 items-center rounded-full border",
      checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"
    )}
  >
    <span
      className={cx(
        "inline-block h-5 w-5 transform rounded-full bg-white transition",
        checked ? "translate-x-5" : "translate-x-1",
        "ring-1 ring-inset ring-gray-200"
      )}
    />
    <span className="sr-only">{label}</span>
  </button>
);

/* --------------------------------- Page ---------------------------------- */
export default function Settings() {
  const [active, setActive] = useState(() => localStorage.getItem("settings.activeTab") || "system");

  // Per-tab busy flags
  const [busy, setBusy] = useState({
    systemLoad: true,
    systemSave: false,
    emailLoad: true,
    emailSave: false,
    emailTest: false,
    pkfareLoad: true,
    pkfareSave: false,
    pkfareTest: false,
    notifLoad: true,
    notifSave: false,
  });

  const setBusyFlag = (k, v) => setBusy((b) => ({ ...b, [k]: v }));

  const [err, setErr] = useState("");

  // System
  const [system, setSystem] = useState({
    siteName: "FlyGasal",
    defaultCurrency: "usd",
    maintenanceMode: false,
    timezone: "UTC",
    language: "en",
    maxLoginAttempts: 5,
  });
  const [systemInit, setSystemInit] = useState(system);

  // Email
  const [email, setEmail] = useState({
    smtpHost: "",
    smtpPort: "",
    smtpKey: "",
    encryption: "tls",
    senderEmail: "",
  });
  const [showSmtp, setShowSmtp] = useState(false);
  const [emailInit, setEmailInit] = useState(email);

  // PKfare
  const [pkfare, setPkfare] = useState({
    baseUrl: "https://api.pkfare.com",
    partnerId: "",
    partnerKey: "",
    environment: "production",
    timeout: 30,
  });
  const [showPkKey, setShowPkKey] = useState(false);
  const [pkfareInit, setPkfareInit] = useState(pkfare);

  // Notifications
  const [notif, setNotif] = useState({
    emailNotifications: true,
    smsNotifications: false,
    emailBookingConfirmation: true,
    smsBookingConfirmation: false,
  });
  const [notifInit, setNotifInit] = useState(notif);

  const importRef = useRef(null);

  /* ------------------------------ Fetch init ----------------------------- */
  useEffect(() => {
    let cancel = false;

    // SYSTEM
    (async () => {
      setBusyFlag("systemLoad", true);
      setErr("");
      try {
        const res = await apiService.get("/admin/settings");
        const d = res?.data || {};
        const s = {
          siteName: d.site_name || "FlyGasal",
          defaultCurrency: (d.default_currency || "usd").toLowerCase(),
          maintenanceMode: !!d.maintenance_mode,
          timezone: d.timezone || "UTC",
          language: d.language || "en",
          maxLoginAttempts: intOr(d.max_login_attempts ?? d.login_attempts ?? 5, 5),
        };
        if (!cancel) {
          setSystem(s);
          setSystemInit(s);
        }
      } catch (e) {
        if (!cancel) setErr("Failed to load system settings.");
      } finally {
        if (!cancel) setBusyFlag("systemLoad", false);
      }
    })();

    // EMAIL
    (async () => {
      setBusyFlag("emailLoad", true);
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
        if (!cancel) {
          setEmail(e);
          setEmailInit(e);
        }
      } catch (e) {
        if (!cancel) setErr("Failed to load email settings.");
      } finally {
        if (!cancel) setBusyFlag("emailLoad", false);
      }
    })();

    // PKFARE
    (async () => {
      setBusyFlag("pkfareLoad", true);
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
        if (!cancel) {
          setPkfare(p);
          setPkfareInit(p);
        }
      } catch (e) {
        if (!cancel) setErr("Failed to load PKfare settings.");
      } finally {
        if (!cancel) setBusyFlag("pkfareLoad", false);
      }
    })();

    // NOTIF
    (async () => {
      setBusyFlag("notifLoad", true);
      try {
        const res = await apiService.get("/admin/settings");
        const d = res?.data || {};
        const n = {
          emailNotifications: !!d.email_notification,
          smsNotifications: !!d.sms_notification,
          emailBookingConfirmation: !!d.booking_confirmation_email,
          smsBookingConfirmation: !!d.booking_confirmation_sms,
        };
        if (!cancel) {
          setNotif(n);
          setNotifInit(n);
        }
      } catch (e) {
        if (!cancel) setErr("Failed to load notification settings.");
      } finally {
        if (!cancel) setBusyFlag("notifLoad", false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, []);

  /* -------------------------- Persist active tab -------------------------- */
  useEffect(() => {
    localStorage.setItem("settings.activeTab", active);
  }, [active]);

  /* ------------------------- Unsaved changes guard ------------------------ */
  const dirty =
    !deepEqual(system, systemInit) ||
    !deepEqual(email, emailInit) ||
    !deepEqual(pkfare, pkfareInit) ||
    !deepEqual(notif, notifInit);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  /* --------------------------------- Save -------------------------------- */
  const saveSystem = async (e) => {
    e?.preventDefault?.();
    if (!system.siteName || intOr(system.maxLoginAttempts, 0) < 1) {
      return toast.error("Please fill all required fields correctly.");
    }
    setBusyFlag("systemSave", true);
    setErr("");
    try {
      await apiService.post("/admin/settings", {
        site_name: system.siteName,
        default_currency: system.defaultCurrency,
        timezone: system.timezone,
        language: system.language,
        // send both spellings for safety with legacy backend
        login_attempts: system.maxLoginAttempts,
        login_attemps: system.maxLoginAttempts,
        maintenance_mode: system.maintenanceMode,
      });
      setSystemInit(system);
      toast.success("System settings saved.");
    } catch (e1) {
      setErr("Failed to save system settings.");
      toast.error("Failed to save system settings.");
    } finally {
      setBusyFlag("systemSave", false);
    }
  };

  const saveEmail = async (e) => {
    e?.preventDefault?.();
    if (!email.smtpHost || !email.smtpPort || !emailOk(email.senderEmail)) {
      return toast.error("Please fill all required fields correctly.");
    }
    setBusyFlag("emailSave", true);
    setErr("");
    try {
      await apiService.post("/admin/email-settings", {
        MAIL_MAILER: "smtp",
        MAIL_HOST: email.smtpHost,
        MAIL_PORT: email.smtpPort,
        MAIL_USERNAME: email.senderEmail,
        MAIL_PASSWORD: email.smtpKey,
        MAIL_ENCRYPTION: email.encryption,
        MAIL_FROM_ADDRESS: email.senderEmail,
        MAIL_FROM_NAME: system.siteName || "FlyGasal",
      });
      setEmailInit(email);
      toast.success("Email settings saved.");
    } catch (e1) {
      setErr("Failed to save email settings.");
      toast.error("Failed to save email settings.");
    } finally {
      setBusyFlag("emailSave", false);
    }
  };

  const testEmail = async () => {
    if (!emailOk(email.senderEmail)) return toast.error("Enter a valid sender email first.");
    setBusyFlag("emailTest", true);
    try {
      const res = await apiService.post("/admin/email-settings/test", {
        host: email.smtpHost,
        port: email.smtpPort,
        encryption: email.encryption,
        from: email.senderEmail,
        key: email.smtpKey,
      });
      if (res?.status >= 200 && res?.status < 300) toast.success("SMTP connection OK.");
      else throw new Error();
    } catch {
      toast.error("SMTP test failed.");
    } finally {
      setBusyFlag("emailTest", false);
    }
  };

  const savePkfare = async (e) => {
    e?.preventDefault?.();
    if (!pkfare.baseUrl || !pkfare.partnerId || !pkfare.partnerKey || intOr(pkfare.timeout, 0) < 1) {
      return toast.error("Please fill all required fields correctly.");
    }
    setBusyFlag("pkfareSave", true);
    setErr("");
    try {
      await apiService.post("/admin/pkfare-settings", {
        PKFARE_API_BASE_URL: pkfare.baseUrl,
        PKFARE_PARTNER_ID: pkfare.partnerId,
        PKFARE_PARTNER_KEY: pkfare.partnerKey,
        PKFARE_ENVIRONMENT: pkfare.environment,
        PKFARE_TIMEOUT: pkfare.timeout,
      });
      setPkfareInit(pkfare);
      toast.success("PKfare settings saved.");
    } catch (e1) {
      setErr("Failed to save PKfare settings.");
      toast.error("Failed to save PKfare settings.");
    } finally {
      setBusyFlag("pkfareSave", false);
    }
  };

  const testPkfare = async () => {
    setBusyFlag("pkfareTest", true);
    try {
      const res = await apiService.post("/admin/pkfare-settings/ping", {
        base_url: pkfare.baseUrl,
        partner_id: pkfare.partnerId,
        partner_key: pkfare.partnerKey,
        environment: pkfare.environment,
        timeout: pkfare.timeout,
      });
      if (res?.status >= 200 && res?.status < 300) toast.success("PKfare connection OK.");
      else throw new Error();
    } catch {
      toast.error("PKfare test failed.");
    } finally {
      setBusyFlag("pkfareTest", false);
    }
  };

  const saveNotif = async (e) => {
    e?.preventDefault?.();
    setBusyFlag("notifSave", true);
    setErr("");
    try {
      await apiService.post("/admin/settings/notification", {
        email_notification: notif.emailNotifications,
        sms_notification: notif.smsNotifications,
        booking_confirmation_email: notif.emailBookingConfirmation,
        booking_confirmation_sms: notif.smsBookingConfirmation,
      });
      setNotifInit(notif);
      toast.success("Notification settings saved.");
    } catch (e1) {
      setErr("Failed to save notification settings.");
      toast.error("Failed to save notification settings.");
    } finally {
      setBusyFlag("notifSave", false);
    }
  };

  /* --------------------------- Export / Import --------------------------- */
  const exportJSON = () => {
    const payload = {
      system,
      email: { ...email, smtpKey: email.smtpKey ? "****" : "" }, // mask for export
      pkfare: { ...pkfare, partnerKey: pkfare.partnerKey ? "****" : "" },
      notification: notif,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "settings_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        if (d.system) setSystem(d.system);
        if (d.email) setEmail((prev) => ({ ...prev, ...d.email, smtpKey: prev.smtpKey })); // keep secret
        if (d.pkfare) setPkfare((prev) => ({ ...prev, ...d.pkfare, partnerKey: prev.partnerKey }));
        if (d.notification) setNotif(d.notification);
        toast.success("Imported (secrets kept from current form).");
      } catch {
        toast.error("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const resetTab = (tab) => {
    if (tab === "system") setSystem(systemInit);
    if (tab === "email") setEmail(emailInit);
    if (tab === "pkfare") setPkfare(pkfareInit);
    if (tab === "notification") setNotif(notifInit);
  };

  /* ------------------------------- Rendering ------------------------------ */
  const Tab = ({ id, name, Icon }) => {
    const activeTab = active === id;
    return (
      <button
        onClick={() => setActive(id)}
        className={cx(
          "flex items-center gap-2 px-3 py-2 text-xs sm:text-sm rounded-md",
          activeTab ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
        )}
        aria-current={activeTab ? "page" : undefined}
      >
        <Icon className="h-5 w-5" />
        {name}
      </button>
    );
  };

  const topBar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-xs text-gray-500">Configure system defaults, integrations and notifications.</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={exportJSON}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs hover:bg-gray-50"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export
        </button>
        <button
          onClick={() => importRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs hover:bg-gray-50"
        >
          <ArrowUpTrayIcon className="h-4 w-4" />
          Import
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => importJSON(e.target.files?.[0])}
        />
      </div>
    </div>
  );

  const tabs = (
    <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-2" aria-label="Settings tabs">
      <Tab id="system" name="System" Icon={CogIcon} />
      <Tab id="email" name="Email API" Icon={EnvelopeIcon} />
      <Tab id="pkfare" name="PKfare API" Icon={PaperAirplaneIcon} />
      <Tab id="notification" name="Notifications" Icon={BellIcon} />
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-2 sm:px-6 py-2">
        {topBar}
        <div className="mt-4">{tabs}</div>

        {err && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div>}

        <div className="mt-4 grid gap-4">
          {/* SYSTEM */}
          {active === "system" && (
            <Section
              title="System Settings"
              icon={CogIcon}
              footer={
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-gray-500">
                    {deepEqual(system, systemInit) ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircleIcon className="h-4 w-4" /> No changes
                      </span>
                    ) : (
                      "You have unsaved changes"
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => resetTab("system")}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs hover:bg-gray-50"
                      disabled={busy.systemSave}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={saveSystem}
                      disabled={busy.systemSave}
                      className={cx(
                        "rounded-md px-3 py-2 text-xs text-white",
                        busy.systemSave ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      {busy.systemSave ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              }
            >
              {busy.systemLoad ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 rounded bg-gray-100" />
                  ))}
                </div>
              ) : (
                <form onSubmit={saveSystem} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Labeled label="Site Name">
                    <TextInput
                      value={system.siteName}
                      onChange={(e) => setSystem((s) => ({ ...s, siteName: e.target.value }))}
                      required
                      aria-label="Site name"
                    />
                  </Labeled>

                  <Labeled label="Default Currency">
                    <Select
                      value={system.defaultCurrency}
                      onChange={(e) => setSystem((s) => ({ ...s, defaultCurrency: e.target.value }))}
                      options={CURRENCIES}
                      aria-label="Default currency"
                    />
                  </Labeled>

                  <Labeled label="Timezone">
                    <Select
                      value={system.timezone}
                      onChange={(e) => setSystem((s) => ({ ...s, timezone: e.target.value }))}
                      options={TIMEZONES}
                      aria-label="Timezone"
                    />
                  </Labeled>

                  <Labeled label="Language">
                    <Select
                      value={system.language}
                      onChange={(e) => setSystem((s) => ({ ...s, language: e.target.value }))}
                      options={LANGUAGES}
                      aria-label="Language"
                    />
                  </Labeled>

                  <Labeled label="Max Login Attempts" hint="Minimum 1">
                    <TextInput
                      type="number"
                      min={1}
                      value={system.maxLoginAttempts}
                      onChange={(e) => setSystem((s) => ({ ...s, maxLoginAttempts: intOr(e.target.value, 1) }))}
                      required
                      aria-label="Max login attempts"
                    />
                  </Labeled>

                  <div className="flex items-center gap-3 pt-2">
                    <Toggle
                      checked={system.maintenanceMode}
                      onChange={(v) => setSystem((s) => ({ ...s, maintenanceMode: v }))}
                      label="Enable maintenance mode"
                    />
                    <span className="text-sm text-gray-700">Enable Maintenance Mode</span>
                  </div>
                </form>
              )}
            </Section>
          )}

          {/* EMAIL */}
          {active === "email" && (
            <Section
              title="Email (SMTP)"
              icon={EnvelopeIcon}
              footer={
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-gray-500">
                    {deepEqual(email, emailInit) ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircleIcon className="h-4 w-4" /> No changes
                      </span>
                    ) : (
                      "You have unsaved changes"
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => resetTab("email")}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs hover:bg-gray-50"
                      disabled={busy.emailSave || busy.emailTest}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={testEmail}
                      disabled={busy.emailTest}
                      className={cx(
                        "rounded-md px-3 py-2 text-xs text-blue-700 border border-blue-600",
                        busy.emailTest ? "opacity-60" : "hover:bg-blue-50"
                      )}
                    >
                      {busy.emailTest ? "Testing…" : "Test Connection"}
                    </button>
                    <button
                      type="button"
                      onClick={saveEmail}
                      disabled={busy.emailSave}
                      className={cx(
                        "rounded-md px-3 py-2 text-xs text-white",
                        busy.emailSave ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      {busy.emailSave ? "Saving..." : "Save Email Settings"}
                    </button>
                  </div>
                </div>
              }
            >
              {busy.emailLoad ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 rounded bg-gray-100" />
                  ))}
                </div>
              ) : (
                <form onSubmit={saveEmail} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Labeled label="SMTP Host">
                    <TextInput
                      value={email.smtpHost}
                      onChange={(e) => setEmail((s) => ({ ...s, smtpHost: e.target.value }))}
                      required
                      placeholder="smtp.example.com"
                    />
                  </Labeled>
                  <Labeled label="SMTP Port">
                    <TextInput
                      type="number"
                      value={email.smtpPort}
                      onChange={(e) => setEmail((s) => ({ ...s, smtpPort: e.target.value }))}
                      required
                      placeholder="587"
                    />
                  </Labeled>
                  <Labeled label="Encryption">
                    <Select
                      value={email.encryption}
                      onChange={(e) => setEmail((s) => ({ ...s, encryption: e.target.value }))}
                      options={[
                        { v: "tls", l: "TLS" },
                        { v: "ssl", l: "SSL" },
                        { v: "none", l: "None" },
                      ]}
                    />
                  </Labeled>
                  <Labeled label="Sender Email">
                    <TextInput
                      type="email"
                      value={email.senderEmail}
                      onChange={(e) => setEmail((s) => ({ ...s, senderEmail: e.target.value }))}
                      required
                      placeholder="sender@example.com"
                    />
                  </Labeled>
                  <div className="sm:col-span-2">
                    <Labeled label="SMTP Key / Password">
                      <div className="flex items-center gap-2">
                        <TextInput
                          type={showSmtp ? "text" : "password"}
                          value={email.smtpKey}
                          onChange={(e) => setEmail((s) => ({ ...s, smtpKey: e.target.value }))}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtp((v) => !v)}
                          className="inline-flex h-10 items-center rounded-md border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50"
                          aria-label={showSmtp ? "Hide key" : "Show key"}
                        >
                          {showSmtp ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                      </div>
                    </Labeled>
                  </div>
                </form>
              )}
            </Section>
          )}

          {/* PKFARE */}
          {active === "pkfare" && (
            <Section
              title="PKfare API (Flights)"
              icon={PaperAirplaneIcon}
              footer={
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-gray-500">
                    {deepEqual(pkfare, pkfareInit) ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircleIcon className="h-4 w-4" /> No changes
                      </span>
                    ) : (
                      "You have unsaved changes"
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => resetTab("pkfare")}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs hover:bg-gray-50"
                      disabled={busy.pkfareSave || busy.pkfareTest}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={testPkfare}
                      disabled={busy.pkfareTest}
                      className={cx(
                        "rounded-md px-3 py-2 text-xs text-blue-700 border border-blue-600",
                        busy.pkfareTest ? "opacity-60" : "hover:bg-blue-50"
                      )}
                    >
                      {busy.pkfareTest ? "Testing…" : "Test Connection"}
                    </button>
                    <button
                      type="button"
                      onClick={savePkfare}
                      disabled={busy.pkfareSave}
                      className={cx(
                        "rounded-md px-3 py-2 text-xs text-white",
                        busy.pkfareSave ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      {busy.pkfareSave ? "Saving..." : "Save PKfare Settings"}
                    </button>
                  </div>
                </div>
              }
            >
              {busy.pkfareLoad ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 rounded bg-gray-100" />
                  ))}
                </div>
              ) : (
                <form onSubmit={savePkfare} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Labeled label="API Base URL">
                    <TextInput
                      value={pkfare.baseUrl}
                      onChange={(e) => setPkfare((s) => ({ ...s, baseUrl: e.target.value }))}
                      required
                      placeholder="https://api.pkfare.com"
                    />
                  </Labeled>
                  <Labeled label="Partner ID">
                    <TextInput
                      value={pkfare.partnerId}
                      onChange={(e) => setPkfare((s) => ({ ...s, partnerId: e.target.value }))}
                      required
                      placeholder="Your partner ID"
                    />
                  </Labeled>
                  <div className="sm:col-span-2">
                    <Labeled label="Partner Key">
                      <div className="flex items-center gap-2">
                        <TextInput
                          type={showPkKey ? "text" : "password"}
                          value={pkfare.partnerKey}
                          onChange={(e) => setPkfare((s) => ({ ...s, partnerKey: e.target.value }))}
                          required
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPkKey((v) => !v)}
                          className="inline-flex h-10 items-center rounded-md border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50"
                          aria-label={showPkKey ? "Hide key" : "Show key"}
                        >
                          {showPkKey ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                      </div>
                    </Labeled>
                  </div>
                  <Labeled label="Environment">
                    <Select
                      value={pkfare.environment}
                      onChange={(e) => setPkfare((s) => ({ ...s, environment: e.target.value }))}
                      options={[
                        { v: "sandbox", l: "Sandbox" },
                        { v: "production", l: "Production" },
                      ]}
                    />
                  </Labeled>
                  <Labeled label="Timeout (seconds)" hint="Minimum 1">
                    <TextInput
                      type="number"
                      min={1}
                      value={pkfare.timeout}
                      onChange={(e) => setPkfare((s) => ({ ...s, timeout: intOr(e.target.value, 30) }))}
                      required
                    />
                  </Labeled>
                </form>
              )}
            </Section>
          )}

          {/* NOTIFICATION */}
          {active === "notification" && (
            <Section
              title="Notification Settings"
              icon={BellIcon}
              footer={
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-gray-500">
                    {deepEqual(notif, notifInit) ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircleIcon className="h-4 w-4" /> No changes
                      </span>
                    ) : (
                      "You have unsaved changes"
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => resetTab("notification")}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs hover:bg-gray-50"
                      disabled={busy.notifSave}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={saveNotif}
                      disabled={busy.notifSave}
                      className={cx(
                        "rounded-md px-3 py-2 text-xs text-white",
                        busy.notifSave ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      {busy.notifSave ? "Saving..." : "Save Notification Settings"}
                    </button>
                  </div>
                </div>
              }
            >
              {busy.notifLoad ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 rounded bg-gray-100" />
                  ))}
                </div>
              ) : (
                <form onSubmit={saveNotif} className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={notif.emailNotifications}
                      onChange={(v) => setNotif((n) => ({ ...n, emailNotifications: v }))}
                      label="Enable Email Notifications"
                    />
                    <span className="text-sm text-gray-700">Enable Email Notifications</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={notif.smsNotifications}
                      onChange={(v) => setNotif((n) => ({ ...n, smsNotifications: v }))}
                      label="Enable SMS Notifications"
                    />
                    <span className="text-sm text-gray-700">Enable SMS Notifications</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={notif.emailBookingConfirmation}
                      onChange={(v) => setNotif((n) => ({ ...n, emailBookingConfirmation: v }))}
                      label="Send booking confirmation by email"
                    />
                    <span className="text-sm text-gray-700">Send Booking Confirmation via Email</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={notif.smsBookingConfirmation}
                      onChange={(v) => setNotif((n) => ({ ...n, smsBookingConfirmation: v }))}
                      label="Send booking confirmation by SMS"
                    />
                    <span className="text-sm text-gray-700">Send Booking Confirmation via SMS</span>
                  </div>
                </form>
              )}
            </Section>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-gray-500">
          Changes are saved per section. Export a backup before large edits.
        </p>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
