# WasteWise - Aplikasi Manajemen Sampah

Aplikasi web berbasis Next.js untuk manajemen sampah organik dan anorganik dengan fitur analitik tingkat lanjut.

## 🚀 Fitur Utama

- **Dashboard Interaktif**: Statistik real-time dengan visualisasi data
- **Manajemen Sampah Organik**: CRUD lengkap untuk data sampah organik
- **Manajemen Sampah Anorganik**: CRUD lengkap untuk data sampah anorganik
- **Rekap Penjualan**: Sistem penjualan dengan ID otomatis
- **Analitik Tingkat Lanjut**: Grafik dan laporan komprehensif
- **Real-time Notifications**: Notifikasi instan untuk data baru
- **Export Data**: Export ke format CSV
- **Responsive Design**: Optimized untuk semua perangkat

## 🛠️ Teknologi yang Digunakan

- **Frontend**: Next.js 14+ (App Router)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **UI Components**: shadcn/ui + Aceternity UI
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Charts**: Chart.js
- **Validation**: Zod
- **Authentication**: Supabase Auth dengan RLS

## 📋 Prasyarat

- Node.js 18+ 
- npm atau yarn
- Akun Supabase

## 🔧 Instalasi

1. **Clone repository**
   \`\`\`bash
   git clone <repository-url>
   cd wastewise-app
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Setup environment variables**
   
   Buat file `.env.local` di root project:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   \`\`\`

4. **Setup Supabase Database**
   
   Jalankan script SQL di Supabase SQL Editor:
   \`\`\`bash
   # Copy dan paste isi file scripts/database-schema.sql
   # ke Supabase SQL Editor dan jalankan
   \`\`\`

5. **Buat Admin User**
   
   Melalui Supabase Dashboard:
   - Buka Authentication > Users
   - Klik "Add user"
   - Masukkan email: `admin@wastewise.com`
   - Masukkan password yang kuat
   - Konfirmasi email secara manual

6. **Jalankan aplikasi**
   \`\`\`bash
   npm run dev
   \`\`\`

   Aplikasi akan berjalan di `http://localhost:3000`

## 🔐 Login

Gunakan kredensial admin yang telah dibuat:
- Email: `admin@wastewise.com`
- Password: [password yang Anda set]

## 📊 Struktur Database

### Tabel `waste_organic`
- Data sampah organik per RT
- Tracking jumlah KK dan timbunan

### Tabel `waste_inorganic`
- Data sampah anorganik dengan kategori
- Pemisahan recyclable dan non-recyclable

### Tabel `sales`
- Data penjualan dengan ID otomatis
- Support untuk Inorganic Waste, Maggot, dan BSF Fly

## 🎯 Fitur Keamanan

- **Row Level Security (RLS)**: Akses data hanya untuk user terautentikasi
- **Role-based Access**: Hanya admin yang dapat mengakses sistem
- **Input Validation**: Validasi data menggunakan Zod
- **Error Handling**: Penanganan error yang komprehensif

## 📱 Responsive Design

Aplikasi dioptimalkan untuk:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔄 Real-time Features

- Notifikasi instan saat ada data baru
- Update otomatis untuk statistik dashboard
- Sinkronisasi real-time antar pengguna

## 📈 Analytics & Reporting

- Grafik tren bulanan
- Statistik per RT
- Laporan penjualan
- Export data ke CSV
- Kalkulasi otomatis revenue

## 🚀 Deployment

### Vercel (Recommended)

1. Push code ke GitHub repository
2. Connect repository ke Vercel
3. Set environment variables di Vercel dashboard
4. Deploy otomatis

### Manual Deployment

\`\`\`bash
npm run build
npm start
\`\`\`

## 🔧 Development

### Struktur Folder

\`\`\`
wastewise-app/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication
│   └── globals.css       # Global styles
├── components/           # Reusable components
│   ├── ui/              # shadcn/ui components
│   └── ...              # Custom components
├── lib/                 # Utilities
│   └── supabase/        # Supabase clients
├── scripts/             # Database scripts
└── public/              # Static assets
\`\`\`

### Menambah Fitur Baru

1. Buat komponen di folder `components/`
2. Tambah route di folder `app/`
3. Update database schema jika diperlukan
4. Test fitur secara menyeluruh

## 🐛 Troubleshooting

### Error: "Invalid API key"
- Pastikan environment variables sudah benar
- Cek Supabase project settings

### Error: "Row Level Security"
- Pastikan user sudah login
- Cek RLS policies di Supabase

### Error: "Function not found"
- Jalankan ulang database schema
- Pastikan semua functions sudah dibuat

## 📞 Support

Untuk bantuan teknis atau pertanyaan:
- Buka issue di GitHub repository
- Contact: admin@wastewise.com

## 📄 License

MIT License - Lihat file LICENSE untuk detail lengkap.

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

---

**WasteWise** - Solusi digital untuk manajemen sampah yang efektif dan berkelanjutan.
