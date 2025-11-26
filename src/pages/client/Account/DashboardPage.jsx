import React, { useContext, useEffect, useMemo, useState } from "react";
import Headbar from "../../../components/client/Headbar";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import apiService from "../../../api/apiService";
import DepositModal from "../../../components/client/Account/DepositModal";
import { 
  UsersIcon, ListBulletIcon, PaperClipIcon, ChartBarIcon,
  TicketIcon, BanknotesIcon, ArrowPathIcon, CalendarDaysIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon
} from "@heroicons/react/24/outline";
import { ArrowDownLeft, ArrowUpRight, CreditCard, Wallet } from "lucide-react";

// --- Translation & Helpers ---
const T = {
  walletbalance: "Wallet Balance",
  totalbookings: "Total Bookings",
  pendinginvoices: "Pending",
  issued: "Issued",
  to_be_paid: "Unpaid",
  cancelled: "Cancelled",
  add_funds: "Add Funds",
  view_bookings: "All Bookings",
  new_booking: "New Flight",
  recent_bookings: "Recent Activity",
  wallet_activity: "Transactions",
  empty_recent: "No recent activity found.",
  fetch_error_title: "Data Error",
  fetch_error: "Could not refresh dashboard data."
};

const currencyFmt = (amount, curr = "USD") => {
  const num = Number(amount);
  if (Number.isNaN(num)) return `${amount ?? ""} ${curr}`.trim();
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: curr }).format(num); } 
  catch { return `${num.toLocaleString()} ${curr}`; }
};

const getDate = (v) => (v ? new Date(v) : null);

const formatTransactionType = (type) => {
  switch (type) {
    case "wallet_topup": return "Wallet Top-up";
    case "booking_payment": return "Booking Payment";
    default: return (type || "").replace(/_/g, ' ');
  }
};

