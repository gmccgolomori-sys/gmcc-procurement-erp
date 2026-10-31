import React from 'react';
import { PurchaseOrder } from '../types/procurement';
import { OFFICIAL_GMCC_ADDRESS } from '../data/procurementMock';
import { X, Building2, Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';

interface OfficialPoModalProps {
  po: PurchaseOrder;
  onClose: () => void;
}

export const OfficialPoModal: React.FC<OfficialPoModalProps> = ({ po, onClose }) => {
  const formatRupiah = (val?: number) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('po-official-sheet');
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
            <title>PO_${po.poNumber.replace(/[\/\\]/g, '_')}</title>
            <meta charset="utf-8">
            <style>
              @page {
                size: A4 portrait;
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
                padding: 10px;
                font-size: 11px;
                line-height: 1.35;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .po-container {
                width: 100%;
                max-width: 100%;
                margin: 0 auto;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #0f172a;
                padding-bottom: 8px;
                margin-bottom: 12px;
              }
              .brand {
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .logo-box {
                background: #0f172a;
                color: #ffffff;
                font-weight: 900;
                font-size: 16px;
                padding: 6px 10px;
                border-radius: 6px;
                letter-spacing: -0.5px;
              }
              .brand-title {
                font-size: 14px;
                font-weight: 900;
                letter-spacing: -0.2px;
                text-transform: uppercase;
                color: #0f172a;
              }
              .brand-sub {
                font-size: 10px;
                color: #475569;
                margin-top: 1px;
              }
              .brand-contact {
                font-size: 9px;
                color: #64748b;
                margin-top: 1px;
              }
              .po-meta-right {
                text-align: right;
              }
              .po-badge {
                font-size: 10px;
                font-weight: 800;
                color: #475569;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .po-number {
                font-size: 13px;
                font-weight: 900;
                color: #0f172a;
                font-family: monospace;
                margin-top: 2px;
              }
              .po-ref {
                font-size: 9.5px;
                color: #64748b;
                margin-top: 2px;
              }
              .info-box {
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 10px 14px;
                margin-bottom: 12px;
                display: flex;
                justify-content: space-between;
                background-color: #f8fafc;
                font-size: 10.5px;
              }
              .info-col-left {
                width: 52%;
              }
              .info-col-right {
                width: 46%;
                text-align: right;
              }
              .label-tiny {
                font-size: 8.5px;
                font-weight: 800;
                text-transform: uppercase;
                color: #64748b;
                letter-spacing: 0.5px;
                margin-bottom: 2px;
              }
              .vendor-title {
                font-size: 12px;
                font-weight: 800;
                color: #0f172a;
                margin-bottom: 2px;
              }
              .info-text {
                font-size: 10px;
                color: #334155;
                line-height: 1.3;
              }
              .info-strong {
                font-weight: 700;
                color: #0f172a;
              }
              table.items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
              }
              table.items-table th {
                background-color: #f1f5f9;
                border-top: 1px solid #cbd5e1;
                border-bottom: 1.5px solid #0f172a;
                border-left: 1px solid #e2e8f0;
                border-right: 1px solid #e2e8f0;
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                padding: 6px 8px;
                color: #1e293b;
              }
              table.items-table td {
                border-bottom: 1px solid #e2e8f0;
                border-left: 1px solid #f1f5f9;
                border-right: 1px solid #f1f5f9;
                padding: 6px 8px;
                font-size: 10px;
                vertical-align: top;
              }
              .item-name {
                font-weight: 800;
                color: #0f172a;
                font-size: 10.5px;
              }
              .item-spec {
                font-size: 9px;
                color: #475569;
                margin-top: 2px;
                line-height: 1.25;
              }
              .total-block {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 12px;
              }
              .total-table {
                width: 260px;
                border-collapse: collapse;
                font-size: 10.5px;
              }
              .total-table td {
                padding: 3px 6px;
              }
              .total-table .row-subtotal {
                color: #334155;
              }
              .total-table .row-tax {
                color: #334155;
                border-bottom: 1px solid #cbd5e1;
                padding-bottom: 4px;
              }
              .total-table .row-grand {
                font-size: 12px;
                font-weight: 900;
                color: #0369a1;
                padding-top: 4px;
              }
              .auth-section {
                border-top: 1.5px solid #0f172a;
                padding-top: 8px;
                margin-top: 10px;
                page-break-inside: avoid;
              }
              .auth-title {
                text-align: center;
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                color: #475569;
                margin-bottom: 6px;
              }
              .auth-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
              }
              .auth-box {
                border: 1px solid #cbd5e1;
                background-color: #f8fafc;
                border-radius: 4px;
                padding: 6px;
                text-align: center;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                min-height: 90px;
              }
              .auth-box-title {
                font-size: 8.5px;
                font-weight: 800;
                text-transform: uppercase;
                color: #475569;
                margin-bottom: 4px;
              }
              .auth-sig-area {
                height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .auth-sig-img {
                max-height: 40px;
                max-width: 100%;
                object-fit: contain;
              }
              .auth-sig-fallback {
                font-family: Georgia, serif;
                font-style: italic;
                font-size: 11px;
                font-weight: bold;
                color: #0369a1;
              }
              .auth-name {
                font-size: 9.5px;
                font-weight: 800;
                color: #0f172a;
                border-top: 1px solid #cbd5e1;
                padding-top: 3px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .auth-role {
                font-size: 8px;
                color: #64748b;
              }
              .footer-stamp {
                margin-top: 8px;
                text-align: center;
                font-size: 8px;
                color: #94a3b8;
                border-top: 1px dashed #e2e8f0;
                padding-top: 5px;
              }
            </style>
          </head>
          <body>
            <div class="po-container">
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
          document.body.removeChild(printIframe);
        }, 1000);
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-150 my-6 print:border-none print:shadow-none print:my-0 print:max-w-none">
        
        {/* Top Control Bar with Print and Close */}
        <div className="print:hidden bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-white">Purchase Order (PO) Resmi GMCC</span>
              <span className="text-slate-400 font-mono ml-2 text-[11px]">[{po.poNumber}]</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Cetak langsung ke printer atau Simpan sebagai PDF Resmi GMCC"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak ke Printer / PDF Resmi</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tutup Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clean Paper Document Preview Sheet */}
        <div className="p-6 md:p-8 space-y-3.5 text-slate-800 text-[11px] leading-tight bg-white" id="po-official-sheet">
          {/* Header & Letterhead */}
          <div className="border-b-2 border-slate-900 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                  <img 
                    src={`${import.meta.env.BASE_URL}assets/aistudio/GMCC___Logo_Primer___Putih_8d762ffb.png`}
                    alt="GMCC Logo" 
                    className="max-h-full max-w-full object-contain" 
                  />
                </div>
                <div>
                  <h1 className="text-sm md:text-base font-black text-slate-900 tracking-tight uppercase leading-none">
                    GOLO MORI CONVENTION CENTER
                  </h1>
                  <p className="text-[10px] text-slate-600 font-semibold mt-1">
                    Kawasan Pariwisata The Golo Mori by ITDC, Labuan Bajo, NTT 86763
                  </p>
                  <p className="text-[9px] text-slate-500">
                    Email: procurement@golomori.id • Telp: (0385) 244-9900
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  PURCHASE ORDER (PO)
                </div>
                <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                  {po.poNumber}
                </div>
                <div className="text-[9.5px] text-slate-500 mt-0.5">
                  Ref PR: <span className="font-mono font-medium">{po.prNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Box - Identical to Image 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-lg bg-slate-50 border border-slate-300 text-[10.5px]">
            <div className="space-y-0.5">
              <div className="uppercase font-bold text-slate-500 text-[9px] tracking-wider">VENDOR / REKANAN:</div>
              <div className="font-black text-slate-900 text-xs">{po.vendorName}</div>
              <div className="text-slate-700 leading-snug">{po.vendorAddress}</div>
              <div className="text-slate-600">Telp: {po.vendorPhone}</div>
            </div>

            <div className="space-y-0.5 md:text-right">
              <div>
                <span className="text-slate-500 font-bold">Tgl Order: </span>
                <span className="font-mono font-bold text-slate-900">{po.orderDate}</span>
                <span className="text-slate-400 mx-1.5">|</span>
                <span className="text-slate-500 font-bold">Batas Kirim: </span>
                <span className="font-mono font-bold text-slate-900">{po.expectedDeliveryDate}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold">Syarat Bayar: </span>
                <span className="font-semibold text-slate-800">{po.paymentTerms}</span>
              </div>
              <div className="text-slate-700">
                <span className="font-bold text-slate-500">Kirim Ke: </span>
                <span>{OFFICIAL_GMCC_ADDRESS}</span>
              </div>
            </div>
          </div>

          {/* Table of Items & Specifications */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-100 text-slate-900 uppercase font-bold text-[9px] border-b border-slate-300">
                <tr>
                  <th className="px-2.5 py-2 w-8 text-center">NO</th>
                  <th className="px-3 py-2">DESKRIPSI BARANG & SPESIFIKASI DETAIL</th>
                  <th className="px-2.5 py-2 text-center w-16">SATUAN</th>
                  <th className="px-2.5 py-2 text-center w-16">QTY</th>
                  <th className="px-3 py-2 text-right w-28">HARGA (IDR)</th>
                  <th className="px-3 py-2 text-right w-32">TOTAL (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {po.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-2.5 py-2 text-center font-mono text-slate-600 font-bold">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <div className="font-bold text-slate-900 text-[10.5px]">{item.itemName}</div>
                      {item.specification && (
                        <div className="text-[9px] text-slate-600 font-normal leading-snug mt-0.5">
                          Spesifikasi: {item.specification}
                        </div>
                      )}
                    </td>
                    <td className="px-2.5 py-2 text-center text-slate-700 font-semibold">{item.unit}</td>
                    <td className="px-2.5 py-2 text-center font-mono font-bold text-slate-900">{item.quantityOrdered}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-700">{formatRupiah(item.unitPrice)}</td>
                    <td className="px-3 py-2 text-right font-mono font-black text-slate-900">{formatRupiah(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotal, Tax, and Grand Total */}
          <div className="flex justify-end pt-1">
            <div className="w-72 space-y-1 p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-[10.5px]">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal:</span>
                <span className="font-mono font-bold">{formatRupiah(po.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-700 border-b border-slate-300 pb-1">
                <span>PPN (11%):</span>
                <span className="font-mono font-bold">{formatRupiah(po.taxPpn)}</span>
              </div>
              <div className="flex justify-between pt-1 font-black text-xs text-slate-900">
                <span>TOTAL:</span>
                <span className="font-mono text-cyan-800 text-sm">{formatRupiah(po.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Lembar Otorisasi & Pengesahan Dokumen Pengadaan GMCC (4 Columns) */}
          <div className="pt-2 border-t-2 border-slate-900">
            <div className="text-[9.5px] text-slate-700 uppercase font-extrabold text-center tracking-wider mb-2">
              LEMBAR OTORISASI & PENGESAHAN DOKUMEN PENGADAAN GMCC
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-[9px]">
              {/* Box 1: Pemohon / Requestor */}
              <div className="border border-slate-300 rounded p-1.5 bg-slate-50 flex flex-col justify-between min-h-[92px]">
                <div className="uppercase font-bold text-slate-700 text-[8.5px]">
                  Diajukan (Pemohon)
                </div>
                <div className="h-10 flex items-center justify-center my-0.5">
                  {po.signatures.requestor?.signatureUrl ? (
                    <img 
                      src={po.signatures.requestor.signatureUrl} 
                      alt="TTD Pemohon" 
                      className="max-h-9 max-w-full object-contain" 
                    />
                  ) : (
                    <span className="font-serif italic text-cyan-900 text-xs font-bold">
                      {po.signatures.requestor?.name || 'Pemohon'}
                    </span>
                  )}
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <div className="font-bold text-slate-900 truncate">{po.signatures.requestor?.name || 'Staff Pemohon'}</div>
                  <div className="text-[8px] text-slate-500">Requestor Dept</div>
                </div>
              </div>

              {/* Box 2: Purchasing Officer */}
              <div className="border border-slate-300 rounded p-1.5 bg-slate-50 flex flex-col justify-between min-h-[92px]">
                <div className="uppercase font-bold text-slate-700 text-[8.5px]">
                  Disiapkan (Purchasing)
                </div>
                <div className="h-10 flex items-center justify-center my-0.5">
                  {po.signatures.purchasingOfficer?.signatureUrl ? (
                    <img 
                      src={po.signatures.purchasingOfficer.signatureUrl} 
                      alt="TTD Purchasing" 
                      className="max-h-9 max-w-full object-contain" 
                    />
                  ) : (
                    <span className="font-serif italic text-teal-900 text-xs font-bold">
                      {po.signatures.purchasingOfficer?.name || 'Purchasing'}
                    </span>
                  )}
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <div className="font-bold text-slate-900 truncate">{po.signatures.purchasingOfficer.name}</div>
                  <div className="text-[8px] text-slate-500">Purchasing Officer</div>
                </div>
              </div>

              {/* Box 3: Dept Head Finance */}
              <div className="border border-slate-300 rounded p-1.5 bg-slate-50 flex flex-col justify-between min-h-[92px]">
                <div className="uppercase font-bold text-slate-700 text-[8.5px]">
                  Verifikasi (Finance)
                </div>
                <div className="h-10 flex items-center justify-center my-0.5">
                  {po.signatures.financeManager?.signatureUrl ? (
                    <img 
                      src={po.signatures.financeManager.signatureUrl} 
                      alt="TTD Finance" 
                      className="max-h-9 max-w-full object-contain" 
                    />
                  ) : (
                    <span className="font-serif italic text-indigo-900 text-xs font-bold">
                      {po.signatures.financeManager?.name || 'Finance'}
                    </span>
                  )}
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <div className="font-bold text-slate-900 truncate">{po.signatures.financeManager.name}</div>
                  <div className="text-[8px] text-slate-500">Dept Head Finance</div>
                </div>
              </div>

              {/* Box 4: General Manager */}
              <div className="border border-slate-300 rounded p-1.5 bg-slate-50 flex flex-col justify-between min-h-[92px]">
                <div className="uppercase font-bold text-slate-700 text-[8.5px]">
                  Disetujui (GM)
                </div>
                <div className="h-10 flex items-center justify-center my-0.5">
                  {po.signatures.generalManager?.signatureUrl ? (
                    <img 
                      src={po.signatures.generalManager.signatureUrl} 
                      alt="TTD GM" 
                      className="max-h-9 max-w-full object-contain" 
                    />
                  ) : (
                    <span className="font-serif italic text-amber-900 text-xs font-bold">
                      {po.signatures.generalManager?.name || 'GM'}
                    </span>
                  )}
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <div className="font-bold text-slate-900 truncate">{po.signatures.generalManager.name}</div>
                  <div className="text-[8px] text-slate-500">General Manager</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Verification Stamp */}
          <div className="text-[8.5px] text-slate-500 text-center flex items-center justify-center gap-2 pt-1 border-t border-dashed border-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-700" />
            <span>Dokumen sah terverifikasi GMCC Enterprise Hub • Dicetak dari sistem pengadaan resmi GOLO MORI CONVENTION CENTER by ITDC</span>
          </div>
        </div>
      </div>
    </div>
  );
};
