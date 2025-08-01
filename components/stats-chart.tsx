"use client"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Chart } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

interface StatsChartProps {
  data: Array<{
    month: string
    organic: number
    inorganic: number
    sales: number
  }>
}

export function StatsChart({ data }: StatsChartProps) {
  const chartData = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        label: "Sampah Organik (kg)",
        data: data.map((item) => item.organic),
        backgroundColor: "rgba(34, 197, 94, 0.5)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 2,
      },
      {
        label: "Sampah Anorganik (kg)",
        data: data.map((item) => item.inorganic),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
      },
      {
        label: "Penjualan (kg)",
        data: data.map((item) => item.sales),
        backgroundColor: "rgba(249, 115, 22, 0.5)",
        borderColor: "rgba(249, 115, 22, 1)",
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Statistik Bulanan WasteWise",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return <Chart type="bar" data={chartData} options={options} />
}