// --- Components ---
const Sparkline = ({ values = [], width = 100, height = 32, stroke = "currentColor" }) => {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const norm = (v) => (max === min ? height / 2 : height - ((v - min) / (max - min)) * height);
  const step = width / (values.length - 1 || 1);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${norm(v)}`).join(" ");
  return <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible"><path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};

const StatCard = ({ label, value, trend, color }) => {
    const themes = {
      blue: { bg: "bg-blue-50 text-blue-600", icon: TicketIcon },
      purple: { bg: "bg-purple-50 text-purple-600", icon: PaperClipIcon },
      orange: { bg: "bg-orange-50 text-orange-600", icon: ChartBarIcon },
    };
    const theme = themes[color];
    const Icon = theme.icon;

    return (
      <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group hover:shadow-md hover:border-[#EB7313]/20 transition-all">
        <div className="flex justify-between items-start mb-4">
             <div className={`p-3 rounded-2xl ${theme.bg} transition-transform group-hover:scale-110 duration-300`}>
                <Icon className="h-6 w-6" strokeWidth={2} />
             </div>
             {trend && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 text-xs font-bold text-slate-600">
                   <span>{trend}</span>
                </div>
             )}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
          <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
        </div>
      </div>
    );
};

export default function DashboardPage({ rootUrl = "/", apiUrl = "/api" }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // State
  const [range, setRange] = useState("7d");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [bankTransfer, setBankTransfer] = useState(null);
  
  // Data
  const [summary, setSummary] = useState({
    currency: user?.currency || "USD",
    balance: user?.wallet_balance ?? "0.00",
    totalBookings: user?.booking_count ?? 0,
    pendingInvoices: 0,
    issued: 0,
    toBePaid: 0,
    cancelled: 0,
    trend: [4, 2, 5, 3, 7, 6, 8], // Default sparkline
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [walletTx, setWalletTx] = useState([]);

  // --- 1. Fetch Gateways ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiService.post("/payment_gateways", { api_key: "none" });
        if (res?.data?.status === "true" && !cancelled) {
           setBankTransfer(res.data.data?.[0] || null);
        }
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, []);

  // --- 2. Fetch Dashboard Data (Real Logic) ---
  const fetchAll = async () => {
      setIsLoading(true);
      setError("");
      try {
        // A. Summary (Optional - uncomment if you have this endpoint)
        // const resSum = await apiService.get("/dashboard/summary", { params: { range } });
        
        // B. Bookings
        const resBookings = await apiService.get("/bookings");
        const bData = resBookings?.data?.data?.data || [];
        setRecentBookings(bData.slice(0, 5).map(b => ({
            id: b.order_num || b.id,
            customer: b.contact_name || b.customer || "Guest",
            pnr: b.pnr || "—",
            type: b.type || "flight",
            amount: b.total_amount ?? 0,
            currency: b.currency || "USD",
            status: b.status || "pending",
            date: getDate(b.created_at || b.date)
        })));

        // C. Wallet
        const resTx = await apiService.get("/transactions");
        const tData = resTx?.data?.data || [];
        setWalletTx(tData.slice(0, 6).map(t => ({
            id: t.trx_id || t.reference,
            type: t.type || "transaction",
            amount: t.amount ?? 0,
            currency: t.currency || "USD",
            date: getDate(t.date || t.created_at),
            status: t.status || "completed"
        })));

        // Update Summary Counts from fetched lists (or use real endpoint data)
        setSummary(prev => ({
            ...prev,
            totalBookings: bData.length, // or user.booking_count
            pendingInvoices: bData.filter(b => b.status === 'pending').length,
            issued: bData.filter(b => b.status === 'confirmed').length,
            cancelled: bData.filter(b => b.status === 'cancelled').length,
            toBePaid: bData.filter(b => b.payment_status === 'unpaid').length
        }));

      } catch (e) {
        console.error(e);
        setError(T.fetch_error);
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => { fetchAll(); }, [range, user?.id]);

  // --- 3. Deposit Callback ---
  const onDepositSuccess = async () => {
      try {
         const res = await apiService.get("/wallet/balance");
         if (res?.data?.status === "true") {
             setSummary(s => ({ ...s, balance: res.data.balance, currency: res.data.currency }));
             fetchAll(); // Refresh tx list
         }
      } catch {}
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <Headbar T={T} rootUrl={rootUrl} user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Overview for {user?.name?.split(' ')[0]}</p>
          </div>
          <div className="flex items-center gap-3">
             <select 
                value={range} onChange={(e) => setRange(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#EB7313] focus:border-transparent shadow-sm outline-none cursor-pointer"
             >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
             </select>
             <button 
                onClick={fetchAll}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
             >
                <ArrowPathIcon className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
             </button>
             <button onClick={() => navigate("/flight/availability")} className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2">
                <TicketIcon className="h-4 w-4" /> {T.new_booking}
             </button>
          </div>
        </div>

        {error && (
           <div className="mb-6 p-4 rounded-xl border border-red-100 bg-red-50 text-red-700 flex items-center gap-3">
              <span className="font-bold">Error:</span> {error}
           </div>
        )}

        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Wallet Card */}
          <div className="md:col-span-1 lg:col-span-1 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 text-black shadow-xl shadow-slate-900/10 p-6 flex flex-col justify-between min-h-[220px]">
             <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
             <div className="relative z-10">
                <div className="flex items-center gap-2 opacity-80 mb-1 text-sm font-medium">
                   <Wallet className="h-4 w-4" /> {T.walletbalance}
                </div>
                <div className="text-3xl font-bold tracking-tight mt-2">{currencyFmt(summary.balance, summary.currency)}</div>
             </div>
             <div className="relative z-10 mt-auto">
                <div className="h-8 mb-4 opacity-40"><Sparkline values={summary.trend} stroke="white" /></div>
                <button 
                  data-bs-toggle="modal" data-bs-target="#depositModal"
                  className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-black text-sm font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                   <ArrowDownLeft className="h-4 w-4" /> {T.add_funds}
                </button>
             </div>
          </div>

          {/* Stats */}
          <StatCard label={T.totalbookings} value={summary.totalBookings} trend={`${summary.issued} Issued`} color="blue" />
          <StatCard label={T.pendinginvoices} value={summary.pendingInvoices} trend={`${summary.cancelled} Cancelled`} color="orange" />
          <StatCard label={T.to_be_paid} value={summary.toBePaid} trend="Action Required" color="purple" />
        </div>

        {/* Lists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Recent Bookings (2 Cols) */}
           <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                 <h3 className="font-bold text-slate-900 text-lg">{T.recent_bookings}</h3>
                 <button onClick={() => navigate("/bookings")} className="text-sm text-[#EB7313] font-bold hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
                       <tr>
                          <th className="px-6 py-3 font-bold">Reference</th>
                          <th className="px-6 py-3 font-bold">Customer</th>
                          <th className="px-6 py-3 font-bold text-right">Total</th>
                          <th className="px-6 py-3 font-bold text-center">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {isLoading ? (
                          [...Array(3)].map((_, i) => <tr key={i}><td colSpan="4" className="p-6"><div className="h-4 bg-slate-100 rounded animate-pulse"></div></td></tr>)
                       ) : recentBookings.length === 0 ? (
                          <tr><td colSpan="4" className="p-12 text-center text-slate-400">{T.empty_recent}</td></tr>
                       ) : (
                          recentBookings.map((b) => (
                             <tr key={b.id} className="hover:bg-[#FFF7ED]/30 transition-colors cursor-pointer group" onClick={() => navigate(`/flight/booking/invoice/${b.id}`)}>
                                <td className="px-6 py-4">
                                   <div className="font-bold text-slate-900 group-hover:text-[#EB7313] transition-colors">{b.id}</div>
                                   <div className="text-xs text-slate-400 font-mono mt-0.5">{b.pnr}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{b.customer}</td>
                                <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">{currencyFmt(b.amount, b.currency)}</td>
                                <td className="px-6 py-4 text-center">
                                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                      b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 
                                      b.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                                   }`}>
                                      {b.status}
                                   </span>
                                </td>
                             </tr>
                          ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Wallet Activity (1 Col) */}
           <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                 <h3 className="font-bold text-slate-900 text-lg">{T.wallet_activity}</h3>
              </div>
              <div className="flex-1 p-0 overflow-y-auto max-h-[400px] divide-y divide-slate-50">
                 {isLoading ? (
                    <div className="p-6 space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="h-12 bg-slate-50 rounded animate-pulse"></div>)}</div>
                 ) : walletTx.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-sm">No transactions.</div>
                 ) : (
                    walletTx.map((t) => {
                       const isPositive = Number(t.amount) > 0;
                       return (
                          <div key={t.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                             <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                   isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                                }`}>
                                   {isPositive ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                </div>
                                <div>
                                   <div className="text-sm font-bold text-slate-900 capitalize">{formatTransactionType(t.type)}</div>
                                   <div className="text-xs text-slate-400">{t.date ? t.date.toLocaleDateString() : "—"}</div>
                                </div>
                             </div>
                             <div className={`text-sm font-bold font-mono ${isPositive ? 'text-emerald-600' : 'text-slate-900'}`}>
                                {isPositive ? '+' : ''}{currencyFmt(t.amount, t.currency)}
                             </div>
                          </div>
                       );
                    })
                 )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                 <button onClick={() => navigate('/deposits')} className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:text-[#EB7313] hover:border-orange-200 transition-all shadow-sm">
                    View All History
                 </button>
              </div>
           </div>

        </div>
      </div>

      {/* Deposit Modal */}
      <DepositModal 
         apiUrl={apiUrl} 
         rootUrl={rootUrl} 
         user={user} 
         bankTransfer={bankTransfer} 
         onSuccess={onDepositSuccess} 
      />
    </div>
  );
}