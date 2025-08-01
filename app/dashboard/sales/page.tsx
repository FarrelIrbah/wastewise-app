"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Plus, Search, Edit, Trash2, Loader2, Filter, Download, ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { showDeleteConfirmation, showSuccessMessage, showErrorMessage, showLoadingMessage, closeLoadingMessage } from "@/lib/sweetalert"

export const dynamic = "force-dynamic"

interface Sale {
  id: number
  sale_id: string
  date: string
  rt: string
  item_type: string
  item_detail: string | null
  weight_kg: number
  price_per_kg: number
  total_price: number
  buyer: string | null
  notes: string | null
}

const itemTypeOptions = [
  { value: "Sampah Anorganik", label: "Sampah Anorganik" },
  { value: "Maggot", label: "Maggot" },
  { value: "Lalat BSF", label: "Lalat BSF" },
]

// ✨ Fungsi kecil untuk menentukan warna badge berdasarkan jenis item
const getItemTypeBadgeColor = (itemType: string) => {
  switch (itemType) {
    case "Maggot":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "Lalat BSF":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    case "Sampah Anorganik":
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  }
}

export default function SalesPage() {
  const [data, setData] = useState<Sale[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterRT, setFilterRT] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Sale | null>(null)
  const [generatedSaleId, setGeneratedSaleId] = useState<string>("")
  const [formData, setFormData] = useState({
    date: "",
    rt: "",
    item_type: "",
    item_detail: "",
    weight_kg: "",
    price_per_kg: "",
    buyer: "",
    notes: "",
  })
  const [sortConfig, setSortConfig] = useState<{ key: keyof Sale; direction: "ascending" | "descending" } | null>({
    key: "date",
    direction: "descending",
  })

  const { toast } = useToast()
  const supabase = createClient()
  const rtOptions = ["RT-01", "RT-02", "RT-03", "RT-04", "RT-05", "RT-06", "RT-07"]

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const { data: salesData, error } = await supabase.from("sales").select("*")
      if (error) throw error
      setData(salesData || [])
    } catch (error) {
      toast({ title: "Error", description: "Gagal memuat data penjualan.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const generateSaleId = async () => {
    try {
      const { data, error } = await supabase.rpc("create_new_sale_id")
      if (error) throw error
      return data
    } catch (error) {
      toast({ title: "Error", description: "Gagal generate Sale ID.", variant: "destructive" })
      return null
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        (item.sale_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.rt.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.buyer && item.buyer.toLowerCase().includes(searchTerm.toLowerCase()))) &&
        (filterType === "all" || item.item_type === filterType) &&
        (filterRT === "all" || item.rt === filterRT),
    )
  }, [searchTerm, filterType, filterRT, data])

  const sortedData = useMemo(() => {
    const sortableItems = [...filteredData]
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key]
        const valB = b[sortConfig.key]
        if (valA === null) return 1
        if (valB === null) return -1
        if (valA < valB) return sortConfig.direction === "ascending" ? -1 : 1
        if (valA > valB) return sortConfig.direction === "ascending" ? 1 : -1
        return 0
      })
    }
    return sortableItems
  }, [filteredData, sortConfig])

  const requestSort = (key: keyof Sale) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const calculateTotalPrice = (weight: string, pricePerKg: string) => {
    const weightNum = Number.parseFloat(weight) || 0
    const priceNum = Number.parseFloat(pricePerKg) || 0
    return weightNum * priceNum
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const totalPrice = calculateTotalPrice(formData.weight_kg, formData.price_per_kg)
      const payload = {
        sale_id: editingItem ? editingItem.sale_id : generatedSaleId,
        date: formData.date,
        rt: formData.rt,
        item_type: formData.item_type,
        item_detail: formData.item_type === "Sampah Anorganik" ? formData.item_detail : null,
        weight_kg: Number.parseFloat(formData.weight_kg),
        price_per_kg: Number.parseFloat(formData.price_per_kg),
        total_price: totalPrice,
        buyer: formData.buyer || null,
        notes: formData.notes || null,
      }

      if (editingItem) {
        const { error } = await supabase.from("sales").update(payload).eq("id", editingItem.id)
        if (error) throw error
        toast({ title: "Berhasil", description: "Data penjualan berhasil diperbarui." })
      } else {
        const { error } = await supabase.from("sales").insert([payload])
        if (error) throw error
        toast({ title: "Berhasil", description: `Data penjualan berhasil ditambahkan.` })
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      toast({ title: "Error", description: "Gagal menyimpan data.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = async (item: Sale | null = null) => {
    if (item) {
      setEditingItem(item)
      setGeneratedSaleId(item.sale_id)
      setFormData({
        date: item.date,
        rt: item.rt,
        item_type: item.item_type,
        item_detail: item.item_detail || "",
        weight_kg: item.weight_kg.toString(),
        price_per_kg: item.price_per_kg.toString(),
        buyer: item.buyer || "",
        notes: item.notes || "",
      })
    } else {
      setEditingItem(null)
      const newSaleId = await generateSaleId()
      if (newSaleId) setGeneratedSaleId(newSaleId)
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        rt: "",
        item_type: "",
        item_detail: "",
        weight_kg: "",
        price_per_kg: "",
        buyer: "",
        notes: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number, itemName: string) => {
    const isConfirmed = await showDeleteConfirmation(`data penjualan ${itemName}`)
    
    if (isConfirmed) {
      showLoadingMessage('Menghapus data...')
      try {
        const { error } = await supabase.from("sales").delete().eq("id", id)
        if (error) throw error
        
        closeLoadingMessage()
        showSuccessMessage('Berhasil!', 'Data penjualan berhasil dihapus.')
        fetchData()
      } catch (error) {
        closeLoadingMessage()
        showErrorMessage('Error!', 'Gagal menghapus data penjualan.')
      }
    }
  }

  const exportToCSV = () => {
    const headers = ["Sale ID", "Tanggal", "RT", "Jenis Item", "Detail Item", "Berat (kg)", "Harga per kg", "Total Harga", "Pembeli", "Catatan"]
    const csvContent = [
      headers.join(","),
      ...sortedData.map((item) =>
        [
          item.sale_id,
          item.date,
          item.rt,
          item.item_type,
          item.item_detail || "",
          item.weight_kg,
          item.price_per_kg,
          item.total_price,
          item.buyer || "",
          `"${(item.notes || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `sales-data-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const uniqueRTs = useMemo(() => Array.from(new Set(data.map((item) => item.rt))).sort(), [data])
  const totalRevenue = useMemo(() => sortedData.reduce((sum, item) => sum + item.total_price, 0), [sortedData])
  const totalWeight = useMemo(() => sortedData.reduce((sum, item) => sum + item.weight_kg, 0), [sortedData])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Rekap Penjualan</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Kelola data penjualan sampah anorganik, maggot, dan lalat BSF</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={exportToCSV} className="glow-effect bg-transparent w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button className="glow-effect w-full sm:w-auto" onClick={() => handleOpenDialog(null)}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Penjualan
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Transaksi</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sortedData.length}</div>
            <p className="text-xs text-muted-foreground">Total berat: {totalWeight.toFixed(1)} kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalRevenue.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground">Dari {sortedData.length} transaksi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Rata-rata per kg</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalWeight > 0 ? Math.round(totalRevenue / totalWeight).toLocaleString("id-ID") : 0}</div>
            <p className="text-xs text-muted-foreground">Harga rata-rata</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Data Penjualan" : "Tambah Data Penjualan"}</DialogTitle>
            <DialogDescription>Masukkan informasi penjualan yang akan dicatat.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2"><Label htmlFor="sale_id">Sale ID</Label><Input id="sale_id" value={generatedSaleId} disabled /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Tanggal</Label>
                <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rt">RT</Label>
                <Select value={formData.rt || undefined} onValueChange={(value) => setFormData({ ...formData, rt: value })}>
                  <SelectTrigger id="rt"><SelectValue placeholder="Pilih RT" /></SelectTrigger>
                  <SelectContent>{rtOptions.map((rt) => (<SelectItem key={rt} value={rt}>{rt}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item_type">Jenis Item</Label>
              <Select value={formData.item_type || undefined} onValueChange={(value) => setFormData({ ...formData, item_type: value })}>
                <SelectTrigger><SelectValue placeholder="Pilih jenis item" /></SelectTrigger>
                <SelectContent>{itemTypeOptions.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {formData.item_type === "Sampah Anorganik" && (
              <div className="space-y-2">
                <Label htmlFor="item_detail">Detail Sampah (cth: botol kaca, thinwall)</Label>
                <Input id="item_detail" placeholder="Masukkan jenis spesifik" value={formData.item_detail} onChange={(e) => setFormData({ ...formData, item_detail: e.target.value })} required />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight_kg">Berat (kg)</Label>
                <Input id="weight_kg" type="number" step="0.1" placeholder="10.5" value={formData.weight_kg} onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_per_kg">Harga per kg (Rp)</Label>
                <Input id="price_per_kg" type="number" step="100" placeholder="2500" value={formData.price_per_kg} onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Total Harga</Label>
              <div className="p-3 bg-muted rounded-md"><span className="text-lg font-semibold">Rp {calculateTotalPrice(formData.weight_kg, formData.price_per_kg).toLocaleString("id-ID")}</span></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyer">Pembeli</Label>
              <Input id="buyer" placeholder="Nama pembeli" value={formData.buyer} onChange={(e) => setFormData({ ...formData, buyer: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea id="notes" placeholder="Catatan tambahan..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingItem ? "Perbarui" : "Simpan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Data Penjualan</CardTitle>
          <CardDescription>Daftar semua transaksi penjualan dengan detail lengkap</CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="flex items-center space-x-2 flex-grow">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari berdasarkan Sale ID, RT..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter jenis" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  {itemTypeOptions.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={filterRT} onValueChange={setFilterRT}>
                <SelectTrigger className="w-full sm:w-[120px]"><SelectValue placeholder="Filter RT" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua RT</SelectItem>
                  {uniqueRTs.map((rt) => (<SelectItem key={rt} value={rt}>{rt}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* ✨ PERUBAHAN: Menambahkan `className` untuk header tabel ✨ */}
                    <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort("sale_id")}>Sale ID<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                    <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort("date")}>Tanggal<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                    <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort("rt")}>RT<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                    <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort("item_type")}>Jenis Item<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                    <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort("weight_kg")}>Berat (kg)<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                    <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort("price_per_kg")}>Harga/kg</Button></TableHead>
                    <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort("total_price")}>Total Harga</Button></TableHead>
                    <TableHead><Button variant="ghost" onClick={() => requestSort("buyer")}>Pembeli</Button></TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((item) => (
                    <TableRow key={item.id}>
                      {/* ✨ PERUBAHAN: Menambahkan `className` untuk isi tabel ✨ */}
                      <TableCell className="text-center font-mono font-semibold">{item.sale_id}</TableCell>
                      <TableCell className="text-center">{format(new Date(item.date), "dd MMM yyyy", { locale: id })}</TableCell>
                      <TableCell className="text-center">{item.rt}</TableCell>
                      <TableCell className="text-center">
                        <span className={`capitalize px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getItemTypeBadgeColor(item.item_type)}`}>
                          {item.item_type}
                          {item.item_detail ? ` (${item.item_detail})` : ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{item.weight_kg.toFixed(1)} kg</TableCell>
                      <TableCell className="text-center">Rp {item.price_per_kg.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-center font-semibold">Rp {item.total_price.toLocaleString("id-ID")}</TableCell>
                      <TableCell>{item.buyer || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center space-x-2">
                          <Button variant="outline" size="icon" onClick={() => handleOpenDialog(item)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(item.id, item.sale_id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}