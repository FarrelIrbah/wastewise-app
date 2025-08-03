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
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Plus, Search, Edit, Trash2, Loader2, ArrowUpDown, Weight, Users, Trash } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export const dynamic = "force-dynamic"

interface OrganicWaste {
  id: number
  date: string
  rt: string
  nama: string
  jumlah_kk: number
  jumlah_timbunan_kg: number
}

const ITEMS_PER_PAGE = 10;

export default function OrganicWastePage() {
  const [data, setData] = useState<OrganicWaste[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<OrganicWaste | null>(null)
  const [formData, setFormData] = useState({
    date: "",
    rt: "",
    nama: "",
    jumlah_kk: "",
    jumlah_timbunan_kg: "",
  })
  const [sortConfig, setSortConfig] = useState<{
    key: keyof OrganicWaste
    direction: "ascending" | "descending"
  } | null>({ key: "date", direction: "descending" })
  
  const [currentPage, setCurrentPage] = useState(1);

  const { toast } = useToast()
  const supabase = createClient()

  const rtOptions = ["RT-01", "RT-02", "RT-03", "RT-04", "RT-05", "RT-06", "RT-07"]

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const { data: wasteData, error } = await supabase
        .from("waste_organic")
        .select("id, date, rt, nama, jumlah_kk, jumlah_timbunan_kg")
        .order("date", { ascending: false }) // Ambil data terbaru dulu

      if (error) throw error
      setData(wasteData || [])
    } catch (error) {
      toast({ title: "Error", description: "Gagal memuat data sampah organik.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = useMemo(() => {
    setCurrentPage(1);
    return data.filter(
      (item) =>
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.rt.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [searchTerm, data])

  const sortedData = useMemo(() => {
    const sortableItems = [...filteredData]
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
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

  const requestSort = (key: keyof OrganicWaste) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.date || !formData.rt || !formData.nama || !formData.jumlah_kk || !formData.jumlah_timbunan_kg) {
      toast({ title: "Error", description: "Semua kolom harus diisi.", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        date: formData.date,
        rt: formData.rt,
        nama: formData.nama,
        jumlah_kk: Number.parseInt(formData.jumlah_kk),
        jumlah_timbunan_kg: Number.parseFloat(formData.jumlah_timbunan_kg),
      }

      if (editingItem) {
        const { error } = await supabase.from("waste_organic").update(payload).eq("id", editingItem.id)
        if (error) throw error
        toast({ title: "Berhasil", description: "Data berhasil diperbarui." })
      } else {
        const { error } = await supabase.from("waste_organic").insert([payload])
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

  const handleOpenDialog = (item: OrganicWaste | null = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        date: item.date,
        rt: item.rt,
        nama: item.nama,
        jumlah_kk: item.jumlah_kk.toString(),
        jumlah_timbunan_kg: item.jumlah_timbunan_kg.toString(),
      })
    } else {
      setEditingItem(null)
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        rt: "",
        nama: "",
        jumlah_kk: "",
        jumlah_timbunan_kg: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return
    try {
      const { error } = await supabase.from("waste_organic").delete().eq("id", id)
      if (error) throw error
      toast({ title: "Berhasil", description: "Data berhasil dihapus." })
      fetchData()
    } catch (error) {
      toast({ title: "Error", description: "Gagal menghapus data.", variant: "destructive" })
    }
  }

  const summary = useMemo(() => {
    const totalTimbunan = data.reduce((sum, item) => sum + item.jumlah_timbunan_kg, 0)
    const totalKK = data.reduce((sum, item) => sum + item.jumlah_kk, 0)
    const totalEntries = data.length
    return { totalTimbunan, totalKK, totalEntries }
  }, [data])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Sampah Organik</h1>
          <p className="text-muted-foreground">Daftar semua data sampah organik yang telah dicatat</p>
        </div>
        <Button className="glow-effect" onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Timbunan</CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTimbunan.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">Dari {summary.totalEntries} catatan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total KK Terlibat</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalKK} KK</div>
            <p className="text-xs text-muted-foreground">Akumulasi dari semua entri</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Catatan</CardTitle>
            <Trash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalEntries}</div>
            <p className="text-xs text-muted-foreground">Total data yang dimasukkan</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Data Sampah Organik" : "Tambah Data Sampah Organik"}</DialogTitle>
            <DialogDescription>Masukkan informasi sampah organik yang akan dicatat.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
              <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rt">RT</Label>
              <Select value={formData.rt} onValueChange={(value) => setFormData({ ...formData, rt: value })}>
                <SelectTrigger id="rt"><SelectValue placeholder="Pilih RT" /></SelectTrigger>
                <SelectContent>
                  {rtOptions.map((rt) => (<SelectItem key={rt} value={rt}>{rt}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Penanggung Jawab</Label>
              <Input id="nama" placeholder="Nama Lengkap" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jumlah_kk">Jumlah KK</Label>
              <Input id="jumlah_kk" type="number" placeholder="50" value={formData.jumlah_kk} onChange={(e) => setFormData({ ...formData, jumlah_kk: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jumlah_timbunan_kg">Jumlah Timbunan (kg)</Label>
              <Input id="jumlah_timbunan_kg" type="number" step="0.1" placeholder="25.5" value={formData.jumlah_timbunan_kg} onChange={(e) => setFormData({ ...formData, jumlah_timbunan_kg: e.target.value })} required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingItem ? "Perbarui" : "Simpan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Data Sampah Organik</CardTitle>
              <CardDescription>Daftar semua data sampah organik yang telah dicatat</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama atau RT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 max-w-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px] text-center"><Button variant="ghost" onClick={() => requestSort("date")}>Tanggal <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                      <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort("rt")}>RT <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                      <TableHead><Button variant="ghost" onClick={() => requestSort("nama")}>Nama <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                      <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort("jumlah_kk")}>Jumlah KK <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                      <TableHead className="text-center"><Button variant="ghost" onClick={() => requestSort("jumlah_timbunan_kg")}>Timbunan (kg) <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center font-medium">{format(new Date(item.date), "dd MMM yyyy", { locale: id })}</TableCell>
                        <TableCell className="text-center">{item.rt}</TableCell>
                        <TableCell>{item.nama}</TableCell>
                        <TableCell className="text-center">{item.jumlah_kk}</TableCell>
                        <TableCell className="text-center">{item.jumlah_timbunan_kg.toFixed(1)} kg</TableCell>
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
                    disabled={currentPage === 1 || totalPages === 0}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
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