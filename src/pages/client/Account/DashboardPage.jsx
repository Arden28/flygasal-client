import React, { useContext, useEffect, useMemo, useState } from "react";
import Headbar from "../../../components/client/Headbar";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import apiService from "../../../api/apiService";
import DepositModal from "../../../components/client/Account/DepositModal";

const T = {
  walletbalance: "Wallet Balance",
  totalbookings: "Total Bookings",
  pendinginvoices: "Pending Invoices",
  request_deposit: "Request Deposit",
  add_funds: "Add Funds",
  fetch_error_title: "Could not load data",
  fetch_error: "There was an error fetching data.",
  payment_gateways_unavailable: "Payment gateways are currently unavailable.",
};

const DashboardPage = ({ rootUrl = "/", apiUrl = "/api", apiKey = "mock_api_key" }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [bankTransfer, setBankTransfer] = useState(null);
  const [dashboardDetails, setDashboardDetails] = useState({
    balance: "0.00",
    currency: "USD",
    bookings: 0,
    pending: 0,
  });

  // derive initial snapshot from user
  const initialFromUser = useMemo(() => ({
    currency: user?.currency || "USD",
    balance: user?.wallet_balance ?? "0.00",
    bookings: user?.booking_count ?? 0,
    pending: 0,
  }), [user]);

  // Prime state from user
  useEffect(() => {
    setDashboardDetails((prev) => ({ ...prev, ...initialFromUser }));
  }, [initialFromUser]);

  // Fetch payment gateways and (optionally) live wallet balance
  useEffect(() => {
    let cancelled = false;

    const fetchGateways = async () => {
      try {
        const res = await apiService.post("/payment_gateways", { api_key: "none" });
        const ok = res?.data?.status === "true" || res?.status === "true";
        if (ok) {
          const first = Array.isArray(res?.data?.data) ? res.data.data[0] : null;
          if (!cancelled) setBankTransfer(first || null);
        } else if (!cancelled) {
          setError(res?.data?.message || res?.message || T.payment_gateways_unavailable);
        }
      } catch (e) {
        if (!cancelled) setError(T.fetch_error);
        console.error("Fetch payment gateways error:", e);
      }
    };

    const fetchLiveBalance = async () => {
      try {
        setIsLoading(true);
        // If you have an endpoint, replace "/wallet/balance" accordingly.
        // This block is optional and safely ignored if endpoint is missing.
        const res = await apiService.get?.("/wallet/balance");
        const ok = res && (res?.data?.status === "true" || res?.status === "true" || res?.data?.ok === true);
        const balance = ok ? (res?.data?.balance ?? res?.data?.data?.balance) : null;
        const currency = ok ? (res?.data?.currency ?? res?.data?.data?.currency) : null;
        if (!cancelled && balance != null) {
          setDashboardDetails((d) => ({
            ...d,
            balance: String(balance),
            currency: currency || d.currency,
          }));
        }
      } catch (e) {
        // Silently ignore if endpoint not available
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchGateways();
    fetchLiveBalance();

    return () => {
      cancelled = true;
    };
  }, []);

  const currencyFmt = (amount, curr = "USD") => {
    const num = Number(amount);
    if (Number.isNaN(num)) return `${amount ?? ""} ${curr}`.trim();
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: curr }).format(num);
    } catch {
      return `${num.toLocaleString()} ${curr}`;
    }
  };

  const handleDepositSuccess = () => {
    // Soft refresh: try refetch balance; fall back to bumping from user context if your modal returns amount
    (async () => {
      try {
        const res = await apiService.get?.("/wallet/balance");
        const ok = res && (res?.data?.status === "true" || res?.status === "true" || res?.data?.ok === true);
        const balance = ok ? (res?.data?.balance ?? res?.data?.data?.balance) : null;
        const currency = ok ? (res?.data?.currency ?? res?.data?.data?.currency) : null;
        if (balance != null) {
          setDashboardDetails((d) => ({ ...d, balance: String(balance), currency: currency || d.currency }));
          return;
        }
      } catch (e) {
        // ignore
      }
      // As a fallback, nothing to do; UI remains consistent.
    })();
  };

  // Active path (if you later want to highlight nav)
  const currentPath = location.pathname;
  const meta = {
    dashboard_active: currentPath === "/dashboard",
    bookings_active: currentPath === "/bookings",
    markups_active: currentPath === "/markups",
    deposit_active: currentPath === "/deposit",
    agency_active: currentPath === "/agency",
    profile_active: currentPath === "/profile",
  };

  const StatCard = ({ bg, icon, label, value }) => (
    <div className="col-lg-4">
      <div className={`p-4 rounded-2`} style={{ background: bg }}>
        <div className="flex items-start justify-between">
          <p className="mb-2 flex items-center gap-2 text-gray-900">
            {icon}
            <span className="font-medium">{label}</span>
          </p>
          <button
            className="btn btn-transparent"
            data-bs-toggle={label === T.walletbalance ? "modal" : undefined}
            data-bs-target={label === T.walletbalance ? "#depositModal" : undefined}
            aria-label={label === T.walletbalance ? T.request_deposit : undefined}
          >
            {label === T.walletbalance ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/></svg>
            ) : null}
          </button>
        </div>
        <div className="mt-1">
          <div className="text-2xl sm:text-3xl font-semibold">
            {label === T.walletbalance ? (
              isLoading ? <span className="inline-block h-7 w-24 bg-white/50 rounded animate-pulse" /> : <>{currencyFmt(dashboardDetails.balance, dashboardDetails.currency)}</>
            ) : (
              <span>{value}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const WalletIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M16 13h.01" /><path d="M2 10h18a2 2 0 0 1 2 2v0" />
    </svg>
  );

  const BookingsIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3.8 6h16.4" /><path d="M16 10a4 4 0 1 1-8 0" />
    </svg>
  );

  const PendingIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );

  return (
    <div>
      <Headbar T={T} rootUrl={rootUrl} user={user} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 mb-8">
        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-900">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-white text-xs">!</span>
            <div className="flex-1">
              <p className="font-medium">{T.fetch_error_title}</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="row g-3">
            <StatCard bg="#ecf8f1" icon={WalletIcon} label={T.walletbalance} value={currencyFmt(dashboardDetails.balance, dashboardDetails.currency)} />
            <StatCard bg="#ebf8fe" icon={BookingsIcon} label={T.totalbookings} value={<strong>{dashboardDetails.bookings}</strong>} />
            <StatCard bg="#f1eeff" icon={PendingIcon} label={T.pendinginvoices} value={<strong>{dashboardDetails.pending}</strong>} />
          </div>
        </div>

        {/* Deposit modal mount */}
        <DepositModal
          apiUrl={apiUrl}
          rootUrl={rootUrl}
          user={user}
          bankTransfer={bankTransfer}
          onSuccess={handleDepositSuccess}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
