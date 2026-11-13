import React, { useState, useEffect } from 'react';
import { GoodsReceipt } from '../types/procurement';
import { generateReceiptSvg } from '../data/pettyCashMock';
import { SAMPLE_SIGNATURES } from '../data/procurementMock';
import { GMCC_LOGO_WHITE } from '../data/gmccLogo';
import { Printer, X, Building2, CheckCircle2, ShieldCheck, QrCode, FileCheck } from 'lucide-react';

interface OfficialGrnModalProps {
  grn: GoodsReceipt;
  onClose: () => void;
}

export const OfficialGrnModal: React.FC<OfficialGrnModalProps> = ({ grn, onClose }) => {
  const [includeReceiptProof, setIncludeReceiptProof] = useState(true);

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
            {/* Toggle Include Receipt Proof */}
            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-emerald-300 transition-colors">
              <input
                type="checkbox"
                checked={includeReceiptProof}
                onChange={(e) => setIncludeReceiptProof(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-emerald-400 w-3.5 h-3.5 cursor-pointer"
              />
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Sertakan Bukti Nota Fisik</span>
              <span className="md:hidden">Bukti Nota</span>
            </label>

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
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                  <img 
                    src={GMCC_LOGO_WHITE}
                    alt="GMCC Logo" 
                    className="max-h-full max-w-full object-contain" 
                  />
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
              <tfoot className="bg-slate-100/90 font-semibold border-t-2 border-slate-300 text-slate-800">
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right uppercase text-[10px] text-slate-600 font-bold">
                    Subtotal Nota Diaudit:
                  </td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-slate-900">
                    {formatRupiah(grn.totalInvoiceAudited)}
                  </td>
                  <td></td>
                </tr>
                {grn.taxPPh23Applicable && (
                  <tr>
                    <td colSpan={5} className="px-4 py-1.5 text-right uppercase text-[10px] text-amber-700 font-bold">
                      Potongan Pajak PPh 23 (2%):
                    </td>
                    <td className="px-4 py-1.5 text-right font-mono font-bold text-amber-700">
                      - {formatRupiah(grn.taxPPh23Amount || Math.round(grn.totalInvoiceAudited * 0.02))}
                    </td>
                    <td className="px-4 py-1.5 text-[10px] text-amber-800 italic">
                      Dipotong PPh Pasal 23
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-200 text-slate-950">
                  <td colSpan={5} className="px-4 py-2 text-right uppercase text-xs font-black">
                    Total Bersih Yang Harus Dibayar (Netto):
                  </td>
                  <td className="px-4 py-2 text-right font-mono font-black text-sm text-emerald-800">
                    {formatRupiah(grn.netPaymentAmount || (grn.taxPPh23Applicable ? grn.totalInvoiceAudited - (grn.taxPPh23Amount || Math.round(grn.totalInvoiceAudited * 0.02)) : grn.totalInvoiceAudited))}
                  </td>
                  <td className="px-4 py-2 text-[10px]">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      grn.paymentStatus === 'UNPAID_AP'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      {grn.paymentStatus === 'UNPAID_AP' ? `AP Tempo (Due: ${grn.dueDate || '-'})` : 'Lunas (Kas Kecil)'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {grn.notes && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
              <span className="font-bold">Catatan Gudang Receiving: </span>
              <span>{grn.notes}</span>
            </div>
          )}

          {/* Signatures: Receiving GMCC & Dept Request with Attached Digital Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-center">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                Petugas Penerimaan (Purchasing & Receiving),
              </div>
              <div className="h-14 flex items-center justify-center my-0.5">
                <img 
                  src={SAMPLE_SIGNATURES.PURCHASING} 
                  alt="TTD Petugas Receiving" 
                  className="max-h-12 w-auto object-contain mx-auto"
                />
              </div>
              <div className="font-bold border-t border-slate-300 pt-1 text-slate-900">
                {grn.receivedBy}
              </div>
              <div className="text-[9px] text-emerald-700 font-semibold font-mono">
                ✓ Diverifikasi Fisik Gudang GMCC
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                Dept Request / Pemohon Barang,
              </div>
              <div className="h-14 flex items-center justify-center my-0.5">
                <img 
                  src={SAMPLE_SIGNATURES.CHEF} 
                  alt="TTD Pemohon Dept" 
                  className="max-h-12 w-auto object-contain mx-auto"
                />
              </div>
              <div className="font-bold border-t border-slate-300 pt-1 text-slate-900">
                Departemen Pemohon (User Requestor)
              </div>
              <div className="text-[9px] text-indigo-700 font-semibold font-mono">
                ✓ Tanda Tangan &amp; Otorisasi Penerimaan
              </div>
            </div>
          </div>

          <div className="text-[9px] text-slate-400 text-center flex items-center justify-center gap-1 pt-2">
            <QrCode className="w-3 h-3" />
            <span>Dokumen Bukti Penerimaan Barang Resmi GOLO MORI CONVENTION CENTER by ITDC</span>
          </div>

          {/* HALAMAN 2+: LAMPIRAN BUKTI FISIK NOTA & SURAT JALAN SUPPLIER (BISA LEBIH DARI 1 DENGAN PENOMORAN URUT) */}
          {includeReceiptProof && (() => {
            const proofList = (grn.receiptProofItems && grn.receiptProofItems.length > 0)
              ? grn.receiptProofItems
              : (grn.receiptProofImages && grn.receiptProofImages.length > 0)
              ? grn.receiptProofImages.map((img, idx) => ({
                  id: `proof-${idx}`,
                  orderIndex: idx + 1,
                  proofNumber: `${grn.receiptProofNumber || grn.deliveryOrderNumber || 'NOTA'}-${String(idx + 1).padStart(2, '0')}`,
                  imageUrl: img,
                  caption: `Foto Nota Fisik #${idx + 1}`
                }))
              : [{
                  id: 'default-proof',
                  orderIndex: 1,
                  proofNumber: grn.receiptProofNumber || grn.deliveryOrderNumber || 'NOTA-01',
                  imageUrl: grn.receiptProofImage || generateReceiptSvg(
                    grn.vendorName,
                    grn.receiptProofNumber || grn.deliveryOrderNumber,
                    grn.receiptDate.split(' ')[0],
                    grn.totalInvoiceAudited,
                    grn.items.map(i => `${i.qtyReceived} ${i.unit} ${i.itemName}`).slice(0, 3).join(', ')
                  ),
                  caption: `Nota Fisik Utama (${grn.vendorName})`
                }];

            return (
              <div className="break-before-page pt-6 border-t-2 border-slate-900 mt-6 space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center p-1 shrink-0">
                      <img 
                        src={GMCC_LOGO_WHITE}
                        alt="GMCC Logo" 
                        className="max-h-full max-w-full object-contain" 
                      />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 uppercase">
                        LAMPIRAN BUKTI FISIK NOTA &amp; SURAT JALAN SUPPLIER
                      </h2>
                      <p className="text-[10px] text-slate-500">
                        GOLO MORI CONVENTION CENTER • RECEIVING &amp; PURCHASING AUDIT ({proofList.length} Foto Nota Berurut)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-mono text-[10px] font-bold uppercase">
                      LAMPIRAN DOKUMEN PROOF ({proofList.length} NOTA)
                    </span>
                    <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                      GRN Ref: {grn.grnNumber}
                    </div>
                  </div>
                </div>

                {/* Multiple Physical Receipt Cards with Sequential Numbering */}
                <div className="space-y-4">
                  {proofList.map((proof, idx) => (
                    <div key={proof.id || idx} className="avoid-page-break border-2 border-slate-800 rounded-xl overflow-hidden bg-white shadow-sm">
                      <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-400 text-slate-950 font-black text-xs font-mono">
                            NOTA #{proof.orderIndex} DARI {proofList.length}
                          </span>
                          <span className="font-mono text-xs font-bold text-emerald-200">
                            No. Dokumen: {proof.proofNumber}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-amber-300 text-xs">
                          {proof.caption || `Foto Arsip Bukti Nota #${proof.orderIndex}`}
                        </span>
                      </div>

                      <div className="px-4 py-1.5 bg-slate-100 border-b border-slate-200 text-[10px] flex items-center justify-between text-slate-700">
                        <div>
                          <span>Rekanan: <b>{grn.vendorName}</b></span>
                          <span className="mx-2">•</span>
                          <span>Waktu Kedatangan: <b className="font-mono">{grn.receiptDate}</b></span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-200 font-bold uppercase text-[9px]">
                          PO: {grn.poNumber}
                        </span>
                      </div>

                      <div className="h-80 sm:h-96 p-4 bg-slate-50 flex items-center justify-center border-b border-slate-200 relative overflow-hidden">
                        <img 
                          src={proof.imageUrl}
                          alt={`Bukti Fisik Nota ${proof.proofNumber}`}
                          className="max-h-full max-w-full object-contain filter contrast-105"
                        />
                        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
                          ✓ ARSIP FISIK #{proof.orderIndex} TELAH DIAUDIT
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 text-[10px] flex items-center justify-between text-slate-600">
                        <span>Petugas Receiving: <b>{grn.receivedBy}</b></span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                          STATUS: DIVERIFIKASI LENGKAP #{proof.orderIndex}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="avoid-page-break pt-2 text-[9px] text-slate-400 text-center flex items-center justify-center gap-1">
                  <span>Seluruh bukti arsip fisik tersimpan rapi di Finance &amp; Accounting GMCC by ITDC</span>
                </div>
              </div>
            );
          })()}
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
