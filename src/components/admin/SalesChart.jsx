import { useEffect, useMemo, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function useLabels(range) {
  // Create labels dynamically based on range
  if (range === "7d") {
    // Last 7 days
    const now = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    });
  }
  if (range === "30d") {
    // last 5 weeks (approx)
    return ["W-4", "W-3", "W-2", "W-1", "This W"];
  }
  if (range === "6m") {
    const now = new Date();
    return Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return d.toLocaleString(undefined, { month: "short" });
    });
  }
  // 12m
  const now = new Date();
  return Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return d.toLocaleString(undefined, { month: "short" });
  });
}

function fakeSeries(range) {
  // Generate lightweight demo series — swap with API-fed arrays later
  if (range === "7d") {
    const sales = [1200, 1600, 900, 2200, 1800, 2400, 2600];
    const bookings = [12, 18, 10, 24, 20, 26, 28];
    return { sales, bookings };
  }
  if (range === "30d") {
    const sales = [5800, 6400, 6100, 7200, 6900];
    const bookings = [52, 58, 55, 67, 63];
    return { sales, bookings };
  }
  if (range === "6m") {
    const sales = [12000, 19000, 30000, 25000, 40000, 35000];
    const bookings = [120, 190, 300, 250, 400, 350];
    return { sales, bookings };
  }
  // 12m
  const sales = [9, 11, 12, 13, 16, 14, 18, 20, 19, 23, 22, 25].map((v) => v * 1000);
  const bookings = [90, 110, 120, 130, 160, 140, 180, 200, 190, 230, 220, 250];
  return { sales, bookings };
}

export default function SalesChart({ range = "30d", currency = "USD" }) {
  const labels = useLabels(range);
  const { sales, bookings } = useMemo(() => fakeSeries(range), [range]);

  const chartRef = useRef(null);

  const data = useMemo(() => {
    // gradient fill for sales
    const gradientFactory = (ctx) => {
      const chart = ctx.chart;
      const { ctx: c, chartArea } = chart;
      if (!chartArea) return "rgba(99,102,241,0.12)"; // fallback before first render
      const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      g.addColorStop(0, "rgba(99,102,241,0.25)");
      g.addColorStop(1, "rgba(99,102,241,0)");
      return g;
    };

    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: sales,
          borderColor: "#6366F1",
          backgroundColor: gradientFactory,
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 2,
        },
        {
          label: "Bookings",
          data: bookings,
          borderColor: "#10B981",
          backgroundColor: "transparent",
          fill: false,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 2,
          yAxisID: "y1",
        },
      ],
    };
  }, [labels, sales, bookings]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: {
          position: "top",
          labels: { usePointStyle: true, pointStyle: "line", boxWidth: 10 },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const label = ctx.dataset.label || "";
              const v = ctx.raw ?? 0;
              if (label === "Revenue") {
                try {
                  return `${label}: ${new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency,
                  }).format(v)}`;
                } catch {
                  return `${label}: ${currency} ${Number(v).toFixed(2)}`;
                }
              }
              return `${label}: ${v}`;
            },
          },
        },
        title: {
          display: true,
          text: "Sales Overview",
          font: { weight: "600", size: 14 },
          color: "#111827",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(17,24,39,0.06)" },
          ticks: {
            callback: (v) => {
              try {
                return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
              } catch {
                return `${currency} ${v}`;
              }
            },
            maxTicksLimit: 6,
          },
        },
        y1: {
          beginAtZero: true,
          position: "right",
          grid: { drawOnChartArea: false },
          ticks: { maxTicksLimit: 6 },
        },
        x: {
          grid: { display: false },
        },
      },
    }),
    [currency]
  );

  // simple PNG export
  const exportPNG = () => {
    const chart = chartRef.current;
    if (!chart) return;
    const url = chart.toBase64Image("image/png", 1);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales_chart.png";
    a.click();
  };

  // keep gradient responsive on resize
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const handler = () => chart.update("none");
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div className="relative">
      <div className="absolute right-0 top-0 z-10">
        <button
          onClick={exportPNG}
          className="text-xs rounded-lg border bg-white px-2 py-1 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
        >
          Download PNG
        </button>
      </div>
      <div className="h-72 sm:h-80">
        <Line
          ref={(node) => {
            // react-chartjs-2 forwards to node?.chartInstance in v4; expose canvas helpers with getDatasetMeta
            chartRef.current = node?.canvas
              ? {
                  toBase64Image: (...args) => node?.toBase64Image?.(...args),
                  update: (...args) => node?.update?.(...args),
                }
              : node;
          }}
          data={data}
          options={options}
        />
      </div>
    </div>
  );
}
