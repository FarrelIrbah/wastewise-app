"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Chart } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

const CHART_COLORS = [
  "rgba(59, 130, 246, 0.9)",   // Blue
  "rgba(34, 197, 94, 0.9)",    // Green
  "rgba(249, 115, 22, 0.9)",    // Orange
  "rgba(168, 85, 247, 0.9)",   // Purple
  "rgba(239, 68, 68, 0.9)",    // Red
  "rgba(236, 72, 153, 0.9)",    // Pink
  "rgba(14, 165, 233, 0.9)",   // Sky Blue
  "rgba(245, 158, 11, 0.9)",   // Amber
  "rgba(132, 204, 22, 0.9)",   // Lime
  "rgba(20, 184, 166, 0.9)",   // Teal
  "rgba(124, 58, 237, 0.9)",   // Violet
  "rgba(217, 70, 239, 0.9)",   // Fuchsia
];

interface AnalyticsChartProps {
  data: any[]
  type: "line" | "bar" | "doughnut"
}

export function AnalyticsChart({ data, type }: AnalyticsChartProps) {
  // ✨ PERBAIKAN: Kembali menggunakan `item_detail`
  const isSalesByDetail = type === "bar" && data[0]?.item_detail
  const isRtComparison = type === "bar" && data[0]?.rt
  const isSalesByType = type === "bar" && !isSalesByDetail && !isRtComparison

  const generateChartData = () => {
    switch (type) {
      case "line":
        return {
          labels: data.map((item) => item.month),
          datasets: [
            { label: "Sampah Organik (kg)", data: data.map((item) => item.organic), borderColor: CHART_COLORS[1], backgroundColor: "rgba(34, 197, 94, 0.1)", tension: 0.4, yAxisID: "y" },
            { label: "Sampah Anorganik (kg)", data: data.map((item) => item.inorganic), borderColor: CHART_COLORS[0], backgroundColor: "rgba(59, 130, 246, 0.1)", tension: 0.4, yAxisID: "y" },
            { label: "Penjualan (kg)", data: data.map((item) => item.sales), borderColor: CHART_COLORS[2], backgroundColor: "rgba(249, 115, 22, 0.1)", tension: 0.4, yAxisID: "y" },
          ],
        }

      case "bar":
        if (isRtComparison) {
          return {
            labels: data.map((item) => item.rt),
            datasets: [
              { label: "Sampah Organik (kg)", data: data.map((item) => item.organic), backgroundColor: CHART_COLORS[1] },
              { label: "Sampah Anorganik (kg)", data: data.map((item) => item.inorganic), backgroundColor: CHART_COLORS[0] },
              { label: "Penjualan (kg)", data: data.map((item) => item.sales), backgroundColor: CHART_COLORS[2] },
            ],
          }
        }

        if (isSalesByDetail) {
          return {
            // ✨ PERBAIKAN: Kembali menggunakan `item_detail`
            labels: data.map((item) => item.item_detail),
            datasets: [
              { label: "Pendapatan (Rp)", data: data.map((item) => item.total_revenue), backgroundColor: CHART_COLORS[0], yAxisID: "y" },
              { label: "Berat (kg)", data: data.map((item) => item.total_weight), backgroundColor: CHART_COLORS[2], yAxisID: "y1" },
            ],
          }
        }

        if (isSalesByType) {
          return {
            labels: data.map((item) => item.type),
            datasets: [{ label: "Pendapatan (Rp)", data: data.map((item) => item.revenue), backgroundColor: CHART_COLORS[1] }],
          }
        }
        break

      case "doughnut":
        return {
          labels: data.map((item) => item.type),
          datasets: [
            {
              label: "Berat (kg)",
              data: data.map((item) => item.weight),
              backgroundColor: CHART_COLORS.slice(0, data.length),
              borderWidth: 2,
              borderColor: "#fff",
            },
          ],
        }

      default:
        return { labels: [], datasets: [] }
    }
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            if (context.chart.config.type === "doughnut" || context.chart.config.type === "pie") {
              const segmentLabel = context.label || ""
              const value = context.raw || 0
              return `${segmentLabel}: ${Number(value).toFixed(1)} kg`
            }
            let lineLabel = context.dataset.label || ""
            if (lineLabel) {
              lineLabel += ": "
            }
            const value = context.parsed.y
            if (value !== null) {
              if (context.dataset.label?.toLowerCase().includes("(kg)")) {
                lineLabel += `${Number(value).toFixed(1)} kg`
              } else {
                lineLabel += new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value)
              }
            }
            return lineLabel
          },
        },
      },
    },
    scales:
      type === "doughnut"
        ? undefined
        : isSalesByDetail
        ? {
            y: { type: "linear" as const, display: true, position: "left" as const, beginAtZero: true, title: { display: true, text: "Pendapatan (Rp)" } },
            y1: { type: "linear" as const, display: true, position: "right" as const, beginAtZero: true, grid: { drawOnChartArea: false }, title: { display: true, text: "Berat (kg)" } },
          }
        : {
            y: { beginAtZero: true, title: { display: true, text: "Jumlah" } },
          },
  }

  return <Chart type={type} data={generateChartData()!} options={options} />
}
