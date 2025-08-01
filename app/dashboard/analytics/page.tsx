"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Download,
  Calendar,
  Filter,
  Loader2,
} from "lucide-react";
import { AnalyticsChart } from "@/components/analytics-chart";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

// Daftar RT statis
const STATIC_RTS = [
  "RT-01",
  "RT-02",
  "RT-03",
  "RT-04",
  "RT-05",
  "RT-06",
  "RT-07",
];

interface AnalyticsData {
  wasteByType: Array<{ type: string; weight: number; count: number }>;
  salesByType: Array<{
    type: string;
    weight: number;
    revenue: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    organic: number;
    inorganic: number;
    sales: number;
    revenue: number;
  }>;
  rtComparison: Array<{
    rt: string;
    organic: number;
    inorganic: number;
    sales: number;
  }>;
  inorganicSalesDetail: Array<{
    item_detail: string;
    total_revenue: number;
    total_weight: number;
  }>;
  summary: {
    totalOrganicWaste: number;
    totalInorganicWaste: number;
    totalSales: number;
    totalRevenue: number;
    avgPricePerKg: number;
    recyclingRate: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    wasteByType: [],
    salesByType: [],
    monthlyTrend: [],
    rtComparison: [],
    inorganicSalesDetail: [],
    summary: {
      totalOrganicWaste: 0,
      totalInorganicWaste: 0,
      totalSales: 0,
      totalRevenue: 0,
      avgPricePerKg: 0,
      recyclingRate: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(subMonths(new Date(), 5)), "yyyy-MM-dd"),
    to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });
  const [selectedRT, setSelectedRT] = useState<string>("all");
  const { toast } = useToast();
  const supabase = createClient();

  const processAnalyticsData = (
    organicData: any[],
    inorganicData: any[],
    salesData: any[],
    inorganicSalesDetailData: any[],
  ): AnalyticsData => {
    const wasteByType = inorganicData.reduce((acc, item) => {
      const existing = acc.find((w: any) => w.type === item.waste_type);
      if (existing) {
        existing.weight += item.weight_kg;
        existing.count += 1;
      } else {
        acc.push({ type: item.waste_type, weight: item.weight_kg, count: 1 });
      }
      return acc;
    }, []);

    const salesByType = salesData.reduce((acc, item) => {
      const existing = acc.find((s: any) => s.type === item.item_type);
      if (existing) {
        existing.weight += item.weight_kg;
        existing.revenue += Number.parseFloat(item.total_price);
        existing.count += 1;
      } else {
        acc.push({
          type: item.item_type,
          weight: item.weight_kg,
          revenue: Number.parseFloat(item.total_price),
          count: 1,
        });
      }
      return acc;
    }, []);

    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const monthStr = format(month, "MMM yyyy");

      const organicForMonth = organicData
        .filter((item) => format(new Date(item.date), "MMM yyyy") === monthStr)
        .reduce((sum, item) => sum + item.jumlah_timbunan_kg, 0);
      const inorganicForMonth = inorganicData
        .filter((item) => format(new Date(item.date), "MMM yyyy") === monthStr)
        .reduce((sum, item) => sum + item.weight_kg, 0);
      const salesForMonth = salesData
        .filter((item) => format(new Date(item.date), "MMM yyyy") === monthStr)
        .reduce((sum, item) => sum + item.weight_kg, 0);
      const revenueForMonth = salesData
        .filter((item) => format(new Date(item.date), "MMM yyyy") === monthStr)
        .reduce((sum, item) => sum + Number.parseFloat(item.total_price), 0);

      monthlyTrend.push({
        month: monthStr,
        organic: organicForMonth,
        inorganic: inorganicForMonth,
        sales: salesForMonth,
        revenue: revenueForMonth,
      });
    }

    const rtComparison = STATIC_RTS.map((rt) => {
      const organicForRT = organicData
        .filter((item) => item.rt === rt)
        .reduce((sum, item) => sum + item.jumlah_timbunan_kg, 0);
      const inorganicForRT = inorganicData
        .filter((item) => item.rt === rt)
        .reduce((sum, item) => sum + item.weight_kg, 0);
      const salesForRT = salesData
        .filter((item) => item.rt === rt)
        .reduce((sum, item) => sum + item.weight_kg, 0);
      return { rt, organic: organicForRT, inorganic: inorganicForRT, sales: salesForRT };
    });

    const totalOrganicWaste = organicData.reduce(
      (sum, item) => sum + item.jumlah_timbunan_kg,
      0,
    );
    const totalInorganicWaste = inorganicData.reduce(
      (sum, item) => sum + item.weight_kg,
      0,
    );
    const totalSales = salesData.reduce((sum, item) => sum + item.weight_kg, 0);
    const totalRevenue = salesData.reduce(
      (sum, item) => sum + Number.parseFloat(item.total_price),
      0,
    );
    const avgPricePerKg = totalSales > 0 ? totalRevenue / totalSales : 0;
    const totalRecyclable = inorganicData.reduce(
      (sum, item) => sum + (item.recyclable_kg || 0),
      0,
    );
    const recyclingRate = totalInorganicWaste > 0 ? (totalRecyclable / totalInorganicWaste) * 100 : 0;

    return {
      wasteByType,
      salesByType,
      monthlyTrend,
      rtComparison,
      inorganicSalesDetail: inorganicSalesDetailData,
      summary: {
        totalOrganicWaste,
        totalInorganicWaste,
        totalSales,
        totalRevenue,
        avgPricePerKg,
        recyclingRate,
      },
    };
  };

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      let organicQuery = supabase
        .from("waste_organic")
        .select("*")
        .gte("date", dateRange.from)
        .lte("date", dateRange.to);
      if (selectedRT !== "all") {
        organicQuery = organicQuery.eq("rt", selectedRT);
      }
      const { data: organicData, error: organicError } = await organicQuery;

      let inorganicQuery = supabase
        .from("waste_inorganic")
        .select("*")
        .gte("date", dateRange.from)
        .lte("date", dateRange.to);
      if (selectedRT !== "all") {
        inorganicQuery = inorganicQuery.eq("rt", selectedRT);
      }
      const { data: inorganicData, error: inorganicError } = await inorganicQuery;

      let salesQuery = supabase
        .from("sales")
        .select("*")
        .gte("date", dateRange.from)
        .lte("date", dateRange.to);
      if (selectedRT !== "all") {
        salesQuery = salesQuery.eq("rt", selectedRT);
      }
      const { data: salesData, error: salesError } = await salesQuery;

      const { data: inorganicSalesDetailData, error: inorganicSalesDetailError } = await supabase.rpc(
        "get_inorganic_sales_by_detail",
        {
          start_date: dateRange.from,
          end_date: dateRange.to,
          filter_rt: selectedRT === "all" ? null : selectedRT,
        },
      );

      if (organicError || inorganicError || salesError || inorganicSalesDetailError) {
        console.error({ organicError, inorganicError, salesError, inorganicSalesDetailError });
        throw new Error("Failed to fetch analytics data");
      }

      const processedData = processAnalyticsData(
        organicData || [],
        inorganicData || [],
        salesData || [],
        inorganicSalesDetailData || [],
      );
      setData(processedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data analitik",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalytics = () => {
    const csvData = [
      ["Ringkasan Analitik WasteWise"],
      ["Periode:", `${dateRange.from} sampai ${dateRange.to}`],
      ["RT:", selectedRT === "all" ? "Semua RT" : selectedRT],
      [""],
      ["RINGKASAN"],
      ["Total Sampah Organik (kg)", data.summary.totalOrganicWaste.toFixed(2)],
      ["Total Sampah Anorganik (kg)", data.summary.totalInorganicWaste.toFixed(2)],
      ["Total Penjualan (kg)", data.summary.totalSales.toFixed(2)],
      ["Total Pendapatan (Rp)", data.summary.totalRevenue.toFixed(0)],
      ["Rata-rata Harga per kg (Rp)", data.summary.avgPricePerKg.toFixed(0)],
      ["Tingkat Daur Ulang (%)", data.summary.recyclingRate.toFixed(1)],
      [""],
      ["SAMPAH ANORGANIK PER JENIS"],
      ["Jenis", "Berat (kg)", "Jumlah Data"],
      ...data.wasteByType.map((item) => [item.type, item.weight.toFixed(2), item.count]),
      [""],
      ["PENJUALAN PER JENIS"],
      ["Jenis", "Berat (kg)", "Pendapatan (Rp)", "Jumlah Transaksi"],
      ...data.salesByType.map((item) => [
        item.type,
        item.weight.toFixed(2),
        item.revenue.toFixed(0),
        item.count,
      ]),
      [""],
      ["RINCIAN PENJUALAN ANORGANIK"],
      ["Detail Item", "Berat (kg)", "Pendapatan (Rp)"],
      ...data.inorganicSalesDetail.map((item) => [
        item.item_detail,
        Number(item.total_weight).toFixed(2),
        Number(item.total_revenue).toFixed(0),
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `analytics-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Berhasil",
      description: "Data analitik berhasil diekspor",
    });
  };

  useEffect(() => {
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnalysis = () => {
    fetchAnalyticsData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analitik Tingkat Lanjut</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Wawasan mendalam dari data manajemen sampah</p>
        </div>
        <Button onClick={exportAnalytics} className="glow-effect w-full sm:w-auto" disabled={isLoading}>
          <Download className="mr-2 h-4 w-4" />
          Export Analitik
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-date">Dari Tanggal</Label>
              <Input
                id="from-date"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">Sampai Tanggal</Label>
              <Input
                id="to-date"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rt-filter">Filter RT</Label>
              <Select value={selectedRT} onValueChange={setSelectedRT}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih RT" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua RT</SelectItem>
                  {STATIC_RTS.map((rt) => (
                    <SelectItem key={rt} value={rt}>
                      {rt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAnalysis} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="mr-2 h-4 w-4" />
                )}
                Analisis
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="tilt-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sampah Terkumpul</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.summary.totalOrganicWaste + data.summary.totalInorganicWaste).toFixed(1)} kg
            </div>
            <p className="text-xs text-muted-foreground">
              Organik: {data.summary.totalOrganicWaste.toFixed(1)} kg | Anorganik:{" "}
              {data.summary.totalInorganicWaste.toFixed(1)} kg
            </p>
          </CardContent>
        </Card>

        <Card className="tilt-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <PieChart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {data.summary.totalRevenue.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">Dari total penjualan sampah</p>
          </CardContent>
        </Card>

        <Card className="tilt-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Harga</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {data.summary.avgPricePerKg.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Per kilogram produk terjual</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tren Bulanan</CardTitle>
            <CardDescription>Perkembangan sampah dan penjualan per bulan</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsChart data={data.monthlyTrend} type="line" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Perbandingan per RT</CardTitle>
            <CardDescription>Kinerja setiap RT dalam pengelolaan sampah</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsChart data={data.rtComparison} type="bar" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sampah Anorganik per Jenis</CardTitle>
            <CardDescription>Distribusi jenis sampah anorganik</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsChart data={data.wasteByType} type="doughnut" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Penjualan per Jenis</CardTitle>
            <CardDescription>Pendapatan dari setiap jenis produk</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsChart data={data.salesByType} type="bar" />
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Rincian Penjualan Sampah Anorganik</CardTitle>
            <CardDescription>
              Pendapatan berdasarkan item spesifik yang terjual (cth: botol, kardus)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.inorganicSalesDetail.length > 0 ? (
              <AnalyticsChart data={data.inorganicSalesDetail} type="bar" />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Tidak ada data rincian penjualan anorganik untuk ditampilkan pada periode ini.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
