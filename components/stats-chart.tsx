"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface StatsChartProps {
  data: Array<{
    month: string
    organic: number
    inorganic: number
    sales: number
  }>
}

export function StatsChart({ data }: StatsChartProps) {
  const chartConfig = {
    organic: {
      label: "Sampah Organik (kg)",
      color: "hsl(var(--chart-2))", // Green
    },
    inorganic: {
      label: "Sampah Anorganik (kg)",
      color: "hsl(var(--chart-1))", // Blue
    },
    sales: {
      label: "Penjualan (kg)",
      color: "hsl(var(--chart-3))", // Orange
    },
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
            tickFormatter={(value) => `${value} kg`}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="organic" fill="var(--color-organic)" radius={4} />
          <Bar dataKey="inorganic" fill="var(--color-inorganic)" radius={4} />
          <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}