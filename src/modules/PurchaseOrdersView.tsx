import React, { useState, useMemo } from 'react';
import { PurchaseOrder, UserAccount } from '../types/procurement';
import { OfficialPoModal } from '../components/OfficialPoModal';
import { 
  Package, 
  Search, 
  Printer, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Building2, 
  FileSpreadsheet,
  Calendar,
  ArrowUpDown,
  DollarSign,
  Filter
} from 'lucide-react';

interface PurchaseOrdersViewProps {
  pos: PurchaseOrder[];
  onUpdatePO?: (updatedPO: PurchaseOrder) => void;
  users?: UserAccount[];
}

export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({ pos, onUpdatePO, users = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPoForModal, setSelectedPoForModal] = useState<PurchaseOrder | null>(null);

  // USER REQUEST: Tambahkan filter sortir bulan dengan default MTD (Month to Date)
  const [periodMode, setPeriodMode] = useState<'MTD' | 'ALL'>('MTD');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    // Cari bulan dari data PO yang ada, atau default ke 2026-10 / bulan sekarang
    if (pos.length > 0 && pos[0].orderDate) {
      return pos[0].orderDate.substring(0, 7);
    }
    return '2026-10';
  });
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

  const formatRupiah = (val?: number) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // 12 Bulan lengkap untuk opsi pemilihan MTD
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (let i = 1; i <= 12; i++) {
      const mStr = i.toString().padStart(2, '0');
      set.add(`2026-${mStr}`);
    }
    pos.forEach(p => {
      if (p.orderDate && p.orderDate.length >= 7) {
        set.add(p.orderDate.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [pos]);

  const formatMonthLabel = (ym: string) => {
    const parts = ym.split('-');
    if (parts.length < 2) return ym;
    const y = parts[0];
    const m = parts[1];
    const mNames: Record<string, string> = {
      '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
      '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
      '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
    };
    return `${mNames[m] || m} ${y}`;
  };

  const handleTogglePoTax = (po: PurchaseOrder) => {
    if (!onUpdatePO) return;
    const currentlyTaxable = po.isTaxable !== false && po.taxPpn > 0;
    const newIsTaxable = !currentlyTaxable;
    const newTaxPpn = newIsTaxable ? Math.round(po.subtotal * 0.11) : 0;
    const newGrandTotal = po.subtotal + newTaxPpn;

    const updated: PurchaseOrder = {
      ...po,
      isTaxable: newIsTaxable,
      taxRate: newIsTaxable ? 0.11 : 0,
      taxPpn: newTaxPpn,
      grandTotal: newGrandTotal
    };

    onUpdatePO(updated);
    if (selectedPoForModal?.id === po.id) {
      setSelectedPoForModal(updated);
    }
  };

  // Filter berdasarkan Search, Status, dan Bulan MTD
  const filteredPos = useMemo(() => {
    let result = pos.filter((p) => {
      const matchesSearch = 
        p.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.prNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      
      const matchesPeriod = periodMode === 'ALL' || (p.orderDate && p.orderDate.startsWith(selectedMonth));

      return matchesSearch && matchesStatus && matchesPeriod;
    });

    // Sortir Tanggal
    result.sort((a, b) => {
      const dateA = a.orderDate || '';
      const dateB = b.orderDate || '';
      if (sortOrder === 'DESC') {
        return dateB.localeCompare(dateA);
      } else {
        return dateA.localeCompare(dateB);
      }
    });

    return result;
  }, [pos, searchTerm, statusFilter, periodMode, selectedMonth, sortOrder]);

  // Statistik Ringkasan MTD
  const mtdStats = useMemo(() => {
    const list = periodMode === 'MTD'
      ? pos.filter(p => p.orderDate && p.orderDate.startsWith(selectedMonth))
      : pos;

    const totalGrandTotal = list.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0);
    const countTotal = list.length;
    const countCompleted = list.filter(p => p.status === 'COMPLETED').length;
    const countIssued = list.filter(p => p.status === 'ISSUED').length;

    return { totalGrandTotal, countTotal, countCompleted, countIssued };
  }, [pos, periodMode, selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            Purchase Order (PO)
          </h1>
          <p className="text-xs text-slate-400">
            Daftar PO resmi GMCC dengan penyortiran MTD (Month to Date). Ketentuan pajak PPN ditentukan seutuhnya oleh Purchasing.
          </p>
        </div>

        {/* MTD Quick Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-2 text-xs">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300 font-semibold">Periode PO:</span>
            <span className="text-cyan-300 font-bold uppercase">
              {periodMode === 'MTD' ? `MTD (${formatMonthLabel(selectedMonth)})` : 'Semua Periode'}
            </span>
          </div>
        </div>
      </div>

      {/* Ringkasan Statistik MTD Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
            <span>Total Belanja {periodMode === 'MTD' ? 'MTD' : 'Semua'}</span>
            <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-base sm:text-lg font-black text-white font-mono mt-1">
            {formatRupiah(mtdStats.totalGrandTotal)}
          </div>
          <div className="text-[10px] text-cyan-400 mt-0.5">Nilai pengadaan terbit</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
            <span>Jumlah PO {periodMode === 'MTD' ? 'MTD' : ''}</span>
            <Package className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-1">
            {mtdStats.countTotal} PO
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Total dokumen pesanan</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
            <span>PO Baru (Issued)</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base sm:text-lg font-black text-amber-400 font-mono mt-1">
            {mtdStats.countIssued} PO
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Menunggu pengiriman vendor</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
            <span>PO Selesai Diterima</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-1">
            {mtdStats.countCompleted} PO
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Fisik barang telah diterima</div>
        </div>
      </div>

      {/* Filter and Search Bar dengan MTD & Sortir Bulan */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Mode Periode: MTD vs Semua */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setPeriodMode('MTD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                periodMode === 'MTD'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>MTD (Month to Date)</span>
            </button>

            <button
              type="button"
              onClick={() => setPeriodMode('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                periodMode === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Semua Bulan</span>
            </button>
          </div>

          {/* Pilihan Bulan MTD (Aktif jika periodMode === MTD) */}
          {periodMode === 'MTD' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Bulan MTD:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-cyan-500/50 text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sortir Tanggal: Terbaru vs Terlama */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold whitespace-nowrap flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
              Sortir:
            </span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'DESC' | 'ASC')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="DESC">Tanggal Terbaru (Z-A)</option>
              <option value="ASC">Tanggal Terlama (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-800/80">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor PO, vendor, atau nomor PR referensi..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 shrink-0"
          >
            <option value="ALL">Semua Status PO</option>
            <option value="ISSUED">ISSUED (Baru Terbit)</option>
            <option value="PARTIALLY_RECEIVED">PARTIALLY RECEIVED</option>
            <option value="COMPLETED">COMPLETED (Barang Lengkap Diterima)</option>
          </select>
        </div>
      </div>

      {/* PO Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700">
              <tr>
                <th className="px-5 py-3.5">Nomor PO</th>
                <th className="px-4 py-3.5">Tanggal Order</th>
                <th className="px-4 py-3.5">Vendor / Rekanan</th>
                <th className="px-4 py-3.5">Departemen</th>
                <th className="px-4 py-3.5">Nilai PO &amp; PPN</th>
                <th className="px-4 py-3.5 text-center">Status Pajak (Purchasing)</th>
                <th className="px-4 py-3.5">Ref PR</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi &amp; Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredPos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    Belum ada Purchase Order yang cocok.
                  </td>
                </tr>
              ) : (
                filteredPos.map((po) => {
                  const isTax = po.isTaxable !== false && po.taxPpn > 0;
                  return (
                    <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-white">
                        {po.poNumber}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        {po.orderDate}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{po.vendorName}</div>
                        <div className="text-[10px] text-slate-500">{po.vendorAddress}</div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-300">
                        {po.department}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-mono font-black text-cyan-300">{formatRupiah(po.grandTotal)}</div>
                        <div className="text-[10px] text-slate-400">
                          Subtotal: {formatRupiah(po.subtotal)}
                        </div>
                      </td>

                      {/* Status Pajak ditentukan Purchasing */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePoTax(po)}
                          disabled={!onUpdatePO}
                          title="Klik untuk mengubah status pajak (Wewenang Purchasing)"
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all inline-flex items-center gap-1 ${
                            isTax
                              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                        >
                          <span>{isTax ? 'PPN 11% (PKP)' : 'Bebas PPN (0%)'}</span>
                          <span className="text-[9px] opacity-70">⚙️</span>
                        </button>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        {po.prNumber}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          po.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {po.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedPoForModal(po)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white border border-slate-700 inline-flex items-center gap-1.5 transition-colors font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Lihat PO</span>
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

      {/* Official PO Printable Modal */}
      {selectedPoForModal && (
        <OfficialPoModal
          po={selectedPoForModal}
          onClose={() => setSelectedPoForModal(null)}
          users={users}
        />
      )}
    </div>
  );
};
