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
import { Plus, Search, Edit, Trash2, Loader2, ArrowUpDown, Weight, Recycle, Package } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export const dynamic = "force-dynamic"

interface InorganicWaste {
  id: number
  date: string
  rt: string
  household_name: string
  waste_type: string
  weight_kg: number
  recyclable_kg: number | null
  non_recyclable_kg: number | null
  notes: string | null
}

const ITEMS_PER_PAGE = 10;

export default function InorganicWastePage() {
  const [data, setData] = useState<InorganicWaste[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterRT, setFilterRT] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InorganicWaste | null>(null)
  const [formData, setFormData] = useState({
    date: "",
    rt: "",
    household_name: "",
    waste_type: "",
    weight_kg: "",
    recyclable_kg: "",
    non_recyclable_kg: "",
    notes: "",
  })
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InorganicWaste
    direction: "ascending" | "descending"
  } | null>({ key: "date", direction: "descending" })
  
  const [currentPage, setCurrentPage] = useState(1);

  const { toast } = useToast()
  const supabase = createClient()

  const rtOptions = ["RT-01", "RT-02", "RT-03", "RT-04", "RT-05", "RT-06", "RT-07"]

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const { data: wasteData, error } = await supabase.from("waste_inorganic").select("*")
      if (error) throw error
      setData(wasteData || [])
    } catch (error) {
      toast({ title: "Error", description: "Gagal memuat data sampah anorganik.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const totalWeight = parseFloat(formData.weight_kg) || 0
    const recyclableWeight = parseFloat(formData.recyclable_kg) || 0
    let calculatedResidu = ""
    if (formData.weight_kg) {
      const residu = totalWeight > recyclableWeight ? totalWeight - recyclableWeight : 0
      calculatedResidu = residu.toFixed(1)
    }
    if (calculatedResidu !== formData.non_recyclable_kg) {
      setFormData((prev) => ({
        ...prev,
        non_recyclable_kg: calculatedResidu,
      }))
    }
  }, [formData.weight_kg, formData.recyclable_kg, formData.non_recyclable_kg])
  
  const filteredData = useMemo(() => {
    setCurrentPage(1);
    return data.filter(
      (item) =>
        (item.household_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.rt.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterType === "all" || item.waste_type === filterType) &&
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

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, sortedData]);

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);

  const requestSort = (key: keyof InorganicWaste) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.date || !formData.rt || !formData.household_name || !formData.waste_type || !formData.weight_kg) {
      toast({ title: "Error", description: "Kolom bertanda (*) wajib diisi.", variant: "destructive" })
      return
    }
    const totalWeight = parseFloat(formData.weight_kg)
    const recyclableWeight = parseFloat(formData.recyclable_kg) || 0
    if (recyclableWeight > totalWeight) {
      toast({
        title: "Input Tidak Valid",
        description: "Berat sampah yang didaur ulang tidak boleh melebihi berat total.",
        variant: "destructive",
      })
      return
    }
    setIsLoading(true)
    try {
      const payload = {
        date: formData.date,
        rt: formData.rt,
        household_name: formData.household_name,
        waste_type: formData.waste_type.toLowerCase(),
        weight_kg: totalWeight,
        recyclable_kg: recyclableWeight,
        non_recyclable_kg: parseFloat(formData.non_recyclable_kg) || 0,
        notes: formData.notes || null,
      }
      if (editingItem) {
        const { error } = await supabase.from("waste_inorganic").update(payload).eq("id", editingItem.id)
        if (error) throw error
        toast({ title: "Berhasil", description: "Data berhasil diperbarui." })
      } else {
        const { error } = await supabase.from("waste_inorganic").insert([payload])
        if (error) throw error
        toast({ title: "Berhasil", description: "Data berhasil ditambahkan." })
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      toast({ title: "Error", description: "Gagal menyimpan data.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (item: InorganicWaste | null = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        date: item.date,
        rt: item.rt,
        household_name: item.household_name,
        waste_type: item.waste_type,
        weight_kg: item.weight_kg.toString(),
        recyclable_kg: item.recyclable_kg?.toString() || "",
        non_recyclable_kg: item.non_recyclable_kg?.toString() || "",
        notes: item.notes || "",
      })
    } else {
      setEditingItem(null)
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        rt: "",
        household_name: "",
        waste_type: "",
        weight_kg: "",
        recyclable_kg: "",
        non_recyclable_kg: "",
        notes: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return
    try {
      const { error } = await supabase.from("waste_inorganic").delete().eq("id", id)
      if (error) throw error
      toast({ title: "Berhasil", description: "Data berhasil dihapus." })
      fetchData()
    } catch (error) {
      toast({ title: "Error", description: "Gagal menghapus data.", variant: "destructive" })
    }
  }

  const uniqueWasteTypes = useMemo(() => Array.from(new Set(data.map((item) => item.waste_type))).sort(), [data])
  const uniqueRTs = useMemo(() => Array.from(new Set(data.map((item) => item.rt))).sort(), [data])

  const summary = useMemo(() => {
    const totalWeight = data.reduce((sum, item) => sum + item.weight_kg, 0)
    const totalRecyclable = data.reduce((sum, item) => sum + (item.recyclable_kg || 0), 0)
    const recyclingRate = totalWeight > 0 ? (totalRecyclable / totalWeight) * 100 : 0
    return { totalWeight, totalRecyclable, recyclingRate }
  }, [data])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sampah Anorganik</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Kelola data sampah anorganik dengan kategori dan status daur ulang</p>
        </div>
        <Button className="glow-effect w-full sm:w-auto" onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Data
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Terkumpul</CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalWeight.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">Dari semua data tercatat</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dapat Didaur Ulang</CardTitle>
            <Recycle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRecyclable.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">Akumulasi dari semua entri</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Daur Ulang</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.recyclingRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Dari total sampah terkumpul</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Data Sampah Anorganik" : "Tambah Data Sampah Anorganik"}</DialogTitle>
            <DialogDescription>Masukkan informasi sampah anorganik yang akan dicatat.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Tanggal *</Label>
                <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rt">RT *</Label>
                <Select value={formData.rt} onValueChange={(value) => setFormData({ ...formData, rt: value })}>
                  <SelectTrigger id="rt"><SelectValue placeholder="Pilih RT" /></SelectTrigger>
                  <SelectContent>{rtOptions.map((rt) => (<SelectItem key={rt} value={rt}>{rt}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="household_name">Nama Rumah Tangga *</Label>
              <Input id="household_name" placeholder="Keluarga Budi" value={formData.household_name} onChange={(e) => setFormData({ ...formData, household_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waste_type">Jenis Sampah (cth: tutup botol) *</Label>
              <Input id="waste_type" placeholder="Masukkan jenis sampah spesifik" value={formData.waste_type} onChange={(e) => setFormData({ ...formData, waste_type: e.target.value })} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="weight_kg">Berat Total (kg) *</Label>
                <Input id="weight_kg" type="number" step="0.1" placeholder="10.5" value={formData.weight_kg} onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recyclable_kg">Didaur Ulang (kg)</Label>
                <Input id="recyclable_kg" type="number" step="0.1" placeholder="8.0" value={formData.recyclable_kg} onChange={(e) => setFormData({ ...formData, recyclable_kg: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="non_recyclable_kg">Residu (kg)</Label>
                <Input
                  id="non_recyclable_kg"
                  type="number"
                  step="0.1"
                  placeholder="Otomatis"
                  value={formData.non_recyclable_kg}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>
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

      <Card className="w-full overflow-hidden">
        <CardHeader>
          <CardTitle>Data Sampah Anorganik</CardTitle>
          <CardDescription>Daftar semua data sampah anorganik dengan kategori dan status daur ulang</CardDescription>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama atau RT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-auto"><SelectValue placeholder="Filter jenis" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  {uniqueWasteTypes.map((type) => (<SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={filterRT} onValueChange={setFilterRT}>
                <SelectTrigger className="w-full sm:w-auto"><SelectValue placeholder="Filter RT" /></SelectTrigger>
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
            <>
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[1200px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort("date")}>Tanggal <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                      <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort("rt")}>RT <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                      <TableHead><Button variant="ghost" onClick={() => requestSort("household_name")}>Nama Rumah Tangga <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                      <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort("waste_type")}>Jenis <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                      <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort("weight_kg")}>Berat Total <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                      <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort("recyclable_kg")}>Didaur Ulang <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                      <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort("non_recyclable_kg")}>Residu <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center font-medium whitespace-nowrap">{format(new Date(item.date), "dd MMM yyyy", { locale: id })}</TableCell>
                        <TableCell className="text-center">{item.rt}</TableCell>
                        <TableCell>{item.household_name}</TableCell>
                        <TableCell className="text-center"><span className="capitalize bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">{item.waste_type}</span></TableCell>
                        <TableCell className="text-center">{item.weight_kg.toFixed(1)} kg</TableCell>
                        <TableCell className="text-center">{item.recyclable_kg ? `${item.recyclable_kg.toFixed(1)} kg` : "-"}</TableCell>
                        <TableCell className="text-center">{item.non_recyclable_kg ? `${item.non_recyclable_kg.toFixed(1)} kg` : "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center space-x-2">
                            <Button variant="outline" size="icon" onClick={() => handleOpenDialog(item)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {totalPages}
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}