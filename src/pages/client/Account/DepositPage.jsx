import React, { useContext, useEffect, useMemo, useState } from "react";
import Headbar from "../../../components/client/Headbar";
import DepositModal from "../../../components/client/Account/DepositModal";
import { AuthContext } from "../../../context/AuthContext";
import { T } from "../../../utils/translation";
import apiService from "../../../api/apiService";

/**
 * DepositPage (Refined)
 * - Unified response handling (accepts {success:"true"} or {data:{status:"true"}})
 * - Inline alerts + retry, notifies only on real request failures
 * - Responsive layout; table on desktop, cards on mobile
 * - Loading skeletons & empty state
 * - Utilities: format amount/date, status chip
 */
const DepositPage = ({ rootUrl = "/", apiUrl = "/api/" }) => {
  const { user, loading } = useContext(AuthContext);

  const [deposits, setDeposits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [bankTransfer, setBankTransfer] = useState(null);

  const canFetch = useMemo(() => !!user?.id, [user]);

  useEffect(() => {
    if (!canFetch) return;

    const fetchDeposits = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await apiService.post("/transactions", { user_id: user.id });
        // Normalize success flag across possible backends
        const ok =
          res?.data?.status === "true" ||
          res?.status === "true" ||
          res?.success === "true" ||
          res?.data?.success === "true" ||
          res?.data?.ok === true;

        const rows = res?.data?.data ?? res?.data?.rows ?? res?.data ?? [];

        if (ok) {
          setDeposits(Array.isArray(rows) ? rows : []);
        } else {
          setError(res?.data?.message || res?.message || "Failed to fetch deposits");
        }
      } catch (e) {
        console.error("Fetch deposits error:", e);
        setError(T.fetch_error || "Error fetching deposits");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPaymentGateways = async () => {
      try {
        const res = await apiService.post("/payment_gateways", { api_key: "none" });
        const ok = res?.data?.status === "true" || res?.status === "true";
        if (ok) {
          const first = Array.isArray(res?.data?.data) ? res.data.data[0] : null;
          setBankTransfer(first || null);
        } else {
          console.warn("Payment gateways not available", res);
        }
      } catch (e) {
        console.error("Fetch payment gateways error:", e);
      }
    };

    fetchDeposits();
    fetchPaymentGateways();
  }, [apiUrl, canFetch, user]);

  const handleDepositSuccess = () => {
    // Re-fetch instead of hard reload for better UX
    if (!user?.id) return;
    (async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await apiService.post("/transactions", { user_id: user.id });
        const ok =
          res?.data?.status === "true" ||
          res?.status === "true" ||
          res?.success === "true" ||
          res?.data?.success === "true" ||
          res?.data?.ok === true;
        const rows = res?.data?.data ?? res?.data?.rows ?? res?.data ?? [];
        if (ok) setDeposits(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const formatAmount = (amt, curr) => {
    const num = Number(amt);
    if (Number.isNaN(num)) return amt ?? "";
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: curr || "USD" }).format(num);
    } catch {
      return `${num.toLocaleString()} ${curr || ""}`.trim();
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleString();
  };

  const StatusChip = ({ value }) => {
    const v = String(value || "").toLowerCase();
    const map = {
      completed: "bg-green-100 text-green-700 border-green-200",
      success: "bg-green-100 text-green-700 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      processing: "bg-blue-100 text-blue-700 border-blue-200",
      failed: "bg-red-100 text-red-700 border-red-200",
      cancelled: "bg-gray-100 text-gray-600 border-gray-200",
    };
    const cls = map[v] || "bg-gray-100 text-gray-600 border-gray-200";
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
        {value || "—"}
      </span>
    );
  };

  return (
    <div>
      <Headbar T={T} rootUrl={rootUrl} user={user} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{T.deposits}</h1>
            <p className="text-sm text-gray-600">{T.deposits_subtitle || "Manage and review your wallet top‑ups."}</p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
            data-bs-toggle="modal"
            data-bs-target="#depositModal"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/></svg>
            {T.request_deposit || "Request Deposit"}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-xs">!</span>
            <div className="flex-1">
              <p className="font-medium">{T.fetch_error_title || "Could not load deposits"}</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <button
              onClick={() => {
                // trigger re-fetch by toggling a quick effect
                if (!user?.id) return;
                setIsLoading(true); setError("");
                apiService.post("/transactions", { user_id: user.id })
                  .then((res) => {
                    const ok = res?.data?.status === "true" || res?.status === "true" || res?.success === "true" || res?.data?.success === "true" || res?.data?.ok === true;
                    const rows = res?.data?.data ?? res?.data?.rows ?? res?.data ?? [];
                    if (ok) setDeposits(Array.isArray(rows) ? rows : []); else setError(res?.data?.message || res?.message || "Failed to fetch deposits");
                  })
                  .catch(() => setError(T.fetch_error || "Error fetching deposits"))
                  .finally(() => setIsLoading(false));
              }}
              className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
            >
              {T.retry || "Retry"}
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6">
            {/* Loading skeleton */}
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 w-full bg-gray-100 rounded" />
                ))}
              </div>
            ) : deposits.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400"><path d="M12 1a9 9 0 019 9c0 7-9 13-9 13S3 17 3 10a9 9 0 019-9zm0 4a5 5 0 100 10 5 5 0 000-10z"/></svg>
                </div>
                <h3 className="text-base font-medium">{T.no_deposits || "No deposits yet"}</h3>
                <p className="text-sm text-gray-600 mt-1">{T.no_deposits_help || "When you add funds, they'll appear here."}</p>
                <div className="mt-4">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-white shadow-sm hover:bg-blue-700"
                    data-bs-toggle="modal"
                    data-bs-target="#depositModal"
                  >
                    {T.add_funds || "Add Funds"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="-mx-4 sm:mx-0">
                {/* Table (desktop) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 border-b">
                        <th className="py-3 pr-3">{T.id || "ID"}</th>
                        <th className="py-3 pr-3">{T.date || "Date"}</th>
                        <th className="py-3 pr-3">{T.amount || "Amount"}</th>
                        <th className="py-3 pr-3">{T.currency || "Currency"}</th>
                        <th className="py-3 pr-3">{T.payment_method || "Payment Method"}</th>
                        <th className="py-3 pr-3">{T.status || "Status"}</th>
                        <th className="py-3">{T.details || "Details"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.map((d) => (
                        <tr key={d.trx_id || d.id} className="border-b last:border-b-0">
                          <td className="py-3 pr-3 font-medium">#{d.trx_id || d.id}</td>
                          <td className="py-3 pr-3">{formatDate(d.date)}</td>
                          <td className="py-3 pr-3">{formatAmount(d.amount, d.currency)}</td>
                          <td className="py-3 pr-3">{d.currency || "—"}</td>
                          <td className="py-3 pr-3">{d.payment_gateway || d.method || "—"}</td>
                          <td className="py-3 pr-3"><StatusChip value={d.status} /></td>
                          <td className="py-3">{d.description || d.details || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards (mobile) */}
                <div className="md:hidden space-y-3">
                  {deposits.map((d) => (
                    <div key={d.trx_id || d.id} className="rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">#{d.trx_id || d.id}</div>
                        <StatusChip value={d.status} />
                      </div>
                      <div className="mt-2 text-sm text-gray-700">{formatDate(d.date)}</div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-gray-500">{T.amount || "Amount"}</div>
                          <div className="font-medium">{formatAmount(d.amount, d.currency)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">{T.payment_method || "Payment Method"}</div>
                          <div className="font-medium">{d.payment_gateway || d.method || "—"}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-gray-500">{T.details || "Details"}</div>
                          <div className="font-medium">{d.description || d.details || "—"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DepositModal
        apiUrl={apiUrl}
        rootUrl={rootUrl}
        user={user}
        bankTransfer={bankTransfer}
        onSuccess={handleDepositSuccess}
      />
    </div>
  );
};

export default DepositPage;
