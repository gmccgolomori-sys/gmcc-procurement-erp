import React, { useEffect } from 'react';
import { GoodsReceipt } from '../types/procurement';
import { Printer, X, Building2, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';

interface OfficialGrnModalProps {
  grn: GoodsReceipt;
  onClose: () => void;
}

export const OfficialGrnModal: React.FC<OfficialGrnModalProps> = ({ grn, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (val?: number) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-300 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] overflow-hidden print:border-none print:shadow-none print:max-h-none print:overflow-visible">
        
        {/* Top Sticky Header (always visible on screen, hidden in print) */}
        <div className="print:hidden bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-800 shrink-0 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold truncate">Dokumen Bukti Penerimaan Barang (GRN)</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Cetak atau Simpan ke PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak GRN / PDF</span>
              <span className="sm:hidden">Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Tutup Jendela Bukti Penerimaan Barang"
            >
              <X className="w-4 h-4" />
              <span>Tutup</span>
            </button>
          </div>
        </div>

        {/* Scrollable Printable Area */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-8 space-y-6 text-slate-800 text-xs print:p-2 print:overflow-visible">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shrink-0">
                  GMCC
                </div>
                <div>
                  <h1 className="text-base font-black text-slate-900 uppercase">
                    GOLO MORI CONVENTION CENTER
                  </h1>
                  <p className="text-[11px] text-slate-600">
                    Pos Penerimaan Barang & Pergudangan (Receiving Hub)
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Convention Center by ITDC • Labuan Bajo, Manggarai Barat, NTT
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block px-3 py-1 rounded bg-emerald-600 text-white text-xs font-black uppercase">
                  GOODS RECEIPT NOTE (GRN)
                </div>
                <div className="text-sm font-black text-slate-900 font-mono mt-1">
                  {grn.grnNumber}
                </div>
                <div className="text-[10px] text-slate-500">
                  Ref PO: <span className="font-mono font-bold text-slate-800">{grn.poNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Nama Vendor:</span>
              <div className="font-bold text-slate-900">{grn.vendorName}</div>
              <div className="text-slate-600 mt-1">
                No. Surat Jalan Vendor: <span className="font-mono font-semibold">{grn.deliveryOrderNumber}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500">Waktu Kedatangan Barang:</span>
              <div className="font-bold text-slate-900">{grn.receiptDate}</div>
              <div className="text-slate-600 mt-1">
                Petugas Pemeriksa: <span className="font-semibold text-slate-800">{grn.receivedBy}</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Deskripsi Barang</th>
                  <th className="px-4 py-2.5 text-center">Satuan</th>
                  <th className="px-4 py-2.5 text-center">Dipesan (PO)</th>
                  <th className="px-4 py-2.5 text-center">Diterima (Qty)</th>
                  <th className="px-4 py-2.5 text-center">Ditolak</th>
                  <th className="px-4 py-2.5 text-right">Harga Nota Diaudit</th>
                  <th className="px-4 py-2.5">Kondisi & Catatan Fisik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {grn.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <span className="font-bold text-slate-900">{it.itemName}</span>
                      {it.specification && (
                        <span className="block text-[10px] text-slate-500">{it.specification}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">{it.unit}</td>
                    <td className="px-4 py-2.5 text-center font-mono">{it.qtyOrdered}</td>
                    <td className="px-4 py-2.5 text-center font-mono font-bold text-emerald-700">{it.qtyReceived}</td>
                    <td className="px-4 py-2.5 text-center font-mono text-rose-700">{it.qtyRejected}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-800">
                      {formatRupiah(it.unitPriceNota || it.unitPricePO)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                        {it.condition}
                      </span>
                      {it.remarks && <p className="text-[10px] text-slate-500 mt-0.5">{it.remarks}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {grn.notes && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
              <span className="font-bold">Catatan Gudang Receiving: </span>
              <span>{grn.notes}</span>
            </div>
          )}

          {/* Signatures: Receiving GMCC & Dept Request */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-center">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                Petugas Penerimaan (Purchasing & Receiving),
              </div>
              <div className="h-14 flex items-center justify-center font-serif italic text-emerald-700 text-xs">
                (Telah Diverifikasi Fisik)
              </div>
              <div className="font-bold border-t border-slate-300 pt-1 text-slate-900">
                {grn.receivedBy}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                Dept Request / Pemohon Barang,
              </div>
              <div className="h-14 flex items-center justify-center font-serif italic text-indigo-700 text-xs">
                (Tanda Tangan & Verifikasi Dept)
              </div>
              <div className="font-bold border-t border-slate-300 pt-1 text-slate-900">
                Departemen Pemohon (User Requestor)
              </div>
            </div>
          </div>

          <div className="text-[9px] text-slate-400 text-center flex items-center justify-center gap-1 pt-2">
            <QrCode className="w-3 h-3" />
            <span>Dokumen Bukti Penerimaan Barang Resmi GOLO MORI CONVENTION CENTER by ITDC</span>
          </div>
        </div>

        {/* Dedicated Bottom Sticky Action Bar (hidden in print) */}
        <div className="print:hidden bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600 font-mono">
            No. Dokumen: <span className="font-bold text-slate-900">{grn.grnNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-2 shadow transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Tutup Jendela GRN</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
