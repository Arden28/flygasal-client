import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/outline";

/**
 * Props:
 * - title: string
 * - value: string | number
 * - icon: HeroIcon
 * - color: "indigo" | "emerald" | "rose" | "amber" | "violet" | "blue" | "cyan"
 * - delta: string (e.g. "+8%")
 * - deltaTone: "up" | "down"
 * - subtitle?: string
 * - trend?: number[]  // small array for sparkline (<= 24 points recommended)
 * - formatValue?: (n:number)=>string
 */
export default function DashboardWidget({
  title,
  value,
  icon: Icon,
  color = "indigo",
  delta,
  deltaTone = "up",
  subtitle,
  trend = [],
}) {
  const variants = {
    indigo: {
      card: "bg-gradient-to-br from-indigo-50 to-white ring-indigo-100",
      iconWrap: "bg-indigo-100 text-indigo-700",
      text: "text-indigo-800",
      accent: "text-indigo-600",
      spark: "#6366F1",
    },
    emerald: {
      card: "bg-gradient-to-br from-emerald-50 to-white ring-emerald-100",
      iconWrap: "bg-emerald-100 text-emerald-700",
      text: "text-emerald-800",
      accent: "text-emerald-600",
      spark: "#10B981",
    },
    rose: {
      card: "bg-gradient-to-br from-rose-50 to-white ring-rose-100",
      iconWrap: "bg-rose-100 text-rose-700",
      text: "text-rose-800",
      accent: "text-rose-600",
      spark: "#F43F5E",
    },
    amber: {
      card: "bg-gradient-to-br from-amber-50 to-white ring-amber-100",
      iconWrap: "bg-amber-100 text-amber-700",
      text: "text-amber-800",
      accent: "text-amber-600",
      spark: "#F59E0B",
    },
    violet: {
      card: "bg-gradient-to-br from-violet-50 to-white ring-violet-100",
      iconWrap: "bg-violet-100 text-violet-700",
      text: "text-violet-800",
      accent: "text-violet-600",
      spark: "#8B5CF6",
    },
    blue: {
      card: "bg-gradient-to-br from-blue-50 to-white ring-blue-100",
      iconWrap: "bg-blue-100 text-blue-700",
      text: "text-blue-800",
      accent: "text-blue-600",
      spark: "#3B82F6",
    },
    cyan: {
      card: "bg-gradient-to-br from-cyan-50 to-white ring-cyan-100",
      iconWrap: "bg-cyan-100 text-cyan-700",
      text: "text-cyan-800",
      accent: "text-cyan-600",
      spark: "#06B6D4",
    },
  };
  const v = variants[color] || variants.indigo;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-white/60 ring-1 ${v.card} p-3 sm:p-4 transition-all duration-200 hover:shadow-lg focus-within:shadow-lg`}
      tabIndex={0}
      role="region"
      aria-label={title}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${v.iconWrap} ring-1 ring-black/5`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">{title} icon</span>
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500">{title}</p>
            <p className="text-base sm:text-lg font-semibold text-gray-800">{value}</p>
          </div>
        </div>

        {/* Delta */}
        {delta && (
          <div
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
              deltaTone === "up"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
            title={deltaTone === "up" ? "Improved vs prior period" : "Down vs prior period"}
          >
            {deltaTone === "up" ? (
              <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
            ) : (
              <ArrowTrendingDownIcon className="h-3.5 w-3.5" />
            )}
            {delta}
          </div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && <p className="mt-1 text-[11px] text-gray-500">{subtitle}</p>}

      {/* Sparkline */}
      {trend?.length > 1 && (
        <Sparkline
          className="mt-3 h-12 w-full"
          data={trend}
          stroke={v.spark}
          strokeWidth={2}
          fill="currentColor"
          fillOpacity={0.12}
        />
      )}

      {/* Hover ripple */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/60 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-60" />
    </div>
  );
}

/** Tiny, dependency-free sparkline (SVG) */
function Sparkline({ data = [], className = "", stroke = "#6366F1", strokeWidth = 2, fill = "none", fillOpacity = 0 }) {
  if (!data.length) return null;
  const w = 240; // logical width
  const h = 48; // logical height
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = 4;
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y];
  });

  const path = points
    .map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`))
    .join(" ");

  const area = `${path} L ${points[points.length - 1][0]} ${h - pad} L ${points[0][0]} ${h - pad} Z`;

  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      {fill !== "none" && <path d={area} fill={fill} opacity={fillOpacity} />}
      <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
