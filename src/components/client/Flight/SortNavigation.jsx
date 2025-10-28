import React from "react";

/**
 * SortNavigation
 * - Full-width, 3-segment selector: Recommended | Cheapest | Quickest
 * - No "modify search" button
 * - Active segment = solid color with white text
 * - Inactive segments = subtle light background
 * - Shows title, price and average duration (pass via props or relies on sensible defaults)
 *
 * Props:
 *   sortOrder: "recommended" | "cheapest" | "quickest"
 *   handleSortChange: (key) => void
 *   summaries?: {
 *     recommended?: { price?: string, duration?: string },
 *     cheapest?: { price?: string, duration?: string },
 *     quickest?: { price?: string, duration?: string },
 *   }
 */
const SortNavigation = ({
  sortOrder = "recommended",
  handleSortChange = () => {},
  summaries = {},
}) => {
  const data = {
    recommended: {
      title: "Recommended",
      price: summaries?.recommended?.price ?? "€1 141",
      duration: summaries?.recommended?.duration ?? "16h 13m (average)",
      // Active purple approximating AA’s tone
      activeBg: "bg-[#5A46E0]",
      inactiveBg: "bg-slate-50",
      activeText: "text-white",
      inactiveText: "text-slate-800",
      leftRounded: true,
      rightRounded: false,
      showInfo: true,
    },
    cheapest: {
      title: "Cheapest",
      price: summaries?.cheapest?.price ?? "€1 141",
      duration: summaries?.cheapest?.duration ?? "16h 13m (average)",
      activeBg: "bg-emerald-600",
      inactiveBg: "bg-white",
      activeText: "text-white",
      inactiveText: "text-slate-800",
      leftRounded: false,
      rightRounded: false,
      showInfo: false,
    },
    quickest: {
      title: "Quickest",
      price: summaries?.quickest?.price ?? "€3 952",
      duration: summaries?.quickest?.duration ?? "9h 5m (average)",
      activeBg: "bg-[#5A46E0]",
      inactiveBg: "bg-white",
      activeText: "text-white",
      inactiveText: "text-slate-800",
      leftRounded: false,
      rightRounded: true,
      showInfo: false,
    },
  };

  const tabs = ["recommended", "cheapest", "quickest"];

  return (
    <nav className="w-full">
      {/* Outer shell: rounded, subtle border, no shadow */}
      <div className="w-full overflow-hidden rounded-2xl ring-1 ring-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {tabs.map((key, idx) => {
            const isActive = sortOrder === key;
            const t = data[key];

            // Corner rounding is on the outer shell; keep buttons square.
            // Use separators between middle cells.
            const separator =
              idx > 0
                ? "sm:border-l sm:border-slate-200"
                : "";

            const bg = isActive ? t.activeBg : t.inactiveBg;
            const text = isActive ? t.activeText : t.inactiveText;
            const priceText = isActive ? "text-white/95" : "text-slate-900";
            const durationText = isActive ? "text-white/90" : "text-slate-500";

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
                        className={`h-4 w-4 ${
                          isActive ? "text-white/90" : "text-[#5A46E0]"
                        }`}
                        fill="currentColor"
                      >
                        <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm-.75-11.5h1.5V17h-1.5v-6.5Zm0-3h1.5V9h-1.5V7.5Z" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className={`mt-2 text-sm font-semibold ${priceText}`}>
                  {t.price}
                </div>
                <div className={`mt-3 text-xs ${durationText}`}>
                  {t.duration}
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
