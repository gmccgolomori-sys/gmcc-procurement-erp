import React, { useState } from 'react';
import { PurchaseOrder } from '../types/procurement';
import { OfficialPoModal } from '../components/OfficialPoModal';
import { 
  Package, 
  Search, 
  Printer, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Building2, 
  FileSpreadsheet 
} from 'lucide-react';

interface PurchaseOrdersViewProps {
  pos: PurchaseOrder[];
}

export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({ pos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPoForModal, setSelectedPoForModal] = useState<PurchaseOrder | null>(null);

  const formatRupiah = (val?: number) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const filteredPos = pos.filter((p) => {
    const matchesSearch = 
      p.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            Purchase Order
          </h1>
          <p className="text-xs text-slate-400">
            Daftar PO resmi GMCC yang telah disetujui General Manager dengan 4 kolom otorisasi TTD
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center gap-3">
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
          className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">Semua Status PO</option>
          <option value="ISSUED">ISSUED (Baru Terbit)</option>
          <option value="PARTIALLY_RECEIVED">PARTIALLY RECEIVED</option>
          <option value="COMPLETED">COMPLETED (Barang Lengkap Diterima)</option>
        </select>
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
                <th className="px-4 py-3.5">Nilai PO (Termasuk PPN)</th>
                <th className="px-4 py-3.5">Ref PR</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Dokumen PO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredPos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Belum ada Purchase Order yang cocok.
                  </td>
                </tr>
              ) : (
                filteredPos.map((po) => (
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

                    <td className="px-4 py-3.5 font-mono font-black text-cyan-300">
                      {formatRupiah(po.grandTotal)}
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
                        <span>Lihat Dokumen PO</span>
                      </button>
                    </td>
                  </tr>
                ))
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
        />
      )}
    </div>
  );
};
