import React, { useState, useMemo, useEffect } from 'react';
import { UserAccount, MAX_PR_LIMIT, hasRestrictedModuleAccess, hasItAdminAccess } from '../types/procurement';
import { GMCC_LOGO_DARK } from '../data/gmccLogo';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Circle,
  ChevronRight,
  ArrowRight,
  Printer,
  ShieldCheck,
  Users,
  PlusCircle,
  Truck,
  TrendingUp,
  Receipt,
  FileCheck2,
  Scale,
  Database,
  AlertTriangle,
  HelpCircle,
  Lock,
  ExternalLink,
  RotateCcw,
  CheckSquare
} from 'lucide-react';

interface TrainingManualViewProps {
  currentUser: UserAccount;
  onNavigate: (tab: string) => void;
}

type RoleFilter =
  | 'ALL'
  | 'REQUESTOR'
  | 'PURCHASING'
  | 'FINANCE'
  | 'GM'
  | 'ADMIN';

interface SopStep {
  title: string;
  detail: string;
  tip?: string;
}

interface TrainingModule {
  id: string;
  order: string;
  title: string;
  subtitle: string;
  targetTab?: string;
  targetTabLabel?: string;
  restrictedToFinancePurchasing?: boolean;
  itAdminOnly?: boolean;
  roles: Exclude<RoleFilter, 'ALL'>[];
  roleSummary: string;
  estimatedMinutes: number;
  objective: string;
  prerequisites: string[];
  steps: SopStep[];
  rulesAndControls: string[];
  commonMistakes: { issue: string; solution: string }[];
}

const ROLE_FILTERS: { id: RoleFilter; label: string }[] = [
  { id: 'ALL', label: 'Semua Peran' },
  { id: 'REQUESTOR', label: 'Requestor / Dept' },
  { id: 'PURCHASING', label: 'Purchasing & Gudang' },
  { id: 'FINANCE', label: 'Finance & Accounting' },
  { id: 'GM', label: 'Dept Head & GM' },
  { id: 'ADMIN', label: 'IT & Administrator' }
];

const WORKFLOW_STAGES = [
  {
    step: '01',
    title: 'Login & Sesi Aman',
    summary: 'Masuk akun resmi · Idle lock 30 menit',
    moduleId: 'auth-security'
  },
  {
    step: '02',
    title: 'Buat PR Baru',
    summary: 'Filter COA otomatis · Plafon Rp 40 Jt',
    moduleId: 'pr-create'
  },
  {
    step: '03',
    title: 'Approval Berjenjang',
    summary: 'Purchasing -> Finance -> GM -> Terbit PO',
    moduleId: 'approval-po'
  },
  {
    step: '04',
    title: 'Receiving (GRN)',
    summary: 'Verifikasi fisik · Foto nota · Tunai/Tempo',
    moduleId: 'receiving-grn'
  },
  {
    step: '05',
    title: 'Food Flash & Insight',
    summary: 'BPP/Event ke Food Flash · Cost Center',
    moduleId: 'food-flash-insight'
  },
  {
    step: '06',
    title: 'Petty Cash & Bukti TF',
    summary: 'No. Inv ITDC · Upload Bukti TF · Arsip',
    moduleId: 'billing-files'
  }
];

