import React, { useState } from 'react';
import { GoodsReceipt, GoodsReceiptItem, PurchaseOrder, UserAccount } from '../types/procurement';
import { OfficialGrnModal } from '../components/OfficialGrnModal';
import { generateReceiptSvg } from '../data/pettyCashMock';
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
  ShieldAlert,
  FileText,
  Upload,
  Eye,
  Receipt
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
  const [selectedReceiptProofModal, setSelectedReceiptProofModal] = useState<GoodsReceipt | null>(null);

  // Direct PO selected from the table for receiving
  const [targetPoForReceiving, setTargetPoForReceiving] = useState<PurchaseOrder | null>(null);
  const [deliveryOrderNumber, setDeliveryOrderNumber] = useState('');
  const [receivingNotes, setReceivingNotes] = useState('');

  // Proof Bukti Nota states
  const [receiptProofNumber, setReceiptProofNumber] = useState('');
  const [receiptProofDate, setReceiptProofDate] = useState('');
  const [receiptProofType, setReceiptProofType] = useState<GoodsReceipt['receiptProofType']>('NOTA_KONTAN');
  const [receiptProofNotes, setReceiptProofNotes] = useState('');
  const [receiptProofImage, setReceiptProofImage] = useState('');
  const [receivingPaymentMethod, setReceivingPaymentMethod] = useState<'PETTY_CASH' | 'AP_INVOICE' | 'COD_CASH'>('PETTY_CASH');

  // Fitur PPh 23 (2%) & AP Aging
  const [taxPPh23Applicable, setTaxPPh23Applicable] = useState(false);
  const [taxPPh23Method, setTaxPPh23Method] = useState<'DIPOTONG' | 'DITAMBAHKAN'>('DIPOTONG');
  const [paymentDestination, setPaymentDestination] = useState<'PAID' | 'UNPAID_AP'>('PAID');
  const [termsOfPayment, setTermsOfPayment] = useState('NET 30');
  const [customDueDate, setCustomDueDate] = useState('');
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState('');

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
    const doNum = `DO/${po.vendorName.substring(0, 4).toUpperCase()}/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const notaNum = `NOTA/${po.vendorName.substring(0, 4).toUpperCase()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const todayStr = new Date().toLocaleDateString('id-ID');
    
    setDeliveryOrderNumber(doNum);
    setReceivingNotes('Penerimaan fisik barang di pos receiving GOLO MORI CONVENTION CENTER by ITDC');
    setReceiptProofNumber(notaNum);
    setReceiptProofDate(todayStr);
    setReceiptProofType('NOTA_KONTAN');
    setReceiptProofNotes('Nota fisik asli telah diverifikasi & dicap lunas oleh rekanan');
    setReceivingPaymentMethod(po.paymentMethod === 'PETTY_CASH' ? 'PETTY_CASH' : 'PETTY_CASH');
    
    // Inisialisasi PPh 23 (2%) & AP Aging
    setTaxPPh23Applicable(false); // Manual dicentang, default tidak aktif
    setTaxPPh23Method('DIPOTONG');
    const isPoCredit = po.paymentMethod === 'AP_INVOICE' || po.paymentTerms?.toLowerCase().includes('net') || po.grandTotal > 5000000;
    setPaymentDestination(isPoCredit ? 'UNPAID_AP' : 'PAID');
    setTermsOfPayment(po.paymentTerms || 'NET 30');
    
    const targetDueDate = new Date();
    targetDueDate.setDate(targetDueDate.getDate() + 30);
    setCustomDueDate(targetDueDate.toISOString().split('T')[0]);
    setVendorInvoiceNo(`INV/${po.vendorName.substring(0, 4).toUpperCase()}/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);

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
        outletDestination: it.outletDestination || (it.itemName.toLowerCase().includes('salmon') || it.itemName.toLowerCase().includes('nuka') ? 'NUKA' : 'MICE'),
        coaName: it.coaName || po.coaName || 'BPP',
        coaCode: it.coaCode || po.coaCode,
        costCenterName: it.costCenterName || po.costCenterName
      };
    });

    const initTotal = initialItems.reduce((acc, curr) => acc + curr.totalPriceNota, 0);
    // Auto-generate realistic SVG receipt proof preview
    const sampleItemsStr = initialItems.map(i => `${i.qtyReceived} ${i.unit} ${i.itemName}`).slice(0, 3).join(', ');
    setReceiptProofImage(generateReceiptSvg(po.vendorName, notaNum, todayStr, initTotal, sampleItemsStr));

    setAuditItems(initialItems);
  };

  const handleProofImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
  const pph23Amount = taxPPh23Applicable ? Math.round(totalAuditedNota * 0.02) : 0;
  const netPaymentAmount = taxPPh23Applicable
    ? (taxPPh23Method === 'DIPOTONG' ? totalAuditedNota - pph23Amount : totalAuditedNota + pph23Amount)
    : totalAuditedNota;

  const handleSubmitGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPoForReceiving) return;
    if (!deliveryOrderNumber.trim()) {
      alert('Nomor Surat Jalan / Nota Vendor wajib diisi.');
      return;
    }

    const nowStr = new Date().toLocaleString('id-ID', { hour12: false });
    const grnNumber = `GRN/GMCC/2026/10/${Math.floor(100 + Math.random() * 900)}`;

    const finalProofImage = receiptProofImage || generateReceiptSvg(
      targetPoForReceiving.vendorName,
      receiptProofNumber || deliveryOrderNumber,
      receiptProofDate || new Date().toLocaleDateString('id-ID'),
      totalAuditedNota,
      auditItems.map(i => `${i.qtyReceived} ${i.unit} ${i.itemName}`).slice(0, 3).join(', ')
    );

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
      notes: receivingNotes,
      // Bukti Nota Fisik
      receiptProofNumber: receiptProofNumber || deliveryOrderNumber,
      receiptProofDate: receiptProofDate || nowStr.split(' ')[0],
      receiptProofVendor: targetPoForReceiving.vendorName,
      receiptProofAmount: totalAuditedNota,
      receiptProofImage: finalProofImage,
      receiptProofType: receiptProofType || 'NOTA_KONTAN',
      paymentMethod: receivingPaymentMethod,
      settlementStatus: paymentDestination === 'PAID' ? 'UNSETTLED' : undefined,
      costCenterName: targetPoForReceiving.costCenterName,
      coaName: targetPoForReceiving.coaName || (targetPoForReceiving.items[0] as any)?.coaName || 'BPP',
      // PPh 23 & AP Aging
      taxPPh23Applicable,
      taxPPh23Rate: taxPPh23Applicable ? 0.02 : 0,
      taxPPh23Method: taxPPh23Applicable ? taxPPh23Method : undefined,
      taxPPh23Amount: pph23Amount,
      netPaymentAmount: netPaymentAmount,
      paymentStatus: paymentDestination,
      termsOfPayment,
      dueDate: customDueDate || new Date().toISOString().split('T')[0],
      invoiceNumber: vendorInvoiceNo || receiptProofNumber || deliveryOrderNumber
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
    alert(`Penerimaan barang ${grnNumber} berhasil disimpan dengan bukti nota fisik! Data otomatis dapat ditarik di modul Petty Cash & Settlement.`);
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
          Audit harga terbaru sesuai nota, pemeriksaan jumlah barang diterima & reject, serta alokasi outlet NUKA BEACH CLUB / MICE
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
                <th className="px-4 py-3 text-center">Metode Pelunasan</th>
                <th className="px-4 py-3 text-center">Bukti Fisik Nota</th>
                <th className="px-4 py-3">Penerima</th>
                <th className="px-4 py-3 text-right">Cetak Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredGrns.map((g) => {
                const isPettyCash = g.paymentMethod !== 'AP_INVOICE';
                return (
                  <tr key={g.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">{g.grnNumber}</td>
                    <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">{g.receiptDate}</td>
                    <td className="px-4 py-3 font-mono text-white font-semibold">{g.poNumber}</td>
                    <td className="px-4 py-3 text-slate-200 font-medium">{g.vendorName}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{g.deliveryOrderNumber}</td>
                    <td className="px-4 py-3 font-mono font-bold text-cyan-300">{formatRupiah(g.totalInvoiceAudited || 0)}</td>
                    
                    {/* Metode Pelunasan / Kas Kecil Badge */}
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${
                        isPettyCash 
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' 
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                      }`}>
                        <span>{isPettyCash ? '💰 Kas Kecil' : '📑 AP Tempo'}</span>
                      </span>
                    </td>

                    {/* Bukti Nota Fisik Button */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedReceiptProofModal(g)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1.5 transition-colors"
                        title="Klik untuk melihat bukti fisik nota / struk vendor"
                      >
                        <Receipt className="w-3 h-3 text-emerald-400" />
                        <span>{g.receiptProofNumber || 'Bukti Nota'}</span>
                      </button>
                    </td>

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
                );
              })}
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
                  Audit Penerimaan Barang &amp; Nota: <span className="text-cyan-400 font-mono">{targetPoForReceiving.poNumber}</span>
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
                {/* Metode Pelunasan / Kas Kecil vs AP */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase text-[10px] tracking-wider">
                      Metode Pelunasan Pembelian / Jalur Kas Pembayaran:
                    </span>
                    <span className="text-[10px] text-cyan-300">
                      *Tentukan apakah belanja ini menggunakan kas kecil atau invoice tempo
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setReceivingPaymentMethod('PETTY_CASH')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        receivingPaymentMethod === 'PETTY_CASH'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <span>💰 Kas Kecil / Petty Cash (COD Tunai &amp; Reimbursement)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceivingPaymentMethod('AP_INVOICE')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        receivingPaymentMethod === 'AP_INVOICE'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <span>📑 Hutang Usaha / AP Invoice (Tempo Vendor)</span>
                    </button>
                  </div>
                </div>

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
                              <option value="NUKA">NUKA BEACH CLUB</option>
                              <option value="MICE">MICE Banquet</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Audited & Konfirmasi Pajak PPh 23 (2%) Menggantikan PPN 11% */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <span className="font-bold text-white text-xs block">
                      Perhitungan Nilai Nota &amp; Pajak PPh 23 (2%)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Sesuai SOP Konfirmasi Penerimaan GMCC: Ketentuan PPN 11% diganti dengan <b>PPh 23 (2%)</b> manual (pilihan dipotong atau ditambahkan ke nilai pengadaan).
                    </span>
                  </div>

                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer hover:border-cyan-500 transition-colors shrink-0">
                    <input
                      type="checkbox"
                      checked={taxPPh23Applicable}
                      onChange={(e) => setTaxPPh23Applicable(e.target.checked)}
                      className="rounded text-cyan-500 focus:ring-cyan-400 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-cyan-300">
                      Kena Pajak PPh 23 (2%)
                    </span>
                  </label>
                </div>

                {/* 2 Pilihan Perhitungan PPh 23: Dipotong vs Ditambahkan */}
                {taxPPh23Applicable && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/40 space-y-2">
                    <span className="text-[11px] font-bold text-cyan-300 uppercase block tracking-wider">
                      Metode Perhitungan Pajak PPh 23 (2%):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label 
                        onClick={() => setTaxPPh23Method('DIPOTONG')}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                          taxPPh23Method === 'DIPOTONG'
                            ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/30'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="taxPPh23Method"
                          checked={taxPPh23Method === 'DIPOTONG'}
                          onChange={() => setTaxPPh23Method('DIPOTONG')}
                          className="mt-0.5 text-amber-500 focus:ring-amber-400"
                        />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>1. Dipotong dari Rekanan (-2%)</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 font-mono">Netto = Bruto - PPh</span>
                          </div>
                          <p className="text-[10.5px] text-slate-400 mt-0.5 leading-snug">
                            PPh 23 dipotong langsung dari pembayaran ke rekanan. Rekanan menerima nilai bersih setelah dikurangi pajak 2%.
                          </p>
                        </div>
                      </label>

                      <label 
                        onClick={() => setTaxPPh23Method('DITAMBAHKAN')}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                          taxPPh23Method === 'DITAMBAHKAN'
                            ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/30'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="taxPPh23Method"
                          checked={taxPPh23Method === 'DITAMBAHKAN'}
                          onChange={() => setTaxPPh23Method('DITAMBAHKAN')}
                          className="mt-0.5 text-cyan-500 focus:ring-cyan-400"
                        />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>2. Ditambahkan / Gross-up (+2%)</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-mono">Netto = Bruto + PPh</span>
                          </div>
                          <p className="text-[10.5px] text-slate-400 mt-0.5 leading-snug">
                            PPh 23 ditambahkan ke total pengeluaran GMCC sehingga rekanan menerima nilai penuh bruto utuh.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Bruto Nota Diaudit:</span>
                    <span className="text-base font-bold text-white font-mono mt-0.5 block">{formatRupiah(totalAuditedNota)}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-amber-400 uppercase font-semibold block">
                      {taxPPh23Applicable 
                        ? (taxPPh23Method === 'DIPOTONG' ? 'Potongan PPh 23 (-2%):' : 'Tambahan PPh 23 (+2%):')
                        : 'Pajak PPh 23 (2%):'}
                    </span>
                    <span className="text-base font-bold text-amber-300 font-mono mt-0.5 block">
                      {taxPPh23Applicable 
                        ? (taxPPh23Method === 'DIPOTONG' ? `- ${formatRupiah(pph23Amount)}` : `+ ${formatRupiah(pph23Amount)}`)
                        : 'Rp 0 (Non-PPh 23)'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60">
                    <span className="text-[10px] text-cyan-300 uppercase font-bold block">
                      Total Bersih Yang Harus Dibayar (Netto):
                    </span>
                    <span className="text-base font-black text-cyan-300 font-mono mt-0.5 block">
                      {formatRupiah(netPaymentAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION: STATUS PEMBAYARAN & INTEGRASI AP AGING SUPPLIER */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wide">
                      Status Pembayaran &amp; Alur AP Aging (Hutang Dagang Rekanan)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Pilih apakah barang langsung dibayar atau masuk catatan hutang jatuh tempo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Sudah Dibayar */}
                  <label 
                    onClick={() => setPaymentDestination('PAID')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      paymentDestination === 'PAID'
                        ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentDestination"
                      checked={paymentDestination === 'PAID'}
                      onChange={() => setPaymentDestination('PAID')}
                      className="mt-1 text-emerald-500 focus:ring-emerald-400"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>✓ Sudah Dibayar (Lunas / Kas Kecil)</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300">Siap Settlement</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Pengadaan dibayar tunai / kas operasional dan otomatis siap ditarik ke dalam laporan penarikan <b>Petty Cash (Kas Kecil)</b>.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Masuk AP Aging */}
                  <label 
                    onClick={() => setPaymentDestination('UNPAID_AP')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      paymentDestination === 'UNPAID_AP'
                        ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/30'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentDestination"
                      checked={paymentDestination === 'UNPAID_AP'}
                      onChange={() => setPaymentDestination('UNPAID_AP')}
                      className="mt-1 text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <span>⏳ Masuk AP Aging (Hutang Dagang Rekanan)</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300">Belum Dibayar</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Barang telah diterima tetapi pembayaran belum dilakukan. Tagihan ini otomatis masuk ke modul <b>AP Aging</b> di bawah vendor <b>{targetPoForReceiving.vendorName}</b>.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Sub-form when AP Aging is selected */}
                {paymentDestination === 'UNPAID_AP' && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in">
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                        Syarat Pembayaran (TOP) *
                      </label>
                      <select
                        value={termsOfPayment}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTermsOfPayment(val);
                          const days = val.includes('7') ? 7 : val.includes('14') ? 14 : val.includes('45') ? 45 : val.includes('60') ? 60 : 30;
                          const d = new Date();
                          d.setDate(d.getDate() + days);
                          setCustomDueDate(d.toISOString().split('T')[0]);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                      >
                        <option value="NET 7">NET 7 Hari</option>
                        <option value="NET 14">NET 14 Hari</option>
                        <option value="NET 30">NET 30 Hari</option>
                        <option value="NET 45">NET 45 Hari</option>
                        <option value="NET 60">NET 60 Hari</option>
                        <option value="COD">Cash On Delivery (COD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                        Tanggal Jatuh Tempo (Due Date) *
                      </label>
                      <input
                        type="date"
                        value={customDueDate}
                        onChange={(e) => setCustomDueDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-mono text-xs font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                        No. Invoice / Faktur Vendor
                      </label>
                      <input
                        type="text"
                        value={vendorInvoiceNo}
                        onChange={(e) => setVendorInvoiceNo(e.target.value)}
                        placeholder="Contoh: INV/VND/2026/001"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: PROOF / BUKTI FISIK NOTA VENDOR */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wide">
                      Unggah / Lampirkan Bukti Fisik Nota &amp; Struk Rekanan
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Wajib Ada Bukti Nota
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                      Nomor Nota / Kwitansi Fisik *
                    </label>
                    <input
                      type="text"
                      value={receiptProofNumber}
                      onChange={(e) => setReceiptProofNumber(e.target.value)}
                      placeholder="Contoh: NOTA/2026/04/8892"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                      Jenis Bukti Fisik
                    </label>
                    <select
                      value={receiptProofType}
                      onChange={(e) => setReceiptProofType(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      <option value="NOTA_KONTAN">Nota Kontan Toko</option>
                      <option value="KWITANSI">Kwitansi Asli Lunas</option>
                      <option value="FAKTUR_PAJAK">Faktur Pajak / Invoice Vendor</option>
                      <option value="STRUK_EDC">Struk Mesin EDC / Kasir</option>
                      <option value="BUKTI_TRANSFER">Bukti Transfer Bank / KlikBCA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                      Tanggal di Nota Fisik
                    </label>
                    <input
                      type="text"
                      value={receiptProofDate}
                      onChange={(e) => setReceiptProofDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>

                {/* Upload & Preview */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Foto Nota Fisik</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofImageUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {receiptProofImage ? '✓ Bukti nota fisik siap diarsip' : 'Visual struk otomatis dibuatkan oleh sistem'}
                    </span>
                  </div>

                  {receiptProofImage && (
                    <div className="h-12 w-28 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                      <img 
                        src={receiptProofImage} 
                        alt="Preview Bukti Nota" 
                        className="h-full w-full object-cover" 
                      />
                    </div>
                  )}
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
                  <span>Simpan Penerimaan &amp; Bukti Nota (GRN)</span>
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

      {/* MODAL LIHAT SCAN BUKTI NOTA FISIK */}
      {selectedReceiptProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-800/70 shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Bukti Fisik Nota / Struk Penerimaan Barang
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    GRN: {selectedReceiptProofModal.grnNumber} • Vendor: {selectedReceiptProofModal.vendorName}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceiptProofModal(null)}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-2 shadow-inner">
                {selectedReceiptProofModal.receiptProofImage ? (
                  <img 
                    src={selectedReceiptProofModal.receiptProofImage} 
                    alt={`Bukti Nota ${selectedReceiptProofModal.receiptProofNumber}`}
                    className="max-h-[380px] w-auto object-contain rounded-lg shadow-lg"
                  />
                ) : (
                  <img 
                    src={generateReceiptSvg(
                      selectedReceiptProofModal.vendorName,
                      selectedReceiptProofModal.deliveryOrderNumber,
                      selectedReceiptProofModal.receiptDate.split(' ')[0],
                      selectedReceiptProofModal.totalInvoiceAudited,
                      selectedReceiptProofModal.items.map(i => `${i.qtyReceived} ${i.unit} ${i.itemName}`).slice(0, 3).join(', ')
                    )}
                    alt="Scan Nota"
                    className="max-h-[380px] w-auto object-contain rounded-lg shadow-lg"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Nomor Nota / DO</span>
                  <span className="font-mono font-bold text-white">
                    {selectedReceiptProofModal.receiptProofNumber || selectedReceiptProofModal.deliveryOrderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Total Nilai Audit</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {formatRupiah(selectedReceiptProofModal.totalInvoiceAudited)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Penerima Gudang</span>
                  <span className="font-bold text-slate-200">
                    {selectedReceiptProofModal.receivedBy.split('(')[0]}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Waktu Masuk</span>
                  <span className="font-mono text-slate-300">
                    {selectedReceiptProofModal.receiptDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">PO Terkait</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {selectedReceiptProofModal.poNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Kondisi Fisik</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    ✓ Fisik &amp; Nota Klir
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedReceiptProofModal(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
