"use client"

import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const CHART_COLORS = [
  "hsl(217, 91%, 60%)", // Blue
  "hsl(142, 76%, 36%)", // Green
  "hsl(24, 95%, 53%)", // Orange
  "hsl(262, 83%, 58%)", // Purple
  "hsl(0, 84%, 60%)", // Red
  "hsl(322, 65%, 68%)", // Pink
  "hsl(199, 89%, 48%)", // Sky Blue
  "hsl(43, 96%, 56%)", // Amber
  "hsl(84, 81%, 44%)", // Lime
  "hsl(178, 77%, 40%)", // Teal
  "hsl(258, 90%, 66%)", // Violet
  "hsl(292, 84%, 61%)", // Fuchsia
]

interface AnalyticsChartProps {
  data: any[]
  type: "line" | "bar" | "doughnut"
}

export function AnalyticsChart({ data, type }: AnalyticsChartProps) {
  // Determine chart data structure
  const isSalesByDetail = type === "bar" && data[0]?.item_detail
  const isRtComparison = type === "bar" && data[0]?.rt
  const isSalesByType = type === "bar" && !isSalesByDetail && !isRtComparison

  // Chart configurations
  const lineChartConfig = {
    organic: {
      label: "Sampah Organik (kg)",
      color: CHART_COLORS[1],
    },
    inorganic: {
      label: "Sampah Anorganik (kg)",
      color: CHART_COLORS[0],
    },
    sales: {
      label: "Penjualan (kg)",
      color: CHART_COLORS[2],
    },
  }

  const barChartConfig = {
    organic: {
      label: "Sampah Organik (kg)",
      color: CHART_COLORS[1],
    },
    inorganic: {
      label: "Sampah Anorganik (kg)",
      color: CHART_COLORS[0],
    },
    sales: {
      label: "Penjualan (kg)",
      color: CHART_COLORS[2],
    },
    total_revenue: {
      label: "Pendapatan (Rp)",
      color: CHART_COLORS[0],
    },
    total_weight: {
      label: "Berat (kg)",
      color: CHART_COLORS[2],
    },
    revenue: {
      label: "Pendapatan (Rp)",
      color: CHART_COLORS[1],
    },
  }

  const pieChartConfig = data.reduce((config: any, item: any, index: number) => {
    config[item.type] = {
      label: item.type,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }
    return config
  }, {})

  // Custom tooltip formatters
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatWeight = (value: number) => {
    return `${Number(value).toFixed(1)} kg`
  }

  // Render line chart
  if (type === "line") {
    return (
      <ChartContainer config={lineChartConfig} className="min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(value, name) => [formatWeight(Number(value)), name]} />}
            />
            <Line
              type="monotone"
              dataKey="organic"
              stroke="var(--color-organic)"
              strokeWidth={2}
              dot={{ fill: "var(--color-organic)", strokeWidth: 2, r: 4 }}
              name="Sampah Organik (kg)"
            />
            <Line
              type="monotone"
              dataKey="inorganic"
              stroke="var(--color-inorganic)"
              strokeWidth={2}
              dot={{ fill: "var(--color-inorganic)", strokeWidth: 2, r: 4 }}
              name="Sampah Anorganik (kg)"
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="var(--color-sales)"
              strokeWidth={2}
              dot={{ fill: "var(--color-sales)", strokeWidth: 2, r: 4 }}
              name="Penjualan (kg)"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    )
  }

  // Render bar chart
  if (type === "bar") {
    if (isRtComparison) {
      return (
        <ChartContainer config={barChartConfig} className="min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rt" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value, name) => [formatWeight(Number(value)), name]} />}
              />
              <Bar dataKey="organic" fill="var(--color-organic)" radius={[2, 2, 0, 0]} name="Sampah Organik (kg)" />
              <Bar
                dataKey="inorganic"
                fill="var(--color-inorganic)"
                radius={[2, 2, 0, 0]}
                name="Sampah Anorganik (kg)"
              />
              <Bar dataKey="sales" fill="var(--color-sales)" radius={[2, 2, 0, 0]} name="Penjualan (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )
    }

    if (isSalesByDetail) {
      return (
        <ChartContainer config={barChartConfig} className="min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="item_detail" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis yAxisId="left" orientation="left" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      if (name === "Pendapatan (Rp)") {
                        return [formatCurrency(Number(value)), name]
                      }
                      return [formatWeight(Number(value)), name]
                    }}
                  />
                }
              />
              <Bar
                yAxisId="left"
                dataKey="total_revenue"
                fill="var(--color-total_revenue)"
                radius={[2, 2, 0, 0]}
                name="Pendapatan (Rp)"
              />
              <Bar
                yAxisId="right"
                dataKey="total_weight"
                fill="var(--color-total_weight)"
                radius={[2, 2, 0, 0]}
                name="Berat (kg)"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )
    }

    if (isSalesByType) {
      return (
        <ChartContainer config={barChartConfig} className="min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value, name) => [formatCurrency(Number(value)), name]} />}
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[2, 2, 0, 0]} name="Pendapatan (Rp)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )
    }
  }

  // Render doughnut chart (as pie chart)
  if (type === "doughnut") {
    return (
      <ChartContainer config={pieChartConfig} className="min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="weight"
              nameKey="type"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip
              content={<ChartTooltipContent formatter={(value, name) => [formatWeight(Number(value)), name]} />}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    )
  }

  return null
}
