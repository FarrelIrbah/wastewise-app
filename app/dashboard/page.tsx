"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Trash2, Recycle, DollarSign, TrendingUp, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { StatsChart } from "@/components/stats-chart"
import { AnalyticsChart } from "@/components/analytics-chart"

export const dynamic = "force-dynamic"

interface DashboardStats {
  totalOrganicWaste: number
  totalInorganicWaste: number
  totalSales: number
  totalRevenue: number
  monthlyTrend: Array<{ month: string; organic: number; inorganic: number; sales: number }>
  wasteComposition: Array<{ type: string; weight: number }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrganicWaste: 0,
    totalInorganicWaste: 0,
    totalSales: 0,
    totalRevenue: 0,
    monthlyTrend: [],
    wasteComposition: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const { data: organicData, error: organicError } = await supabase.from("waste_organic").select("jumlah_timbunan_kg")
      const { data: inorganicData, error: inorganicError } = await supabase.from("waste_inorganic").select("weight_kg")
      const { data: salesData, error: salesError } = await supabase.from("sales").select("weight_kg, total_price")
      const { data: monthlyData, error: monthlyError } = await supabase.rpc("get_monthly_stats", { months_back: 6 })

      if (organicError || inorganicError || salesError || monthlyError) {
        console.error({ organicError, inorganicError, salesError, monthlyError })
        throw new Error("Failed to fetch all stats")
      }

      const totalOrganicWaste = organicData?.reduce((sum, item) => sum + item.jumlah_timbunan_kg, 0) || 0
      const totalInorganicWaste = inorganicData?.reduce((sum, item) => sum + item.weight_kg, 0) || 0
      const totalSales = salesData?.reduce((sum, item) => sum + item.weight_kg, 0) || 0
      const totalRevenue = salesData?.reduce((sum, item) => sum + Number.parseFloat(item.total_price), 0) || 0

      const monthlyTrend =
        monthlyData?.map((d) => ({
          month: d.month_year,
          organic: d.organic_weight,
          inorganic: d.inorganic_weight,
          sales: d.sales_weight,
        })) || []
      
      const wasteComposition = [
        { type: "Organik", weight: totalOrganicWaste },
        { type: "Anorganik", weight: totalInorganicWaste },
      ]

      setStats({
        totalOrganicWaste,
        totalInorganicWaste,
        totalSales,
        totalRevenue,
        monthlyTrend,
        wasteComposition,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data statistik",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    const supabase = createClient()
    const channel = supabase
      .channel("realtime-dashboard-updates")
      .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
        toast({
          title: "Pembaruan Data",
          description: `Ada perubahan baru di tabel ${payload.table}. Refresh untuk melihat.`,
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Ringkasan data manajemen sampah WasteWise</p>
        </div>
        <Button onClick={fetchStats} disabled={isLoading} className="glow-effect w-full sm:w-auto">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sampah Organik</CardTitle>
            <Trash2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganicWaste.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">Sampah organik terkumpul</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sampah Anorganik</CardTitle>
            <Recycle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInorganicWaste.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">Sampah anorganik terkumpul</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">Produk terjual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.totalRevenue.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground">Pendapatan kotor</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Tren Bulanan</CardTitle>
            <CardDescription className="text-sm">Grafik perkembangan sampah dan penjualan per bulan</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] sm:h-[350px] w-full">
            {isLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <StatsChart data={stats.monthlyTrend} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Komposisi Sampah</CardTitle>
            <CardDescription className="text-sm">Perbandingan total sampah organik dan anorganik</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] sm:h-[350px] w-full">
             {isLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <AnalyticsChart data={stats.wasteComposition} type="doughnut" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}