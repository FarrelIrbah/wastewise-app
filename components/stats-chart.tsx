"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

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
      color: "hsl(142, 76%, 36%)", // Green
    },
    inorganic: {
      label: "Sampah Anorganik (kg)",
      color: "hsl(217, 91%, 60%)", // Blue
    },
    sales: {
      label: "Penjualan (kg)",
      color: "hsl(24, 95%, 53%)", // Orange
    },
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-center">Statistik Bulanan WasteWise</h3>
      </div>
      <ChartContainer config={chartConfig} className="min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(0, 0, 0, 0.1)" }} />
            <Bar dataKey="organic" fill="var(--color-organic)" radius={[2, 2, 0, 0]} name="Sampah Organik (kg)" />
            <Bar dataKey="inorganic" fill="var(--color-inorganic)" radius={[2, 2, 0, 0]} name="Sampah Anorganik (kg)" />
            <Bar dataKey="sales" fill="var(--color-sales)" radius={[2, 2, 0, 0]} name="Penjualan (kg)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
