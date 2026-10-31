# PANDUAN LENGKAP INSTALASI & DEPLOYMENT
## GMCC PURCHASING & PROCUREMENT ERP SYSTEM
**GOLO MORI CONVENTION CENTER**
*Kawasan Pariwisata The Golo Mori by ITDC, Golo Mori, Labuan Bajo, Kabupaten Manggarai Barat, Nusa Tenggara Timur 86763*

---

Aplikasi ini tersedia dalam 2 pilihan arsitektur yang siap pakai:
1. **PILIHAN A: Full-Stack Web App (Node.js + Express + React + SQLite/Relasional)**  
   *Cocok untuk: Server Lokal Kantor GMCC, VPS Cloud (AWS/GCP/DigitalOcean/IdCloudHost), Docker, atau Laptop IT.*
2. **PILIHAN B: Serverless Google Apps Script + Google Sheets Database (100% Gratis Tanpa Server)**  
   *Cocok untuk: Operasional cloud Google Workspace/Drive GMCC tanpa biaya sewa server.*

---

## 🚀 PILIHAN A: INSTALASI FULL-STACK WEB APP (NODE.JS)

### 1. Prasyarat Sistem (System Requirements)
- **Node.js**: Versi `20.x` atau `22.x` (LTS direkomendasikan). Unduh dari: [nodejs.org](https://nodejs.org/)
- **NPM**: Versi 10+ (otomatis terpasang bersama Node.js).
- **RAM**: Minimal 1 GB (Sangat hemat resource).
- **OS**: Windows, macOS, Ubuntu/Debian/Linux.

### 2. Ekstrak File Aplikasi
1. Unduh file `gmcc-purchasing-system.zip`.
2. Ekstrak ke folder yang diinginkan di komputer atau server Anda, contohnya:
   - Windows: `C:\GMCC_ERP\`
   - Linux/Mac: `/var/www/gmcc-erp/` atau `~/gmcc-erp/`

### 3. Instalasi Dependensi
Buka Terminal / Command Prompt / PowerShell di folder proyek tersebut, lalu jalankan:
```bash
npm install
```
*Tunggu hingga seluruh paket selesai dipasang.*

### 4. Menjalankan Aplikasi

#### A. Mode Development (Pengembangan / Uji Coba)
```bash
npm run dev
```
Server akan aktif di: **`http://localhost:3000`**

#### B. Mode Production (Untuk Operasional Kantor / Server VPS)
Build frontend menjadi static assets yang optimal:
```bash
npm run build
npm start
```
Aplikasi akan melayani permintaan pengguna secara cepat dan stabil di port `3000`.

#### C. Menjalankan Otomatis di Background (Production VPS dengan PM2)
Jika menggunakan server Ubuntu/Linux, disarankan menggunakan process manager `pm2`:
```bash
npm install -g pm2
npm run build
pm2 start server.ts --name "gmcc-erp" --interpreter npx --interpreter-args "tsx"
pm2 save
pm2 startup
```

### 5. Akun Pengguna Standar & PIN Keamanan
Saat aplikasi pertama kali dijalankan, sistem otomatis menyiapkan database relasional bersih dengan akun standar:

| Username | Role Akses | Departemen / Jabatan | PIN Otorisasi Default |
| :--- | :--- | :--- | :--- |
| **admin** | ADMIN (Super Administrator) | Executive IT | `123456` |
| **requestor_chef** | REQUESTOR | Food & Beverage (Head Chef) | `123456` |
| **purchasing** | PURCHASING | Purchasing Manager / Officer | `123456` |
| **dept_head_fb** | DEPT_HEAD | Head of Department F&B | `123456` |
| **gm** | GM | General Manager (GMCC) | `123456` |
| **receiving** | RECEIVING | Goods Receiving Staff | `123456` |
| **mice_op** | MICE_OP | Food Flash Operations (MICE) | `123456` |
| **nuka_op** | NUKA_OP | Food Flash Operations (Nuka) | `123456` |

> 🔒 **Keamanan:** Administrator dapat mengganti 6-digit PIN kapan saja melalui menu **System Admin $\rightarrow$ User Management $\rightarrow$ Rubah PIN (Admin)**.

---

## ☁️ PILIHAN B: INSTALASI GOOGLE APPS SCRIPT (DRIVE & SPREADSHEET)

Jika manajemen GMCC menginginkan sistem yang berjalan langsung di atas ekosistem Google Workspace tanpa perlu instalasi server:

### 1. Buka Google Apps Script
1. Buka browser dan kunjungi: **[script.google.com](https://script.google.com/)**
2. Klik tombol **"+ Proyek Baru" (+ New Project)** di pojok kiri atas.
3. Beri nama proyek pada bagian kiri atas, misalnya: `GMCC_Purchasing_System`.

### 2. Pasang Kode Skrip
1. Buka file `gas/Code.gs` yang ada di dalam folder zip aplikasi ini.
2. Salin seluruh isi kodenya (Ctrl+A $\rightarrow$ Ctrl+C).
3. Di editor Google Apps Script, hapus baris `function myFunction() {}` yang ada, lalu tempel (Paste) kode `Code.gs`.
4. Klik tombol **Simpan (Save)** (ikon disket atau Ctrl+S).

### 3. Eksekusi Setup Otomatis Database & Folder
1. Pada menu pilihan fungsi di toolbar atas editor, pilih: **`setupDatabaseAndFolders`**
2. Klik tombol **Run (Jalankan)**.
3. Google akan meminta izin akses drive (*Review permissions* $\rightarrow$ Pilih akun Google Anda $\rightarrow$ Klik *Advanced* $\rightarrow$ Klik *Go to GMCC_Purchasing_System (unsafe)* $\rightarrow$ Klik *Allow*).
4. Skrip akan berjalan secara otomatis dalam ~15 detik dan menghasilkan:
   - Folder induk di Google Drive: **`Purchasing system GMCC`**
   - 4 Subfolder penyimpanan dokumen:
     - `01_Purchase_Requisitions`
     - `02_Purchase_Orders`
     - `03_Goods_Receipts_Vouchers`
     - `04_Invoices_Vendor_Bills`
   - File Google Spreadsheet Database: **`GMCC_Procurement_Database`**
   - 14 Tabel terformat rapi dengan header navy blue:
     1. `tbl_users`
     2. `tbl_departments_costcenters` (Alamat resmi GMCC Labuan Bajo)
     3. `tbl_item_master` (Item katalog dengan alokasi multi-departemen)
     4. `tbl_vendor_master` (Daftar rekanan supplier resmi)
     5. `tbl_approval_flow` (Alur Sekuensial: Requester $\rightarrow$ Purchasing $\rightarrow$ Finance Manager $\rightarrow$ GM $\rightarrow$ Receiving)
     6. `tbl_purchase_requisitions`
     7. `tbl_pr_items`
     8. `tbl_purchase_orders`
     9. `tbl_po_items`
     10. `tbl_goods_receipts`
     11. `tbl_gr_items`
     12. `tbl_food_flash_revenue` (Mendukung in-place update omset & kalkulasi persentase)
     13. `tbl_signatures` (Tanda tangan digital pejabat berwenang)
     14. `tbl_audit_logs` (Rekam jejak keamanan)

### 4. Publikasikan Web App API (Opsional)
1. Klik tombol **Deploy** di kanan atas $\rightarrow$ **New deployment**.
2. Pilih jenis **Web app**.
3. Konfigurasi:
   - **Execute as**: *Me (email Anda)*
   - **Who has access**: *Anyone* (atau *Anyone with Google account*)
4. Klik **Deploy** dan salin URL Web App yang dihasilkan.

---

## 🏢 IDENTITAS RESMI & ALAMAT OPERASIONAL GMCC

Semua dokumen Purchase Order (PO), tanda terima barang (GRN), dan korespondensi vendor secara baku mencantumkan identitas resmi:
- **Entitas**: GOLO MORI CONVENTION CENTER
- **Alamat**: Kawasan Pariwisata The Golo Mori by ITDC, Golo Mori, Labuan Bajo, Kabupaten Manggarai Barat, Nusa Tenggara Timur 86763
- **Wilayah Waktu**: WITA (UTC+8)

---

*Disiapkan untuk Tim Purchasing & Finance Golo Mori Convention Center (GMCC).*
