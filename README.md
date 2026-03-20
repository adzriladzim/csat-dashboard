# 📊 CSAT Dashboard — Cakrawala University

**Client-Side Analytics · React + Vite + Tailwind · No-DB Architecture**

Dashboard analisis kinerja dosen berbasis feedback mahasiswa yang bekerja sepenuhnya di sisi client.  
Data diimpor melalui file XLSX/CSV hasil export Google Forms, diproses secara instan di browser, dan divisualisasikan tanpa memerlukan database atau server backend.

---

## 🏗️ Alur Kerja Sistem (Local-Only)

```
Google Forms (Mahasiswa isi feedback)
        ↓
Google Sheets (Admin export ke .xlsx / .csv)
        ↓
React Dashboard (User upload file ke browser)
        ↓
Instant Analytics (Data diolah & ditampilkan secara lokal)
        ↓
Export PDF / Excel (Laporan siap cetak)
```

> [!NOTE]
> **Privasi & Keamanan:** Data feedback tidak pernah meninggalkan browser anda. Semua perhitungan skor dan analisis dilakukan secara lokal di perangkat anda.

---

## 🚀 Memulai (Setup Lokal)

1. **Clone & Install**

   ```bash
   # Masuk folder project
   cd csat-dashboard

   # Install dependensi
   npm install
   ```

2. **Jalankan Aplikasi**

   ```bash
   npm run dev
   ```

   Buka `http://localhost:5173` di browser anda. ✅

3. **Gunakan Dashboard**
   - Download hasil respon dari Google Forms dalam format `.xlsx` atau `.csv`.
   - Drag & drop file tersebut ke halaman **Upload** di dashboard.
   - Semua menu analisis akan terbuka secara otomatis.

---

## ✨ Fitur Unggulan

| Fitur                     | Keterangan                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------- |
| 📤 **Instant Upload**     | Drag & drop XLSX/CSV dengan auto-mapping kolom pintar.                                  |
| 📊 **Dashboard Overview** | Ringkasan CSAT, Tren per semester, dan Skor performa global.                            |
| 🏆 **Ranking Dosen**      | Tabel performa sortable untuk melihat Top 5 & Bottom 5 dosen.                           |
| 👤 **Detail Per Dosen**   | Radar chart kompetensi, tren per pertemuan, dan daftar komentar.                        |
| 📄 **Export Laporan**     | Cetak detail per dosen ke PDF atau rekap ranking ke Excel.                              |
| 💬 **Analisis Sentimen**  | Deteksi otomatis komentar Positif, Negatif, atau Netral.                                |
| ☁️ **Word Cloud**         | Visualisasi kata kunci feedback & topik yang belum dipahami mahasiswa.                  |
| 🔍 **Anomaly Detection**  | Identifikasi dosen dengan skor luar biasa atau yang perlu perhatian khusus via Z-Score. |
| 🌓 **Dark Mode**          | Tampilan premium dengan dukungan mode gelap dan terang.                                 |

---

## 📁 Struktur Project

```
csat-dashboard/
│
├── src/
│   ├── lib/
│   │   └── store.js               ← Zustand global state (penyimpanan data in-memory)
│   │
│   ├── utils/
│   │   ├── rowParser.js           ← Logic pemetaan kolom & pembersihan data teknis
│   │   ├── analytics.js           ← Inti perhitungan CSAT, Sentimen, & Anomali
│   │   └── exportUtils.js         ← Export PDF (jsPDF) & Excel (xlsx)
│   │
│   └── components/
│       ├── layout/Layout.jsx      ← Sidebar & Navigasi Utama
│       ├── charts/                ← Komponen visualisasi Recharts (Radar, Line, Bar)
│       └── pages/                 ← Halaman utama: Upload, Dashboard, Ranking, Detail, dll
│
├── package.json
├── tailwind.config.js             ← Konfigurasi tema & warna brand
└── vite.config.js
```

---

## 🔧 Kustomisasi Pemetaan Data

Jika format kolom di Google Forms anda berubah, anda dapat menyesuaikannya di file `src/utils/rowParser.js`.

### Menambah Kata Kunci Struggling (Word Cloud)

Cari konstanta `STRUGGLE_WORDS` untuk menambah kata kunci yang menandakan mahasiswa belum paham suatu materi:

```javascript
const STRUGGLE_WORDS = [
  "bingung",
  "belum paham",
  "perlu latihan lebih", // tambahkan di sini
];
```

### Memfilter Feedback Sampah (Junk Filter)

Edit konstanta `FB_JUNK` untuk membuang komentar yang tidak informatif (seperti "oke", "siap", dll):

```javascript
const FB_JUNK = new Set(['oke', 'aman', 'tidak ada', // tambahkan di sini])
```

---

## 🆘 Troubleshooting

| Masalah                  | Solusi                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| File tidak terbaca       | Pastikan format file adalah `.xlsx`, `.xls`, atau `.csv`.                                                                       |
| Kolom tidak terdeteksi   | Sesuaikan keyword kolom di `src/utils/rowParser.js`.                                                                            |
| Tampilan berantakan      | Pastikan anda menjalankan `npm install` untuk mengunduh Tailwind CSS.                                                           |
| Data hilang saat refresh | Karena sistem ini No-DB, data hanya disimpan sementara di memory browser. Anda perlu upload ulang file jika browser di-refresh. |

---

# Dibuat oleh **Adzril Adzim Hendrynov** untuk keperluan evaluasi & peningkatan kualitas pengajaran dosen **Cakrawala University** 🎓

# csat-dashboard
