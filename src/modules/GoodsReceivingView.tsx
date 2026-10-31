import React, { useState } from 'react';
import { GoodsReceipt, GoodsReceiptItem, PurchaseOrder, UserAccount } from '../types/procurement';
import { OfficialGrnModal } from '../components/OfficialGrnModal';
import { 
  Truck, 
  Search, 
  Printer, 
  CheckCircle2, 
  Package, 
  AlertCircle,
  FileCheck2,
  DollarSign,
  Building2,
  X,
  ShieldAlert
} from 'lucide-react';

interface GoodsReceivingViewProps {
  grns: GoodsReceipt[];
  pos: PurchaseOrder[];
  currentUser: UserAccount;
  onSaveGRN: (grn: GoodsReceipt, updatedPO: PurchaseOrder) => void;
}

export const GoodsReceivingView: React.FC<GoodsReceivingViewProps> = ({
  grns,
  pos,
  currentUser,
  onSaveGRN
}) => {
  // Requirement: "YG DAPAT MENERIMA BARANG HANYA PURCHASING."
  const canReceiveGoods = currentUser.role === 'PURCHASING' || currentUser.role === 'ADMIN';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrnForModal, setSelectedGrnForModal] = useState<GoodsReceipt | null>(null);

  // Direct PO selected from the table for receiving
  const [targetPoForReceiving, setTargetPoForReceiving] = useState<PurchaseOrder | null>(null);
  const [deliveryOrderNumber, setDeliveryOrderNumber] = useState('');
  const [receivingNotes, setReceivingNotes] = useState('');

  // Editable receiving items state
  const [auditItems, setAuditItems] = useState<GoodsReceiptItem[]>([]);

  const formatRupiah = (val?: number) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Open receiving form for a specific PO directly from the table
  const openReceivingForPo = (po: PurchaseOrder) => {
    if (!canReceiveGoods) {
      alert('Akses Ditolak: Hanya staf Purchasing yang berwenang melakukan penerimaan barang dan audit nota vendor.');
      return;
    }

    setTargetPoForReceiving(po);
    setDeliveryOrderNumber(`DO/${po.vendorName.substring(0, 4).toUpperCase()}/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`);
    setReceivingNotes('Penerimaan fisik barang di pos receiving GOLO MORI CONVENTION CENTER by ITDC');

    // Pre-populate items with audit fields
    const initialItems: GoodsReceiptItem[] = po.items.map((it) => {
      const remainingQty = Math.max(0, it.quantityOrdered - it.quantityReceived);
      const unitPrice = Number(it.unitPrice) || 0;
      return {
        itemId: it.itemId,
        itemName: it.itemName,
        specification: it.specification,
        unit: it.unit,
        qtyOrdered: it.quantityOrdered,
        qtyReceived: remainingQty,
        qtyRejected: 0,
        unitPricePO: unitPrice,
        unitPriceNota: unitPrice, // Default to PO price, editable by receiving
        totalPriceNota: remainingQty * unitPrice,
        condition: 'Baik & Sesuai',
        rejectionReason: '',
        remarks: 'Kemasan utuh dan suhu cold chain terjaga',
        outletDestination: it.outletDestination || (it.itemName.toLowerCase().includes('salmon') || it.itemName.toLowerCase().includes('nuka') ? 'NUKA' : 'MICE')
      };
    });

    setAuditItems(initialItems);
  };

  const handleItemAuditChange = (index: number, field: keyof GoodsReceiptItem, value: any) => {
    setAuditItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const updated = { ...item, [field]: value };
        if (field === 'qtyReceived' || field === 'unitPriceNota') {
          const qty = field === 'qtyReceived' ? (Number(value) || 0) : item.qtyReceived;
          const price = field === 'unitPriceNota' ? (Number(value) || 0) : item.unitPriceNota;
          updated.totalPriceNota = qty * price;
        }
        return updated;
      }
      return item;
    }));
  };

  const totalAuditedNota = auditItems.reduce((acc, curr) => acc + (Number(curr.totalPriceNota) || 0), 0);

  const handleSubmitGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPoForReceiving) return;
    if (!deliveryOrderNumber.trim()) {
      alert('Nomor Surat Jalan / Nota Vendor wajib diisi.');
      return;
    }

    const nowStr = new Date().toLocaleString('id-ID', { hour12: false });
    const grnNumber = `GRN/GMCC/2026/10/${Math.floor(100 + Math.random() * 900)}`;

    const newGRN: GoodsReceipt = {
      id: `grn-${Date.now()}`,
      grnNumber,
      poId: targetPoForReceiving.id,
      poNumber: targetPoForReceiving.poNumber,
      deliveryOrderNumber,
      receiptDate: `${nowStr} WITA`,
      receivedBy: `${currentUser.name} (Purchasing GMCC)`,
      vendorName: targetPoForReceiving.vendorName,
      totalInvoiceAudited: totalAuditedNota,
      items: auditItems,
      notes: receivingNotes
    };

    // Update quantities in PO
    const updatedPOItems = targetPoForReceiving.items.map(it => {
      const match = auditItems.find(a => a.itemId === it.itemId);
      const addedQty = match ? match.qtyReceived : 0;
      return {
        ...it,
        quantityReceived: it.quantityReceived + addedQty
      };
    });

    const isAllCompleted = updatedPOItems.every(it => it.quantityReceived >= it.quantityOrdered);

    const updatedPO: PurchaseOrder = {
      ...targetPoForReceiving,
      items: updatedPOItems,
      status: isAllCompleted ? 'COMPLETED' : 'PARTIALLY_RECEIVED'
    };

    onSaveGRN(newGRN, updatedPO);
    setTargetPoForReceiving(null);
    alert(`Penerimaan barang ${grnNumber} berhasil disimpan! Harga nota diaudit sebesar ${formatRupiah(totalAuditedNota)}.`);
  };

  // POs waiting for delivery or partially delivered
  const openPOs = pos.filter(p => p.status === 'ISSUED' || p.status === 'PARTIALLY_RECEIVED');

  const filteredGrns = grns.filter((g) => {
    return g.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.deliveryOrderNumber.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-400" />
          Penerimaan Barang Gudang (Goods Receiving / GRN)
        </h1>
        <p className="text-xs text-slate-400">
          Audit harga terbaru sesuai nota, pemeriksaan jumlah barang diterima & reject, serta alokasi outlet Nuka/MICE
        </p>
      </div>

      {/* Role Notice Banner: "YG DAPAT MENERIMA BARANG HANYA PURCHASING" */}
      {!canReceiveGoods && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="font-bold">Akses Penerimaan Barang Terbatas (Purchasing Only)</div>
            <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
              Sesuai regulasi operasional GMCC, hanya staf <b>Purchasing</b> yang berwenang melakukan penerimaan fisik barang, audit harga nota supplier, dan validasi reject. Akun dengan peran lain hanya memiliki akses view & cetak bukti GRN.
            </p>
          </div>
        </div>
      )}

      {/* TABLE 1: DAFTAR PO AKTIF YANG SIAP DITERIMA */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden space-y-2">
        <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-cyan-400" />
            <h2 className="font-bold text-white text-xs">
              Daftar Purchase Order (PO) Aktif Menunggu Kedatangan Barang ({openPOs.length})
            </h2>
          </div>
          <span className="text-[11px] text-cyan-400">
            {canReceiveGoods ? 'Klik tombol "Terima Barang" pada baris PO yang tiba' : 'Mode Baca (View Only)'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Nomor PO</th>
                <th className="px-4 py-3">Vendor / Rekanan</th>
                <th className="px-4 py-3">Departemen</th>
                <th className="px-4 py-3">Batas Kirim</th>
                <th className="px-4 py-3 text-right">Total Nilai</th>
                <th className="px-4 py-3 text-center">Status Barang</th>
                <th className="px-4 py-3 text-right">Aksi Penerimaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {openPOs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada PO yang sedang menunggu penerimaan barang.
                  </td>
                </tr>
              ) : (
                openPOs.map((po) => {
                  const totalItems = po.items.length;
                  const receivedItems = po.items.filter(i => i.quantityReceived >= i.quantityOrdered).length;
                  
                  return (
                    <tr key={po.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-cyan-400">
                        {po.poNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {po.vendorName}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {po.department}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {po.expectedDeliveryDate}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-cyan-300">
                        {formatRupiah(po.grandTotal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {receivedItems}/{totalItems} Item Diterima
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openReceivingForPo(po)}
                          disabled={!canReceiveGoods}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                            canReceiveGoods
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          }`}
                          title={canReceiveGoods ? 'Buka formulir audit fisik & nota' : 'Hanya staf Purchasing yang dapat menerima barang'}
                        >
                          Terima Barang (Purchasing)
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

      {/* TABLE 2: HISTORI PENERIMAAN BARANG (GRN) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden space-y-2">
        <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-white text-xs">
              Histori Surat Tanda Penerimaan Barang (GRN) Resmi GMCC ({filteredGrns.length})
            </h2>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor GRN/PO/Vendor..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Nomor GRN</th>
                <th className="px-4 py-3">Waktu Penerimaan</th>
                <th className="px-4 py-3">Ref PO</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Surat Jalan / Nota</th>
                <th className="px-4 py-3">Total Nota Diaudit</th>
                <th className="px-4 py-3">Penerima</th>
                <th className="px-4 py-3 text-right">Cetak Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredGrns.map((g) => (
                <tr key={g.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400">{g.grnNumber}</td>
                  <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">{g.receiptDate}</td>
                  <td className="px-4 py-3 font-mono text-white font-semibold">{g.poNumber}</td>
                  <td className="px-4 py-3 text-slate-200 font-medium">{g.vendorName}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{g.deliveryOrderNumber}</td>
                  <td className="px-4 py-3 font-mono font-bold text-cyan-300">{formatRupiah(g.totalInvoiceAudited || 0)}</td>
                  <td className="px-4 py-3 text-slate-400">{g.receivedBy.split('(')[0]}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedGrnForModal(g)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white border border-slate-700 inline-flex items-center gap-1.5 font-semibold text-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Bukti GRN</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL AUDIT PENERIMAAN BARANG DARI PO YANG DIPILIH */}
      {targetPoForReceiving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900 shrink-0">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-400" />
                  Audit Penerimaan Barang & Nota: <span className="text-cyan-400 font-mono">{targetPoForReceiving.poNumber}</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Vendor: {targetPoForReceiving.vendorName} • Departemen: {targetPoForReceiving.department}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTargetPoForReceiving(null)}
                className="px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Tutup Formulir Penerimaan"
              >
                <X className="w-4 h-4" />
                <span>Tutup</span>
              </button>
            </div>

            <form onSubmit={handleSubmitGRN} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nomor Surat Jalan / Nota Fisik Vendor *
                  </label>
                  <input
                    type="text"
                    value={deliveryOrderNumber}
                    onChange={(e) => setDeliveryOrderNumber(e.target.value)}
                    placeholder="Contoh: DO/FLORES/2026/8892"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Petugas Pemeriksa Purchasing
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${currentUser.name} (Purchasing GMCC)`}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400"
                  />
                </div>
              </div>

              {/* High-density Auditing Table */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-[11px]">
                    Audit Rincian Barang Datang, Harga Nota, dan Reject:
                  </span>
                  <span className="text-[11px] text-amber-400">
                    *Sesuaikan harga terbaru dengan nota fisik dari supplier
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-3 py-2.5">Barang</th>
                        <th className="px-3 py-2.5 text-center">Satuan</th>
                        <th className="px-3 py-2.5 text-center">Qty PO</th>
                        <th className="px-3 py-2.5 text-center w-24">Qty Diterima</th>
                        <th className="px-3 py-2.5 text-center w-20">Reject</th>
                        <th className="px-3 py-2.5 text-right w-32">Harga Nota (Audit)</th>
                        <th className="px-3 py-2.5 text-right w-36">Total Nota</th>
                        <th className="px-3 py-2.5 w-32">Outlet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {auditItems.map((it, idx) => (
                        <tr key={it.itemId}>
                          <td className="px-3 py-2">
                            <span className="font-bold text-white block">{it.itemName}</span>
                            {it.specification && (
                              <span className="text-[10px] text-slate-400 block">{it.specification}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center font-mono text-slate-400">{it.unit}</td>
                          <td className="px-3 py-2 text-center font-mono">{it.qtyOrdered}</td>
                          
                          {/* Qty Received Input */}
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              max={it.qtyOrdered}
                              value={it.qtyReceived}
                              onChange={(e) => handleItemAuditChange(idx, 'qtyReceived', e.target.value)}
                              className="w-full text-center px-2 py-1 rounded bg-slate-800 border border-emerald-500/50 text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
                            />
                          </td>

                          {/* Qty Reject Input */}
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              value={it.qtyRejected}
                              onChange={(e) => handleItemAuditChange(idx, 'qtyRejected', e.target.value)}
                              className="w-full text-center px-2 py-1 rounded bg-slate-800 border border-rose-500/50 text-rose-300 font-mono font-bold focus:outline-none focus:border-rose-400"
                            />
                          </td>

                          {/* Audit Unit Price Nota */}
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="500"
                              value={it.unitPriceNota}
                              onChange={(e) => handleItemAuditChange(idx, 'unitPriceNota', e.target.value)}
                              className="w-full text-right px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-400"
                            />
                          </td>

                          {/* Total Price Nota (Computed) */}
                          <td className="px-3 py-2 text-right font-mono font-bold text-cyan-300">
                            {formatRupiah(it.totalPriceNota)}
                          </td>

                          {/* Outlet Destination (2 Outlets: NUKA / MICE) */}
                          <td className="px-3 py-2">
                            <select
                              value={it.outletDestination || 'NUKA'}
                              onChange={(e) => handleItemAuditChange(idx, 'outletDestination', e.target.value)}
                              className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-[10px]"
                            >
                              <option value="NUKA">Nuka Resto</option>
                              <option value="MICE">MICE Banquet</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Audited */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <div className="text-slate-400 text-xs">
                  Alokasi biaya bahan makanan ini otomatis masuk ke perhitungan <b>Daily Food Flash</b> setelah disimpan.
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-3">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Total Nota Diaudit:</span>
                  <span className="text-lg font-black text-cyan-400 font-mono">
                    {formatRupiah(totalAuditedNota)}
                  </span>
                </div>
              </div>

              </div>

              {/* Modal Sticky Bottom Action Bar */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setTargetPoForReceiving(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Batal / Tutup</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Penerimaan & Audit Nota (GRN)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official GRN Document Modal */}
      {selectedGrnForModal && (
        <OfficialGrnModal
          grn={selectedGrnForModal}
          onClose={() => setSelectedGrnForModal(null)}
        />
      )}
    </div>
  );
};
