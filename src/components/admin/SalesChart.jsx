import { useEffect, useMemo, useRef, useState } from "react";
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
import apiService from "../../api/apiService";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function SalesChart({ range = "30d", currency = "USD", prefetched }) {
  const chartRef = useRef(null);

  // If parent passed prefetched summary trends, use them; otherwise fetch once here.
  const [labels, setLabels] = useState(prefetched?.labels || []);
  const [sales, setSales] = useState(prefetched?.revenue || []);
  const [bookings, setBookings] = useState(prefetched?.bookings || []);
  const [error, setError] = useState("");

  useEffect(() => {
    if (prefetched && prefetched.labels?.length) {
      setLabels(prefetched.labels);
      setSales(prefetched.revenue || []);
      setBookings(prefetched.bookings || []);
      setError("");
      return;
    }

    let cancel = false;
    (async () => {
      setError("");
      try {
        // Pull everything from /dashboard/summary to get aligned labels + both series
        const res = await apiService.get("/dashboard/summary", { params: { range } });
        const data = res?.data?.data;
        if (!data) throw new Error("Invalid chart payload");
        if (cancel) return;
        setLabels(data.labels || []);
        setSales((data.trends?.revenue || []).map(Number));
        setBookings((data.trends?.bookings || []).map(Number));
      } catch (e) {
        console.error(e);
        if (!cancel) setError("Failed to load chart.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [range, prefetched?.labels]);

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
      maintainAspectRatio: false, // key for responsiveness w/ fixed height wrapper
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
                return new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency,
                  maximumFractionDigits: 0,
                }).format(v);
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

      {/* Responsive height wrapper prevents overflow on small screens */}
      <div className="h-72 sm:h-80">
        {/* react-chartjs-2 v5 forwards the Chart instance to ref */}
        <Line
          ref={(instance) => {
            // expose only the methods we use
            if (!instance) {
              chartRef.current = null;
              return;
            }
            chartRef.current = {
              toBase64Image: (...args) => instance.toBase64Image?.(...args),
              update: (...args) => instance.update?.(...args),
            };
          }}
          data={data}
          options={options}
        />
      </div>

      {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
