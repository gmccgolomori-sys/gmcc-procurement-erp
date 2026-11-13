import React, { useState } from 'react';
import { GoodsReceipt, Vendor, UserAccount } from '../types/procurement';
import { getStoredBankAccounts } from '../utils/procurementStorage';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  FileText, 
  Receipt, 
  Printer, 
  ArrowUpRight, 
  CreditCard,
  X,
  Upload,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  ShieldCheck,
  Scale
} from 'lucide-react';

interface ApAgingViewProps {
  grns: GoodsReceipt[];
  vendors: Vendor[];
  currentUser: UserAccount;
  onUpdateGRN: (updatedGrn: GoodsReceipt) => void;
}

export const ApAgingView: React.FC<ApAgingViewProps> = ({
  grns,
  vendors,
  currentUser,
  onUpdateGRN
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'DETAIL'>('SUMMARY');
  const [agingFilter, setAgingFilter] = useState<'ALL' | 'CURRENT' | '31_60' | '61_90' | 'OVER_90'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('UNPAID');

  // Modal Pelunasan Tagihan
  const availableBankAccounts = getStoredBankAccounts().filter(b => b.isActive);
  const defaultBankString = availableBankAccounts[0] 
    ? `${availableBankAccounts[0].bankName} - Rek. ${availableBankAccounts[0].accountNumber} (${availableBankAccounts[0].purpose})`
    : 'Bank Mandiri - Rek. 161-00-998877 (Operasional GMCC)';
  const [payingGrn, setPayingGrn] = useState<GoodsReceipt | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAccount, setPaymentAccount] = useState(defaultBankString);
  const [paymentReferenceNo, setPaymentReferenceNo] = useState('');
  const [paymentProofNotes, setPaymentProofNotes] = useState('');
  const [paymentProofImage, setPaymentProofImage] = useState('');

  // Modal Preview Nota Fisik
  const [selectedProofModal, setSelectedProofModal] = useState<GoodsReceipt | null>(null);

  const formatRupiah = (val?: number) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Helper untuk menghitung umur hutang (dalam hari)
  const calculateAgingDays = (grn: GoodsReceipt): number => {
    try {
      const now = new Date();
      // Gunakan tanggal penerimaan atau dueDate
      const dateParts = grn.receiptDate.split(' ')[0].split('/');
      let receiptDateObj: Date;
      if (dateParts.length === 3) {
        // format DD/MM/YYYY
        receiptDateObj = new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]));
      } else {
        receiptDateObj = new Date(grn.receiptDate.split(' ')[0]);
      }

      if (isNaN(receiptDateObj.getTime())) {
        return 14; // Default safe fallback
      }

      const diffTime = Math.abs(now.getTime() - receiptDateObj.getTime());
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 15;
    }
  };

  // Filter GRN yang memiliki status hutang atau riwayat pembayaran
  const apGrns = grns.filter(g => {
    // Termasuk yang berstatus UNPAID_AP atau yang paymentMethod AP_INVOICE atau yang belum dibayar
    const isAp = g.paymentStatus === 'UNPAID_AP' || 
                 (g.paymentStatus !== 'PAID' && g.paymentMethod !== 'PETTY_CASH') ||
                 (g.paidDate !== undefined);
    return isAp;
  });

  // Kategorisasi Aging
  const categorizedGrns = apGrns.map(g => {
    const days = calculateAgingDays(g);
    let category: 'CURRENT' | '31_60' | '61_90' | 'OVER_90';
    if (days <= 30) category = 'CURRENT';
    else if (days <= 60) category = '31_60';
    else if (days <= 90) category = '61_90';
    else category = 'OVER_90';

    const netAmount = g.netPaymentAmount || (
      g.taxPPh23Applicable 
        ? g.totalInvoiceAudited - (g.taxPPh23Amount || Math.round(g.totalInvoiceAudited * 0.02))
        : g.totalInvoiceAudited
    );

    return {
      grn: g,
      agingDays: days,
      category,
      netAmount,
      isPaid: g.paymentStatus === 'PAID' || !!g.paidDate
    };
  });

  // Filtered List
  const filteredList = categorizedGrns.filter(item => {
    // Search
    const matchSearch = 
      item.grn.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.grn.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.grn.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.grn.deliveryOrderNumber && item.grn.deliveryOrderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.grn.invoiceNumber && item.grn.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    // Vendor filter
    const matchVendor = selectedVendorFilter === 'ALL' || item.grn.vendorName === selectedVendorFilter;

    // Aging filter
    const matchAging = agingFilter === 'ALL' || item.category === agingFilter;

    // Status filter
    const matchStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'UNPAID' && !item.isPaid) ||
      (statusFilter === 'PAID' && item.isPaid);

    return matchSearch && matchVendor && matchAging && matchStatus;
  });

  // KPI Calculations (Hanya yang belum dibayar)
  const unpaidItems = categorizedGrns.filter(item => !item.isPaid);
  const totalOutstanding = unpaidItems.reduce((acc, curr) => acc + curr.netAmount, 0);
  const currentTotal = unpaidItems.filter(i => i.category === 'CURRENT').reduce((acc, curr) => acc + curr.netAmount, 0);
  const aging31to60Total = unpaidItems.filter(i => i.category === '31_60').reduce((acc, curr) => acc + curr.netAmount, 0);
  const aging61to90Total = unpaidItems.filter(i => i.category === '61_90').reduce((acc, curr) => acc + curr.netAmount, 0);
  const over90Total = unpaidItems.filter(i => i.category === 'OVER_90').reduce((acc, curr) => acc + curr.netAmount, 0);

  // Rekap per Vendor
  const vendorSummaryMap = new Map<string, {
    vendorName: string;
    current: number;
    days31to60: number;
    days61to90: number;
    over90: number;
    total: number;
    invoiceCount: number;
  }>();

  unpaidItems.forEach(item => {
    const vName = item.grn.vendorName;
    if (!vendorSummaryMap.has(vName)) {
      vendorSummaryMap.set(vName, {
        vendorName: vName,
        current: 0,
        days31to60: 0,
        days61to90: 0,
        over90: 0,
        total: 0,
        invoiceCount: 0
      });
    }

    const rec = vendorSummaryMap.get(vName)!;
    rec.total += item.netAmount;
    rec.invoiceCount += 1;
    if (item.category === 'CURRENT') rec.current += item.netAmount;
    else if (item.category === '31_60') rec.days31to60 += item.netAmount;
    else if (item.category === '61_90') rec.days61to90 += item.netAmount;
    else rec.over90 += item.netAmount;
  });

  const vendorSummaryList = Array.from(vendorSummaryMap.values());

  // Handle Konfirmasi Pembayaran
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingGrn) return;

    const updatedGrn: GoodsReceipt = {
      ...payingGrn,
      paymentStatus: 'PAID',
      paidDate: paymentDate,
      paymentReference: paymentReferenceNo || `TRF/GMCC/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      paymentProofImage: paymentProofImage || undefined,
      notes: `${payingGrn.notes ? payingGrn.notes + ' • ' : ''}Lunas via ${paymentAccount} tgl ${paymentDate} (${paymentProofNotes || 'Pelunasan Hutang Dagang'})`
    };

    onUpdateGRN(updatedGrn);
    setPayingGrn(null);
    alert(`Tagihan ${payingGrn.grnNumber} kepada ${payingGrn.vendorName} berhasil dicatat LUNAS!`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            Accounts Payable (AP) Aging &amp; Hutang Dagang Rekanan
          </h1>
          <p className="text-xs text-slate-400">
            Pemantauan jatuh tempo tagihan vendor penerimaan barang (GRN), audit potongan PPh 23 (2%), dan pelunasan transfer bank
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cetak Laporan AP Aging</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Cards: Umur Hutang */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Outstanding */}
        <div 
          onClick={() => { setAgingFilter('ALL'); setStatusFilter('UNPAID'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-lg ${
            agingFilter === 'ALL' && statusFilter === 'UNPAID'
              ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/30'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Hutang Usaha (AP)
            </span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-300 font-mono">
            {formatRupiah(totalOutstanding)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {unpaidItems.length} Tagihan Belum Lunas
          </span>
        </div>

        {/* 0 - 30 Hari (Lancar) */}
        <div 
          onClick={() => { setAgingFilter('CURRENT'); setStatusFilter('UNPAID'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-lg ${
            agingFilter === 'CURRENT'
              ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              0 - 30 Hari (Lancar)
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-white font-mono">
            {formatRupiah(currentTotal)}
          </div>
          <span className="text-[10px] text-emerald-400/80 mt-1 block">
            Belum Jatuh Tempo
          </span>
        </div>

        {/* 31 - 60 Hari */}
        <div 
          onClick={() => { setAgingFilter('31_60'); setStatusFilter('UNPAID'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-lg ${
            agingFilter === '31_60'
              ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/30'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
              31 - 60 Hari
            </span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-black text-white font-mono">
            {formatRupiah(aging31to60Total)}
          </div>
          <span className="text-[10px] text-cyan-400/80 mt-1 block">
            Jatuh Tempo Berjalan
          </span>
        </div>

        {/* 61 - 90 Hari */}
        <div 
          onClick={() => { setAgingFilter('61_90'); setStatusFilter('UNPAID'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-lg ${
            agingFilter === '61_90'
              ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/30'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              61 - 90 Hari
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-black text-white font-mono">
            {formatRupiah(aging61to90Total)}
          </div>
          <span className="text-[10px] text-amber-400/80 mt-1 block">
            Prioritas Pembayaran
          </span>
        </div>

        {/* > 90 Hari (Overdue) */}
        <div 
          onClick={() => { setAgingFilter('OVER_90'); setStatusFilter('UNPAID'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-lg ${
            agingFilter === 'OVER_90'
              ? 'bg-rose-950/40 border-rose-500/60 ring-1 ring-rose-500/30'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
              &gt; 90 Hari (Overdue)
            </span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-black text-rose-300 font-mono">
            {formatRupiah(over90Total)}
          </div>
          <span className="text-[10px] text-rose-400/80 mt-1 block">
            Menunggak / Kritis
          </span>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('SUMMARY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'SUMMARY'
                ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Rekapitulasi per Rekanan ({vendorSummaryList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('DETAIL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'DETAIL'
                ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Buku Rincian Tagihan &amp; Faktur ({filteredList.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
          >
            <option value="UNPAID">Belum Dibayar (Outstanding)</option>
            <option value="PAID">Sudah Lunas (Paid)</option>
            <option value="ALL">Semua Riwayat Tagihan</option>
          </select>

          {/* Filter Aging Bucket */}
          <select
            value={agingFilter}
            onChange={(e) => setAgingFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
          >
            <option value="ALL">Semua Periode Aging</option>
            <option value="CURRENT">0 - 30 Hari (Lancar)</option>
            <option value="31_60">31 - 60 Hari</option>
            <option value="61_90">61 - 90 Hari</option>
            <option value="OVER_90">&gt; 90 Hari (Overdue)</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari vendor, No. GRN, PO..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs w-48 focus:w-64 transition-all focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: REKAPITULASI PER REKANAN (VENDOR SUMMARY) */}
      {activeTab === 'SUMMARY' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <h2 className="font-bold text-white text-xs">
                Daftar Vendor dengan Saldo Hutang Belum Dibayar
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Total Hutang Usaha: <b className="text-amber-300 font-mono">{formatRupiah(totalOutstanding)}</b>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/70 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Nama Vendor Rekanan</th>
                  <th className="px-4 py-3 text-center">Faktur Aktif</th>
                  <th className="px-4 py-3 text-right">0 - 30 Hari</th>
                  <th className="px-4 py-3 text-right">31 - 60 Hari</th>
                  <th className="px-4 py-3 text-right">61 - 90 Hari</th>
                  <th className="px-4 py-3 text-right">&gt; 90 Hari</th>
                  <th className="px-4 py-3 text-right text-amber-400">Total Hutang</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {vendorSummaryList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada tagihan hutang dagang vendor yang aktif atau sesuai filter.
                    </td>
                  </tr>
                ) : (
                  vendorSummaryList.map((v, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white text-sm">{v.vendorName}</div>
                        <span className="text-[10px] text-slate-400">Rekanan Terverifikasi GMCC</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                          {v.invoiceCount} Dokumen
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-400">
                        {v.current > 0 ? formatRupiah(v.current) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-cyan-300">
                        {v.days31to60 > 0 ? formatRupiah(v.days31to60) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-amber-400">
                        {v.days61to90 > 0 ? formatRupiah(v.days61to90) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-rose-400 font-bold">
                        {v.over90 > 0 ? formatRupiah(v.over90) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-amber-300 text-sm">
                        {formatRupiah(v.total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedVendorFilter(v.vendorName);
                            setActiveTab('DETAIL');
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white border border-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Rincian Tagihan</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-800/90 font-bold border-t-2 border-slate-700 text-white">
                <tr>
                  <td className="px-4 py-3 uppercase text-xs">Total Seluruh Rekanan:</td>
                  <td className="px-4 py-3 text-center font-mono">{unpaidItems.length} Faktur</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-400">{formatRupiah(currentTotal)}</td>
                  <td className="px-4 py-3 text-right font-mono text-cyan-300">{formatRupiah(aging31to60Total)}</td>
                  <td className="px-4 py-3 text-right font-mono text-amber-400">{formatRupiah(aging61to90Total)}</td>
                  <td className="px-4 py-3 text-right font-mono text-rose-400">{formatRupiah(over90Total)}</td>
                  <td className="px-4 py-3 text-right font-mono text-amber-300 text-sm font-black">{formatRupiah(totalOutstanding)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BUKU RINCIAN TAGIHAN & FAKTUR (DETAILED INVOICES) */}
      {activeTab === 'DETAIL' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <h2 className="font-bold text-white text-xs">
                Rincian Tagihan per Faktur Penerimaan (GRN &amp; PO)
                {selectedVendorFilter !== 'ALL' && (
                  <span className="text-amber-400 ml-1">({selectedVendorFilter})</span>
                )}
              </h2>
            </div>
            {selectedVendorFilter !== 'ALL' && (
              <button
                onClick={() => setSelectedVendorFilter('ALL')}
                className="text-[11px] text-cyan-400 hover:underline self-start sm:self-auto"
              >
                Tampilkan Semua Vendor
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/70 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">No. GRN / PO</th>
                  <th className="px-4 py-3">Rekanan Vendor</th>
                  <th className="px-4 py-3">Tgl Terima / Tempo</th>
                  <th className="px-4 py-3 text-center">Umur Hutang</th>
                  <th className="px-4 py-3 text-right">Nilai Bruto</th>
                  <th className="px-4 py-3 text-right text-amber-400">PPh 23 (2%)</th>
                  <th className="px-4 py-3 text-right text-cyan-300">Netto Tagihan</th>
                  <th className="px-4 py-3 text-center">Bukti Nota</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada data tagihan faktur yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => {
                    const g = item.grn;
                    const agingCategoryColor = 
                      item.category === 'CURRENT'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : item.category === '31_60'
                        ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        : item.category === '61_90'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30';

                    return (
                      <tr key={g.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-white block">{g.grnNumber}</span>
                          <span className="text-[10px] text-slate-400 font-mono">PO: {g.poNumber}</span>
                          {g.deliveryOrderNumber && (
                            <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">
                              DO: {g.deliveryOrderNumber}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-bold text-white text-xs">{g.vendorName}</div>
                          <span className="text-[10px] text-slate-400">
                            {g.coaName || 'BPP'} • {g.costCenterName || 'GMCC'}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-slate-300 font-mono text-[11px]">{g.receiptDate.split(' ')[0]}</div>
                          <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                            Jatuh Tempo: {g.dueDate || '30 Hari'}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${agingCategoryColor}`}>
                            {item.agingDays} Hari ({item.category === 'CURRENT' ? '0-30' : item.category.replace('_', '-')})
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-slate-300">
                          {formatRupiah(g.totalInvoiceAudited)}
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-amber-400">
                          {g.taxPPh23Applicable ? `- ${formatRupiah(g.taxPPh23Amount || Math.round(g.totalInvoiceAudited * 0.02))}` : '-'}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-cyan-300">
                          {formatRupiah(item.netAmount)}
                        </td>

                        {/* Bukti Nota Modal Trigger */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedProofModal(g)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-[10px] font-bold inline-flex items-center gap-1"
                            title="Lihat foto nota fisik"
                          >
                            <Receipt className="w-3 h-3 text-emerald-400" />
                            <span>{g.receiptProofNumber ? 'Lihat Nota' : 'Struk'}</span>
                          </button>
                        </td>

                        {/* Status Tagihan */}
                        <td className="px-4 py-3 text-center">
                          {item.isPaid ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ✓ Lunas ({g.paidDate || 'Paid'})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              ⏳ Belum Dibayar
                            </span>
                          )}
                        </td>

                        {/* Action Bayar */}
                        <td className="px-4 py-3 text-right">
                          {!item.isPaid ? (
                            <button
                              onClick={() => {
                                setPayingGrn(g);
                                setPaymentReferenceNo(`TRF/GMCC/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1 shadow-sm transition-all"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Bayar</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">
                              Ref: {g.paymentReference || 'Transfer'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PELUNASAN TAGIHAN VENDOR */}
      {payingGrn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-800/80 shrink-0">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Pelunasan Hutang Dagang Rekanan (AP Payment)
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {payingGrn.grnNumber} • Rekanan: {payingGrn.vendorName}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayingGrn(null)}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-5 space-y-4 overflow-y-auto">
              {/* Ringkasan Nilai Tagihan */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Nomor Dokumen Penerimaan:</span>
                  <span className="font-mono text-white font-bold">{payingGrn.grnNumber}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Ref PO &amp; DO Vendor:</span>
                  <span className="font-mono text-white">{payingGrn.poNumber} • {payingGrn.deliveryOrderNumber || '-'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Bruto Nota:</span>
                  <span className="font-mono text-white">{formatRupiah(payingGrn.totalInvoiceAudited)}</span>
                </div>
                {payingGrn.taxPPh23Applicable && (
                  <div className="flex justify-between text-amber-400">
                    <span>Potongan PPh 23 (2%):</span>
                    <span className="font-mono font-bold">- {formatRupiah(payingGrn.taxPPh23Amount || Math.round(payingGrn.totalInvoiceAudited * 0.02))}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                  <span className="text-cyan-300">Total Netto Yang Dibayarkan:</span>
                  <span className="font-mono text-cyan-300 font-black">
                    {formatRupiah(
                      payingGrn.netPaymentAmount || (
                        payingGrn.taxPPh23Applicable 
                          ? payingGrn.totalInvoiceAudited - (payingGrn.taxPPh23Amount || Math.round(payingGrn.totalInvoiceAudited * 0.02))
                          : payingGrn.totalInvoiceAudited
                      )
                    )}
                  </span>
                </div>
              </div>

              {/* Form Input Pembayaran */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">
                    Tanggal Pelunasan / Transfer *
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">
                    Rekening Sumber Pembayaran (Bank GMCC) *
                  </label>
                  <select
                    value={paymentAccount}
                    onChange={(e) => setPaymentAccount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    {availableBankAccounts.map(b => (
                      <option key={b.id} value={`${b.bankName} - Rek. ${b.accountNumber} (${b.purpose})`}>
                        {b.bankName} - Rek. {b.accountNumber} ({b.accountHolder}) — {b.purpose}
                      </option>
                    ))}
                    {availableBankAccounts.length === 0 && (
                      <option value="Bank Mandiri - Rek. 161-00-998877 (Operasional GMCC)">
                        Bank Mandiri - Rek. 161-00-998877 (Operasional GMCC)
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">
                    Nomor Referensi Transfer / No. Cek *
                  </label>
                  <input
                    type="text"
                    value={paymentReferenceNo}
                    onChange={(e) => setPaymentReferenceNo(e.target.value)}
                    placeholder="Contoh: TRF/BCA/2026/01/9921"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">
                    Catatan Pembayaran (Opsional)
                  </label>
                  <textarea
                    value={paymentProofNotes}
                    onChange={(e) => setPaymentProofNotes(e.target.value)}
                    placeholder="Keterangan transfer, nama pembawa cek, atau catatan finance..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    rows={2}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayingGrn(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi Pelunasan &amp; Catat Lunas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW NOTA FISIK */}
      {selectedProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-800/80">
              <span className="font-bold text-white text-xs flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Bukti Fisik Nota: {selectedProofModal.receiptProofNumber || selectedProofModal.deliveryOrderNumber}
              </span>
              <button
                onClick={() => setSelectedProofModal(null)}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-950 overflow-y-auto">
              {selectedProofModal.receiptProofImage ? (
                <img 
                  src={selectedProofModal.receiptProofImage} 
                  alt="Bukti Nota" 
                  className="max-h-[380px] w-auto object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-center p-8 text-slate-500 text-xs">
                  Struk fisik asli tersimpan dalam arsip berkas receiving GMCC.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
