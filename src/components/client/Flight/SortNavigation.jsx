import React from "react";

/**
 * SortNavigation
 * - Full-width, 3-segment selector: Recommended | Cheapest | Quickest
 * - No "modify search" button
 * - Active segment = solid color with white text
 * - Inactive segments = subtle light background
 * - Shows title, price and average duration
 * - Skeleton loading for price & duration (global `loading` or per-tab)
 *
 * Props:
 *   sortOrder: "recommended" | "cheapest" | "quickest"
 *   handleSortChange: (key) => void
 *   loading?: boolean
 *   summaries?: {
 *     recommended?: { price?: string, duration?: string, loading?: boolean },
 *     cheapest?:    { price?: string, duration?: string, loading?: boolean },
 *     quickest?:    { price?: string, duration?: string, loading?: boolean },
 *   }
 */
const SortNavigation = ({
  sortOrder = "recommended",
  handleSortChange = () => {},
  loading = false,
  summaries = {},
}) => {
  const tabs = {
    recommended: {
      title: "Recommended",
      price: summaries?.recommended?.price ?? "€1 141",
      duration: summaries?.recommended?.duration ?? "16h 13m (average)",
      activeBg: "bg-[#5A46E0]",
      inactiveBg: "bg-slate-50",
      activeText: "text-white",
      inactiveText: "text-slate-800",
      showInfo: true,
      loading: !!summaries?.recommended?.loading,
    },
    cheapest: {
      title: "Cheapest",
      price: summaries?.cheapest?.price ?? "€1 141",
      duration: summaries?.cheapest?.duration ?? "16h 13m (average)",
      activeBg: "bg-emerald-600",
      inactiveBg: "bg-white",
      activeText: "text-white",
      inactiveText: "text-slate-800",
      showInfo: false,
      loading: !!summaries?.cheapest?.loading,
    },
    quickest: {
      title: "Quickest",
      price: summaries?.quickest?.price ?? "€3 952",
      duration: summaries?.quickest?.duration ?? "9h 5m (average)",
      activeBg: "bg-[#5A46E0]",
      inactiveBg: "bg-white",
      activeText: "text-white",
      inactiveText: "text-slate-800",
      showInfo: false,
      loading: !!summaries?.quickest?.loading,
    },
  };

  const order = ["recommended", "cheapest", "quickest"];

  // Skeleton block (width variants to avoid uniform look)
  const Skel = ({ active, w = "w-24", h = "h-4", className = "" }) => (
    <span
      className={[
        "inline-block rounded",
        h,
        w,
        "animate-pulse",
        active ? "bg-white/40" : "bg-slate-200",
        className,
      ].join(" ")}
      aria-hidden
    />
  );

  return (
    <nav className="w-full mb-3">
      <div className="w-full overflow-hidden rounded-2xl ring-1 ring-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {order.map((key, idx) => {
            const isActive = sortOrder === key;
            const t = tabs[key];

            const separator = idx > 0 ? "sm:border-l sm:border-slate-200" : "";

            const bg = isActive ? t.activeBg : t.inactiveBg;
            const text = isActive ? t.activeText : t.inactiveText;
            const priceText = isActive ? "text-white/95" : "text-slate-900";
            const durationText = isActive ? "text-white/90" : "text-slate-500";

            const tabLoading =
              loading ||
              t.loading ||
              !summaries?.[key]?.price ||
              !summaries?.[key]?.duration;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSortChange(key)}
                className={[
                  "w-full text-left transition-colors",
                  bg,
                  text,
                  "px-4 py-4 md:px-6 md:py-5",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                  isActive ? "focus-visible:ring-white/40" : "focus-visible:ring-slate-300/60",
                  separator,
                ].join(" ")}
                aria-pressed={isActive}
              >
                <div className="flex items-start gap-2">
                  <div className="text-sm font-semibold leading-6 flex items-center gap-1">
                    {t.title}
                    {t.showInfo && (
                      <svg
                        aria-hidden
                        viewBox="0 0 24 24"
                        className={`h-4 w-4 ${isActive ? "text-white/90" : "text-[#5A46E0]"}`}
                        fill="currentColor"
                      >
                        <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm-.75-11.5h1.5V17h-1.5v-6.5Zm0-3h1.5V9h-1.5V7.5Z" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="mt-2">
                  {tabLoading ? (
                    <Skel active={isActive} w="w-20" h="h-4" />
                  ) : (
                    <div className={`text-sm font-semibold ${priceText}`}>{t.price}</div>
                  )}
                </div>

                {/* Duration */}
                <div className="mt-3">
                  {tabLoading ? (
                    <Skel active={isActive} w="w-32" h="h-3" />
                  ) : (
                    <div className={`text-xs ${durationText}`}>{t.duration}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default SortNavigation;