const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'auth-security',
    order: '01',
    title: 'Akses Sistem, Keamanan Login & Manajemen Akun',
    subtitle: 'Standar autentikasi, logout 1-klik, batas waktu idle, dan penggantian kata sandi',
    roles: ['REQUESTOR', 'PURCHASING', 'FINANCE', 'GM', 'ADMIN'],
    roleSummary: 'Seluruh Pengguna GMCC',
    estimatedMinutes: 5,
    objective: 'Memastikan setiap staf masuk memakai akun masing-masing untuk menjaga validitas jejak audit (Audit Trail) dan tanda tangan digital.',
    prerequisites: [
      'Memiliki Username atau Email resmi GMCC serta Password aktif dari IT/Admin.',
      'Menggunakan browser reguler (bukan mode incognito) agar data lokal sesi tersimpan stabil.'
    ],
    steps: [
      {
        title: 'Masuk ke Portal ERP',
        detail: 'Buka halaman login GMCC Procurement ERP, masukkan Username atau Email resmi beserta Password akun Anda, lalu klik tombol Masuk ke Sistem.',
        tip: 'Gunakan ikon mata (Perlihatkan) di kolom password jika ingin memeriksa ketepatan ketikan sebelum masuk.'
      },
      {
        title: 'Mengganti Password Akun Sendiri',
        detail: 'Setelah berhasil login, klik Ganti Password di bagian bawah sidebar kiri atau melalui dropdown profil di pojok kanan atas.',
        tip: 'Minimal gunakan kombinasi huruf dan angka yang mudah diingat namun tidak dibagikan ke staf lain.'
      },
      {
        title: 'Keluar Sistem (Log Out 1-Klik)',
        detail: 'Saat selesai bertugas atau ingin berpindah operator di komputer bersama, klik tombol Keluar di kanan atas Navbar atau Keluar dari Sistem di bawah Sidebar.',
        tip: 'Logout langsung bekerja 1-klik tanpa dialog konfirmasi popup browser agar stabil di seluruh perangkat.'
      },
      {
        title: 'Proteksi Idle Otomatis 30 Menit',
        detail: 'Jika tidak ada aktivitas mouse, ketikan, atau sentuhan selama 30 menit, sistem otomatis mengunci sesi dan mengembalikan layar ke halaman login.'
      }
    ],
    rulesAndControls: [
      'Fitur pindah akun langsung di kanan atas HANYA tersedia untuk role ADMIN; staf operasional wajib Log Out lalu login ulang.',
      'Panel integrasi GitHub di sisi kanan layar dibatasi khusus untuk Administrator & staf IT.'
    ],
    commonMistakes: [
      {
        issue: 'Tombol pindah akun tidak muncul di pojok kanan atas saat login sebagai Purchasing/Requestor.',
        solution: 'Kondisi ini disengaja demi keamanan data dan tanda tangan digital. Klik tombol Keluar (Log Out) di kanan atas untuk masuk sebagai akun lain.'
      },
      {
        issue: 'Layar tiba-tiba kembali ke halaman login setelah ditinggal istirahat.',
        solution: 'Fitur Auto-Logout 30 menit aktif. Login kembali dengan username dan password akun Anda.'
      }
    ]
  },
  {
    id: 'pr-create',
    order: '02',
    title: 'Pembuatan Purchase Requisition (Buat PR Baru)',
    subtitle: 'Pengisian departemen, cost center, pemilihan COA pintar, dan batas plafon Rp 40 Juta',
    targetTab: 'pr-create',
    targetTabLabel: 'Buka Buat PR Baru',
    roles: ['REQUESTOR', 'PURCHASING', 'FINANCE', 'ADMIN'],
    roleSummary: 'Requestor · Chef · Engineering · Purchasing',
    estimatedMinutes: 10,
    objective: 'Membuat permintaan pembelian barang/jasa dengan klasifikasi COA dan Cost Center yang akurat tanpa melebihi kapasitas batch Petty Cash.',
    prerequisites: [
      'Mengetahui Departemen, Cost Center, dan COA biaya yang akan dibebankan.',
      'Pastikan barang sudah terdaftar di Master Data (jika belum, ajukan atau tambahkan melalui menu Katalog & Spesifikasi).'
    ],
    steps: [
      {
        title: 'Pilih Tanggal, Departemen & Cost Center',
        detail: 'Isi tanggal kebutuhan, pilih Departemen pemohon, dan tentukan Cost Center penanggung biaya (misal: Culinary Central Kitchen, NUKA, MICE, atau MEP).'
      },
      {
        title: 'Tentukan Vendor / Pemasok & COA Biaya',
        detail: 'Pilih pemasok utama dan pilih Chart of Account (COA). Pilihan katalog barang di bawahnya otomatis menyesuaikan aturan COA yang dipilih.',
        tip: 'Untuk COA Event Cost, tentukan outlet tujuan: NUKA, MICE, atau TIDAK KEDUANYA (Non-BPP Event).'
      },
      {
        title: 'Pilih Barang Sesuai Aturan Klasifikasi COA',
        detail: 'Tambahkan item dari katalog yang muncul. Daftar barang sudah disaring otomatis sesuai aturan akuntansi GMCC agar tidak terjadi salah pos biaya.'
      },
      {
        title: 'Periksa Total Estimasi terhadap Plafon Maksimal',
        detail: `Pastikan subtotal 1 dokumen PR tidak melebihi batas maksimal ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(MAX_PR_LIMIT)} (Rp 40.000.000). Jika melebihi, tombol submit terkunci otomatis.`
      },
      {
        title: 'Kirim PR ke Antrean Approval',
        detail: 'Klik Simpan & Ajukan PR. Sistem menerbitkan nomor PR resmi dengan status WAITING_PURCHASING dan mencatatnya di Audit Log.'
      }
    ],
    rulesAndControls: [
      'Batas Maksimal 1 PR = Rp 40.000.000 agar penggabungan transaksi pada 1 berkas Petty Cash (maksimal Rp 50.000.000) tetap aman dan tidak tertolak.',
      'COA BPP hanya menampilkan item berkategori BPP. COA Non-BPP, Transport, dan Rental hanya menampilkan item Non-BPP.',
      'COA Event (NUKA/MICE) menampilkan item BPP Event, sedangkan Event Non-BPP (outlet NONE) menampilkan item Non-BPP.',
      'COA Meal Employee mengambil gabungan seluruh item BPP maupun Non-BPP.'
    ],
    commonMistakes: [
      {
        issue: 'Barang bahan dapur tidak muncul saat memilih COA Non-BPP atau sebaliknya.',
        solution: 'Periksa kembali pilihan COA di header PR atau cek kolom klasifikasi COA barang pada modul Katalog & Spesifikasi.'
      },
      {
        issue: 'Tombol kirim PR berwarna merah / terkunci karena nominal di atas Rp 40.000.000.',
        solution: 'Pecah pengajuan PR menjadi 2 dokumen terpisah sesuai kelompok barang atau tanggal pengiriman agar tetap di bawah Rp 40 Juta per PR.'
      }
    ]
  },
  {
    id: 'approval-po',
    order: '03',
    title: 'Approval Center & Penerbitan Purchase Order (PO)',
    subtitle: 'Persetujuan 3 tahap (Purchasing -> Finance -> GM) dan manajemen PO resmi',
    targetTab: 'approval-center',
    targetTabLabel: 'Buka Approval Center',
    roles: ['PURCHASING', 'FINANCE', 'GM', 'ADMIN'],
    roleSummary: 'Purchasing · Finance/HOD · General Manager',
    estimatedMinutes: 8,
    objective: 'Memverifikasi kewajaran harga, kesesuaian anggaran Cost Center, dan menerbitkan PO resmi bertanda tangan digital secara berjenjang.',
    prerequisites: [
      'Terdapat dokumen PR berstatus Menunggu Persetujuan di tab Pending pada Approval Center.',
      'Tanda tangan digital (specimen) user sudah tersimpan di System Admin.'
    ],
    steps: [
      {
        title: 'Tahap 1 — Verifikasi Purchasing (WAITING_PURCHASING)',
        detail: 'Staf Purchasing meninjau spesifikasi barang, harga satuan, dan vendor terpilih, lalu klik Setujui (Tahap Purchasing) untuk meneruskan ke Finance.'
      },
      {
        title: 'Tahap 2 — Review Finance / Dept Head (WAITING_FINANCE)',
        detail: 'Chief Accounting / Finance atau Dept Head mengecek ketersediaan alokasi anggaran Cost Center serta kode COA/GL, kemudian menyetujui ke tahap GM.'
      },
      {
        title: 'Tahap 3 — Persetujuan Final GM (WAITING_GM)',
        detail: 'General Manager melakukan persetujuan akhir. Begitu GM menyetujui, status PR berubah menjadi PO_CREATED dan sistem otomatis membuat Purchase Order resmi.'
      },
      {
        title: 'Cetak & Pantau di Modul Purchase Orders (PO)',
        detail: 'Buka menu Purchase Orders (PO) untuk mengunduh/mencetak dokumen PO resmi lengkap dengan alamat GMCC Labuan Bajo dan specimen tanda tangan.'
      }
    ],
    rulesAndControls: [
      'Persetujuan dieksekusi langsung menggunakan otentikasi sesi aktif tanpa perlu memasukkan password berulang.',
      'PR yang ditolak (REJECTED) wajib disertai catatan alasan penolakan yang tercatat di histori approval.'
    ],
    commonMistakes: [
      {
        issue: 'PO belum muncul di daftar Purchase Orders padahal PR sudah disetujui Purchasing dan Finance.',
        solution: 'Pastikan PR telah melewati persetujuan tahap akhir oleh General Manager (status WAITING_GM -> PO_CREATED).'
      }
    ]
  },
  {
    id: 'receiving-grn',
    order: '04',
    title: 'Penerimaan Barang (GRN) & Penentuan Jalur Pembayaran',
    subtitle: 'Serah terima fisik gudang, upload foto nota, dan pemisahan vendor Tunai vs Tempo',
    targetTab: 'receiving',
    targetTabLabel: 'Buka Receiving (GRN)',
    roles: ['PURCHASING', 'REQUESTOR', 'FINANCE', 'ADMIN'],
    roleSummary: 'Receiving · Gudang · Purchasing',
    estimatedMinutes: 8,
    objective: 'Mencatat kuantitas aktual barang masuk beserta foto bukti nota fisik dan mengarahkan transaksi ke Kas Kecil atau Hutang Dagang (AP).',
    prerequisites: [
      'Dokumen PO sudah diterbitkan (OPEN / PARTIAL).',
      'Barang fisik dan surat jalan/nota dari vendor sudah tiba di area receiving GMCC.'
    ],
    steps: [
      {
        title: 'Pilih PO & Input Kuantitas Diterima',
        detail: 'Buka modul Penerimaan Barang (GRN), klik Terima Barang pada PO terkait, lalu masukkan jumlah kuantitas aktual yang diterima.'
      },
      {
        title: 'Lengkapi Nomor Nota & Foto Bukti Fisik',
        detail: 'Masukkan nomor kwitansi/faktur vendor, harga realisasi final, dan unggah foto nota fisik agar siap ditarik ke berkas penagihan.'
      },
      {
        title: 'Simpan GRN & Jalankan Routing Otomatis',
        detail: 'Saat GRN disimpan: barang dari vendor CASH_PURCHASE langsung masuk kandidat Petty Cash & Rekonsiliasi, sedangkan vendor CREDIT masuk modul AP Aging.'
      }
    ],
    rulesAndControls: [
      'Status termin pembayaran pada Master Vendor menentukan apakah transaksi masuk jalur Kas Kecil (Tunai) atau AP Aging (Tempo).',
      'Foto bukti fisik nota pada GRN menjadi syarat utama kelengkapan lampiran cetak 1 Baris 2 Nota di Petty Cash.'
    ],
    commonMistakes: [
      {
        issue: 'Transaksi GRN tunai tidak muncul saat tarik data di Petty Cash.',
        solution: 'Periksa di Master Data -> Pemasok apakah vendor tersebut sudah disetel ke CASH_PURCHASE (Tunai) dan tanggal GRN masuk dalam rentang periode.'
      }
    ]
  },
  {
    id: 'food-flash-insight',
    order: '05',
    title: 'Daftar Belanja & Insight, Daily Food Flash & Recipe Cost',
    subtitle: 'Analitik pembelanjaan per Cost Center, aturan masuk Food Flash, dan kalkulasi HPP resep',
    targetTab: 'spending-analytics',
    targetTabLabel: 'Buka Daftar Belanja & Insight',
    roles: ['REQUESTOR', 'PURCHASING', 'FINANCE', 'GM', 'ADMIN'],
    roleSummary: 'Chef · F&B · Purchasing · Finance · GM',
    estimatedMinutes: 9,
    objective: 'Memantau tren belanja per departemen/cost center/COA dan menjaga akurasi rasio Food Cost harian di NUKA dan MICE.',
    prerequisites: [
      'Data PO dan GRN sudah tercatat sesuai Cost Center dan COA yang benar.'
    ],
    steps: [
      {
        title: 'Analisis Belanja di Daftar Belanja & Insight',
        detail: 'Gunakan tab Ringkasan, Per Item, Per Vendor, Per Cost Center, atau Per COA untuk melacak frekuensi belanja dan total pengeluaran tiap pos biaya.'
      },
      {
        title: 'Verifikasi Data Masuk Daily Food Flash',
        detail: 'Buka menu Daily Food Flash. Hanya transaksi dengan COA BPP (NUKA/MICE) dan COA Event yang diarahkan ke outlet NUKA atau MICE yang otomatis masuk perhitungan Food Cost.'
      },
      {
        title: 'Kelola Standar Resep di Recipe Cost Center',
        detail: 'Susun daftar bahan dari Master Data pada setiap menu banquet atau NUKA untuk menghitung HPP per porsi dan margin penjualan secara real-time.'
      }
    ],
    rulesAndControls: [
      'COA Non-BPP, Transport, Rental Equipment Event, Meal Employee, dan Event outlet NONE (Non-BPP Event) secara ketat TIDAK dimasukkan ke Daily Food Flash.'
    ],
    commonMistakes: [
      {
        issue: 'Pembelian bahan acara Banquet tidak masuk ke laporan Daily Food Flash MICE.',
        solution: 'Pastikan pada saat pembuatan PR menggunakan COA Event Cost dengan pilihan Outlet = MICE (bukan NONE).'
      }
    ]
  },
  {
    id: 'petty-cash',
    order: '06',
    title: 'Petty Cash & Settlement (Laporan Pertanggungjawaban)',
    subtitle: 'Tarik transaksi harian, penomoran No. Invoice ITDC, plafon Rp 50 Juta, dan penguncian tanggal',
    targetTab: 'petty-cash',
    targetTabLabel: 'Buka Petty Cash & Settlement',
    restrictedToFinancePurchasing: true,
    roles: ['PURCHASING', 'FINANCE', 'GM', 'ADMIN'],
    roleSummary: 'Purchasing · Finance/Accounting · GM',
    estimatedMinutes: 12,
    objective: 'Menyusun periode settlement Kas Kecil yang utuh per tanggal, terhubung lintas aplikasi via No. Invoice ITDC, dan siap dibakukan menjadi berkas tagihan resmi.',
    prerequisites: [
      'Nota GRN tunai atau kwitansi kas kecil langsung sudah lengkap beserta foto bukti.',
      'Maksimal akumulasi 1 periode/berkas tidak melebihi Rp 50.000.000.'
    ],
    steps: [
      {
        title: 'Buat Periode Baru & Isi No. Invoice ITDC',
        detail: 'Tentukan rentang tanggal awal dan akhir periode, lalu isi Nomor Invoice ITDC dengan format standar (contoh: INV/GMCC-ITDC/2026/XI-001) sebagai kunci pelacakan antar-aplikasi.'
      },
      {
        title: 'Tarik Data GRN Tunai atau Tambah Transaksi Langsung',
        detail: 'Tarik item GRN berstatus CASH_PURCHASE pada rentang tanggal tersebut atau input pengeluaran kas kecil langsung lengkap dengan COA, GL Code, dan foto nota.'
      },
      {
        title: 'Jaga Keutuhan Tanggal & Plafon Maksimal Rp 50 Juta',
        detail: 'Sistem mengecek agar seluruh transaksi pada tanggal yang dipilih ditarik utuh (tidak terpotong sebagian) dan total tidak melampaui Rp 50.000.000.'
      },
      {
        title: 'Konfirmasi & Standarisasi File Penagihan',
        detail: 'Jika seluruh item dan foto nota sudah lengkap, klik tombol Konfirmasi & Standarisasi File Penagihan untuk membakukan data ke modul Berkas Tagihan Kas Kecil.'
      }
    ],
    rulesAndControls: [
      'Proteksi Anti-Double Billing (Strict Date Lock): Tanggal transaksi yang sudah dibakukan ke dalam Berkas Tagihan otomatis terkunci dan ditolak bila ditarik ulang.',
      'No. Invoice ITDC menjadi ID penghubung resmi antara modul Petty Cash, Berkas Tagihan, ekspor Google Sheets, dan aplikasi keuangan eksternal ITDC.'
    ],
    commonMistakes: [
      {
        issue: 'Muncul peringatan Strict Date Lock saat menarik tanggal transaksi tertentu.',
        solution: 'Tanggal tersebut sudah masuk ke dalam Berkas Tagihan Kas Kecil yang dibakukan. Periksa daftar periode di modul Berkas Tagihan Kas Kecil.'
      }
    ]
  },
  {
    id: 'billing-files',
    order: '07',
    title: 'Berkas Tagihan Kas Kecil, Filter MTD/FY & Upload Bukti TF',
    subtitle: 'Penyortiran periode Bulan (MTD)/Full Year, konfirmasi terbayar wajib Bukti TF, dan arsip otomatis turun ke bawah',
    targetTab: 'billing-files',
    targetTabLabel: 'Buka Berkas Tagihan Kas Kecil',
    restrictedToFinancePurchasing: true,
    roles: ['PURCHASING', 'FINANCE', 'GM', 'ADMIN'],
    roleSummary: 'Finance/Accounting · Purchasing · GM',
    estimatedMinutes: 10,
    objective: 'Mengelola tagihan kas kecil aktif hingga proses pencairan dana, memastikan setiap status terbayar memiliki Bukti Transfer (TF) valid.',
    prerequisites: [
      'Berkas sudah dibakukan dari modul Petty Cash & Settlement.',
      'Tersedia file gambar/screenshot atau PDF Bukti Transfer saat dana sudah dicairkan.'
    ],
    steps: [
      {
        title: 'Gunakan Filter Periode: Semua · Bulan (MTD) · Full Year',
        detail: 'Pilih Bulan (MTD) untuk melihat berkas pada bulan & tahun tertentu (bulan berjalan otomatis bertanda MTD s/d tanggal hari ini), atau pilih Full Year untuk rekap 1 tahun penuh.',
        tip: 'Gunakan tombol Urutkan Terbaru / Terlama serta filter Status untuk mempersempit pencarian berkas.'
      },
      {
        title: 'Pantau Berkas Aktif pada Baris Atas',
        detail: 'Seluruh berkas yang Belum Terbayarkan (Siap Ditagihkan / Proses Verifikasi) selalu ditampilkan pada bagian paling atas (Berkas Aktif — Belum Terbayarkan) agar menjadi prioritas penagihan.'
      },
      {
        title: 'Tandai Sudah Terbayarkan & Wajib Upload Bukti TF',
        detail: 'Klik tombol Tandai Terbayar & Upload Bukti TF pada berkas aktif. Isi No. Invoice ITDC, tanggal pencairan, bank tujuan, nomor referensi, dan unggah file Bukti Transfer (JPG/PNG atau PDF).'
      },
      {
        title: 'Perpindahan Otomatis ke Baris Bawah (Arsip Terbayar)',
        detail: 'Begitu dikonfirmasi lunas dengan Bukti TF, berkas otomatis turun ke bagian bawah (Arsip Sudah Terbayarkan & Bukti TF) sehingga daftar aktif di atas tetap bersih.'
      },
      {
        title: 'Lihat / Ganti Bukti TF & Cetak 2 Lembar Lengkap',
        detail: 'Gunakan tombol Lihat Bukti TF untuk meninjau atau memperbarui lampiran bukti transfer kapan saja. Tombol Cetak / PDF menghasilkan Lembar 1 Rekapitulasi dan Lembar 2 Lampiran Bukti TF & Nota (1 Baris 2 Nota).'
      }
    ],
    rulesAndControls: [
      'Berkas tidak dapat ditandai Sudah Terbayarkan / Dicairkan apabila file Bukti Transfer (Bukti TF) belum dilampirkan.',
      'Gambar Bukti TF dikompresi otomatis oleh browser (maksimal dimensi 1200px) agar penyimpanan lokal dan sinkronisasi tetap ringan.'
    ],
    commonMistakes: [
      {
        issue: 'Berkas yang baru saja dibakukan tidak terlihat di layar.',
        solution: 'Cek filter periode di bagian atas—kemungkinan sedang terpilih Bulan (MTD) atau Full Year tahun lain. Klik Semua Periode untuk menampilkan seluruh berkas.'
      }
    ]
  },
  {
    id: 'reconciliation-ap',
    order: '08',
    title: 'Rekonsiliasi Kas Kecil & AP Aging (Hutang Rekanan)',
    subtitle: 'Audit kesesuaian transaksi GRN tunai vs Petty Cash serta kontrol jatuh tempo invoice vendor tempo',
    targetTab: 'reconciliation',
    targetTabLabel: 'Buka Rekonsiliasi Kas Kecil',
    restrictedToFinancePurchasing: true,
    roles: ['FINANCE', 'PURCHASING', 'GM', 'ADMIN'],
    roleSummary: 'Finance/Accounting · Purchasing',
    estimatedMinutes: 7,
    objective: 'Memastikan tidak ada transaksi receiving tunai yang terlewat dari settlement kas kecil dan seluruh invoice vendor tempo dibayar tepat waktu.',
    prerequisites: [
      'Data GRN dan periode Petty Cash Settlement sudah diperbarui.'
    ],
    steps: [
      {
        title: 'Audit di Modul Rekonsiliasi Kas Kecil',
        detail: 'Bandingkan daftar GRN vendor CASH_PURCHASE dengan item yang sudah masuk ke Petty Cash. Sistem menyorot selisih atau GRN yang belum di-settle.'
      },
      {
        title: 'Tindak Lanjut GRN Belum Masuk Kas Kecil',
        detail: 'Gunakan pintasan di modul rekonsiliasi untuk menarik atau menyinkronkan item GRN yang tertinggal langsung ke periode Petty Cash aktif.'
      },
      {
        title: 'Pantau Hutang Tempo di AP Aging',
        detail: 'Buka menu AP Aging (Hutang Rekanan) untuk memantau kelompok umur hutang (0-30, 31-60, >60 hari) pada vendor bertipe CREDIT serta menandai status pelunasan.'
      }
    ],
    rulesAndControls: [
      'Kedua modul ini masuk kategori Restricted Access (hanya dapat dibuka oleh Purchasing, Finance/Accounting, GM, dan Admin).'
    ],
    commonMistakes: [
      {
        issue: 'User Requestor atau Receiving tidak menemukan menu AP Aging & Rekonsiliasi.',
        solution: 'Akses kedua modul tersebut memang dikhususkan bagi Purchasing, Finance/Accounting, GM, dan Administrator sesuai kebijakan kontrol internal.'
      }
    ]
  },
  {
    id: 'master-sheets-admin',
    order: '09',
    title: 'Master Data, Google Sheets Sync & System Admin',
    subtitle: 'Pengelolaan katalog item & COA, sinkronisasi 2-arah spreadsheet, serta pengaturan user/IT',
    targetTab: 'master-data',
    targetTabLabel: 'Buka Master Data',
    roles: ['REQUESTOR', 'PURCHASING', 'FINANCE', 'GM', 'ADMIN'],
    roleSummary: 'Requestor (Katalog) · Purchasing · Finance · Admin',
    estimatedMinutes: 8,
    objective: 'Menjaga kebersihan data master barang/vendor/COA, melakukan backup atau sinkronisasi Google Sheets 2-arah, dan mengatur hak akses pengguna.',
    prerequisites: [
      'Role Requestor hanya dapat melihat/mengisi Katalog Barang & Spesifikasi; perubahan struktur Vendor, COA, dan User dilakukan oleh peran berwenang.'
    ],
    steps: [
      {
        title: 'Kelola Katalog Barang & Klasifikasi COA',
        detail: 'Di menu Master Data / Katalog & Spesifikasi, pastikan setiap item memiliki SKU, satuan, harga terakhir, serta klasifikasi COA (BPP atau NON_BPP) yang tepat.'
      },
      {
        title: 'Atur Termin Pemasok & Cost Center',
        detail: 'Pada tab Pemasok, pastikan setiap vendor disetel ke Tunai (CASH_PURCHASE) atau Tempo (CREDIT) beserta batas kreditnya. Pisahkan entitas Departemen dan Cost Center pada tab masing-masing.'
      },
      {
        title: 'Sinkronisasi Google Sheets 2-Arah',
        detail: 'Buka Google Sheets Database untuk mengekspor seluruh tabel ERP (termasuk Tanggal Cair & Status Bukti TF pada Berkas Tagihan) atau menarik pembaruan data dari spreadsheet tim.'
      },
      {
        title: 'Administrasi Akun & Audit Log (Admin / GM)',
        detail: 'Melalui System Admin & User, kelola tambah/nonaktif user, atur tanda tangan digital specimen, pantau Audit Log aktivitas, atau gunakan panel GitHub kanan khusus IT/Admin.'
      }
    ],
    rulesAndControls: [
      'Pengaturan akun user dan reset database hanya boleh dijalankan oleh Administrator / GM.',
      'Tombol Sambungan GitHub di sisi kanan layar otomatis tersembunyi untuk akun non-IT/non-Admin.'
    ],
    commonMistakes: [
      {
        issue: 'Requestor mencoba mengubah daftar COA atau menghapus user.',
        solution: 'Role Requestor dibatasi pada Katalog & Spesifikasi; perubahan Master COA/Vendor dilakukan Purchasing/Finance dan user dikelola oleh Admin/GM.'
      }
    ]
  }
];

