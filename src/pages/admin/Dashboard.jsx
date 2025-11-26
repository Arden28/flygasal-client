import { useEffect, useState } from "react";
import {
  UsersIcon,
  ChartBarIcon,
  TicketIcon,
  BanknotesIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from "@heroicons/react/24/outline";
import DashboardWidget from "../../components/admin/DashboardWidget";
import SalesChart from "../../components/admin/SalesChart";
import apiService from "../../api/apiService";

// Utils
const money = (n, c = "USD") => {
  const x = Number(n);
  if (!isFinite(x)) return `${c} 0.00`;
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(x); } 
  catch { return `${c} ${x.toFixed(2)}`; }
};

export default function Dashboard() {
  // UI state
  const [range, setRange] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState("");

  // API data
  const [summary, setSummary] = useState(null);
  const isLoading = bootLoading || refreshing;

  const loadData = async (isBoot = false) => {
    if (isBoot) setBootLoading(true);
    else setRefreshing(true);
    setError("");
    
    try {
      const res = await apiService.get("/admin/dashboard/summary", { params: { range } });
      const data = res?.data?.data;
      if (!data) throw new Error("Invalid dashboard payload");
      setSummary(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load dashboard data.");
    } finally {
      if (isBoot) setBootLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => { loadData(true); }, [range]);

  // Safely read values
  const currency = summary?.currency || "USD";
  const totals = summary?.totals || { users: 0, bookings: 0, cancelled: 0, unpaid: 0, revenue: 0 };
  const trends = summary?.trends || { users: [], bookings: [], cancelled: [], unpaid: [], revenue: [] };

  // Calculate Trends
  const calculateDelta = (arr, inverse = false) => {
    if (!arr || arr.length < 2) return { label: "0%", tone: "neutral" };
    const prev = Number(arr[arr.length - 2] || 0);
    const last = Number(arr[arr.length - 1] || 0);
    
    if (prev === 0) return { label: last > 0 ? "+100%" : "0%", tone: "neutral" };
    
    const pct = ((last - prev) / Math.abs(prev)) * 100;
    const isPositive = pct >= 0;
    
    let tone = "neutral";
    if (isPositive) tone = inverse ? "red" : "green";
    else tone = inverse ? "green" : "red";

    return { 
        label: `${isPositive ? "+" : ""}${Math.round(pct)}%`, 
        tone 
    };
  };

  const dUsers = calculateDelta(trends.users);
  const dBookings = calculateDelta(trends.bookings);
  const dRevenue = calculateDelta(trends.revenue);
  const dCancelled = calculateDelta(trends.cancelled, true); // Inverse: Higher is bad

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      <div className="mx-auto max-w-7xl px-4 mt-3">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
           <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
              <div className="flex items-center gap-2 mt-1 text-slate-500">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 <p className="text-sm font-medium">System Operational</p>
              </div>
           </div>

           <div className="flex flex-col sm:flex-row gap-3">
              {/* Date Segmented Control */}
              <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex">
                 {[
                    { k: "7d", label: "7 Days" },
                    { k: "30d", label: "30 Days" },
                    { k: "6m", label: "6 Months" },
                    { k: "12m", label: "Year" },
                 ].map(({ k, label }) => (
                    <button
                       key={k}
                       onClick={() => setRange(k)}
                       className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          range === k 
                             ? "bg-[#EB7313] text-white shadow-md" 
                             : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                       }`}
                    >
                       {label}
                    </button>
                 ))}
              </div>

              {/* Refresh Button */}
              <button
                 onClick={() => loadData(false)}
                 disabled={refreshing}
                 className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:text-[#EB7313] hover:border-[#EB7313] px-4 py-2 rounded-xl shadow-sm text-sm font-semibold transition-all disabled:opacity-50"
              >
                 <ArrowPathIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                 {refreshing ? "Syncing..." : "Refresh"}
              </button>
           </div>
        </div>

        {/* Error State */}
        {!isLoading && error && (
           <div className="mb-8 p-4 rounded-xl border border-red-100 bg-red-50 text-red-700 flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-semibold">{error}</span>
           </div>
        )}

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           {isLoading ? (
              [...Array(4)].map((_, i) => <WidgetSkeleton key={i} />)
           ) : (
              <>
                 <DashboardWidget
                    title="Total Revenue"
                    value={money(totals.revenue, currency)}
                    icon={BanknotesIcon}
                    trend={dRevenue}
                    sparklineData={trends.revenue}
                    color="orange" // Brand Color
                 />
                 <DashboardWidget
                    title="Confirmed Bookings"
                    value={totals.bookings.toLocaleString()}
                    icon={TicketIcon}
                    trend={dBookings}
                    sparklineData={trends.bookings}
                    color="blue"
                 />
                 <DashboardWidget
                    title="Active Users"
                    value={totals.users.toLocaleString()}
                    icon={UsersIcon}
                    trend={dUsers}
                    sparklineData={trends.users}
                    color="indigo"
                 />
                 <DashboardWidget
                    title="Cancellations"
                    value={totals.cancelled.toLocaleString()}
                    icon={CalendarDaysIcon}
                    trend={dCancelled}
                    sparklineData={trends.cancelled}
                    color="red" // Red for alert
                 />
              </>
           )}
        </div>

        {/* Main Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Sales Chart (Takes 2/3 width) */}
           <div className="lg:col-span-2 bg-white rounded-[1.5rem] border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h2 className="text-lg font-bold text-slate-900">Sales Overview</h2>
                    <p className="text-sm text-slate-500">Revenue vs Bookings volume</p>
                 </div>
                 <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-slate-500">
                    {range.toUpperCase()}
                 </div>
              </div>
              
              {isLoading ? (
                 <ChartSkeleton />
              ) : (
                 <div className="h-80 w-full">
                    <SalesChart
                       range={range}
                       currency={currency}
                       prefetched={{
                          labels: summary?.labels || [],
                          revenue: trends.revenue || [],
                          bookings: trends.bookings || [],
                       }}
                    />
                 </div>
              )}
           </div>

           {/* Secondary Metrics / Quick Actions (Takes 1/3 width) */}
           <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm p-6 flex flex-col h-full">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Quick Analytics</h2>
              
              {/* Mini List */}
              <div className="space-y-6 flex-1">
                 <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-[#EB7313]/5 transition-colors group border border-transparent hover:border-[#EB7313]/20">
                    <div className="flex items-center gap-4">
                       <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-[#EB7313] transition-colors">
                          <TicketIcon className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-500 uppercase">Unpaid</p>
                          <p className="text-lg font-bold text-slate-900">{totals.unpaid}</p>
                       </div>
                    </div>
                    <ArrowTrendingUpIcon className="h-5 w-5 text-slate-300 group-hover:text-[#EB7313]" />
                 </div>

                 <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-blue-50 transition-colors group border border-transparent hover:border-blue-200">
                    <div className="flex items-center gap-4">
                       <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                          <UsersIcon className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-500 uppercase">New Clients</p>
                          <p className="text-lg font-bold text-slate-900">+{dUsers.label}</p>
                       </div>
                    </div>
                    <ArrowTrendingUpIcon className="h-5 w-5 text-slate-300 group-hover:text-blue-600" />
                 </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                 <p className="text-xs text-slate-400 text-center mb-4">Data updated just now</p>
                 <button 
                    onClick={() => loadData(false)}
                    className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-[#EB7313] transition-colors shadow-lg"
                 >
                    Generate Report
                 </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

// --- Skeletons ---
const WidgetSkeleton = () => (
  <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 h-40 animate-pulse">
     <div className="flex justify-between items-start mb-4">
        <div className="h-10 w-10 bg-slate-100 rounded-xl"></div>
        <div className="h-4 w-12 bg-slate-100 rounded-full"></div>
     </div>
     <div className="h-8 w-24 bg-slate-100 rounded mb-2"></div>
     <div className="h-4 w-16 bg-slate-100 rounded"></div>
  </div>
);

const ChartSkeleton = () => (
  <div className="h-80 w-full bg-slate-50 rounded-xl animate-pulse flex items-end justify-between p-4 gap-2">
     {[...Array(12)].map((_,i) => (
        <div key={i} className="w-full bg-slate-200 rounded-t-sm" style={{height: `${Math.random() * 80 + 10}%`}}></div>
     ))}
  </div>
);