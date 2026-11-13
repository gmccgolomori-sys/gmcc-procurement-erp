import React, { useState, useMemo } from 'react';
import { 
  PettyCashBillingFile, 
  UserAccount, 
  ExpenseReceiptProof,
  formatItdcInvoiceNumber
} from '../types/procurement';
import { generateReceiptSvg } from '../data/pettyCashMock';
import { GMCC_LOGO_DARK } from '../data/gmccLogo';
import { getSpecimenSignature } from '../utils/signatureUtils';
import { 
  FileCheck2, 
  Calendar, 
  Printer, 
  Eye, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  ArrowRight, 
  Building2, 
  Search, 
  Filter, 
  X, 
  FileText, 
  CreditCard, 
  ExternalLink,
  ShieldCheck,
  Receipt,
  Layers,
  Sparkles,
  Trash2
} from 'lucide-react';

interface PettyCashBillingViewProps {
  billingFiles: PettyCashBillingFile[];
  onUpdateBillingFile: (updatedFile: PettyCashBillingFile) => void;
  onDeleteBillingFile?: (fileId: string) => void;
  currentUser: UserAccount;
  users?: UserAccount[];
  onNavigateToPettyCash: () => void;
}

export const PettyCashBillingView: React.FC<PettyCashBillingViewProps> = ({
  billingFiles,
  onUpdateBillingFile,
  onDeleteBillingFile,
  currentUser,
  users = [],
  onNavigateToPettyCash
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedFileModal, setSelectedFileModal] = useState<PettyCashBillingFile | null>(null);
  const [selectedProofPreview, setSelectedProofPreview] = useState<ExpenseReceiptProof | null>(null);
  const [fileToPrint, setFileToPrint] = useState<PettyCashBillingFile | null>(null);
  const [disbursementModalFile, setDisbursementModalFile] = useState<PettyCashBillingFile | null>(null);

  // Form state for disbursement modal
  const [disburseBank, setDisburseBank] = useState('Bank Mandiri (161-00-1122334-9)');
  const [disburseDate, setDisburseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [disburseRef, setDisburseRef] = useState('');
  const [disburseNotes, setDisburseNotes] = useState('');
  const [disburseItdcInvoice, setDisburseItdcInvoice] = useState('');

  // Inline Edit state for Detail Modal No. Invoice ITDC
  const [detailItdcInput, setDetailItdcInput] = useState('');

  const formatRupiah = (val?: number) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const toDisplayDate = (isoStr?: string): string => {
    if (!isoStr) return '';
    if (isoStr.includes('-')) {
      const parts = isoStr.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return isoStr;
  };

  // Filtered Billing Files
  const filteredFiles = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return billingFiles.filter(f => {
      const matchSearch = 
        f.fileNumber.toLowerCase().includes(q) ||
        (f.itdcInvoiceNumber && f.itdcInvoiceNumber.toLowerCase().includes(q)) ||
        f.periodName.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        (f.coaCategory && f.coaCategory.toLowerCase().includes(q)) ||
        (f.notes && f.notes.toLowerCase().includes(q));

      const matchStatus = selectedStatusFilter === 'ALL' || f.billingStatus === selectedStatusFilter;

      return matchSearch && matchStatus;
    }).sort((a, b) => (b.confirmedAt || '').localeCompare(a.confirmedAt || ''));
  }, [billingFiles, searchQuery, selectedStatusFilter]);

  // KPI Metrics
  const totalFiles = billingFiles.length;
  const totalAmountBilled = useMemo(() => {
    return billingFiles.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  }, [billingFiles]);

  const totalReceiptsLocked = useMemo(() => {
    return billingFiles.reduce((acc, curr) => acc + (curr.itemCount || curr.items?.length || 0), 0);
  }, [billingFiles]);

  const readyFilesCount = useMemo(() => {
    return billingFiles.filter(f => f.billingStatus === 'SIAP_DITAGIHKAN').length;
  }, [billingFiles]);

  const disbursedFilesCount = useMemo(() => {
    return billingFiles.filter(f => f.billingStatus === 'DICAIRKAN' || f.billingStatus === 'SELESAI').length;
  }, [billingFiles]);

  // Handle Mark as Disbursed
  const handleConfirmDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disbursementModalFile) return;

    const invItdc = disburseItdcInvoice.trim().toUpperCase();
    if (!invItdc) {
      alert('No. Invoice ITDC (Wajib) harus diisi (contoh: INV/GMCC-ITDC/2026/X-001) agar terhubung dengan track record di aplikasi lain!');
      return;
    }

    const ref = disburseRef.trim() || `TRF/GMCC-CAIR/${Date.now().toString().slice(-6)}`;
    const updatedItems = (disbursementModalFile.items || []).map(it => ({
      ...it,
      itdcInvoiceNumber: invItdc
    }));
    const updated: PettyCashBillingFile = {
      ...disbursementModalFile,
      itdcInvoiceNumber: invItdc,
      items: updatedItems,
      billingStatus: 'DICAIRKAN',
      disbursementBank: disburseBank,
      disbursementDate: disburseDate,
      disbursementRef: ref,
      notes: disburseNotes.trim() ? `${disbursementModalFile.notes || ''} | Cair: ${disburseNotes.trim()}` : disbursementModalFile.notes
    };

    onUpdateBillingFile(updated);
    setDisbursementModalFile(null);
    setDisburseRef('');
    setDisburseNotes('');
    setDisburseItdcInvoice('');
    alert(`Berkas Penagihan ${updated.fileNumber} (No. Invoice ITDC: ${invItdc}) berhasil dicairkan melalui ${disburseBank} dengan referensi ${ref}!`);
  };

  // Handle Update No. Invoice ITDC on an existing Billing File
  const handleUpdateFileItdcInvoice = (file: PettyCashBillingFile, newItdcNumber: string) => {
    const normalized = newItdcNumber.trim().toUpperCase();
    if (!normalized) {
      alert('No. Invoice ITDC (Wajib) tidak boleh kosong.');
      return;
    }
    const updated: PettyCashBillingFile = {
      ...file,
      itdcInvoiceNumber: normalized,
      items: (file.items || []).map(it => ({
        ...it,
        itdcInvoiceNumber: normalized
      }))
    };
    onUpdateBillingFile(updated);
    setSelectedFileModal(updated);
    alert(`No. Invoice ITDC berhasil diperbarui menjadi ${normalized} pada berkas ${file.fileNumber}.`);
  };

  // Handle Print Document with 1 baris isi 2 nota (uniform format)
  const handlePrintFile = (file: PettyCashBillingFile) => {
    const printContent = document.getElementById(`billing-print-sheet-${file.id}`);
    if (!printContent) {
      window.print();
      return;
    }

    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Berkas_Tagihan_${file.fileNumber.replace(/[\/\s]/g, '_')}</title>
            <meta charset="utf-8">
            <style>
              @page {
                size: A4 landscape;
                margin: 8mm 10mm;
              }
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                color: #0f172a;
              }
              body {
                background: #ffffff;
                padding: 12px;
                font-size: 10px;
                line-height: 1.35;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-container {
                width: 100%;
                max-width: 100%;
                margin: 0 auto;
                background: #ffffff;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 8px;
                margin-bottom: 12px;
              }
              th, td {
                border: 1px solid #cbd5e1;
                padding: 4px 6px;
                font-size: 9px;
              }
              th {
                background-color: #f1f5f9;
                font-weight: 800;
                text-transform: uppercase;
                color: #1e293b;
              }
              .avoid-page-break {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .sig-table {
                width: 100% !important;
                border-collapse: collapse !important;
                margin-top: 18px !important;
                border-top: 2px solid #0f172a !important;
                page-break-inside: avoid !important;
              }
              .sig-table td {
                width: 50% !important;
                border: none !important;
                padding: 12px 24px !important;
                vertical-align: top !important;
                text-align: center !important;
              }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .font-mono { font-family: monospace; }
              .font-bold { font-weight: 700; }
              .font-black { font-weight: 900; }
              /* Strict Logo Sizing in Print Engine */
              img.gmcc-logo, .gmcc-logo {
                max-height: 36px !important;
                height: 36px !important;
                max-width: 140px !important;
                width: auto !important;
                object-fit: contain !important;
                display: block !important;
              }
              .break-before-page {
                page-break-before: always;
                break-before: page;
              }
              /* 1 Baris 2 Nota Berukuran Seragam */
              .receipt-grid-container {
                display: grid !important;
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 12px !important;
                width: 100% !important;
                margin-top: 10px !important;
              }
              .receipt-card-item {
                border: 1.5px solid #0f172a !important;
                border-radius: 8px !important;
                overflow: hidden !important;
                background: #ffffff !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
              }
              .receipt-card-header {
                background: #0f172a !important;
                color: #ffffff !important;
                padding: 4px 8px !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                font-size: 9px !important;
              }
              .receipt-card-sub {
                background: #f8fafc !important;
                border-bottom: 1px solid #e2e8f0 !important;
                padding: 3px 8px !important;
                display: flex !important;
                justify-content: space-between !important;
                font-size: 8px !important;
                color: #334155 !important;
              }
              .receipt-card-imgbox {
                height: 150px !important;
                max-height: 150px !important;
                background: #f8fafc !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 4px !important;
                position: relative !important;
                overflow: hidden !important;
              }
              .receipt-card-imgbox img {
                max-height: 140px !important;
                max-width: 100% !important;
                object-fit: contain !important;
              }
              .receipt-card-footer {
                background: #f8fafc !important;
                border-top: 1px solid #e2e8f0 !important;
                padding: 4px 8px !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                font-size: 8px !important;
                color: #475569 !important;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${printContent.innerHTML}
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(printIframe)) {
            document.body.removeChild(printIframe);
          }
        }, 1200);
      }, 300);
    }
  };

  const isGmOrAdmin = currentUser.role === 'GM' || currentUser.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
            <FileCheck2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight uppercase">
                Berkas Tagihan Kas Kecil (Dibakukan)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-bold">
                🔒 Data Baku &amp; Anti Double Billing
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Arsip resmi berkas penagihan kas kecil GMCC yang telah dikonfirmasi dan dibakukan. Setiap berkas mematuhi batas maksimal Rp 50.000.000 dengan keutuhan transaksi per tanggal.
            </p>
          </div>
        </div>

        {/* Action Button: Buka Generator Kas Kecil */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onNavigateToPettyCash}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>Ke Modul Petty Cash</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Berkas */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Berkas Dibakukan</div>
          <div className="text-xl font-black text-white font-mono mt-1">
            {totalFiles} <span className="text-xs font-normal text-slate-400">Berkas</span>
          </div>
          <div className="text-[11px] text-teal-400 mt-1 flex items-center gap-1 font-semibold">
            <Lock className="w-3 h-3" />
            <span>Terkunci Permanen</span>
          </div>
        </div>

        {/* Total Nilai Tagihan Dibakukan */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Nominal Tagihan</div>
          <div className="text-xl font-black text-amber-300 font-mono mt-1 truncate">
            {formatRupiah(totalAmountBilled)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Rata-rata &lt; Rp 50 Jt / berkas
          </div>
        </div>

        {/* Total Nota Fisik Terkunci */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[10px] uppercase font-bold text-slate-400">Nota Fisik Terkunci</div>
          <div className="text-xl font-black text-cyan-400 font-mono mt-1">
            {totalReceiptsLocked} <span className="text-xs font-normal text-slate-400">Kwitansi</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Terverifikasi Gudang &amp; Finance</span>
          </div>
        </div>

        {/* Status Pencairan */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[10px] uppercase font-bold text-slate-400">Status Pencairan</div>
          <div className="text-sm font-bold text-white mt-1.5 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
              {disbursedFilesCount} Cair
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold">
              {readyFilesCount} Siap
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Reimbursement Operasional GMCC
          </div>
        </div>
      </div>

      {/* INTEGRITY INFO BANNER */}
      <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 text-teal-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>Sistem Proteksi Anti-Double Billing GMCC Aktif</span>
              <span className="px-2 py-0.2 rounded text-[10px] bg-teal-500/20 text-teal-300 font-mono">
                Strict Date Lock
              </span>
            </div>
            <p className="text-[11px] text-teal-200/90 mt-0.5 leading-relaxed">
              Semua tanggal transaksi yang telah dibakukan ke dalam berkas penagihan di modul ini terkunci secara otomatis. Jika pengguna membuka atau menarik data kas kecil di modul Petty Cash pada tanggal yang sama, sistem akan memunculkan peringatan alert resmi dan menolak penarikan ulang.
            </p>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari no file tagihan, No. Invoice ITDC, periode, COA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400 font-semibold">Status:</span>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500 font-bold"
          >
            <option value="ALL">Semua Status ({billingFiles.length})</option>
            <option value="SIAP_DITAGIHKAN">Siap Ditagihkan</option>
            <option value="PROSES_VERIFIKASI">Proses Verifikasi</option>
            <option value="DICAIRKAN">Sudah Dicairkan</option>
            <option value="SELESAI">Selesai</option>
          </select>
        </div>
      </div>

      {/* LIST OF BILLING FILES */}
      {filteredFiles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <FileCheck2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Belum Ada Berkas Tagihan Kas Kecil yang Dibakukan</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Untuk membakukan data menjadi berkas penagihan resmi (maksimal Rp 50 Juta per berkas dengan integritas tanggal utuh), buka modul Petty Cash lalu klik tombol <b className="text-teal-400">"🔒 Konfirmasi &amp; Standarisasi File Penagihan"</b>.
          </p>
          <button
            onClick={onNavigateToPettyCash}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg inline-flex items-center gap-2 transition-all mt-2"
          >
            <Receipt className="w-4 h-4 text-amber-300" />
            <span>Buka Modul Petty Cash &amp; Bangun Berkas</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFiles.map((file) => {
            const isDisbursed = file.billingStatus === 'DICAIRKAN' || file.billingStatus === 'SELESAI';
            const isWithinLimit = (file.totalAmount || 0) <= 50000000;

            return (
              <div 
                key={file.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-all shadow-xl space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-sm text-teal-300">
                          {file.fileNumber}
                        </span>
                        {file.itdcInvoiceNumber ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                            ITDC: {file.itdcInvoiceNumber}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFileModal(file);
                              setDetailItdcInput('');
                            }}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                          >
                            + Isi No. Invoice ITDC (Wajib)
                          </button>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isDisbursed
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                        }`}>
                          {isDisbursed ? '✓ DICAIRKAN' : 'SIAP DITAGIHKAN'}
                        </span>
                        {isWithinLimit ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9.5px] font-bold">
                            Pagu &le; 50 Jt Terpenuhi
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9.5px] font-bold">
                            Melebihi Pagu 50 Jt
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white font-bold mt-0.5">
                        {file.title || 'Berkas Penagihan Kas Kecil Operasional GMCC'}
                      </div>
                    </div>
                  </div>

                  {/* Nominal Tagihan */}
                  <div className="text-left md:text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Nominal Tagihan</div>
                    <div className="text-lg font-black text-amber-300 font-mono">
                      {formatRupiah(file.totalAmount)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {file.itemCount || file.items?.length || 0} Bukti Nota Fisik
                    </div>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Periode Tanggal</span>
                    <span className="font-mono font-bold text-white block mt-0.5">
                      {toDisplayDate(file.startDate)} - {toDisplayDate(file.endDate)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{file.periodName}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Kategori COA</span>
                    <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-bold inline-block mt-0.5">
                      {file.coaCategory || 'Semua COA'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Waktu Pembakuan</span>
                    <span className="font-mono text-slate-300 block mt-0.5">
                      {file.confirmedAt ? new Date(file.confirmedAt).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) : '-'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Oleh: {file.confirmedBy?.name || 'Chief Accounting'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Realisasi Pencairan</span>
                    {isDisbursed ? (
                      <div>
                        <span className="font-mono font-bold text-emerald-400 block mt-0.5">
                          {toDisplayDate(file.disbursementDate)}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate" title={file.disbursementBank}>
                          {file.disbursementBank?.split('(')[0].trim() || 'Bank Mandiri'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-amber-400 font-bold text-[11px] block mt-0.5">
                        Menunggu Pencairan Bank
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span>Integritas Tanggal Utuh: Tidak ada transaksi terpotong separuh hari</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Detail Modal */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFileModal(file);
                        setDetailItdcInput(file.itdcInvoiceNumber || '');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Rincian &amp; Bukti Nota</span>
                    </button>

                    {/* Cetak Berkas PDF Resmi */}
                    <button
                      type="button"
                      onClick={() => handlePrintFile(file)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Berkas PDF Resmi</span>
                    </button>

                    {/* Pencairan Button */}
                    {!isDisbursed && (
                      <button
                        type="button"
                        onClick={() => {
                          setDisbursementModalFile(file);
                          setDisburseRef(`TRF/GMCC/${file.fileNumber.split('/').pop() || '001'}`);
                          setDisburseItdcInvoice(file.itdcInvoiceNumber || '');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Tandai Telah Dicairkan</span>
                      </button>
                    )}

                    {/* Hapus Berkas (Khusus Admin / GM jika terjadi pembatalan resmi) */}
                    {isGmOrAdmin && onDeleteBillingFile && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Yakin ingin membatalkan & menghapus Berkas Penagihan Baku "${file.fileNumber}"? Tanggal transaksi yang terkunci akan dibuka kembali.`)) {
                            onDeleteBillingFile(file.id);
                          }
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-colors"
                        title="Batalkan & Hapus Berkas Penagihan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* HIDDEN PRINT SHEET CONTAINER FOR THIS SPECIFIC FILE */}
                <div id={`billing-print-sheet-${file.id}`} className="hidden">
                  <div className="space-y-6">
                    {/* Header Surat Resmi Penagihan GMCC */}
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={GMCC_LOGO_DARK} 
                          alt="GMCC Logo" 
                          className="gmcc-logo h-10 w-auto object-contain shrink-0" 
                          style={{ maxHeight: '36px', height: '36px', maxWidth: '140px', width: 'auto', objectFit: 'contain' }}
                        />
                        <div>
                          <h1 className="text-base font-black tracking-tight text-slate-950 uppercase">
                            GOLO MORI CONVENTION CENTER
                          </h1>
                          <div className="text-[10px] text-slate-600 font-semibold">
                            Kawasan Golo Mori, Labuan Bajo, Kabupaten Manggarai Barat, Nusa Tenggara Timur
                          </div>
                          <div className="text-[9px] text-slate-500">
                            Finance &amp; Accounting Department • ITDC Group
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black uppercase text-teal-900">
                          BERKAS RESMI PENAGIHAN KAS KECIL (PETTY CASH)
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                          NO: {file.fileNumber}
                        </div>
                        {file.itdcInvoiceNumber && (
                          <div className="text-[10.5px] font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-300 rounded px-2 py-0.5 inline-block mt-0.5">
                            NO. INVOICE ITDC: {file.itdcInvoiceNumber}
                          </div>
                        )}
                        <div className="text-[9px] text-slate-600 font-semibold mt-0.5">
                          PERIODE: {toDisplayDate(file.startDate)} s/d {toDisplayDate(file.endDate)}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                          Tgl Cetak: {new Date().toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>

                    {/* Ringkasan Berita Acara Tagihan */}
                    <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-lg text-[10px] text-slate-800 space-y-1">
                      <div className="font-bold uppercase tracking-wider text-slate-950">
                        BERITA ACARA PERTANGGUNGJAWABAN &amp; PENGAJUAN PENGGANTIAN DANA (REIMBURSEMENT)
                      </div>
                      <p className="leading-relaxed">
                        Telah dibakukan dan diverifikasi rekapitulasi pengeluaran kas kecil operasional PT Pengembangan Pariwisata Indonesia (Persero) / ITDC unit Golo Mori Convention Center{file.itdcInvoiceNumber ? ` (Ref. No. Invoice ITDC: ${file.itdcInvoiceNumber})` : ''} sejumlah <b>{file.items.length} transaksi nota fisik</b> dengan total nilai pengeluaran sebesar <b>{formatRupiah(file.totalAmount)}</b>. Transaksi di bawah ini memenuhi batas pagu maksimal Rp 50.000.000 dan tidak memisahkan transaksi dalam 1 hari yang sama.
                      </p>
                    </div>

                    {/* Tabel Rincian Rekap Transaksi */}
                    <table>
                      <thead>
                        <tr>
                          <th className="text-center w-8">NO</th>
                          <th className="w-20">DATE</th>
                          <th className="w-20">NO. AKUN</th>
                          <th>KETERANGAN PENGELUARAN (VENDOR &amp; ITEM)</th>
                          <th className="text-right w-28">DEBIT (IDR)</th>
                          <th className="text-right w-28">KREDIT (IDR)</th>
                          <th className="text-center w-28">NO. NOTA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {file.items.map((it, idx) => (
                          <tr key={it.id || idx}>
                            <td className="text-center font-mono">{idx + 1}</td>
                            <td className="font-mono">{it.date}</td>
                            <td className="font-mono font-bold">{it.glAccountCode}</td>
                            <td>
                              <b>{it.vendorName}</b>: {it.description}
                            </td>
                            <td className="text-right font-mono font-bold">{formatRupiah(it.debit || it.amount)}</td>
                            <td className="text-right font-mono font-bold">{formatRupiah(it.kredit || it.amount)}</td>
                            <td className="text-center font-mono text-[8.5px]">{it.receiptNumber}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>
                          <td colSpan={4} className="text-right uppercase">TOTAL TAGIHAN DIBAKUKAN:</td>
                          <td className="text-right font-mono font-black">{formatRupiah(file.totalAmount)}</td>
                          <td className="text-right font-mono font-black">{formatRupiah(file.totalAmount)}</td>
                          <td className="text-center font-bold text-emerald-800">LUNAS</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Lembar Tanda Tangan Chief Accounting & GM */}
                    <table className="sig-table">
                      <tbody>
                        <tr>
                          <td>
                            <div className="font-bold text-[10px] uppercase text-slate-500">DIPERSIAPKAN OLEH:</div>
                            <div className="text-xs font-bold text-slate-700">Finance &amp; Accounting Department</div>
                            <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                              <img 
                                src={getSpecimenSignature(users, { name: 'Agus Setiabudi', role: 'ACCOUNTING' })} 
                                alt="TTD Agus Setiabudi" 
                                style={{ maxHeight: '42px', width: 'auto', objectFit: 'contain' }}
                              />
                            </div>
                            <div className="font-black text-xs uppercase underline">Agus Setiabudi</div>
                            <div className="text-[10px] font-bold text-slate-700">Chief Accounting</div>
                            <div className="text-[9px] text-slate-500 font-mono">Tgl: {toDisplayDate(file.endDate) || new Date().toLocaleDateString('id-ID')}</div>
                          </td>
                          <td>
                            <div className="font-bold text-[10px] uppercase text-slate-500">DISETUJUI OLEH:</div>
                            <div className="text-xs font-bold text-slate-700">Executive General Management</div>
                            <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                              <img 
                                src={getSpecimenSignature(users, { name: 'Ari Soplanit', role: 'GM' })} 
                                alt="TTD Ari Soplanit" 
                                style={{ maxHeight: '42px', width: 'auto', objectFit: 'contain' }}
                              />
                            </div>
                            <div className="font-black text-xs uppercase underline">Ari Soplanit</div>
                            <div className="text-[10px] font-bold text-slate-700">General Manager</div>
                            <div className="text-[9px] text-slate-500 font-mono">Tgl: {toDisplayDate(file.endDate) || new Date().toLocaleDateString('id-ID')}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* LEMBAR 2: LAMPIRAN BUKTI FISIK 1 BARIS ISI 2 NOTA (SESUAI REQUEST USER) */}
                    <div className="break-before-page pt-6 border-t-2 border-slate-900 space-y-4">
                      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={GMCC_LOGO_DARK} 
                            alt="GMCC Logo" 
                            className="gmcc-logo h-8 w-auto object-contain shrink-0" 
                            style={{ maxHeight: '32px', height: '32px', maxWidth: '130px', width: 'auto', objectFit: 'contain' }}
                          />
                          <div>
                            <h2 className="text-xs font-black uppercase text-slate-950">
                              LAMPIRAN BUKTI NOTA FISIK • 1 BARIS 2 NOTA
                            </h2>
                            <div className="text-[9px] text-slate-600">
                              BERKAS TAGIHAN NO: {file.fileNumber}{file.itdcInvoiceNumber ? ` • NO. INV ITDC: ${file.itdcInvoiceNumber}` : ''} • TOTAL {file.items.length} BUKTI NOTA RESMI
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                            Total: {formatRupiah(file.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* 1 Baris 2 Nota Grid Container */}
                      <div className="receipt-grid-container">
                        {file.items.map((item, idx) => {
                          const proofSrc = item.proofImageUrl || generateReceiptSvg(
                            item.vendorName,
                            item.receiptNumber,
                            item.date,
                            item.amount,
                            item.description
                          );

                          return (
                            <div key={item.id || idx} className="receipt-card-item">
                              <div className="receipt-card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ background: '#06b6d4', color: '#0f172a', fontWeight: 'bold', padding: '1px 5px', borderRadius: '3px' }}>
                                    #{idx + 1}
                                  </span>
                                  <span className="font-mono font-bold" style={{ color: '#bae6fd' }}>
                                    {item.receiptNumber}
                                  </span>
                                </div>
                                <span className="font-mono font-black" style={{ color: '#fde047' }}>
                                  {formatRupiah(item.amount)}
                                </span>
                              </div>

                              <div className="receipt-card-sub">
                                <div>
                                  <b>{item.date}</b> • {item.vendorName}
                                </div>
                                <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                                  {item.department} | {item.glAccountCode}
                                </span>
                              </div>

                              <div className="receipt-card-imgbox">
                                <img 
                                  src={proofSrc} 
                                  alt={`Nota #${idx + 1}`}
                                  loading="lazy"
                                />
                              </div>

                              <div className="receipt-card-footer">
                                <div style={{ maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <b>{item.description}</b>
                                </div>
                                <div style={{ fontWeight: 'bold', color: '#047857' }}>
                                  LUNAS
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL: BROWSE ITEMS & GALLERY */}
      {selectedFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-slate-900 border border-teal-500/30 text-slate-100 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-white text-base">
                      Detail Berkas Tagihan Kas Kecil
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {selectedFileModal.fileNumber}
                    </span>
                    {selectedFileModal.itdcInvoiceNumber && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ITDC: {selectedFileModal.itdcInvoiceNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Periode: <b className="text-white">{toDisplayDate(selectedFileModal.startDate)} - {toDisplayDate(selectedFileModal.endDate)}</b> • Total: <b className="text-amber-300 font-mono">{formatRupiah(selectedFileModal.totalAmount)}</b> ({selectedFileModal.items.length} Nota Terkunci)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFileModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: Gallery of receipts (1 row 2 receipts) */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Editor No. Invoice ITDC (Wajib) untuk Sambungan Track Record */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <label className="block text-xs font-bold text-emerald-900">
                    No. Invoice ITDC (Wajib):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={detailItdcInput}
                      onChange={(e) => setDetailItdcInput(e.target.value.toUpperCase())}
                      placeholder="INV/GMCC-ITDC/2026/X-XXX"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-emerald-400 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const d = selectedFileModal.endDate ? new Date(selectedFileModal.endDate) : new Date();
                        setDetailItdcInput(formatItdcInvoiceNumber(d.getFullYear(), d.getMonth() + 1, billingFiles.indexOf(selectedFileModal) + 1));
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-bold border border-emerald-300 shrink-0"
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateFileItdcInvoice(selectedFileModal, detailItdcInput)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0"
                    >
                      Simpan No. Invoice ITDC
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
                <div className="text-slate-300">
                  <span>Pagu Terpakai: <b className="text-amber-300 font-mono font-bold">{formatRupiah(selectedFileModal.totalAmount)}</b></span>
                  <span className="mx-2">•</span>
                  <span>Batas Pagu: <b className="text-white font-mono">Rp 50.000.000</b></span>
                  <span className="mx-2">•</span>
                  <span className="text-emerald-400 font-semibold">✓ Integritas Tanggal Utuh</span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePrintFile(selectedFileModal)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak PDF</span>
                </button>
              </div>

              {/* Gallery 1 baris 2 nota */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedFileModal.items.map((item, idx) => {
                  const proofSrc = item.proofImageUrl || generateReceiptSvg(
                    item.vendorName,
                    item.receiptNumber,
                    item.date,
                    item.amount,
                    item.description
                  );

                  return (
                    <div 
                      key={item.id || idx}
                      className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 flex flex-col justify-between shadow-lg"
                    >
                      {/* Top Bar */}
                      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold font-mono text-[11px]">
                            #{idx + 1}
                          </span>
                          <span className="font-mono font-bold text-white truncate max-w-[170px]">
                            {item.receiptNumber}
                          </span>
                        </div>
                        <span className="font-mono font-black text-amber-300 text-sm">
                          {formatRupiah(item.amount)}
                        </span>
                      </div>

                      {/* Info Sub-bar */}
                      <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
                        <div>
                          <span>Tgl: <b className="font-mono text-white">{item.date}</b></span>
                          <span className="mx-1.5">•</span>
                          <span className="font-semibold text-slate-200">{item.vendorName}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                          {item.glAccountCode}
                        </span>
                      </div>

                      {/* Image Frame */}
                      <div className="h-48 p-2.5 bg-slate-900/30 flex items-center justify-center relative overflow-hidden group">
                        <img 
                          src={proofSrc} 
                          alt="Bukti Nota"
                          className="max-h-full max-w-full object-contain rounded-lg group-hover:scale-105 transition-transform" 
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedProofPreview(item)}
                          className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                        >
                          <Eye className="w-5 h-5 mr-1" />
                          <span>Perbesar Bukti Nota</span>
                        </button>
                      </div>

                      {/* Footer */}
                      <div className="p-3 bg-slate-900/80 border-t border-slate-800 text-xs flex items-center justify-between">
                        <div className="truncate max-w-[260px] text-slate-300">
                          {item.description}
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                          ✓ LUNAS
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-t border-slate-800 shrink-0">
              <div className="text-xs text-slate-400">
                Berkas Terkunci Resmi: <b className="text-teal-400 font-mono">{selectedFileModal.fileNumber}</b>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFileModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU BUKTI NOTA BESAR */}
      {selectedProofPreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-400" />
                <span className="font-mono font-bold text-sm text-teal-300">
                  {selectedProofPreview.receiptNumber}
                </span>
                <span className="text-xs text-slate-400 font-medium">({selectedProofPreview.vendorName})</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProofPreview(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto flex items-center justify-center p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <img 
                src={selectedProofPreview.proofImageUrl || generateReceiptSvg(
                  selectedProofPreview.vendorName,
                  selectedProofPreview.receiptNumber,
                  selectedProofPreview.date,
                  selectedProofPreview.amount,
                  selectedProofPreview.description
                )} 
                alt="Nota Fisik" 
                className="max-h-[500px] w-auto object-contain rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
              <div>
                <span>Nominal: <b className="text-amber-300 font-mono">{formatRupiah(selectedProofPreview.amount)}</b></span>
                <span className="mx-2">•</span>
                <span>Tgl: <b className="font-mono">{selectedProofPreview.date}</b></span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProofPreview(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENCAIRAN BERKAS (DISBURSEMENT) */}
      {disbursementModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Konfirmasi Pencairan Kas Kecil</h3>
              </div>
              <button
                type="button"
                onClick={() => setDisbursementModalFile(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDisbursement} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px]">No. Berkas Tagihan:</div>
                <div className="font-mono font-bold text-teal-300 text-sm">{disbursementModalFile.fileNumber}</div>
                <div className="flex items-center justify-between pt-1 text-slate-300">
                  <span>Nominal Pencairan:</span>
                  <span className="font-mono font-black text-amber-300 text-sm">{formatRupiah(disbursementModalFile.totalAmount)}</span>
                </div>
              </div>

              {/* No. Invoice ITDC (Wajib) */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-emerald-900 font-bold text-xs">No. Invoice ITDC (Wajib):</label>
                  <button
                    type="button"
                    onClick={() => {
                      const d = disbursementModalFile.endDate ? new Date(disbursementModalFile.endDate) : new Date();
                      setDisburseItdcInvoice(formatItdcInvoiceNumber(d.getFullYear(), d.getMonth() + 1, billingFiles.indexOf(disbursementModalFile) + 1));
                    }}
                    className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                  >
                    Auto
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={disburseItdcInvoice}
                  onChange={(e) => setDisburseItdcInvoice(e.target.value.toUpperCase())}
                  placeholder="INV/GMCC-ITDC/2026/X-XXX"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-400 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Bank Pembayar / Rekening Sumber *</label>
                <select
                  value={disburseBank}
                  onChange={(e) => setDisburseBank(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500 font-semibold"
                >
                  <option value="Bank Mandiri (161-00-1122334-9) Operasional GMCC">Bank Mandiri (161-00-1122334-9) Operasional GMCC</option>
                  <option value="Bank BCA (088-2993388) Kas Operasional">Bank BCA (088-2993388) Kas Operasional</option>
                  <option value="Bank BNI (034-8829911) Holding ITDC">Bank BNI (034-8829911) Holding ITDC</option>
                  <option value="Tunai / Kasir Brankas Finance GMCC">Tunai / Kasir Brankas Finance GMCC</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tanggal Cair *</label>
                  <input
                    type="date"
                    required
                    value={disburseDate}
                    onChange={(e) => setDisburseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nomor Referensi Transfer *</label>
                  <input
                    type="text"
                    required
                    value={disburseRef}
                    onChange={(e) => setDisburseRef(e.target.value)}
                    placeholder="TRF/GMCC-CAIR/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Catatan Pencairan (Opsional)</label>
                <textarea
                  rows={2}
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  placeholder="Misal: Dana reimbursement telah masuk ke rekening bendahara kas kecil..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDisbursementModalFile(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Realisasi Pencairan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
