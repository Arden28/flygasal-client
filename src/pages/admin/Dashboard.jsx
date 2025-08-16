import { useEffect, useMemo, useState } from "react";
import {
  UsersIcon,
  ChartBarIcon,
  PaperClipIcon,
  ListBulletIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import DashboardWidget from "../../components/admin/DashboardWidget";
import SalesChart from "../../components/admin/SalesChart";
import apiService from "../../api/apiService";

const money = (n, c = "USD") => {
  const x = Number(n);
  if (!isFinite(x)) return `${c} 0.00`;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(x);
  } catch {
    return `${c} ${x.toFixed(2)}`;
  }
};

export default function Dashboard() {
  // UI state
  const [range, setRange] = useState("30d"); // "7d" | "30d" | "6m" | "12m"
  const [refreshing, setRefreshing] = useState(false);
  const [bootLoading, setBootLoading] = useState(true); // page skeleton on first mount
  const [error, setError] = useState("");

  // API data
  const [summary, setSummary] = useState(null); // { totals, trends, labels, currency, period }
  const isLoading = bootLoading || refreshing;

  // fetch dashboard summary from backend
  useEffect(() => {
    let cancel = false;

    const load = async (first = false) => {
      if (first) setBootLoading(true);
      setError("");
      try {
        const res = await apiService.get("/dashboard/summary", { params: { range } });
        const data = res?.data?.data;
        if (!data) throw new Error("Invalid dashboard payload");
        if (!cancel) setSummary(data);
      } catch (e) {
        console.error(e);
        if (!cancel) setError(e?.message || "Failed to load dashboard.");
      } finally {
        if (first && !cancel) setBootLoading(false);
      }
    };

    load(true);
    return () => {
      cancel = true;
    };
  }, [range]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      const res = await apiService.get("/dashboard/summary", { params: { range } });
      const data = res?.data?.data;
      if (!data) throw new Error("Invalid dashboard payload");
      setSummary(data);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to refresh dashboard.");
    } finally {
      setRefreshing(false);
    }
  };

  // Safely read values
  const currency = summary?.currency || "USD";
  const totals = summary?.totals || { users: 0, bookings: 0, cancelled: 0, unpaid: 0, revenue: 0 };
  const trends = summary?.trends || {
    users: [],
    bookings: [],
    cancelled: [],
    unpaid: [],
    revenue: [],
  };

  // Δ helpers: compare last bucket vs previous; handle 0 and sign
  const pctDelta = (arr, goodWhenUp = true) => {
    if (!arr || arr.length < 2) return { label: "—", tone: "flat" };
    const prev = Number(arr[arr.length - 2] || 0);
    const last = Number(arr[arr.length - 1] || 0);
    if (prev === 0) {
      const up = last > 0;
      return { label: up ? "+100%" : "0%", tone: up ? (goodWhenUp ? "up" : "down") : "flat" };
    }
    const pct = ((last - prev) / Math.abs(prev)) * 100;
    const up = pct >= 0;
    const tone = up ? (goodWhenUp ? "up" : "down") : (goodWhenUp ? "down" : "up");
    const label = `${up ? "+" : ""}${Math.round(pct)}%`;
    return { label, tone };
  };

  const dUsers = pctDelta(trends.users, true);
  const dBookings = pctDelta(trends.bookings, true);
  const dCancelled = pctDelta(trends.cancelled, false);
  const dUnpaid = pctDelta(trends.unpaid, false);
  const dRevenue = pctDelta(trends.revenue, true);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-2 sm:px-3 md:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Dashboard</h1>
            <p className="text-xs text-gray-500">Overview of recent activity and performance.</p>
          </div>

          {/* Controls are wrap/scroll-safe on tiny screens */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="max-w-full overflow-x-auto">
              <div className="inline-flex rounded-lg border bg-white shadow-sm">
                {[
                  { k: "7d", label: "7d" },
                  { k: "30d", label: "30d" },
                  { k: "6m", label: "6m" },
                  { k: "12m", label: "12m" },
                ].map(({ k, label }) => {
                  const active = range === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setRange(k)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                        active ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"
                      }`}
                      aria-pressed={active}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
              aria-live="polite"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {!isLoading && error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-6">
          {isLoading ? (
            <>
              <WidgetSkeleton />
              <WidgetSkeleton />
              <WidgetSkeleton />
              <WidgetSkeleton />
              <WidgetSkeleton />
            </>
          ) : (
            <>
              <DashboardWidget
                title="Total Users"
                value={totals.users.toLocaleString()}
                icon={UsersIcon}
                color="indigo"
                delta={dUsers.label}
                deltaTone={dUsers.tone}
                subtitle="vs previous bucket"
                trend={trends.users}
              />
              <DashboardWidget
                title="Bookings"
                value={totals.bookings.toLocaleString()}
                icon={ListBulletIcon}
                color="emerald"
                delta={dBookings.label}
                deltaTone={dBookings.tone}
                subtitle="confirmed in range"
                trend={trends.bookings}
              />
              <DashboardWidget
                title="Cancelled Bookings"
                value={totals.cancelled.toLocaleString()}
                icon={PaperClipIcon}
                color="rose"
                delta={dCancelled.label}
                deltaTone={dCancelled.tone}
                subtitle="cancellation count"
                trend={trends.cancelled}
              />
              <DashboardWidget
                title="Revenue"
                value={money(totals.revenue, currency)}
                icon={ChartBarIcon}
                color="amber"
                delta={dRevenue.label}
                deltaTone={dRevenue.tone}
                subtitle="gross receipts"
                trend={trends.revenue}
                formatValue={(v) => money(v, currency)}
              />
              <DashboardWidget
                title="Unpaid Bookings"
                value={totals.unpaid.toLocaleString()}
                icon={PaperClipIcon}
                color="violet"
                delta={dUnpaid.label}
                deltaTone={dUnpaid.tone}
                subtitle="awaiting payment"
                trend={trends.unpaid}
              />
            </>
          )}
        </div>

        {/* Sales Chart Card */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-3 sm:p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-gray-800">Sales &amp; Bookings</h2>
              <p className="text-[11px] text-gray-500">Performance for the selected range</p>
            </div>
          </div>

          {isLoading ? (
            <ChartSkeleton />
          ) : (
            // Pass prefetched trends so SalesChart doesn’t need to re-fetch
            <div className="w-full">
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
      </div>
    </div>
  );
}

/* ---------- Skeletons ---------- */

function WidgetSkeleton() {
  return (
    <div className="rounded-xl border border-white/60 ring-1 ring-gray-100 p-3 sm:p-4 bg-white">
      <div className="animate-pulse">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-gray-100" />
          <div className="flex-1">
            <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
          <div className="h-5 w-14 bg-gray-100 rounded-full" />
        </div>
        <div className="mt-3 h-12 w-full bg-gray-50 rounded" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-72 sm:h-80 w-full overflow-hidden">
      <div className="h-full w-full rounded-lg bg-gradient-to-b from-gray-100 to-gray-50 animate-pulse relative">
        <div className="absolute inset-x-0 bottom-6 flex items-end justify-between px-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-6 sm:w-8 bg-gray-200 rounded-t" style={{ height: `${20 + (i % 5) * 12}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
