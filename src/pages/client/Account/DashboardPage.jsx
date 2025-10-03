import React, { useContext, useEffect, useMemo, useState } from "react";
import Headbar from "../../../components/client/Headbar";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import apiService from "../../../api/apiService";
import DepositModal from "../../../components/client/Account/DepositModal";

/* -------------------------------------------------------------------------- */
/* i18n                                                                        */
/* -------------------------------------------------------------------------- */
const T = {
  walletbalance: "Wallet Balance",
  totalbookings: "Total Bookings",
  pendinginvoices: "Pending Invoices",
  issued: "Issued",
  to_be_paid: "To be Paid",
  cancelled: "Cancelled",
  request_deposit: "Request Deposit",
  add_funds: "Add Funds",
  view_bookings: "View Bookings",
  new_booking: "New Booking",
  fetch_error_title: "Could not load data",
  fetch_error: "There was an error fetching data.",
  payment_gateways_unavailable: "Payment gateways are currently unavailable.",
  recent_bookings: "Recent Bookings",
  wallet_activity: "Wallet Activity",
  empty_recent: "No recent items.",
  amount: "Amount",
  date: "Date",
  status: "Status",
  reference: "Reference",
  type: "Type",
  pnr: "PNR",
  customer: "Customer",
  see_all: "See all",
  last_7_days: "Last 7 days",
  last_30_days: "Last 30 days",
  last_90_days: "Last 90 days",
  today: "Today",
};

/* -------------------------------------------------------------------------- */
/* utils                                                                       */
/* -------------------------------------------------------------------------- */
const currencyFmt = (amount, curr = "USD") => {
  const num = Number(amount);
  if (Number.isNaN(num)) return `${amount ?? ""} ${curr}`.trim();
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: curr }).format(num);
  } catch {
    return `${num.toLocaleString()} ${curr}`;
  }
};

const getDate = (v) => (v ? new Date(v) : null);

