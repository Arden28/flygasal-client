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
import { Download } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function SalesChart({ range = "30d", currency = "USD", prefetched }) {
  const chartRef = useRef(null);
  const [labels, setLabels] = useState(prefetched?.labels || []);
  const [sales, setSales] = useState(prefetched?.revenue || []);
  const [bookings, setBookings] = useState(prefetched?.bookings || []);
  const [error, setError] = useState("");

  useEffect(() => {
    if (prefetched?.labels?.length) {
      setLabels(prefetched.labels);
      setSales(prefetched.revenue || []);
      setBookings(prefetched.bookings || []);
      return;
    }

    let cancel = false;
    const fetchChartData = async () => {
      try {
        const res = await apiService.get("/admin/dashboard/summary", { params: { range } });
        const data = res?.data?.data;
        if (!data) throw new Error("Invalid chart payload");
        if (cancel) return;
        setLabels(data.labels || []);
        setSales((data.trends?.revenue || []).map(Number));
        setBookings((data.trends?.bookings || []).map(Number));
      } catch (e) {
        if (!cancel) setError("Failed to load chart data.");
      }
    };
    fetchChartData();
    return () => { cancel = true; };
  }, [range, prefetched?.labels]);

  const data = useMemo(() => {
    const createGradient = (ctx, colorStart, colorEnd) => {
      const chart = ctx.chart;
      const { ctx: c, chartArea } = chart;
      if (!chartArea) return colorStart;
      const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      g.addColorStop(0, colorStart);
      g.addColorStop(1, colorEnd);
      return g;
    };

    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: sales,
          borderColor: "#EB7313", // Brand Orange
          backgroundColor: (ctx) => createGradient(ctx, "rgba(235, 115, 19, 0.2)", "rgba(235, 115, 19, 0)"),
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: "#EB7313",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          borderWidth: 2,
        },
        {
          label: "Bookings",
          data: bookings,
          borderColor: "#94A3B8", // Slate 400
          backgroundColor: "transparent",
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: "#94A3B8",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          borderDash: [5, 5],
          borderWidth: 2,
          yAxisID: "y1",
        },
      ],
    };
  }, [labels, sales, bookings]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: "index" },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: { 
           usePointStyle: true, 
           boxWidth: 8,
           font: { family: "'Inter', sans-serif", size: 11, weight: '600' },
           color: '#64748B' // Slate 500
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)', // Slate 900
        titleFont: { family: "'Inter', sans-serif", size: 13 },
        bodyFont: { family: "'Inter', sans-serif", size: 12 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (ctx) => {
            const label = ctx.dataset.label || "";
            const v = ctx.raw ?? 0;
            if (label === "Revenue") {
              try {
                return `${label}: ${new Intl.NumberFormat(undefined, { style: "currency", currency }).format(v)}`;
              } catch {
                return `${label}: ${currency} ${Number(v).toFixed(2)}`;
              }
            }
            return `${label}: ${v}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: "#F1F5F9" }, // Slate 100
        ticks: {
          font: { family: "'Inter', sans-serif", size: 10 },
          color: '#94A3B8',
          callback: (v) => {
            try {
              return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
            } catch { return v; }
          },
          maxTicksLimit: 6,
        },
      },
      y1: {
        beginAtZero: true,
        position: "right",
        border: { display: false },
        grid: { drawOnChartArea: false },
        ticks: { 
           font: { family: "'Inter', sans-serif", size: 10 },
           color: '#94A3B8',
           maxTicksLimit: 6 
        },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
           font: { family: "'Inter', sans-serif", size: 10 },
           color: '#94A3B8',
           maxTicksLimit: 8,
           maxRotation: 0
        }
      },
    },
  }), [currency]);

  const exportPNG = () => {
    const chart = chartRef.current;
    if (!chart) return;
    const url = chart.toBase64Image("image/png", 1);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales_chart.png";
    a.click();
  };

  return (
    <div className="relative h-full flex flex-col">
      <div className="absolute right-0 -top-10 z-10">
        <button
          onClick={exportPNG}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-[#EB7313] transition-colors bg-white px-2 py-1 rounded-lg border border-slate-100 hover:border-orange-100"
        >
          <Download size={12} /> Export
        </button>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <Line
          ref={(instance) => {
            if (instance) {
               chartRef.current = {
                  toBase64Image: (...args) => instance.toBase64Image?.(...args),
                  update: (...args) => instance.update?.(...args),
               };
            }
          }}
          data={data}
          options={options}
        />
      </div>
      {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}