const STORAGE_KEY_PREFIX = 'gmcc_erp_training_progress_v1_';

export const TrainingManualView: React.FC<TrainingManualViewProps> = ({
  currentUser,
  onNavigate
}) => {
  const storageKey = `${STORAGE_KEY_PREFIX}${currentUser.id || currentUser.username}`;

  const [selectedRole, setSelectedRole] = useState<RoleFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModuleId, setActiveModuleId] = useState<string>(TRAINING_MODULES[0].id);
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {}
    return [];
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          setCompletedIds(Array.isArray(parsed) ? parsed : []);
        } else {
          setCompletedIds([]);
        }
      }
    } catch {
      setCompletedIds([]);
    }
  }, [storageKey]);

  const persistCompleted = (next: string[]) => {
    setCompletedIds(next);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      }
    } catch {}
  };

  const toggleModuleCompleted = (moduleId: string) => {
    const exists = completedIds.includes(moduleId);
    const next = exists
      ? completedIds.filter(id => id !== moduleId)
      : [...completedIds, moduleId];
    persistCompleted(next);
    setStatusMessage(
      exists
        ? 'Status modul dikembalikan menjadi belum selesai.'
        : 'Modul ditandai selesai dipelajari untuk akun Anda.'
    );
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleResetProgress = () => {
    persistCompleted([]);
    setStatusMessage('Progres pelatihan akun ini berhasil diatur ulang.');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TRAINING_MODULES.filter((mod) => {
      const roleMatch = selectedRole === 'ALL' || mod.roles.includes(selectedRole);
      if (!roleMatch) return false;
      if (!q) return true;
      const haystack = [
        mod.title,
        mod.subtitle,
        mod.roleSummary,
        mod.objective,
        ...mod.steps.map(s => `${s.title} ${s.detail} ${s.tip || ''}`),
        ...mod.rulesAndControls,
        ...mod.commonMistakes.map(m => `${m.issue} ${m.solution}`)
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [selectedRole, searchQuery]);

  const activeModule = useMemo(() => {
    const inFiltered = filteredModules.find(m => m.id === activeModuleId);
    if (inFiltered) return inFiltered;
    return filteredModules[0] || null;
  }, [filteredModules, activeModuleId]);

  const canOpenTargetModule = (mod: TrainingModule) => {
    if (!mod.targetTab) return false;
    if (mod.itAdminOnly) return hasItAdminAccess(currentUser);
    if (mod.restrictedToFinancePurchasing) return hasRestrictedModuleAccess(currentUser);
    return true;
  };

  const completionPercentage = Math.round((completedIds.length / TRAINING_MODULES.length) * 100);

  const handlePrintManual = () => {
    window.print();
  };

  const getModuleIcon = (id: string) => {
    switch (id) {
      case 'auth-security':
        return <Lock className="w-4 h-4" />;
      case 'pr-create':
        return <PlusCircle className="w-4 h-4" />;
      case 'approval-po':
        return <ShieldCheck className="w-4 h-4" />;
      case 'receiving-grn':
        return <Truck className="w-4 h-4" />;
      case 'food-flash-insight':
        return <TrendingUp className="w-4 h-4" />;
      case 'petty-cash':
        return <Receipt className="w-4 h-4" />;
      case 'billing-files':
        return <FileCheck2 className="w-4 h-4" />;
      case 'reconciliation-ap':
        return <Scale className="w-4 h-4" />;
      case 'master-sheets-admin':
        return <Database className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* PRINT-ONLY COMPLETE SOP BOOK HEADER & ALL CHAPTERS */}
      <div className="hidden print:block bg-white text-slate-900 p-8 space-y-6">
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
          <div className="flex items-center gap-4">
            <img src={GMCC_LOGO_DARK} alt="GMCC Logo" className="h-12 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tight">
                Buku Panduan &amp; SOP Pelatihan Sistem GMCC ERP
              </h1>
              <p className="text-xs text-slate-600">
                Golo Mori Convention Center by ITDC · Labuan Bajo · Dicetak oleh: {currentUser.name} ({currentUser.role})
              </p>
            </div>
          </div>
          <div className="text-right text-xs font-mono text-slate-700">
            <div>Total Modul: {TRAINING_MODULES.length}</div>
            <div>Tanggal: {new Date().toLocaleDateString('id-ID')}</div>
          </div>
        </div>

        <div className="space-y-6">
          {TRAINING_MODULES.map((mod) => (
            <section key={mod.id} className="border border-slate-300 rounded-lg p-4 break-inside-avoid space-y-3">
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
                <h2 className="text-base font-bold text-slate-950">
                  {mod.order}. {mod.title}
                </h2>
                <span className="text-xs text-slate-600">{mod.roleSummary} · {mod.estimatedMinutes} menit</span>
              </div>
              <p className="text-xs text-slate-700">{mod.objective}</p>
              <div>
                <div className="text-xs font-bold uppercase text-slate-800 mb-1">Langkah Operasional:</div>
                <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-800">
                  {mod.steps.map((s, idx) => (
                    <li key={idx}>
                      <strong>{s.title}:</strong> {s.detail}
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-slate-800 mb-1">Aturan &amp; Kontrol Sistem:</div>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                  {mod.rulesAndControls.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* SCREEN UI (HIDDEN ON PRINT) */}
      <div className="print:hidden space-y-6">
        {/* Top Header */}
        <header className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Pusat Pelatihan Pengguna</span>
              <span aria-hidden="true">·</span>
              <span>GMCC Procurement &amp; Petty Cash ERP</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{TRAINING_MODULES.length} Modul SOP</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight text-balance">
              Manual &amp; Modul Training Aplikasi GMCC ERP
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Panduan operasional resmi langkah demi langkah bagi staf Departemen, Purchasing, Gudang, Finance, General Manager, dan Administrator.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-0.5 min-w-[175px]">
              <div className="text-slate-400">Progres Pelatihan Anda</div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono tabular-nums font-bold text-base text-cyan-300">
                  {completedIds.length}/{TRAINING_MODULES.length} Modul
                </span>
                <span className="font-mono tabular-nums text-xs text-emerald-400 font-semibold">
                  {completionPercentage}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-cyan-400 transition-all duration-200"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {completedIds.length > 0 && (
              <button
                type="button"
                onClick={handleResetProgress}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                title="Atur ulang daftar modul yang sudah selesai dipelajari"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>Reset Progres</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrintManual}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Manual Lengkap</span>
            </button>
          </div>
        </header>

        {/* Inline Feedback Banner */}
        {statusMessage && (
          <div className="px-4 py-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-emerald-300 hover:text-white font-semibold"
            >
              Tutup
            </button>
          </div>
        )}

        {/* End-to-End Flow Navigation Map */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-white">Alur Kerja Terpadu GMCC ERP (Dari Pengajuan hingga Cair)</h2>
              <p className="text-xs text-slate-400">
                Klik salah satu tahapan di bawah untuk langsung membuka panduan SOP terkait.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
              Role Aktif: <strong className="text-cyan-300">{currentUser.role}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
            {WORKFLOW_STAGES.map((stage) => {
              const isSelected = activeModule?.id === stage.moduleId;
              return (
                <button
                  key={stage.step}
                  type="button"
                  onClick={() => {
                    setSelectedRole('ALL');
                    setSearchQuery('');
                    setActiveModuleId(stage.moduleId);
                  }}
                  className={`text-left p-3.5 rounded-xl border transition-colors flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-white'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono tabular-nums text-xs font-bold text-cyan-400">
                      Tahap {stage.step}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white leading-snug">{stage.title}</div>
                    <div className="text-[11px] text-slate-400 leading-snug">{stage.summary}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Search & Role Filter Toolbar */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SOP, aturan COA, plafon 40 juta, No. Invoice ITDC, Bukti TF..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {ROLE_FILTERS.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  selectedRole === role.id
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </section>

        {/* Main 2-Column Manual Workspace */}
        {filteredModules.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Tidak Ada Modul Panduan yang Cocok</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Kata kunci &ldquo;{searchQuery}&rdquo; pada filter peran saat ini belum menemukan kecocokan. Atur ulang filter untuk melihat seluruh SOP.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedRole('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
            >
              Tampilkan Semua Modul
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Chapter Index */}
            <nav className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-1.5">
              <div className="px-3 py-2 flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-800">
                <span>Daftar Bab Pelatihan</span>
                <span className="font-mono tabular-nums">{filteredModules.length} Bab</span>
              </div>

              <div className="space-y-1 pt-1">
                {filteredModules.map((mod) => {
                  const isActive = activeModule?.id === mod.id;
                  const isDone = completedIds.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => setActiveModuleId(mod.id)}
                      className={`w-full text-left p-3 rounded-xl transition-colors flex items-start gap-3 ${
                        isActive
                          ? 'bg-cyan-500/15 border border-cyan-500/40 text-white'
                          : 'border border-transparent hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <span className={`mt-0.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>
                        {getModuleIcon(mod.id)}
                      </span>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white leading-snug truncate">
                            {mod.order}. {mod.title}
                          </span>
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {mod.roleSummary} · <span className="font-mono tabular-nums">{mod.estimatedMinutes} mnt</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Right Active Chapter Detail */}
            {activeModule && (
              <article className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                {/* Chapter Header */}
                <div className="border-b border-slate-800 pb-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono font-bold text-cyan-400">Bab {activeModule.order}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activeModule.roleSummary}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Estimasi {activeModule.estimatedMinutes} menit</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {canOpenTargetModule(activeModule) && activeModule.targetTab && (
                        <button
                          type="button"
                          onClick={() => onNavigate(activeModule.targetTab!)}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                        >
                          <span>{activeModule.targetTabLabel || 'Buka Modul'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleModuleCompleted(activeModule.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                          completedIds.includes(activeModule.id)
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        }`}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>
                          {completedIds.includes(activeModule.id) ? 'Sudah Dipahami' : 'Tandai Selesai'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-white tracking-tight text-balance">
                      {activeModule.title}
                    </h2>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {activeModule.subtitle}
                    </p>
                  </div>
                </div>

                {/* Objective & Prerequisites */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <h3 className="text-xs font-bold text-cyan-300">Tujuan Operasional</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{activeModule.objective}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <h3 className="text-xs font-bold text-slate-200">Prasyarat Sebelum Mulai</h3>
                    <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed list-disc pl-4">
                      {activeModule.prerequisites.map((pre, i) => (
                        <li key={i}>{pre}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Step-by-Step SOP */}
                <section className="space-y-3">
                  <h3 className="text-sm font-bold text-white">Panduan Langkah demi Langkah (SOP)</h3>
                  <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950/50">
                    {activeModule.steps.map((step, idx) => (
                      <div key={idx} className="p-4 flex items-start gap-4">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 font-mono tabular-nums text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{step.detail}</p>
                          {step.tip && (
                            <p className="text-xs text-cyan-300/90 pt-1">
                              Catatan Praktis: {step.tip}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Rules & Controls */}
                <section className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Aturan Sistem &amp; Batasan Kontrol Internal</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed list-disc pl-5">
                    {activeModule.rulesAndControls.map((rule, i) => (
                      <li key={i}>{rule}</li>
                    ))}
                  </ul>
                </section>

                {/* Troubleshooting FAQ */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Kendala Umum &amp; Cara Mengatasi</span>
                  </div>
                  <div className="space-y-2.5">
                    {activeModule.commonMistakes.map((item, i) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                        <div className="text-xs font-semibold text-rose-300">
                          Kendala: {item.issue}
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed">
                          Solusi: {item.solution}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Bottom Chapter Pagination */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    Butuh latihan langsung? Gunakan tombol modul terkait di atas untuk membuka halaman kerja nyata.
                  </div>
                  {(() => {
                    const currentIndex = filteredModules.findIndex(m => m.id === activeModule.id);
                    const nextMod = currentIndex >= 0 ? filteredModules[currentIndex + 1] : null;
                    if (!nextMod) return null;
                    return (
                      <button
                        type="button"
                        onClick={() => setActiveModuleId(nextMod.id)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>Bab Berikutnya: {nextMod.order}. {nextMod.title.split(',')[0]}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                      </button>
                    );
                  })()}
                </div>
              </article>
            )}
          </div>
        )}

        {/* Quick Reference Role Access Matrix */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Matriks Hak Akses Modul Berdasarkan Peran Akun</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 pr-4 font-semibold">Peran / Role</th>
                  <th className="py-2.5 px-4 font-semibold">Modul Utama yang Dapat Diakses</th>
                  <th className="py-2.5 pl-4 font-semibold">Batasan Keamanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                <tr>
                  <td className="py-3 pr-4 font-mono font-bold text-cyan-300 whitespace-nowrap">REQUESTOR</td>
                  <td className="py-3 px-4">Dashboard, Buat PR Baru, Daftar Belanja &amp; Insight, Daily Food Flash, Recipe Cost, Katalog &amp; Spesifikasi, Training Manual</td>
                  <td className="py-3 pl-4 text-slate-400">Tidak dapat membuka AP Aging, Petty Cash, Berkas Tagihan, Rekonsiliasi, System Admin, dan Panel GitHub.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono font-bold text-amber-300 whitespace-nowrap">PURCHASING</td>
                  <td className="py-3 px-4">Seluruh modul Requestor + Approval Center Tahap 1, PO, Receiving (GRN), AP Aging, Petty Cash, Berkas Tagihan, Rekonsiliasi, Google Sheets, Master Data</td>
                  <td className="py-3 pl-4 text-slate-400">Tidak memiliki akses System Admin &amp; User, tidak dapat pindah akun di Navbar, serta tidak dapat membuka Panel GitHub.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono font-bold text-emerald-300 whitespace-nowrap">DEPT_HEAD / FINANCE</td>
                  <td className="py-3 px-4">Seluruh modul operasional + Approval Center Tahap 2 (Finance/HOD), AP Aging, Petty Cash, Berkas Tagihan, Rekonsiliasi, Google Sheets, Master Data</td>
                  <td className="py-3 pl-4 text-slate-400">Tidak dapat mengubah konfigurasi System Admin atau membuka Panel GitHub.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono font-bold text-indigo-300 whitespace-nowrap">GM</td>
                  <td className="py-3 px-4">Seluruh modul operasional &amp; keuangan + Approval Final (otomatis terbit PO) + System Admin &amp; User</td>
                  <td className="py-3 pl-4 text-slate-400">Panel GitHub kanan tetap dibatasi hanya untuk akun IT &amp; Administrator.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono font-bold text-white whitespace-nowrap">ADMIN / IT</td>
                  <td className="py-3 px-4">Akses penuh seluruh modul ERP, System Admin &amp; User, Audit Log, serta Panel Kanan Sambungan GitHub</td>
                  <td className="py-3 pl-4 text-slate-400">Satu-satunya peran yang dapat mengganti akun aktif secara cepat di menu profil kanan atas.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
