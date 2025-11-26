import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from "@heroicons/react/24/outline";

// Simple SVG Sparkline Component
const Sparkline = ({ data = [], color = "#CBD5E1" }) => {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 100;
  const step = width / (data.length - 1);

  const points = data.map((val, i) => {
    const x = i * step;
    const normalized = (val - min) / range;
    const y = height - (normalized * height);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width="100%" height="32" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

export default function DashboardWidget({
  title,
  value,
  icon: Icon,
  trend = { label: "0%", tone: "neutral" }, 
  color = "orange", // Default to brand
  sparklineData = []
}) {
  
  // Design Tokens
  const themes = {
    orange: { bg: "bg-[#EB7313]/10", text: "text-[#EB7313]", spark: "#EB7313" },
    blue:   { bg: "bg-blue-50", text: "text-blue-600", spark: "#3B82F6" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", spark: "#6366F1" },
    red:    { bg: "bg-rose-50", text: "text-rose-600", spark: "#F43F5E" },
    emerald:{ bg: "bg-emerald-50", text: "text-emerald-600", spark: "#10B981" },
  };
  const theme = themes[color] || themes.orange;

  // Trend Colors
  const trendConfig = {
    green: { text: "text-emerald-600", bg: "bg-emerald-50", icon: ArrowTrendingUpIcon },
    red:   { text: "text-rose-600", bg: "bg-rose-50", icon: ArrowTrendingDownIcon },
    neutral: { text: "text-slate-500", bg: "bg-slate-100", icon: MinusIcon }
  };
  const trendStyle = trendConfig[trend.tone] || trendConfig.neutral;
  const TrendIcon = trendStyle.icon;

  return (
    <div className="relative bg-white rounded-[1.25rem] p-5 border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-[#EB7313]/30 transition-all duration-300 group">
       
       <div className="flex justify-between items-start mb-3">
          <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.text} transition-transform group-hover:scale-105 duration-300`}>
             <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          
          {/* Trend Badge */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${trendStyle.bg} ${trendStyle.text}`}>
             <TrendIcon className="h-3 w-3" strokeWidth={3} />
             {trend.label}
          </div>
       </div>

       <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
       </div>

       {/* Sparkline Area */}
       <div className="mt-3 h-8 opacity-40 group-hover:opacity-100 transition-opacity">
          <Sparkline data={sparklineData} color={theme.spark} />
       </div>
    </div>
  );
}