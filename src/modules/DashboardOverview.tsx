import React, { useState } from 'react';
import { 
  PurchaseRequisition, 
  PurchaseOrder, 
  GoodsReceipt, 
  FoodFlashRecord, 
  UserAccount,
  AuditLog,
  PettyCashSettlementPeriod
} from '../types/procurement';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  ArrowUpRight,
  Building2, 
  Utensils, 
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Percent,
  Receipt,
  Search,
  PlusCircle,
  X,
  Filter,
  Eye
} from 'lucide-react';

interface DashboardOverviewProps {
  prs: PurchaseRequisition[];
  pos: PurchaseOrder[];
  grns: GoodsReceipt[];
  foodFlash: FoodFlashRecord[];
  pettyCashPeriods?: PettyCashSettlementPeriod[];
  currentUser: UserAccount;
  auditLogs: AuditLog[];
  onNavigate: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  prs,
  pos,
  grns,
  foodFlash,
  pettyCashPeriods = [],
  currentUser,
  auditLogs,
  onNavigate
}) => {
  const formatRupiah = (val?: number) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const isSuperAccess = currentUser.role === 'ADMIN' || currentUser.role === 'GM' || currentUser.role === 'PURCHASING';
  const isAdminOrGm = currentUser.role === 'ADMIN' || currentUser.role === 'GM';

  // Requirement: Filter PRs & POs by department for requester/department roles
  const userDeptPRs = isSuperAccess 
    ? prs 
    : prs.filter(p => p.department.toLowerCase().includes(currentUser.department.toLowerCase()) || currentUser.department.toLowerCase().includes(p.department.toLowerCase()));

  const userDeptPOs = isSuperAccess 
    ? pos 
    : pos.filter(p => p.department.toLowerCase().includes(currentUser.department.toLowerCase()) || currentUser.department.toLowerCase().includes(p.department.toLowerCase()));

  const pendingPRs = userDeptPRs.filter(p => p.status === 'WAITING_PURCHASING' || p.status === 'WAITING_HOD' || p.status === 'WAITING_GM');
  const totalPOIssued = userDeptPOs.length;
  const totalPOValue = userDeptPOs.reduce((sum, p) => sum + p.grandTotal, 0);

  // States for embedded PR Hub on Dashboard
  const [prSearch, setPrSearch] = useState('');
  const [prStatusTab, setPrStatusTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedPrDetail, setSelectedPrDetail] = useState<PurchaseRequisition | null>(null);

  const filteredDashboardPRs = userDeptPRs.filter(p => {
    const matchSearch = 
      p.prNumber.toLowerCase().includes(prSearch.toLowerCase()) ||
      p.requesterName.toLowerCase().includes(prSearch.toLowerCase()) ||
      p.purpose.toLowerCase().includes(prSearch.toLowerCase()) ||
      (p.costCenterName && p.costCenterName.toLowerCase().includes(prSearch.toLowerCase())) ||
      (p.coaName && p.coaName.toLowerCase().includes(prSearch.toLowerCase())) ||
      p.items.some(i => i.itemName.toLowerCase().includes(prSearch.toLowerCase()));

    const isPending = p.status === 'WAITING_PURCHASING' || p.status === 'WAITING_HOD' || p.status === 'WAITING_GM';
    const isApproved = p.status === 'APPROVED' || p.status === 'PO_CREATED';
    const isRejected = p.status === 'REJECTED';

    const matchTab = 
      (prStatusTab === 'ALL' && !isRejected) ||
      (prStatusTab === 'PENDING' && isPending) ||
      (prStatusTab === 'APPROVED' && isApproved) ||
      (prStatusTab === 'REJECTED' && isRejected);

    return matchSearch && matchTab;
  });

  // Dynamic live Petty Cash data connected directly to pettyCashPeriods
  const activePettyPeriod = pettyCashPeriods && pettyCashPeriods.length > 0 ? pettyCashPeriods[0] : null;
  const pettyCashDebit = activePettyPeriod?.items?.reduce((sum, item) => sum + (item.debit || item.amount || 0), 0) || 0;
  const pettyCashKredit = activePettyPeriod?.items?.reduce((sum, item) => sum + (item.kredit || 0), 0) || 0;
  const pettyCashNotaCount = activePettyPeriod?.items?.length || 0;
  const pettyCashPeriodTitle = activePettyPeriod?.periodName || 'PERIODE OPERASIONAL GMCC';

  // Real Food Flash data from foodFlash state
  const hasFoodFlash = foodFlash && foodFlash.length > 0;
  const latestFF = hasFoodFlash ? foodFlash[0] : null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/70 to-slate-900 border border-cyan-500/30 p-6 lg:p-7 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              Procurement ERP & Daily Food Flash • {isSuperAccess ? 'Seluruh GMCC' : `Departemen ${currentUser.department}`}
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Selamat Datang, <span className="text-cyan-400">{currentUser.name}</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isSuperAccess 
                ? 'Monitoring pengadaan barang terpusat, matriks approval sekuensial PO resmi, dan rasio food cost F&B GMCC.'
                : `Dashboard operasional pengadaan barang dan anggaran khusus Departemen ${currentUser.department}.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('pr-create')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition-all hover:scale-105"
            >
              <FileText className="w-4 h-4" />
              <span>Buat PR Baru</span>
            </button>
            <button
              onClick={() => onNavigate('approval-center')}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-all hover:scale-105"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approval Center ({pendingPRs.length})</span>
            </button>
            <button
              onClick={() => onNavigate('petty-cash')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-600/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Receipt className="w-4 h-4 text-slate-950" />
              <span>Petty Cash &amp; Settlement</span>
            </button>
            <button
              onClick={() => onNavigate('spending-analytics')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-600/20 flex items-center gap-2 transition-all hover:scale-105"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Daftar Belanja &amp; Insight</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending PRs */}
        <div 
          onClick={() => onNavigate('approval-center')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              PR Menunggu Review {isSuperAccess ? '' : `(${currentUser.department.split(' ')[0]})`}
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400 font-mono">{pendingPRs.length}</span>
            <span className="text-xs text-slate-400">Pengajuan</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Alur Sekuensial 5 Tahap</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

        {/* Total PO Issued */}
        <div 
          onClick={() => onNavigate('purchase-orders')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Purchase Order (PO) {isSuperAccess ? '' : 'Dept'}
            </span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{totalPOIssued}</span>
            <span className="text-xs text-slate-400">PO Resmi Terbit</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Total: <b className="text-cyan-300 font-mono">{formatRupiah(totalPOValue)}</b></span>
          </div>
        </div>

        {/* Goods Receiving */}
        <div 
          onClick={() => onNavigate('receiving')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Penerimaan Barang (GRN)
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-mono">{grns.length}</span>
            <span className="text-xs text-slate-400">Tanda Terima Gudang</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Pos Receiving GMCC</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Spending & Item Analytics Card */}
        <div 
          onClick={() => onNavigate('spending-analytics')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Daftar Belanja &amp; Insight
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-300 font-mono">Daftar Belanja</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Analisis Item, Dept &amp; COA</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>
      </div>

      {/* SECTION: PETTY CASH & SETTLEMENT BANNER CARD */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/40 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold text-white uppercase tracking-tight">
                  GOLOMORI PETTY CASH &amp; SETTLEMENT (NON-BPP &amp; BPP)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                  {pettyCashPeriodTitle}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Modul rekonsiliasi pengeluaran kas kecil operasional resmi GMCC, form Journal Voucher (JV), serta rekapitulasi bukti fisik nota pengadaan.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('petty-cash')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-105 shrink-0"
          >
            <span>Buka Modul Petty Cash</span>
            <ArrowUpRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pengeluaran (Debit)</span>
            <span className="text-sm sm:text-base font-mono font-black text-amber-300">
              {formatRupiah(pettyCashDebit)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Kredit (Seimbang)</span>
            <span className="text-sm sm:text-base font-mono font-black text-cyan-300">
              {formatRupiah(pettyCashKredit)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Bukti Nota Terlampir</span>
            <span className="text-sm sm:text-base font-mono font-black text-emerald-400">
              {pettyCashNotaCount} Lembar Nota
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Status Validasi</span>
            <span className="text-xs font-bold text-emerald-300 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{pettyCashNotaCount > 0 ? (activePettyPeriod?.status === 'APPROVED' ? 'Disetujui GM & CA' : 'Telah Terverifikasi') : 'Siap Digunakan (0 Nota)'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* REQUIREMENT: 3 TAMPILAN DAILY FOOD FLASH (NUKA, MICE, GABUNGAN) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-400" />
              Daily Food Flash Dashboard (3 Tampilan: NUKA BEACH CLUB, MICE & Gabungan)
            </h2>
            <p className="text-xs text-slate-400">
              Biaya makanan otomatis diambil dari data Receiving F&B dan perbandingan rasio target 32.0%
            </p>
          </div>
          <button
            onClick={() => onNavigate('food-flash')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
          >
            <span>{hasFoodFlash ? 'Kelola Food Flash' : '+ Input Food Flash Hari Ini'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. NUKA BEACH CLUB */}
          <div 
            onClick={() => onNavigate('food-flash')}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 cursor-pointer shadow-xl space-y-3 relative overflow-hidden transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold text-[10px] uppercase">
                1. NUKA BEACH CLUB
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${latestFF ? (latestFF.nukaFoodCostPercentage <= 32 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400') : 'bg-slate-800 text-slate-400'}`}>
                {latestFF ? (latestFF.nukaFoodCostPercentage <= 32 ? 'Target Tercapai' : 'Over Target') : 'Standby Operasional'}
              </span>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Revenue NUKA BEACH CLUB</div>
              <div className="text-xl font-black text-white font-mono mt-0.5">
                {formatRupiah(latestFF?.nukaRevenue || 0)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Food Cost NUKA:</span>
                <span className="font-mono font-bold text-amber-300">{formatRupiah(latestFF?.nukaFoodCost || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Food Cost Ratio:</span>
                <span className={`font-mono font-black ${latestFF ? (latestFF.nukaFoodCostPercentage <= 32 ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-400'}`}>
                  {latestFF ? `${latestFF.nukaFoodCostPercentage}%` : '0.0%'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. MICE CONVENTION & BANQUET */}
          <div 
            onClick={() => onNavigate('food-flash')}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 cursor-pointer shadow-xl space-y-3 relative overflow-hidden transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold text-[10px] uppercase">
                2. MICE & Banquet Events
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${latestFF ? (latestFF.miceFoodCostPercentage <= 32 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400') : 'bg-slate-800 text-slate-400'}`}>
                {latestFF ? (latestFF.miceFoodCostPercentage <= 32 ? 'Target Tercapai' : 'Over Target') : 'Standby Operasional'}
              </span>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Revenue Banquet MICE</div>
              <div className="text-xl font-black text-white font-mono mt-0.5">
                {formatRupiah(latestFF?.miceRevenue || 0)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Food Cost MICE:</span>
                <span className="font-mono font-bold text-amber-300">{formatRupiah(latestFF?.miceFoodCost || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Food Cost Ratio:</span>
                <span className={`font-mono font-black ${latestFF ? (latestFF.miceFoodCostPercentage <= 32 ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-400'}`}>
                  {latestFF ? `${latestFF.miceFoodCostPercentage}%` : '0.0%'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. GABUNGAN (TOTAL F&B GMCC) */}
          <div 
            onClick={() => onNavigate('food-flash')}
            className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/30 hover:border-emerald-400 cursor-pointer shadow-xl space-y-3 relative overflow-hidden transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[10px] uppercase">
                3. Total Gabungan F&B GMCC
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${latestFF ? (latestFF.combinedFoodCostPercentage <= 32 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300') : 'bg-slate-800 text-slate-400'}`}>
                {latestFF ? (latestFF.combinedFoodCostPercentage <= 32 ? 'Efisien (≤32%)' : 'Perlu Evaluasi') : 'Standby'}
              </span>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Revenue Gabungan</div>
              <div className="text-xl font-black text-cyan-300 font-mono mt-0.5">
                {formatRupiah(latestFF?.combinedRevenue || 0)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Total Food Cost:</span>
                <span className="font-mono font-bold text-white">{formatRupiah(latestFF?.combinedFoodCost || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Rasio Gabungan:</span>
                <span className={`font-mono font-black text-sm ${latestFF ? (latestFF.combinedFoodCostPercentage <= 32 ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-400'}`}>
                  {latestFF ? `${latestFF.combinedFoodCostPercentage}%` : '0.0%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRs Section (MODUL DAFTAR PR TERINTEGRASI PENUH DI DASHBOARD) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Daftar Permintaan Pembelian (Purchase Requisition - PR)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pusat monitoring seluruh PR pengadaan {isSuperAccess ? 'semua divisi GMCC' : `Departemen ${currentUser.department}`} dengan alokasi COA &amp; Cost Center
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('pr-create')}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Buat PR Baru</span>
            </button>
            <button
              onClick={() => onNavigate('approval-center')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Approval Center ({pendingPRs.length})</span>
            </button>
          </div>
        </div>

        {/* PR Tabs & Search Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: `Daftar Pembelian Aktif (${userDeptPRs.filter(p => p.status !== 'REJECTED').length})` },
              { id: 'PENDING', label: `Menunggu Persetujuan (${pendingPRs.length})` },
              { id: 'APPROVED', label: `Disetujui / Terbit PO (${userDeptPRs.filter(p => p.status === 'APPROVED' || p.status === 'PO_CREATED').length})` },
              { id: 'REJECTED', label: `Ditolak / Dikembalikan (${userDeptPRs.filter(p => p.status === 'REJECTED').length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPrStatusTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  prStatusTab === tab.id
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={prSearch}
              onChange={(e) => setPrSearch(e.target.value)}
              placeholder="Cari PR, barang, pemohon, COA..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs w-full sm:w-64 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* PR Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-3.5 py-2.5">No. Dokumen PR</th>
                  <th className="px-3.5 py-2.5">Tgl Pengajuan</th>
                  <th className="px-3.5 py-2.5">Pemohon &amp; Departemen</th>
                  <th className="px-3.5 py-2.5">COA Kas Kecil</th>
                  <th className="px-3.5 py-2.5">Tujuan / Deskripsi Pengadaan</th>
                  <th className="px-3.5 py-2.5 text-right">Total Anggaran</th>
                  <th className="px-3.5 py-2.5 text-center">Status</th>
                  <th className="px-3.5 py-2.5 text-right">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredDashboardPRs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                      Tidak ada permintaan pembelian (PR) yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredDashboardPRs.map((pr) => {
                    const isPending = pr.status === 'WAITING_PURCHASING' || pr.status === 'WAITING_HOD' || pr.status === 'WAITING_GM';
                    const isApproved = pr.status === 'APPROVED' || pr.status === 'PO_CREATED';
                    
                    return (
                      <tr key={pr.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-cyan-300">
                          {pr.prNumber}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-400 font-mono text-[11px]">
                          {pr.requestDate}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="text-white font-semibold">{pr.requesterName}</div>
                          <span className="text-[10px] text-slate-400 block">{pr.department}</span>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            {pr.coaName || 'BPP'}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 max-w-xs truncate text-slate-300">
                          {pr.purpose}
                          <span className="text-[10px] text-slate-500 block truncate">
                            {pr.items.map(i => `${i.quantityRequested} ${i.unit} ${i.itemName}`).slice(0, 2).join(', ')}
                            {pr.items.length > 2 ? ` (+${pr.items.length - 2} item lain)` : ''}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-white">
                          {formatRupiah(pr.subtotalEstimated)}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPending
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : isApproved
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}>
                            {pr.status === 'PO_CREATED' ? 'PO Diterbitkan' : pr.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <button
                            onClick={() => setSelectedPrDetail(pr)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white border border-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL RINCIAN DETAIL PR */}
      {selectedPrDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-800/80 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Detail Purchase Requisition: {selectedPrDetail.prNumber}
                  </h3>
                  <div className="text-[10px] text-slate-400">
                    Pemohon: {selectedPrDetail.requesterName} • {selectedPrDetail.department}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPrDetail(null)}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Tujuan Pengadaan:</span>
                  <div className="font-semibold text-white mt-0.5">{selectedPrDetail.purpose}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Kategori COA: <b className="text-emerald-400">{selectedPrDetail.coaName || 'BPP'}</b>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Cost Center &amp; Urgensi:</span>
                  <div className="font-semibold text-white mt-0.5">{selectedPrDetail.costCenterName || selectedPrDetail.costCenterCode}</div>
                  <div className="text-[11px] text-amber-300 font-bold mt-1">
                    Urgensi: {selectedPrDetail.urgency}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-3 py-2">Barang</th>
                      <th className="px-3 py-2 text-center">Satuan</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Harga Satuan</th>
                      <th className="px-3 py-2 text-right">Total Estimasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {selectedPrDetail.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="px-3 py-2">
                          <span className="font-semibold text-white">{it.itemName}</span>
                          {it.specification && (
                            <span className="text-[10px] text-slate-500 block">{it.specification}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">{it.unit}</td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-white">{it.quantityRequested}</td>
                        <td className="px-3 py-2 text-right font-mono text-slate-400">{formatRupiah(it.estimatedPrice)}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-cyan-300">{formatRupiah(it.totalEstimated)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-800 font-bold text-white border-t border-slate-700">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right uppercase text-[10px] text-slate-400">Total Estimasi Anggaran PR:</td>
                      <td className="px-3 py-2 text-right font-mono text-sm text-cyan-300 font-black">{formatRupiah(selectedPrDetail.subtotalEstimated)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Approval History */}
              {selectedPrDetail.approvalHistory && selectedPrDetail.approvalHistory.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="font-bold text-white text-xs block">Riwayat Persetujuan Berjenjang:</span>
                  <div className="space-y-1">
                    {selectedPrDetail.approvalHistory.map((h, i) => (
                      <div key={i} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-[11px] flex justify-between text-slate-300">
                        <span>✓ Disetujui {h.stage}: <b className="text-white">{h.approverName}</b></span>
                        <span className="text-slate-400 font-mono">{h.approvedAt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
              {selectedPrDetail.status === 'REJECTED' ? (
                <button
                  onClick={() => {
                    setSelectedPrDetail(null);
                    onNavigate('prs');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold"
                >
                  Buka di Modul PR untuk Revisi / Hapus
                </button>
              ) : <div />}
              <button
                onClick={() => setSelectedPrDetail(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUIREMENT: REKAM JEJAK KEAMANAN HANYA PADA ADMIN DAN GM */}
      {isAdminOrGm && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="text-sm font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Rekam Jejak Keamanan & Transaksi (Khusus Akses Admin & GM)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Restricted Visibility
            </span>
          </div>
          <div className="space-y-2">
            {auditLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-400">[{log.timestamp}]</span>
                  <span className="text-white font-semibold">@{log.username}</span>
                  <span>•</span>
                  <span>{log.details}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 self-start sm:self-auto font-mono">
                  {log.action}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