/* Tiny sparkline (pure SVG) */
const Sparkline = ({ values = [], width = 110, height = 28, stroke = "#0ea5e9" }) => {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const norm = (v) => (max === min ? height / 2 : height - ((v - min) / (max - min)) * height);
  const step = width / (values.length - 1 || 1);
  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${Math.round(norm(v) * 10) / 10}`)
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
  );
};

/* Skeletons */
const StatSkeleton = () => (
  <div className="h-[92px] rounded-2xl border border-gray-100 bg-white p-4 animate-pulse">
    <div className="h-4 w-24 rounded bg-gray-100" />
    <div className="mt-3 h-7 w-28 rounded bg-gray-100" />
  </div>
);

const RowSkeleton = () => (
  <div className="flex items-center justify-between py-3 border-b">
    <div className="h-4 w-28 rounded bg-gray-100" />
    <div className="h-4 w-16 rounded bg-gray-100" />
    <div className="h-4 w-24 rounded bg-gray-100" />
  </div>
);

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */
const DashboardPage = ({ rootUrl = "/", apiUrl = "/api", apiKey = "mock_api_key" }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [bankTransfer, setBankTransfer] = useState(null);
  const [error, setError] = useState("");

  // summary
  const [summary, setSummary] = useState({
    currency: user?.currency || "USD",
    balance: user?.wallet_balance ?? "0.00",
    totalBookings: user?.booking_count ?? 0,
    pendingInvoices: 0,
    issued: 0,
    toBePaid: 0,
    cancelled: 0,
    trend: [], // numbers for sparkline
  });

  // lists
  const [recentBookings, setRecentBookings] = useState([]);
  const [walletTx, setWalletTx] = useState([]);

  // filters
  const [range, setRange] = useState("7d"); // 7d | 30d | 90d | 1d

  // prime from user
  const initialFromUser = useMemo(
    () => ({
      currency: user?.currency || "USD",
      balance: user?.wallet_balance ?? "0.00",
      totalBookings: user?.booking_count ?? 0,
    }),
    [user]
  );

  useEffect(() => {
    setSummary((s) => ({ ...s, ...initialFromUser }));
  }, [initialFromUser]);

  /* ---------------- Fetch gateways (for DepositModal trigger) --------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiService.post("/payment_gateways", { api_key: "none" });
        const ok = res?.data?.status === "true" || res?.status === "true";
        if (ok) {
          const first = Array.isArray(res?.data?.data) ? res.data.data[0] : null;
          if (!cancelled) setBankTransfer(first || null);
        }
      } catch (e) {
        // Non-blocking
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------- Fetch dashboard summary + lists ------------------------ */
  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setIsLoading(true);
      setError("");
      try {
        // Try summary
        // If your backend supports range, pass it; fall back gracefully.
        // const resSummary = await apiService.get?.("/dashboard/summary", { params: { range } });
        // const okS = resSummary && (resSummary?.data?.success || resSummary?.data?.status === "true");
        // const sData = okS ? (resSummary?.data?.data || resSummary?.data) : null;

        // Try recent bookings
        const resBookings = await apiService.get("/bookings");
        console.log("Bookings response:", resBookings);
        const okB = resBookings?.data?.status === "true" || resBookings?.success === true;
        const bData = resBookings?.data?.data.data;
        // const okB = resBookings && (resBookings?.success || Array.isArray(resBookings?.data?.data.data));
        // const bData = okB ? (Array.isArray(resBookings?.data?.data.data) ? resBookings.data.data.data : []) : [];

        // Try wallet transactions
        const resTx = await apiService.get("/transactions");
        const okT = resTx && (resTx?.data?.status === "true" || resTx?.success || Array.isArray(resTx?.data?.data));
        const tData = okT ? (Array.isArray(resTx?.data?.data) ? resTx.data.data : []) : [];

        if (!cancelled) {
          // Merge summary with fallback
          // setSummary((prev) => ({
          //   currency: sData?.currency || prev.currency,
          //   balance: String(sData?.balance ?? prev.balance),
          //   totalBookings: Number(sData?.totalBookings ?? prev.totalBookings),
          //   pendingInvoices: Number(sData?.pendingInvoices ?? 0),
          //   issued: Number(sData?.issued ?? 0),
          //   toBePaid: Number(sData?.toBePaid ?? 0),
          //   cancelled: Number(sData?.cancelled ?? 0),
          //   trend: Array.isArray(sData?.trend) && sData.trend.length ? sData.trend : prev.trend.length ? prev.trend : [2, 4, 3, 6, 7, 6, 9],
          // }));

          setRecentBookings(
            bData.map((b) => ({
              id: b.booking_id || b.id,
              customer: b.client_name || b.customer || "—",
              pnr: b.pnr || "—",
              type: (b.type || "—").toString(),
              amount: b.total_amount ?? 0,
              currency: b.currency || "USD",
              status: b.status || "—",
              date: getDate(b.date || b.created_at || b.createdAt || b.created_time),
            }))
          );

          console.info("Fetched wallet transactions:", bData);

          setWalletTx(
            tData.map((t) => ({
              id: t.id || t.tx_id || t.reference || Math.random().toString(36).slice(2),
              type: t.type || t.tx_type || "—",
              amount: t.amount ?? 0,
              currency: t.currency || summary.currency || "USD",
              date: getDate(t.date || t.created_at || t.createdAt),
              status: t.status || "—",
              reference: t.reference || t.ref || "—",
            }))
          );
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e);
        if (!cancelled) setError(T.fetch_error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [range, user?.id]); // refetch on range change

  const currentPath = location.pathname;
  const meta = {
    dashboard_active: currentPath === "/dashboard",
    bookings_active: currentPath === "/bookings",
  };

  const onDepositSuccess = async () => {
    try {
      const res = await apiService.get?.("/wallet/balance");
      const ok = res && (res?.data?.status === "true" || res?.status === "true" || res?.data?.ok === true);
      const balance = ok ? (res?.data?.balance ?? res?.data?.data?.balance) : null;
      const currency = ok ? (res?.data?.currency ?? res?.data?.data?.currency) : null;
      if (balance != null) {
        setSummary((s) => ({ ...s, balance: String(balance), currency: currency || s.currency }));
      }
    } catch {
      // ignore; UI still fine
    }
  };

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */
  const StatCard = ({ label, value, accent = "blue", hint, children }) => {
    const accents = {
      blue: { bg: "bg-blue-50", chip: "text-blue-700 bg-blue-100", stroke: "#0ea5e9" },
      green: { bg: "bg-emerald-50", chip: "text-emerald-700 bg-emerald-100", stroke: "#10b981" },
      purple: { bg: "bg-violet-50", chip: "text-violet-700 bg-violet-100", stroke: "#8b5cf6" },
      amber: { bg: "bg-amber-50", chip: "text-amber-700 bg-amber-100", stroke: "#f59e0b" },
    };
    const a = accents[accent] || accents.blue;
    return (
      <div className={`rounded-2xl border border-gray-100 bg-white p-4 sm:p-5`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600">{label}</p>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
          </div>
          <div className={`rounded-xl ${a.bg} px-2.5 py-1 text-xs font-medium ${a.chip}`}>{hint}</div>
        </div>
        {children}
      </div>
    );
  };

  const QuickAction = ({ icon, label, onClick, href, dataBsToggle, dataBsTarget }) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm hover:bg-gray-50";
    if (href) {
      return (
        <a href={href} className={base} data-bs-toggle={dataBsToggle} data-bs-target={dataBsTarget}>
          {icon}
          {label}
        </a>
      );
    }
    return (
      <button className={base} onClick={onClick} data-bs-toggle={dataBsToggle} data-bs-target={dataBsTarget}>
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div>
      <Headbar T={T} rootUrl={rootUrl} user={user} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 mb-8">
        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs">!</span>
            <div className="flex-1">
              <p className="font-medium">{T.fetch_error_title}</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Top: stats + range */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2">
            <label htmlFor="range" className="sr-only">Range</label>
            <select
              id="range"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
            >
              <option value="1d">{T.today}</option>
              <option value="7d">{T.last_7_days}</option>
              <option value="30d">{T.last_30_days}</option>
              <option value="90d">{T.last_90_days}</option>
            </select>

            {/* Quick actions */}
            <QuickAction
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/></svg>}
              label={T.add_funds}
              dataBsToggle="modal"
              dataBsTarget="#depositModal"
            />
            <QuickAction
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zm0 4h10v2H4zm0 4h16v2H4z"/></svg>}
              label={T.view_bookings}
              onClick={() => navigate("/bookings")}
            />
            <QuickAction
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h12v2H3z"/></svg>}
              label={T.new_booking}
              onClick={() => navigate("/flight/availability")} // adjust route if needed
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {isLoading ? (
            <>
              <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
            </>
          ) : (
            <>
              <StatCard
                label={T.walletbalance}
                value={currencyFmt(summary.balance, summary.currency)}
                accent="green"
                hint={summary.currency}
              >
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-600">Trend</div>
                  <Sparkline values={summary.trend} stroke="#10b981" />
                </div>
              </StatCard>

              <StatCard
                label={T.totalbookings}
                value={<span>{summary.totalBookings}</span>}
                accent="blue"
                hint={T.last_30_days}
              >
                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                  <span>{T.issued}</span>
                  <span className="font-medium text-gray-800">{summary.issued}</span>
                </div>
              </StatCard>

              <StatCard
                label={T.pendinginvoices}
                value={<span>{summary.pendingInvoices}</span>}
                accent="amber"
                hint={T.to_be_paid}
              >
                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                  <span>{T.cancelled}</span>
                  <span className="font-medium text-gray-800">{summary.cancelled}</span>
                </div>
              </StatCard>

              <StatCard
                label={T.to_be_paid}
                value={<span>{summary.toBePaid}</span>}
                accent="purple"
                hint={T.status}
              >
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-600">{T.issued}</div>
                  <Sparkline values={summary.trend} stroke="#8b5cf6" />
                </div>
              </StatCard>
            </>
          )}
        </div>

        {/* Two-column: recent bookings & wallet activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent bookings */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{T.recent_bookings}</h2>
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={() => navigate("/bookings")}
              >
                {T.see_all}
              </button>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <>
                  <RowSkeleton /><RowSkeleton /><RowSkeleton /><RowSkeleton /><RowSkeleton />
                </>
              ) : recentBookings.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">{T.empty_recent}</p>
              ) : (
                <div className="divide-y">
                  {recentBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {b.customer} · {b.type.toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {T.pnr}: {b.pnr} • {T.date}: {b.date ? b.date.toLocaleString() : "—"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {currencyFmt(b.amount, b.currency)}
                        </div>
                        <div className="text-xs text-gray-600">{b.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Wallet activity */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{T.wallet_activity}</h2>
              <a href="/deposits" className="text-sm text-blue-600 hover:underline">{T.see_all}</a>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <>
                  <RowSkeleton /><RowSkeleton /><RowSkeleton /><RowSkeleton /><RowSkeleton />
                </>
              ) : walletTx.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">{T.empty_recent}</p>
              ) : (
                <div className="divide-y">
                  {walletTx.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{t.type}</div>
                        <div className="text-xs text-gray-500">
                          {T.reference}: {t.reference} • {T.date}: {t.date ? t.date.toLocaleString() : "—"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${Number(t.amount) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {currencyFmt(t.amount, t.currency)}
                        </div>
                        <div className="text-xs text-gray-600">{t.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal mount */}
        <DepositModal
          apiUrl={apiUrl}
          rootUrl={rootUrl}
          user={user}
          bankTransfer={bankTransfer}
          onSuccess={onDepositSuccess}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
