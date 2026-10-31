import React from 'react';
import { 
  PurchaseRequisition, 
  PurchaseOrder, 
  GoodsReceipt, 
  FoodFlashRecord, 
  UserAccount,
  AuditLog 
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
  Percent
} from 'lucide-react';

interface DashboardOverviewProps {
  prs: PurchaseRequisition[];
  pos: PurchaseOrder[];
  grns: GoodsReceipt[];
  foodFlash: FoodFlashRecord[];
  currentUser: UserAccount;
  auditLogs: AuditLog[];
  onNavigate: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  prs,
  pos,
  grns,
  foodFlash,
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

  // Latest Food Flash data for today
  const latestFF = foodFlash[0] || {
    date: '2026-10-27',
    nukaRevenue: 16800000,
    nukaFoodCost: 4872000,
    nukaFoodCostPercentage: 29.0,
    miceRevenue: 48500000,
    miceFoodCost: 14065000,
    miceFoodCostPercentage: 29.0,
    combinedRevenue: 65300000,
    combinedFoodCost: 18937000,
    combinedFoodCostPercentage: 29.0,
    targetFoodCostPercentage: 32.0,
    notes: 'Operasional harian'
  };

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
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            Kelola Food Flash
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. NUKA BEACH CLUB */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold text-[10px] uppercase">
                1. NUKA BEACH CLUB
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${latestFF.nukaFoodCostPercentage <= 32 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {latestFF.nukaFoodCostPercentage <= 32 ? 'Target Tercapai' : 'Over Target'}
              </span>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Revenue NUKA BEACH CLUB</div>
              <div className="text-xl font-black text-white font-mono mt-0.5">
                {formatRupiah(latestFF.nukaRevenue)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Food Cost NUKA BEACH CLUB:</span>
                <span className="font-mono font-bold text-amber-300">{formatRupiah(latestFF.nukaFoodCost)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Food Cost Ratio:</span>
                <span className={`font-mono font-black ${latestFF.nukaFoodCostPercentage <= 32 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {latestFF.nukaFoodCostPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* 2. MICE CONVENTION & BANQUET */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold text-[10px] uppercase">
                2. MICE & Banquet Events
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${latestFF.miceFoodCostPercentage <= 32 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {latestFF.miceFoodCostPercentage <= 32 ? 'Target Tercapai' : 'Over Target'}
              </span>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Revenue Banquet MICE</div>
              <div className="text-xl font-black text-white font-mono mt-0.5">
                {formatRupiah(latestFF.miceRevenue)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Food Cost MICE:</span>
                <span className="font-mono font-bold text-amber-300">{formatRupiah(latestFF.miceFoodCost)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Food Cost Ratio:</span>
                <span className={`font-mono font-black ${latestFF.miceFoodCostPercentage <= 32 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {latestFF.miceFoodCostPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* 3. GABUNGAN (TOTAL F&B GMCC) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/30 shadow-xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[10px] uppercase">
                3. Total Gabungan F&B GMCC
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${latestFF.combinedFoodCostPercentage <= 32 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                {latestFF.combinedFoodCostPercentage <= 32 ? 'Efisien (≤32%)' : 'Perlu Evaluasi'}
              </span>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Revenue Gabungan</div>
              <div className="text-xl font-black text-cyan-300 font-mono mt-0.5">
                {formatRupiah(latestFF.combinedRevenue)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Total Food Cost:</span>
                <span className="font-mono font-bold text-white">{formatRupiah(latestFF.combinedFoodCost)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Rasio Gabungan:</span>
                <span className={`font-mono font-black text-sm ${latestFF.combinedFoodCostPercentage <= 32 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {latestFF.combinedFoodCostPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRs Section filtered by department */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Permintaan Pembelian (PR) {isSuperAccess ? 'Seluruh Departemen' : `Departemen ${currentUser.department}`}
            </h2>
            <p className="text-xs text-slate-400">
              {isSuperAccess ? 'Daftar pengajuan menanti persetujuan berjenjang' : 'Hanya menampilkan data pengajuan departemen Anda'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('prs')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            Lihat Semua PR
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {userDeptPRs.slice(0, 4).map((pr) => (
            <div key={pr.id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-mono">{pr.prNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    pr.urgency === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300'
                      : pr.urgency === 'URGENT'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {pr.urgency}
                  </span>
                </div>
                <p className="text-slate-300 font-medium mt-1">{pr.purpose}</p>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Pemohon: {pr.requesterName} • {pr.department} ({pr.costCenterCode})
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-mono font-bold text-white text-sm">
                  {formatRupiah(pr.subtotalEstimated)}
                </div>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {pr.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

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
