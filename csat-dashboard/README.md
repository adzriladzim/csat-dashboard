# 📊 CSAT Dashboard — Cakrawala University

**Fullstack Analytics · React + Vite + Tailwind · Vercel Serverless · Hugging Face AI & IndexedDB Persistence**

Dashboard analisis kinerja dosen berbasis feedback mahasiswa yang diolah secara instan.  
Data diimpor melalui file XLSX/CSV hasil export Google Forms, diproses di browser, dan dianalisis menggunakan kecerdasan buatan (AI) secara aman dan persisten.

---

## 🏗️ Alur Kerja Sistem (Fullstack & AI)

```
Google Forms (Mahasiswa isi feedback)
        ↓
Google Sheets (Admin export ke .xlsx / .csv)
        ↓
React Dashboard (User upload file ke browser)
        ↓
IndexedDB Store (Data disimpan persisten di browser lokal)
        ↓
Export PDF / Excel (Laporan siap cetak)
        ↓
Hugging Face Inference API (Analisis sentimen asinkronus via Vercel Serverless)
        ↓
Sanity Check System (Deteksi lokal menyempurnakan klasifikasi AI)
        ↓
Interactive Analytics (Dashboard Visualisasi & Word Cloud siap digunakan)
```

> [!NOTE]
> **Privasi & Keamanan:** Data feedback diproses di sisi klien secara aman. Kunci API Hugging Face terlindungi di sisi server (Vercel Serverless Function Proxy) sehingga tidak bocor ke publik.

---

## 🚀 Memulai (Setup Lokal)

1. **Clone & Install**

   ```bash
   # Masuk folder project
   cd csat-dashboard

   # Install dependensi
   npm install
   ```

2. **Pengaturan Environment Variables**
   Buat file `.env.local` di root direktori dan masukkan konfigurasi token Hugging Face Anda:
   ```env
   VITE_HF_API_TOKEN=your_hugging_face_token_here
   ```

3. **Jalankan Aplikasi**

   ```bash
   npm run dev
   ```

   Buka `http://localhost:5173` di browser Anda. ✅

4. **Gunakan Dashboard**
   - Download hasil respon dari Google Forms dalam format `.xlsx` atau `.csv`.
   - Drag & drop file tersebut ke halaman **Upload** di dashboard.
   - Sistem akan memproses data dasar secara instan, lalu antrean sinkronisasi latar belakang (*Background Sync*) akan berjalan otomatis untuk menganalisis sentimen menggunakan Hugging Face AI.

---

## ✨ Fitur Unggulan

| Fitur                     | Keterangan                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------- |
| 📤 **Instant Upload**     | Drag & drop XLSX/CSV dengan auto-mapping kolom pintar.                                  |
| 💾 **IndexedDB Persistence** | Data tersimpan secara aman di browser lokal. Data **tidak akan hilang** walau halaman di-refresh. |
| 🤖 **AI Sentiment Analysis** | Klasifikasi sentimen komentar menggunakan model **Hugging Face Indonesian Roberta**. |
| 🛡️ **Sanity Check System**  | Pemfilteran & koreksi hasil AI otomatis untuk mengatasi salah deteksi kata typo/slang.   |
| 📊 **Dashboard Overview** | Ringkasan CSAT, Tren per semester, dan Skor performa global.                            |
| 🏆 **Ranking Dosen**      | Tabel performa sortable untuk melihat Top 5 & Bottom 5 dosen.                           |
| 👤 **Detail Per Dosen**   | Radar chart kompetensi, tren per pertemuan, dan daftar komentar.                        |
| 📄 **Export Laporan**     | Cetak detail per dosen ke PDF atau rekap ranking ke Excel.                              |
| ☁️ **Word Cloud**         | Visualisasi kata kunci feedback (Unggulan & Evaluasi) bersih dari kata-kata generik.    |
| 🔍 **Anomaly Detection**  | Identifikasi dosen dengan skor luar biasa atau yang perlu perhatian khusus via Z-Score. |
| 🌓 **Dark Mode**          | Tampilan premium dengan dukungan mode gelap dan terang.                                 |

---

## 📁 Struktur Project

```
csat-dashboard/
│
├── api/
│   └── sentiment.js           ← Vercel Serverless Function Proxy (Menghubungkan ke Hugging Face secara aman)
│
├── src/
│   ├── lib/
│   │   └── store.js           ← Zustand store dengan IndexedDB Storage (Penyimpanan data persisten)
│   │
│   ├── utils/
│   │   ├── rowParser.js       ← Logic pemetaan kolom & pembersihan data teknis
│   │   ├── analytics.js       ← Inti perhitungan CSAT, Word Cloud dengan Stemmer, & Anomali
│   │   └── sentimentApi.js    ← Client-side API caller & Post-Processing Sanity Check AI
│   │
│   └── components/
│       ├── layout/Layout.jsx  ← Sidebar & Navigasi Utama
│       ├── charts/            ← Komponen visualisasi Recharts (Radar, Line, Bar)
│       └── pages/             ← Halaman utama: Upload, Dashboard, Ranking, Detail, dll
│
├── package.json
├── tailwind.config.js         ← Konfigurasi tema & warna brand
└── vite.config.js
```

---

## 🔧 Kustomisasi Pemetaan Data

Jika format kolom di Google Forms Anda berubah, Anda dapat menyesuaikannya di file `src/utils/rowParser.js`.

### Menambah Kata Kunci Word Cloud (Stopwords)

Anda bisa mengedit daftar `STOPWORDS` di `src/utils/analytics.js` untuk menyaring kata-kata tidak bermakna yang lolos filter agar Word Cloud tetap bersih dan informatif.

---

## 🆘 Troubleshooting

| Masalah                  | Solusi                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| File tidak terbaca       | Pastikan format file adalah `.xlsx`, `.xls`, atau `.csv`.                                                                       |
| Kolom tidak terdeteksi   | Sesuaikan keyword kolom di `src/utils/rowParser.js`.                                                                            |
| Analisis AI macet / 0%   | Pastikan token `VITE_HF_API_TOKEN` sudah terkonfigurasi dengan benar di file `.env.local` (local) atau Dashboard Vercel (production). |
| Salah klasifikasi kata kunci | Sesuaikan aturan penyaring kata di fungsi `sanityCheckSentiment` dalam file `src/utils/sentimentApi.js`. |

---

# Dibuat oleh **Adzril Adzim Hendrynov** untuk keperluan evaluasi & peningkatan kualitas pengajaran dosen **Cakrawala University** 🎓
