# GMCC Purchasing, Procurement & Daily Food Flash ERP System
**Golo Mori Convention Center (GMCC) - ITDC Kawasan Pariwisata Labuan Bajo**

Sistem ERP Procurement & Daily Food Flash terpadu untuk Golo Mori Convention Center, dibangun menggunakan **React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Motion**.

---

## 🏢 Identitas Resmi GMCC
```
GOLO MORI CONVENTION CENTER
Kawasan Pariwisata The Golo Mori by ITDC
Golo Mori, Labuan Bajo, Kabupaten Manggarai Barat
Nusa Tenggara Timur 86763, Indonesia
Zona Waktu: WITA (UTC+8)
```

---

## 🌟 Modul Utama Sistem (Core ERP Modules)

1. **Executive Dashboard**:
   - Monitoring antrean PR yang menunggu persetujuan, total PO resmi yang telah diterbitkan, penerimaan barang gudang (GRN), dan rasio kontrol biaya makanan (*Daily Food Cost %* vs Target 32%).
   - Log rekam jejak keamanan (*Audit Logs*).

2. **Purchase Requisitions (PR)**:
   - Formulir pembuatan PR lengkap dengan kode Cost Center GMCC, tingkat urgensi (*NORMAL*, *URGENT*, *EVENT_CRITICAL*), usulan rekanan vendor, dan tabel barang pesanan.

3. **Approval Center (Matriks Persetujuan Sekuensial 5 Tahap)**:
   - Alur persetujuan bertingkat dengan otorisasi **PIN Keamanan 6-Digit**:
     $$\text{Requester} \longrightarrow \text{Purchasing Review} \longrightarrow \text{Head of Dept / Finance} \longrightarrow \text{General Manager (GM)} \longrightarrow \text{PO Otomatis}$$

4. **Purchase Orders (PO)**:
   - Penerbitan Surat Pesanan resmi GMCC berformat formal dilengkapi perhitungan PPN 11% dan **4 Kolom Tanda Tangan Digital Pejabat Berwenang** (Purchasing, Finance Manager, General Manager, Rekanan Supplier).
   - Tombol cetak langsung dan simpan PDF.

5. **Goods Receiving / Penerimaan Barang (GRN)**:
   - Verifikasi fisik barang datang di pos gudang GMCC terhadap PO aktif.
   - Pengecekan kondisi fisik barang (*Baik & Sesuai*, *Sebagian Rusak*, *Kadaluarsa*) dan nomor surat jalan vendor (*Delivery Order*).
   - Cetak bukti tanda terima barang (*Goods Receipt Note*).

6. **Daily Food Flash (F&B Cost Control Nuka & MICE)**:
   - 5 KPI Daily Food Flash: Omset Banquet MICE, Omset Restoran Nuka, Total Revenue, Biaya Pemakaian Makanan, dan Rasio *Food Cost %* vs target standar bintang lima (32.0%).
   - Fitur *in-place edit* untuk memperbarui omset harian langsung pada tabel.
   - Ekspor laporan Food Flash harian ke CSV.

7. **Master Data & Rekanan**:
   - **Item Master Multi-Dept**: Katalog barang operasional (F&B, Linen, Chemical, Engineering, IT).
   - **Vendor Master**: Basis data supplier resmi di Labuan Bajo dan nasional.
   - **Cost Center & Departemen**: Pemetaan alokasi anggaran GMCC.

8. **Hubungkan ke GitHub Baru (GitHub Integration Hub)**:
   - Pembuatan repositori baru otomatis via GitHub REST API (menggunakan Personal Access Token).
   - Generator perintah terminal 1-Click siap salin untuk menyatukan seluruh kode ke GitHub Anda.

---

## 👥 Akun Standar & PIN Otorisasi (Default PIN: 123456)

| Username | Role Akses | Departemen / Jabatan | PIN Otorisasi |
| :--- | :--- | :--- | :--- |
| **admin** | ADMIN (Super Administrator) | Executive IT | `123456` |
| **requestor_chef** | REQUESTOR | Food & Beverage (Head Chef) | `123456` |
| **purchasing** | PURCHASING | Purchasing Manager / Officer | `123456` |
| **dept_head_fb** | DEPT_HEAD | Head of Department F&B / Finance | `123456` |
| **gm** | GM | General Manager GMCC | `123456` |
| **receiving** | RECEIVING | Goods Receiving Staff | `123456` |
| **mice_op** | MICE_OP | Food Flash Operations (MICE) | `123456` |
| **nuka_op** | NUKA_OP | Food Flash Operations (Nuka) | `123456` |

---

## 🚀 Panduan Menggabungkan ke Repositori GitHub Baru

Buka terminal pada folder proyek ini, lalu jalankan perintah berikut:

```bash
# 1. Inisialisasi Git Lokal
git init

# 2. Atur identitas Anda
git config user.name "Nama Anda"
git config user.email "email@anda.com"

# 3. Tambahkan seluruh berkas ke staging
git add .

# 4. Buat Commit Perdana
git commit -m "feat: inisialisasi GMCC Purchasing, Procurement & Daily Food Flash ERP"

# 5. Atur branch utama ke main
git branch -M main

# 6. Hubungkan ke Remote URL GitHub Baru Anda
git remote add origin https://github.com/USERNAME_ANDA/NAMA_REPO_ANDA.git

# 7. Unggah seluruh kode ke GitHub
git push -u origin main
```
