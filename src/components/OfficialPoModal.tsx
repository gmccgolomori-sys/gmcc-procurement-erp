import React from 'react';
import { PurchaseOrder } from '../types/procurement';
import { OFFICIAL_GMCC_ADDRESS, SAMPLE_SIGNATURES } from '../data/procurementMock';
import { GMCC_LOGO_DARK } from '../data/gmccLogo';
import { X, Building2, Printer, CheckCircle } from 'lucide-react';

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

  const reqSig = po.signatures.requestor?.signatureUrl || SAMPLE_SIGNATURES.CHEF;
  const purSig = po.signatures.purchasingOfficer?.signatureUrl || SAMPLE_SIGNATURES.PURCHASING;
  const finSig = po.signatures.financeManager?.signatureUrl || SAMPLE_SIGNATURES.AGUS_ACCOUNTING;
  const gmSig = po.signatures.generalManager?.signatureUrl || SAMPLE_SIGNATURES.ARI_GM;

  const reqName = po.signatures.requestor?.name || 'Ignatius Riky (Head Chef)';
  const purName = po.signatures.purchasingOfficer?.name || 'Siti Handayani';
  const finName = po.signatures.financeManager?.name || 'Laurentius Bram / Agus Setiabudi';
  const gmName = po.signatures.generalManager?.name || 'Ari Soplanit';

  const handlePrint = () => {
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

      const itemsRowsHtml = po.items.map((item, idx) => `
        <tr style="border-bottom: 1px solid #cbd5e1; page-break-inside: avoid;">
          <td style="padding: 6px 8px; text-align: center; font-family: monospace; font-weight: bold; color: #475569; border-right: 1px solid #e2e8f0; width: 32px;">${idx + 1}</td>
          <td style="padding: 6px 8px; border-right: 1px solid #e2e8f0;">
            <div style="font-weight: 800; font-size: 11px; color: #0f172a;">${item.itemName}</div>
            ${item.specification ? `<div style="font-size: 9px; color: #475569; margin-top: 2px; line-height: 1.25;">Spesifikasi: ${item.specification}</div>` : ''}
          </td>
          <td style="padding: 6px 8px; text-align: center; color: #334155; font-weight: 600; border-right: 1px solid #e2e8f0; width: 55px;">${item.unit}</td>
          <td style="padding: 6px 8px; text-align: center; font-family: monospace; font-weight: 800; color: #0f172a; border-right: 1px solid #e2e8f0; width: 45px;">${item.quantityOrdered}</td>
          <td style="padding: 6px 8px; text-align: right; font-family: monospace; color: #334155; border-right: 1px solid #e2e8f0; width: 95px;">${formatRupiah(item.unitPrice)}</td>
          <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 800; color: #0f172a; width: 110px;">${formatRupiah(item.totalPrice)}</td>
        </tr>
      `).join('');

      const taxSectionHtml = po.taxPpn && po.taxPpn > 0 ? `
        <tr>
          <td style="padding: 3px 6px; color: #475569;">PPN (11% PKP):</td>
          <td style="padding: 3px 6px; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">${formatRupiah(po.taxPpn)}</td>
        </tr>
      ` : '';

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
                padding: 6px 8px;
                font-size: 10px;
                line-height: 1.3;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .po-sheet {
                width: 100%;
                max-width: 100%;
                margin: 0 auto;
              }
            </style>
          </head>
          <body>
            <div class="po-sheet">
              <!-- HEADER TABLE -->
              <table style="width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: middle; width: 75px; padding-right: 12px;">
                    <img src="${GMCC_LOGO_DARK}" style="height: 48px; width: auto; object-fit: contain; display: block;" alt="GMCC Logo" />
                  </td>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 15px; font-weight: 900; letter-spacing: -0.3px; text-transform: uppercase; color: #0f172a; line-height: 1.1;">
                      GOLO MORI CONVENTION CENTER
                    </div>
                    <div style="font-size: 9.5px; font-weight: 600; color: #475569; margin-top: 2px;">
                      Kawasan Pariwisata The Golo Mori by ITDC, Labuan Bajo, NTT 86763
                    </div>
                    <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">
                      Email: procurement@golomori.id • Telp: (0385) 244-9900
                    </div>
                  </td>
                  <td style="vertical-align: middle; text-align: right; width: 230px;">
                    <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.8px;">
                      PURCHASE ORDER (PO)
                    </div>
                    <div style="font-size: 14px; font-weight: 900; font-family: monospace; color: #0f172a; margin-top: 2px;">
                      ${po.poNumber}
                    </div>
                    <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
                      Ref PR: <span style="font-family: monospace; font-weight: bold; color: #334155;">${po.prNumber}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- METADATA BOX (2-COLUMNS TABLE: VENDOR LEFT, ORDER INFO RIGHT) -->
              <table style="width: 100%; border: 1px solid #cbd5e1; background-color: #f8fafc; border-radius: 6px; border-collapse: collapse; margin-bottom: 10px;">
                <tr>
                  <td style="width: 52%; padding: 8px 12px; vertical-align: top; border-right: 1px solid #e2e8f0;">
                    <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: #64748b; margin-bottom: 2px;">
                      VENDOR / REKANAN:
                    </div>
                    <div style="font-size: 12px; font-weight: 900; color: #0f172a; margin-bottom: 2px;">
                      ${po.vendorName}
                    </div>
                    <div style="font-size: 9.5px; color: #334155; line-height: 1.3;">
                      ${po.vendorAddress || 'Labuan Bajo, Nusa Tenggara Timur'}
                    </div>
                    <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
                      Telp: ${po.vendorPhone || '-'}
                    </div>
                  </td>
                  <td style="width: 48%; padding: 8px 12px; vertical-align: top; text-align: right;">
                    <div style="font-size: 9.5px; line-height: 1.5; color: #334155;">
                      <span style="font-weight: bold; color: #475569;">Tgl Order:</span> 
                      <span style="font-family: monospace; font-weight: bold; color: #0f172a;">${po.orderDate}</span>
                      <span style="color: #cbd5e1; margin: 0 4px;">|</span>
                      <span style="font-weight: bold; color: #475569;">Batas Kirim:</span> 
                      <span style="font-family: monospace; font-weight: bold; color: #0f172a;">${po.expectedDeliveryDate}</span>
                    </div>
                    <div style="font-size: 9.5px; line-height: 1.5; color: #334155; margin-top: 2px;">
                      <span style="font-weight: bold; color: #475569;">Syarat Bayar:</span> 
                      <span style="font-weight: 700; color: #0f172a;">${po.paymentTerms}</span>
                    </div>
                    <div style="font-size: 9px; color: #475569; line-height: 1.3; margin-top: 3px;">
                      <span style="font-weight: bold;">Kirim Ke:</span> 
                      <span>${OFFICIAL_GMCC_ADDRESS}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- ITEMS TABLE -->
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin-bottom: 10px;">
                <thead>
                  <tr style="background-color: #f1f5f9; border-bottom: 2px solid #0f172a;">
                    <th style="padding: 6px 8px; font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #1e293b; border-right: 1px solid #cbd5e1; text-align: center; width: 32px;">NO</th>
                    <th style="padding: 6px 8px; font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #1e293b; border-right: 1px solid #cbd5e1; text-align: left;">DESKRIPSI BARANG &amp; SPESIFIKASI DETAIL</th>
                    <th style="padding: 6px 8px; font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #1e293b; border-right: 1px solid #cbd5e1; text-align: center; width: 55px;">SATUAN</th>
                    <th style="padding: 6px 8px; font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #1e293b; border-right: 1px solid #cbd5e1; text-align: center; width: 45px;">QTY</th>
                    <th style="padding: 6px 8px; font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #1e293b; border-right: 1px solid #cbd5e1; text-align: right; width: 95px;">HARGA (IDR)</th>
                    <th style="padding: 6px 8px; font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #1e293b; text-align: right; width: 110px;">TOTAL (IDR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRowsHtml}
                </tbody>
              </table>

              <!-- TAX STATUS & TOTALS BLOCK -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; page-break-inside: avoid;">
                <tr>
                  <td style="vertical-align: top; padding-right: 12px;">
                    <div style="font-size: 9.5px; color: #475569;">
                      <span style="font-weight: bold; color: #0f172a;">Status Perpajakan: </span>
                      ${po.taxPpn && po.taxPpn > 0 ? `
                        <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; background-color: #ecfeff; color: #155e75; border: 1px solid #a5f3fc;">
                          Kena Pajak PPN 11% (Vendor PKP) — Faktur Pajak Wajib
                        </span>
                      ` : `
                        <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1;">
                          Bebas PPN di PO (Pajak PPh 23 diperhitungkan saat Penerimaan Barang / GRN)
                        </span>
                      `}
                    </div>
                  </td>
                  <td style="vertical-align: top; width: 260px;">
                    <table style="width: 100%; border: 1px solid #cbd5e1; background-color: #f8fafc; border-radius: 4px; border-collapse: collapse; font-size: 9.5px;">
                      <tr>
                        <td style="padding: 4px 8px; color: #475569;">Subtotal Barang:</td>
                        <td style="padding: 4px 8px; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">${formatRupiah(po.subtotal)}</td>
                      </tr>
                      ${taxSectionHtml}
                      <tr style="border-top: 1.5px solid #0f172a; background-color: #f1f5f9;">
                        <td style="padding: 5px 8px; font-weight: 900; font-size: 10.5px; color: #0f172a;">TOTAL AKHIR PO:</td>
                        <td style="padding: 5px 8px; text-align: right; font-family: monospace; font-weight: 900; font-size: 12px; color: #0369a1;">${formatRupiah(po.grandTotal)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- LEMBAR OTORISASI & PENGESAHAN DOKUMEN PENGADAAN GMCC (4 COLS BULLETPROOF TABLE) -->
              <div style="border-top: 2px solid #0f172a; padding-top: 6px; page-break-inside: avoid;">
                <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #334155; text-align: center; margin-bottom: 6px;">
                  LEMBAR OTORISASI &amp; PENGESAHAN DOKUMEN PENGADAAN GMCC
                </div>
                <table style="width: 100%; border-collapse: separate; border-spacing: 6px 0; table-layout: fixed;">
                  <tr>
                    <!-- Box 1: Diajukan (Pemohon) -->
                    <td style="width: 25%; vertical-align: top; border: 1px solid #cbd5e1; background-color: #f8fafc; border-radius: 4px; padding: 6px; text-align: center;">
                      <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 4px;">
                        DIAJUKAN (PEMOHON)
                      </div>
                      <div style="height: 44px; display: flex; align-items: center; justify-content: center;">
                        <img src="${reqSig}" style="max-height: 42px; max-width: 100%; object-fit: contain; display: block; margin: 0 auto;" alt="TTD Pemohon" />
                      </div>
                      <div style="border-top: 1px solid #cbd5e1; padding-top: 3px; margin-top: 3px;">
                        <div style="font-size: 9px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${reqName}
                        </div>
                        <div style="font-size: 8px; color: #64748b;">Requestor Dept</div>
                      </div>
                    </td>

                    <!-- Box 2: Disiapkan (Purchasing) -->
                    <td style="width: 25%; vertical-align: top; border: 1px solid #cbd5e1; background-color: #f8fafc; border-radius: 4px; padding: 6px; text-align: center;">
                      <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 4px;">
                        DISIAPKAN (PURCHASING)
                      </div>
                      <div style="height: 44px; display: flex; align-items: center; justify-content: center;">
                        <img src="${purSig}" style="max-height: 42px; max-width: 100%; object-fit: contain; display: block; margin: 0 auto;" alt="TTD Purchasing" />
                      </div>
                      <div style="border-top: 1px solid #cbd5e1; padding-top: 3px; margin-top: 3px;">
                        <div style="font-size: 9px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${purName}
                        </div>
                        <div style="font-size: 8px; color: #64748b;">Purchasing Officer</div>
                      </div>
                    </td>

                    <!-- Box 3: Verifikasi (Finance) -->
                    <td style="width: 25%; vertical-align: top; border: 1px solid #cbd5e1; background-color: #f8fafc; border-radius: 4px; padding: 6px; text-align: center;">
                      <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 4px;">
                        VERIFIKASI (FINANCE)
                      </div>
                      <div style="height: 44px; display: flex; align-items: center; justify-content: center;">
                        <img src="${finSig}" style="max-height: 42px; max-width: 100%; object-fit: contain; display: block; margin: 0 auto;" alt="TTD Finance" />
                      </div>
                      <div style="border-top: 1px solid #cbd5e1; padding-top: 3px; margin-top: 3px;">
                        <div style="font-size: 9px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${finName}
                        </div>
                        <div style="font-size: 8px; color: #64748b;">Dept Head Finance</div>
                      </div>
                    </td>

                    <!-- Box 4: Disetujui (GM) -->
                    <td style="width: 25%; vertical-align: top; border: 1px solid #cbd5e1; background-color: #f8fafc; border-radius: 4px; padding: 6px; text-align: center;">
                      <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 4px;">
                        DISETUJUI (GM)
                      </div>
                      <div style="height: 44px; display: flex; align-items: center; justify-content: center;">
                        <img src="${gmSig}" style="max-height: 42px; max-width: 100%; object-fit: contain; display: block; margin: 0 auto;" alt="TTD GM" />
                      </div>
                      <div style="border-top: 1px solid #cbd5e1; padding-top: 3px; margin-top: 3px;">
                        <div style="font-size: 9px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${gmName}
                        </div>
                        <div style="font-size: 8px; color: #64748b;">General Manager</div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- FOOTER STAMP -->
              <div style="margin-top: 8px; text-align: center; font-size: 8px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
                Dokumen sah terverifikasi GMCC Enterprise Hub • Dicetak dari sistem pengadaan resmi GOLO MORI CONVENTION CENTER by ITDC
              </div>
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
      }, 350);
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen PO</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PO DOCUMENT SHEET - Interactive Preview matching Print Output */}
        <div id="po-official-sheet" className="p-6 sm:p-8 space-y-4 text-slate-900 bg-white font-sans text-xs">
          
          {/* Header Row: GMCC Logo + Address Left, PO Number Right */}
          <div className="flex flex-col sm:flex-row items-start justify-between border-b-2 border-slate-900 pb-3 gap-3">
            <div className="flex items-center gap-3.5">
              <img 
                src={GMCC_LOGO_DARK} 
                alt="GMCC Logo" 
                className="h-12 w-auto object-contain shrink-0" 
              />
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

            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                PURCHASE ORDER (PO)
              </div>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                {po.poNumber}
              </div>
              <div className="text-[9.5px] text-slate-500 mt-0.5">
                Ref PR: <span className="font-mono font-bold text-slate-700">{po.prNumber}</span>
              </div>
            </div>
          </div>

          {/* Metadata Box: Vendor Left, Order Info Right */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg bg-slate-50 border border-slate-300 text-[10.5px]">
            <div className="space-y-0.5">
              <div className="uppercase font-bold text-slate-500 text-[9px] tracking-wider">VENDOR / REKANAN:</div>
              <div className="font-black text-slate-900 text-xs">{po.vendorName}</div>
              <div className="text-slate-700 leading-snug">{po.vendorAddress || 'Labuan Bajo, Nusa Tenggara Timur'}</div>
              <div className="text-slate-600">Telp: {po.vendorPhone || '-'}</div>
            </div>

            <div className="space-y-0.5 sm:text-right">
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

          {/* Table of Items */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-100 text-slate-900 uppercase font-bold text-[9px] border-b border-slate-300">
                <tr>
                  <th className="px-2.5 py-2 w-8 text-center border-r border-slate-200">NO</th>
                  <th className="px-3 py-2 border-r border-slate-200">DESKRIPSI BARANG &amp; SPESIFIKASI DETAIL</th>
                  <th className="px-2.5 py-2 text-center w-16 border-r border-slate-200">SATUAN</th>
                  <th className="px-2.5 py-2 text-center w-16 border-r border-slate-200">QTY</th>
                  <th className="px-3 py-2 text-right w-28 border-r border-slate-200">HARGA (IDR)</th>
                  <th className="px-3 py-2 text-right w-32">TOTAL (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {po.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-2.5 py-2 text-center font-mono text-slate-600 font-bold border-r border-slate-100">{idx + 1}</td>
                    <td className="px-3 py-2 border-r border-slate-100">
                      <div className="font-bold text-slate-900 text-[10.5px]">{item.itemName}</div>
                      {item.specification && (
                        <div className="text-[9px] text-slate-600 font-normal leading-snug mt-0.5">
                          Spesifikasi: {item.specification}
                        </div>
                      )}
                    </td>
                    <td className="px-2.5 py-2 text-center text-slate-700 font-semibold border-r border-slate-100">{item.unit}</td>
                    <td className="px-2.5 py-2 text-center font-mono font-bold text-slate-900 border-r border-slate-100">{item.quantityOrdered}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-700 border-r border-slate-100">{formatRupiah(item.unitPrice)}</td>
                    <td className="px-3 py-2 text-right font-mono font-black text-slate-900">{formatRupiah(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotal, Tax, and Grand Total */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 pt-1">
            <div className="text-[10px] text-slate-500 max-w-sm">
              <span className="font-bold text-slate-700">Status Perpajakan: </span>
              {po.taxPpn && po.taxPpn > 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-300">
                  Kena Pajak PPN 11% (Vendor PKP) — Faktur Pajak Wajib
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  Bebas PPN di PO (Pajak PPh 23 diperhitungkan saat Penerimaan Barang / GRN)
                </span>
              )}
            </div>
            <div className="w-full sm:w-72 space-y-1 p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-[10.5px]">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal Barang:</span>
                <span className="font-mono font-bold">{formatRupiah(po.subtotal)}</span>
              </div>
              {po.taxPpn && po.taxPpn > 0 ? (
                <div className="flex justify-between text-slate-700 border-b border-slate-300 pb-1">
                  <span>PPN (11% PKP):</span>
                  <span className="font-mono font-bold">{formatRupiah(po.taxPpn)}</span>
                </div>
              ) : null}
              <div className="flex justify-between pt-1 font-black text-xs text-slate-900 border-t border-slate-200">
                <span>TOTAL AKHIR PO:</span>
                <span className="font-mono text-cyan-800 text-sm font-black">{formatRupiah(po.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Lembar Otorisasi & Pengesahan Dokumen Pengadaan GMCC (4 Columns) */}
          <div className="pt-2 border-t-2 border-slate-900">
            <div className="text-[9.5px] text-slate-700 uppercase font-extrabold text-center tracking-wider mb-2">
              LEMBAR OTORISASI &amp; PENGESAHAN DOKUMEN PENGADAAN GMCC
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[9px]">
              {/* Box 1: Pemohon / Requestor */}
              <div className="border border-slate-300 rounded p-1.5 bg-slate-50 flex flex-col justify-between min-h-[96px]">
                <div className="uppercase font-bold text-slate-700 text-[8.5px]">
                  Diajukan (Pemohon)
                </div>
                <div className="h-11 flex items-center justify-center my-0.5">
                  <img 
                    src={reqSig} 
                    alt="TTD Pemohon" 
                    className="max-h-10 max-w-full object-contain" 
                  />
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <div className="font-bold text-slate-900 truncate">{reqName}</div>
                  <div className="text-[8px] text-slate-500">Requestor Dept</div>
                </div>
              </div>

              {/* Box 2: Purchasing Officer */}
              <div className="border border-slate-300 rounded p-1.5 bg-slate-50 flex flex-col justify-between min-h-[96px]">
                <div className="uppercase font-bold text-slate-700 text-[8.5px]">
                  Disiapkan (Purchasing)
                </div>
                <div className="h-11 flex items-center justify-center my-0.5">
                  <img 
                    src={purSig} 
                    alt="TTD Purchasing" 
                    className="max-h-10 max-w-full object-contain" 
                  />
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <div className="font-bold text-slate-900 truncate">{purName}</div>
                  <div className="text-[8px] text-slate-500">Purchasing Officer</div>
                </div>
              </div>

              {/* Box 3: Dept Head Finance */}
              <div className="border border-slate-300 rounded p-1.5 bg-slate-50 flex flex-col justify-between min-h-[96px]">
                <div className="uppercase font-bold text-slate-700 text-[8.5px]">
                  Verifikasi (Finance)
                </div>
                <div className="h-11 flex items-center justify-center my-0.5">
                  <img 
                    src={finSig} 
                    alt="TTD Finance" 
                    className="max-h-10 max-w-full object-contain" 
                  />
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <div className="font-bold text-slate-900 truncate">{finName}</div>
                  <div className="text-[8px] text-slate-500">Dept Head Finance</div>
                </div>
              </div>

              {/* Box 4: General Manager */}
              <div className="border border-slate-300 rounded p-1.5 bg-slate-50 flex flex-col justify-between min-h-[96px]">
                <div className="uppercase font-bold text-slate-700 text-[8.5px]">
                  Disetujui (GM)
                </div>
                <div className="h-11 flex items-center justify-center my-0.5">
                  <img 
                    src={gmSig} 
                    alt="TTD GM" 
                    className="max-h-10 max-w-full object-contain" 
                  />
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <div className="font-bold text-slate-900 truncate">{gmName}</div>
                  <div className="text-[8px] text-slate-500">General Manager</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[8.5px] text-slate-500 border-t border-dashed border-slate-300 pt-2 flex items-center justify-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-cyan-600" />
            <span>Dokumen sah terverifikasi GMCC Enterprise Hub • Dicetak dari sistem pengadaan resmi GOLO MORI CONVENTION CENTER by ITDC</span>
          </div>

        </div>

      </div>
    </div>
  );
};
