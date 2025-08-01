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
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const CHART_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(217, 91%, 60%)",
  "hsl(142, 76%, 36%)", "hsl(24, 95%, 53%)", "hsl(262, 83%, 58%)",
  "hsl(0, 84%, 60%)", "hsl(322, 65%, 68%)", "hsl(199, 89%, 48%)",
];

// Komponen tooltip kustom untuk Pie/Doughnut chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0];
    const name = dataPoint.name;
    const value = dataPoint.value;

    return (
      <div className="rounded-lg border bg-background p-2.5 shadow-sm">
        <p className="capitalize text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{`${Number(value).toFixed(1)} kg`}</p>
      </div>
    );
  }
  return null;
};

interface AnalyticsChartProps {
  data: any[]
  type: "line" | "bar" | "doughnut"
}

export function AnalyticsChart({ data, type }: AnalyticsChartProps) {
  const isSalesByDetail = type === "bar" && data[0]?.item_detail
  const isRtComparison = type === "bar" && data[0]?.rt
  const isSalesByType = type === "bar" && !isSalesByDetail && !isRtComparison

  const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value)
  const formatWeight = (value: number) => `${Number(value).toFixed(1)} kg`

  if (type === "line") {
    const chartConfig = {
      organic: { label: "Sampah Organik (kg)", color: CHART_COLORS[1] },
      inorganic: { label: "Sampah Anorganik (kg)", color: CHART_COLORS[0] },
      sales: { label: "Penjualan (kg)", color: CHART_COLORS[2] },
    }
    return (
      <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(value) => `${value} kg`} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line dataKey="organic" type="monotone" stroke="var(--color-organic)" strokeWidth={2} dot={false} />
            <Line dataKey="inorganic" type="monotone" stroke="var(--color-inorganic)" strokeWidth={2} dot={false} />
            <Line dataKey="sales" type="monotone" stroke="var(--color-sales)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    )
  }

  if (type === "bar") {
    if (isRtComparison) {
      const chartConfig = {
        organic: { label: "Sampah Organik (kg)", color: CHART_COLORS[1] },
        inorganic: { label: "Sampah Anorganik (kg)", color: CHART_COLORS[0] },
        sales: { label: "Penjualan (kg)", color: CHART_COLORS[2] },
      }
      return (
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="rt" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(value) => `${value} kg`} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="organic" fill="var(--color-organic)" radius={4} />
              <Bar dataKey="inorganic" fill="var(--color-inorganic)" radius={4} />
              <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )
    }

    if (isSalesByDetail) {
      const chartConfig = {
        total_revenue: { label: "Pendapatan (Rp)", color: CHART_COLORS[0] },
        total_weight: { label: "Berat (kg)", color: CHART_COLORS[2] },
      }
      return (
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="item_detail" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(value) => `${value} kg`} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar yAxisId="left" dataKey="total_revenue" fill="var(--color-total_revenue)" radius={4} />
              <Bar yAxisId="right" dataKey="total_weight" fill="var(--color-total_weight)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )
    }

    if (isSalesByType) {
      const chartConfig = { revenue: { label: "Pendapatan (Rp)", color: CHART_COLORS[1] } }
      return (
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="type" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )
    }
  }

  if (type === "doughnut") {
    const chartConfig = data.reduce((config: any, item: any, index: number) => {
      config[item.type] = { label: item.type, color: CHART_COLORS[index % CHART_COLORS.length] };
      return config;
    }, {});
    return (
      <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
        <ResponsiveContainer>
          <PieChart>
            <RechartsTooltip content={<CustomPieTooltip />} />
            <Pie data={data} dataKey="weight" nameKey="type" innerRadius="60%" outerRadius="80%" paddingAngle={2}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="type" />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    )
  }

  return null
}