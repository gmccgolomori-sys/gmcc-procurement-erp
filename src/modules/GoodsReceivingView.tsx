import React, { useState } from 'react';
import { GoodsReceipt, GoodsReceiptItem, PurchaseOrder, UserAccount, Vendor, isStrictBppCoa, isEventCoa, OutletDestination, ReceiptProofItem } from '../types/procurement';
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
  Receipt,
  Edit3,
  Save,
  Plus,
  Trash2,
  Layers,
  Image as ImageIcon
} from 'lucide-react';

interface GoodsReceivingViewProps {
  grns: GoodsReceipt[];
  pos: PurchaseOrder[];
  currentUser: UserAccount;
  vendors?: Vendor[];
  onSaveGRN: (grn: GoodsReceipt, updatedPO: PurchaseOrder) => void;
  onUpdateGRN?: (updatedGRN: GoodsReceipt) => void;
}

export const GoodsReceivingView: React.FC<GoodsReceivingViewProps> = ({
  grns,
  pos,
  currentUser,
  vendors = [],
  onSaveGRN,
  onUpdateGRN
}) => {
  // Requirement: "YG DAPAT MENERIMA BARANG HANYA PURCHASING."
  const canReceiveGoods = currentUser.role === 'PURCHASING' || currentUser.role === 'ADMIN';

  // USER REQUEST: Fungsi edit bukti penerimaan barang khusus untuk IT dan GM
  const isItUser = (currentUser.department || '').toLowerCase().includes('it') || 
                   (currentUser.jobTitle || '').toLowerCase().includes('it') ||
                   currentUser.role === 'ADMIN';
  const isGmUser = currentUser.role === 'GM';
  const canEditGrn = isItUser || isGmUser;

  // State Modal Edit Bukti Penerimaan Barang (Khusus IT & GM)
  const [editingGrn, setEditingGrn] = useState<GoodsReceipt | null>(null);
  const [editDoNumber, setEditDoNumber] = useState('');
  const [editReceiptDate, setEditReceiptDate] = useState('');
  const [editProofNumber, setEditProofNumber] = useState('');
  const [editProofDate, setEditProofDate] = useState('');
  const [editProofType, setEditProofType] = useState<GoodsReceipt['receiptProofType']>('NOTA_KONTAN');
  const [editProofImage, setEditProofImage] = useState('');
  const [editProofItems, setEditProofItems] = useState<ReceiptProofItem[]>([]);
  const [editPaymentMethod, setEditPaymentMethod] = useState<'PETTY_CASH' | 'AP_INVOICE' | 'COD_CASH'>('PETTY_CASH');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<GoodsReceiptItem[]>([]);

  const handleOpenEditGrn = (grn: GoodsReceipt) => {
    setEditingGrn(grn);
    setEditDoNumber(grn.deliveryOrderNumber || '');
    setEditReceiptDate(grn.receiptDate || '');
    setEditProofNumber(grn.receiptProofNumber || '');
    setEditProofDate(grn.receiptProofDate || grn.receiptDate || '');
    setEditProofType(grn.receiptProofType || 'NOTA_KONTAN');
    setEditProofImage(grn.receiptProofImage || '');
    setEditPaymentMethod(grn.paymentMethod || 'PETTY_CASH');
    setEditNotes(grn.notes || '');
    setEditItems((grn.items || []).map(i => ({ ...i })));

    // Load multiple receipt photos with sequential numbering
    const initialList: ReceiptProofItem[] = (grn.receiptProofItems && grn.receiptProofItems.length > 0)
      ? grn.receiptProofItems.map(it => ({ ...it }))
      : (grn.receiptProofImages && grn.receiptProofImages.length > 0)
      ? grn.receiptProofImages.map((img, idx) => ({
          id: `edit-proof-${idx}`,
          orderIndex: idx + 1,
          proofNumber: `${grn.receiptProofNumber || grn.deliveryOrderNumber || 'NOTA'}-${String(idx + 1).padStart(2, '0')}`,
          imageUrl: img,
          caption: `Nota Fisik #${idx + 1}`
        }))
      : grn.receiptProofImage ? [{
          id: `edit-proof-0`,
          orderIndex: 1,
          proofNumber: `${grn.receiptProofNumber || grn.deliveryOrderNumber || 'NOTA'}-01`,
          imageUrl: grn.receiptProofImage,
          caption: `Nota Fisik #1`
        }] : [];
    setEditProofItems(initialList);
  };

  const handleEditItemChange = (idx: number, field: keyof GoodsReceiptItem, val: any) => {
    setEditItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: val };
      if (field === 'qtyReceived' || field === 'unitPriceNota') {
        const qty = field === 'qtyReceived' ? Number(val) : item.qtyReceived;
        const price = field === 'unitPriceNota' ? Number(val) : item.unitPriceNota;
        updated.totalPriceNota = (qty || 0) * (price || 0);
      }
      return updated;
    }));
  };

  const handleSaveEditedGrn = () => {
    if (!editingGrn) return;
    const recalculatedTotal = editItems.reduce((acc, curr) => acc + (Number(curr.totalPriceNota) || (Number(curr.qtyReceived) * Number(curr.unitPriceNota))), 0);

    const finalEditProofItems = editProofItems.length > 0
      ? editProofItems
      : editProofImage ? [{
          id: `edit-proof-0`,
          orderIndex: 1,
          proofNumber: `${editProofNumber || editDoNumber || 'NOTA'}-01`,
          imageUrl: editProofImage,
          caption: `Nota Fisik #1`
        }] : [];

    const updated: GoodsReceipt = {
      ...editingGrn,
      deliveryOrderNumber: editDoNumber,
      receiptDate: editReceiptDate,
      receiptProofNumber: editProofNumber,
      receiptProofDate: editProofDate,
      receiptProofType: editProofType,
      receiptProofImage: finalEditProofItems[0]?.imageUrl || editProofImage,
      receiptProofImages: finalEditProofItems.map(it => it.imageUrl),
      receiptProofItems: finalEditProofItems,
      paymentMethod: editPaymentMethod,
      settlementStatus: editPaymentMethod === 'PETTY_CASH' ? (editingGrn.settlementStatus || 'UNSETTLED') : undefined,
      notes: editNotes,
      items: editItems,
      totalInvoiceAudited: recalculatedTotal
    };

    if (onUpdateGRN) {
      onUpdateGRN(updated);
    }
    setEditingGrn(null);
    alert(`Bukti Penerimaan Barang ${updated.grnNumber} berhasil diperbarui oleh ${currentUser.name} (${isGmUser ? 'General Manager' : 'IT System Administrator'})!`);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrnForModal, setSelectedGrnForModal] = useState<GoodsReceipt | null>(null);
  const [selectedReceiptProofModal, setSelectedReceiptProofModal] = useState<GoodsReceipt | null>(null);
  const [proofPreviewActiveIndex, setProofPreviewActiveIndex] = useState(0);

  // Direct PO selected from the table for receiving
  const [targetPoForReceiving, setTargetPoForReceiving] = useState<PurchaseOrder | null>(null);
  const [deliveryOrderNumber, setDeliveryOrderNumber] = useState('');
  const [receivingNotes, setReceivingNotes] = useState('');

  // Proof Bukti Nota states (Mendukung upload banyak foto dengan nomor urut)
  const [receiptProofNumber, setReceiptProofNumber] = useState('');
  const [receiptProofDate, setReceiptProofDate] = useState('');
  const [receiptProofType, setReceiptProofType] = useState<GoodsReceipt['receiptProofType']>('NOTA_KONTAN');
  const [receiptProofNotes, setReceiptProofNotes] = useState('');
  const [receiptProofImage, setReceiptProofImage] = useState('');
  const [receiptProofItems, setReceiptProofItems] = useState<ReceiptProofItem[]>([]);
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

    const matchedVendor = (vendors || []).find(v => 
      v.id === po.vendorId || 
      v.name.toLowerCase().trim() === po.vendorName.toLowerCase().trim()
    );
    const isCreditVendor = Boolean(
      matchedVendor && (
        matchedVendor.paymentTerm === 'CREDIT' || 
        (typeof matchedVendor.creditLimit === 'number' && matchedVendor.creditLimit > 0)
      )
    );

    // Untuk vendor cash purchase langsung lunas (PAID). Untuk credit vendor, default ke UNPAID_AP jika PO kredit atau PAID
    const isPoCredit = isCreditVendor && (po.paymentMethod === 'AP_INVOICE' || po.paymentTerms?.toLowerCase().includes('net') || po.grandTotal > 5000000);
    setPaymentDestination(isPoCredit ? 'UNPAID_AP' : 'PAID');
    setReceivingPaymentMethod('PETTY_CASH');
    setTermsOfPayment(po.paymentTerms || 'NET 30');
    
    const targetDueDate = new Date();
    targetDueDate.setDate(targetDueDate.getDate() + 30);
    setCustomDueDate(targetDueDate.toISOString().split('T')[0]);
    setVendorInvoiceNo(`INV/${po.vendorName.substring(0, 4).toUpperCase()}/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);

    // Pre-populate items with audit fields
    const initialItems: GoodsReceiptItem[] = po.items.map((it) => {
      const remainingQty = Math.max(0, it.quantityOrdered - it.quantityReceived);
      const unitPrice = Number(it.unitPrice) || 0;
      const itemCoa = it.coaName || po.coaName;
      const itemCoaCode = it.coaCode || po.coaCode;
      const isItemBpp = isStrictBppCoa(itemCoa, itemCoaCode);
      const isItemEvent = isEventCoa(itemCoa, itemCoaCode);
      const initialOutlet: OutletDestination | undefined = isItemBpp
        ? (it.outletDestination === 'MICE' ? 'MICE' : 'NUKA')
        : (isItemEvent ? (it.outletDestination || 'NONE') : undefined);

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
        outletDestination: initialOutlet,
        coaName: itemCoa,
        coaCode: itemCoaCode,
        costCenterName: it.costCenterName || po.costCenterName
      };
    });

    const initTotal = initialItems.reduce((acc, curr) => acc + curr.totalPriceNota, 0);
    // Auto-generate realistic SVG receipt proof preview
    const sampleItemsStr = initialItems.map(i => `${i.qtyReceived} ${i.unit} ${i.itemName}`).slice(0, 3).join(', ');
    const defaultSvg = generateReceiptSvg(po.vendorName, notaNum, todayStr, initTotal, sampleItemsStr);
    setReceiptProofImage(defaultSvg);
    setReceiptProofItems([
      {
        id: `proof-${Date.now()}-1`,
        orderIndex: 1,
        proofNumber: `${notaNum}-01`,
        imageUrl: defaultSvg,
        caption: `Nota Fisik #1 (${po.vendorName})`,
        uploadedAt: todayStr
      }
    ]);

    setAuditItems(initialItems);
  };

  const handleMultipleProofImagesUpload = (files: FileList | null, isEdit = false) => {
    if (!files || files.length === 0) return;
    const baseNo = isEdit
      ? (editProofNumber || editDoNumber || 'NOTA')
      : (receiptProofNumber || deliveryOrderNumber || 'NOTA');

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        if (isEdit) {
          setEditProofItems(prev => {
            const nextIdx = prev.length + 1;
            const newItem: ReceiptProofItem = {
              id: `proof-edit-${Date.now()}-${nextIdx}-${Math.random().toString(36).slice(2, 6)}`,
              orderIndex: nextIdx,
              proofNumber: `${baseNo}-${String(nextIdx).padStart(2, '0')}`,
              imageUrl: dataUrl,
              caption: `Foto Nota #${nextIdx} (${file.name})`,
              uploadedAt: new Date().toLocaleDateString('id-ID')
            };
            const updated = [...prev, newItem];
            if (updated[0]?.imageUrl) {
              setEditProofImage(updated[0].imageUrl);
            }
            return updated;
          });
        } else {
          setReceiptProofItems(prev => {
            const isSingleAutoSvg = prev.length === 1 && prev[0].imageUrl.startsWith('data:image/svg+xml');
            const baseList = isSingleAutoSvg ? [] : prev;
            const nextIdx = baseList.length + 1;
            const newItem: ReceiptProofItem = {
              id: `proof-new-${Date.now()}-${nextIdx}-${Math.random().toString(36).slice(2, 6)}`,
              orderIndex: nextIdx,
              proofNumber: `${baseNo}-${String(nextIdx).padStart(2, '0')}`,
              imageUrl: dataUrl,
              caption: `Foto Nota #${nextIdx} (${file.name})`,
              uploadedAt: new Date().toLocaleDateString('id-ID')
            };
            const updated = [...baseList, newItem];
            if (updated[0]?.imageUrl) {
              setReceiptProofImage(updated[0].imageUrl);
            }
            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveProofItem = (id: string, isEdit = false) => {
    if (isEdit) {
      setEditProofItems(prev => {
        const filtered = prev.filter(it => it.id !== id);
        const baseNo = editProofNumber || editDoNumber || 'NOTA';
        const reindexed = filtered.map((it, idx) => ({
          ...it,
          orderIndex: idx + 1,
          proofNumber: `${baseNo}-${String(idx + 1).padStart(2, '0')}`
        }));
        if (reindexed[0]?.imageUrl) {
          setEditProofImage(reindexed[0].imageUrl);
        } else {
          setEditProofImage('');
        }
        return reindexed;
      });
    } else {
      setReceiptProofItems(prev => {
        const filtered = prev.filter(it => it.id !== id);
        const baseNo = receiptProofNumber || deliveryOrderNumber || 'NOTA';
        const reindexed = filtered.map((it, idx) => ({
          ...it,
          orderIndex: idx + 1,
          proofNumber: `${baseNo}-${String(idx + 1).padStart(2, '0')}`
        }));
        if (reindexed[0]?.imageUrl) {
          setReceiptProofImage(reindexed[0].imageUrl);
        } else {
          setReceiptProofImage('');
        }
        return reindexed;
      });
    }
  };

  const handleProofImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleMultipleProofImagesUpload(e.target.files, false);
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

    const matchedVendor = (vendors || []).find(v => 
      v.id === targetPoForReceiving.vendorId ||
      v.name.toLowerCase().trim() === targetPoForReceiving.vendorName.toLowerCase().trim()
    );
    const isCreditVendor = Boolean(
      matchedVendor && (
        matchedVendor.paymentTerm === 'CREDIT' || 
        (typeof matchedVendor.creditLimit === 'number' && matchedVendor.creditLimit > 0)
      )
    );

    const nowStr = new Date().toLocaleString('id-ID', { hour12: false });
    const grnNumber = `GRN/GMCC/2026/10/${Math.floor(100 + Math.random() * 900)}`;

    const finalProofImage = receiptProofImage || generateReceiptSvg(
      targetPoForReceiving.vendorName,
      receiptProofNumber || deliveryOrderNumber,
      receiptProofDate || new Date().toLocaleDateString('id-ID'),
      totalAuditedNota,
      auditItems.map(i => `${i.qtyReceived} ${i.unit} ${i.itemName}`).slice(0, 3).join(', ')
    );

    const finalProofItems: ReceiptProofItem[] = receiptProofItems.length > 0
      ? receiptProofItems
      : [{
          id: `proof-${Date.now()}-1`,
          orderIndex: 1,
          proofNumber: `${receiptProofNumber || deliveryOrderNumber}-01`,
          imageUrl: finalProofImage,
          caption: `Nota Fisik #1 (${targetPoForReceiving.vendorName})`,
          uploadedAt: nowStr.split(' ')[0]
        }];

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
      // Bukti Nota Fisik (Mendukung banyak foto dan penomoran urut)
      receiptProofNumber: receiptProofNumber || deliveryOrderNumber,
      receiptProofDate: receiptProofDate || nowStr.split(' ')[0],
      receiptProofVendor: targetPoForReceiving.vendorName,
      receiptProofAmount: totalAuditedNota,
      receiptProofImage: finalProofItems[0]?.imageUrl || finalProofImage,
      receiptProofImages: finalProofItems.map(it => it.imageUrl),
      receiptProofItems: finalProofItems,
      receiptProofType: receiptProofType || 'NOTA_KONTAN',
      paymentMethod: isCreditVendor ? (paymentDestination === 'UNPAID_AP' ? 'AP_INVOICE' : 'PETTY_CASH') : 'PETTY_CASH',
      settlementStatus: (!isCreditVendor || paymentDestination === 'PAID') ? 'UNSETTLED' : undefined,
      costCenterName: targetPoForReceiving.costCenterName,
      coaName: targetPoForReceiving.coaName || (targetPoForReceiving.items[0] as any)?.coaName || 'BPP',
      // PPh 23 & AP Aging
      taxPPh23Applicable,
      taxPPh23Rate: taxPPh23Applicable ? 0.02 : 0,
      taxPPh23Method: taxPPh23Applicable ? taxPPh23Method : undefined,
      taxPPh23Amount: pph23Amount,
      netPaymentAmount: netPaymentAmount,
      paymentStatus: isCreditVendor ? paymentDestination : 'PAID',
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
                      <div className="flex items-center justify-end gap-1.5">
                        {canEditGrn && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditGrn(g)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1.5 font-semibold text-xs transition-colors"
                            title="Edit Bukti Penerimaan Barang (Khusus IT & GM)"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Edit GRN</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedGrnForModal(g)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white border border-slate-700 inline-flex items-center gap-1.5 font-semibold text-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak Bukti GRN</span>
                        </button>
                      </div>
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
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                  <span>Vendor: <b className="text-white">{targetPoForReceiving.vendorName}</b></span>
                  {(() => {
                    const matchedVendor = (vendors || []).find(v => 
                      v.id === targetPoForReceiving.vendorId || 
                      v.name.toLowerCase().trim() === targetPoForReceiving.vendorName.toLowerCase().trim()
                    );
                    const isCredit = Boolean(
                      matchedVendor && (
                        matchedVendor.paymentTerm === 'CREDIT' || 
                        (typeof matchedVendor.creditLimit === 'number' && matchedVendor.creditLimit > 0)
                      )
                    );
                    return isCredit ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        📑 Rekanan Credit (Tempo / Plafon: {formatRupiah(matchedVendor?.creditLimit)})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        💵 Rekanan Cash Purchase (Sudah Dibayar)
                      </span>
                    );
                  })()}
                  <span>• Departemen: {targetPoForReceiving.department}</span>
                </div>
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

                          {/* Outlet Destination (BPP: NUKA/MICE; Event: NUKA/MICE/NONE; Non-BPP: Dinonaktifkan) */}
                          <td className="px-3 py-2 text-center">
                            {isStrictBppCoa(it.coaName || targetPoForReceiving.coaName, it.coaCode || targetPoForReceiving.coaCode) ? (
                              <select
                                value={it.outletDestination === 'MICE' ? 'MICE' : 'NUKA'}
                                onChange={(e) => handleItemAuditChange(idx, 'outletDestination', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-slate-800 border border-amber-500/50 text-amber-300 font-semibold text-[10px] focus:outline-none focus:border-amber-400"
                              >
                                <option value="NUKA">🏖️ NUKA BEACH CLUB</option>
                                <option value="MICE">🏛️ MICE Banquet</option>
                              </select>
                            ) : isEventCoa(it.coaName || targetPoForReceiving.coaName, it.coaCode || targetPoForReceiving.coaCode) ? (
                              <select
                                value={it.outletDestination || 'NONE'}
                                onChange={(e) => handleItemAuditChange(idx, 'outletDestination', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-slate-800 border border-purple-500/50 text-purple-300 font-semibold text-[10px] focus:outline-none focus:border-purple-400"
                              >
                                <option value="NUKA">🏖️ NUKA (Food Flash)</option>
                                <option value="MICE">🏛️ MICE (Food Flash)</option>
                                <option value="NONE">🚫 Tidak Keduanya (Non-BPP)</option>
                              </select>
                            ) : (
                              <div className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-500 text-[10px] italic" title="Barang non-BPP tidak masuk ke modul Daily Food Flash">
                                Non-BPP (Non-Food Flash)
                              </div>
                            )}
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

              {/* SECTION: PILIHAN PELUNASAN (HANYA MUNCUL JIKA VENDOR ADALAH REKANAN CREDIT / TEMPO) */}
              {(() => {
                const matchedVendor = (vendors || []).find(v => 
                  v.id === targetPoForReceiving.vendorId || 
                  v.name.toLowerCase().trim() === targetPoForReceiving.vendorName.toLowerCase().trim()
                );
                const isCreditVendor = Boolean(
                  matchedVendor && (
                    matchedVendor.paymentTerm === 'CREDIT' || 
                    (typeof matchedVendor.creditLimit === 'number' && matchedVendor.creditLimit > 0)
                  )
                );

                // USER REQUEST: Untuk vendor Cash Purchase, Image 2 dihapus sama sekali (receiving hanya menerima barang karena sudah lunas)
                if (!isCreditVendor) {
                  return null;
                }

                return (
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-white text-xs uppercase tracking-wide">
                          Pilihan Pelunasan Pengadaan Rekanan (Fasilitas Kredit Tersedia)
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Vendor memiliki fasilitas kredit. Tentukan apakah transaksi ini dibayar cash atau masuk tempo:
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Option 1: Sudah Dibayar Cash */}
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
                            <span>💵 Sudah Dibayar Cash (Kas Kecil / Lunas)</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold">Lunas</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            Pengadaan langsung dibayar tunai / kas operasional dan otomatis siap ditarik ke dalam laporan penarikan <b>Petty Cash (Kas Kecil)</b>.
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
                            <span>📑 Pakai Credit / Tempo (Masuk AP Aging)</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 font-bold">Hutang Dagang</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            Plafon kredit tersedia: <b>{formatRupiah(matchedVendor?.creditLimit)}</b>. Tagihan ini otomatis masuk ke modul <b>AP Aging</b> di bawah vendor <b>{targetPoForReceiving.vendorName}</b>.
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
                );
              })()}

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

                {/* Upload & Preview Foto Nota Fisik (Bisa Lebih dari 1 Foto dengan Penomoran Urut) */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-emerald-400" />
                        <span>Foto Nota &amp; Bukti Fisik Penerimaan ({receiptProofItems.length} Foto Terdaftar)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Dapat mengunggah lebih dari 1 foto nota/kuitansi/struk. Penomoran urut otomatis disinkronkan ke Kas Kecil.
                      </p>
                    </div>

                    <label className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-cyan-600/20 shrink-0">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Foto Nota (Bisa Multi)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleProofImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* List / Grid of Sequential Receipt Photos */}
                  {receiptProofItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {receiptProofItems.map((item) => (
                        <div key={item.id} className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-2 relative group">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                              Nota #{item.orderIndex}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveProofItem(item.id, false)}
                              className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Hapus foto nota ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="h-28 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
                            <img 
                              src={item.imageUrl} 
                              alt={`Nota ${item.proofNumber}`} 
                              className="h-full w-full object-cover" 
                            />
                          </div>

                          <div className="space-y-1">
                            <input
                              type="text"
                              value={item.proofNumber}
                              onChange={(e) => {
                                const newNum = e.target.value;
                                setReceiptProofItems(prev => prev.map(p => p.id === item.id ? { ...p, proofNumber: newNum } : p));
                              }}
                              placeholder="Nomor Nota (Urut)"
                              className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 font-bold"
                            />
                            <input
                              type="text"
                              value={item.caption || ''}
                              onChange={(e) => {
                                const newCap = e.target.value;
                                setReceiptProofItems(prev => prev.map(p => p.id === item.id ? { ...p, caption: newCap } : p));
                              }}
                              placeholder="Keterangan foto..."
                              className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[9.5px] text-slate-300 focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-dashed border-slate-700 text-center text-xs text-slate-400">
                      Belum ada foto nota yang diunggah. Klik <b>"Tambah Foto Nota"</b> di atas.
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

            {(() => {
              const modalProofList = (selectedReceiptProofModal.receiptProofItems && selectedReceiptProofModal.receiptProofItems.length > 0)
                ? selectedReceiptProofModal.receiptProofItems
                : (selectedReceiptProofModal.receiptProofImages && selectedReceiptProofModal.receiptProofImages.length > 0)
                ? selectedReceiptProofModal.receiptProofImages.map((img, idx) => ({
                    id: `p-${idx}`,
                    orderIndex: idx + 1,
                    proofNumber: `${selectedReceiptProofModal.receiptProofNumber || selectedReceiptProofModal.deliveryOrderNumber || 'NOTA'}-${String(idx + 1).padStart(2, '0')}`,
                    imageUrl: img,
                    caption: `Foto Nota Fisik #${idx + 1}`
                  }))
                : [{
                    id: 'default',
                    orderIndex: 1,
                    proofNumber: selectedReceiptProofModal.receiptProofNumber || selectedReceiptProofModal.deliveryOrderNumber || 'NOTA-01',
                    imageUrl: selectedReceiptProofModal.receiptProofImage || generateReceiptSvg(
                      selectedReceiptProofModal.vendorName,
                      selectedReceiptProofModal.deliveryOrderNumber,
                      selectedReceiptProofModal.receiptDate.split(' ')[0],
                      selectedReceiptProofModal.totalInvoiceAudited,
                      selectedReceiptProofModal.items.map(i => `${i.qtyReceived} ${i.unit} ${i.itemName}`).slice(0, 3).join(', ')
                    ),
                    caption: `Nota Fisik Utama`
                  }];

              const activeProof = modalProofList[proofPreviewActiveIndex] || modalProofList[0];

              return (
                <div className="p-5 overflow-y-auto space-y-4">
                  {/* Tabs / Thumbnails if multiple photos exist */}
                  {modalProofList.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
                      {modalProofList.map((p, idx) => (
                        <button
                          key={p.id || idx}
                          type="button"
                          onClick={() => setProofPreviewActiveIndex(idx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                            proofPreviewActiveIndex === idx
                              ? 'bg-cyan-500 text-slate-950 shadow'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Nota #{p.orderIndex} ({p.proofNumber})</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-2 shadow-inner">
                    <img 
                      src={activeProof.imageUrl} 
                      alt={`Bukti Nota ${activeProof.proofNumber}`}
                      className="max-h-[380px] w-auto object-contain rounded-lg shadow-lg"
                    />
                    <div className="text-[10px] text-slate-400 mt-2 font-mono">
                      Foto Nota #{activeProof.orderIndex} dari {modalProofList.length} • {activeProof.proofNumber}
                      {activeProof.caption && <span className="text-slate-300 ml-1.5">({activeProof.caption})</span>}
                    </div>
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
            ); })()}

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

      {/* USER REQUEST: MODAL EDIT BUKTI PENERIMAAN BARANG (KHUSUS IT & GM) */}
      {editingGrn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-slate-900 border border-amber-500/40 text-slate-100 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-base">
                      Edit Bukti Penerimaan Barang (GRN) &amp; Nota
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Otorisasi Khusus: IT &amp; GM
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    No. GRN: <b className="text-white font-mono">{editingGrn.grnNumber}</b> • PO Referensi: <b className="text-cyan-400 font-mono">{editingGrn.poNumber}</b> • Rekanan: <b className="text-slate-200">{editingGrn.vendorName}</b>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingGrn(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Info Box */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between">
                <span>
                  🛡️ <b>Mode Edit Manajerial:</b> Anda sedang melakukan revisi resmi bukti penerimaan barang sebagai <b>{isGmUser ? 'General Manager' : 'IT Administrator'}</b>. Seluruh perubahan nomor nota, tanggal, harga audit, atau bukti foto akan otomatis tersinkronisasi.
                </span>
                <span className="font-bold text-slate-300 shrink-0 ml-3">
                  Penerima Awal: {editingGrn.receivedBy.split('(')[0]}
                </span>
              </div>

              {/* Form Input Section 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">No. Surat Jalan / DO *</label>
                  <input
                    type="text"
                    value={editDoNumber}
                    onChange={(e) => setEditDoNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tanggal Penerimaan *</label>
                  <input
                    type="text"
                    value={editReceiptDate}
                    onChange={(e) => setEditReceiptDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
                    placeholder="DD/MM/YYYY atau YYYY-MM-DD"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">No. Bukti Nota / Kwitansi</label>
                  <input
                    type="text"
                    value={editProofNumber}
                    onChange={(e) => setEditProofNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tanggal Nota Fisik</label>
                  <input
                    type="text"
                    value={editProofDate}
                    onChange={(e) => setEditProofDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
                    placeholder="DD/MM/YYYY atau YYYY-MM-DD"
                  />
                </div>
              </div>

              {/* Form Input Section 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Jenis Bukti Transaksi</label>
                  <select
                    value={editProofType}
                    onChange={(e) => setEditProofType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="NOTA_KONTAN">Nota Kontan / Kwitansi Tunai</option>
                    <option value="INVOICE">Faktur / Invoice Rekanan</option>
                    <option value="STRUK_KASIR">Struk Kasir / EDC</option>
                    <option value="FAKTUR_PAJAK">Faktur Pajak</option>
                    <option value="BUKTI_TRANSFER">Bukti Transfer Kas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Jalur Pelunasan Pembayaran</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-400 font-semibold"
                  >
                    <option value="PETTY_CASH">💰 Kas Kecil (Lunas / Reimbursement)</option>
                    <option value="AP_INVOICE">📑 Hutang Usaha / AP Aging (Tempo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Catatan Penerimaan / Revisi</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Catatan inspeksi fisik atau alasan revisi..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Bukti Foto Nota Fisik (Mendukung Multi-Foto & Penomoran Urut) */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-emerald-400" />
                      Lampiran Foto Bukti Nota Fisik ({editProofItems.length} Foto Terlampir)
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Setiap foto otomatis memiliki penomoran urut resmi dan disinkronkan ke dokumen PO/GRN serta modul Petty Cash.
                    </p>
                  </div>
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1.5 text-xs transition-all shadow-sm">
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Foto Nota</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        handleMultipleProofImagesUpload(e.target.files, true);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>

                {editProofItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {editProofItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 transition-all flex flex-col gap-2 relative group"
                      >
                        <div className="relative h-32 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                          <img
                            src={item.imageUrl}
                            alt={item.proofNumber}
                            className="h-full w-full object-contain cursor-pointer"
                            onClick={() => {
                              setSelectedReceiptProofModal({
                                ...editingGrn,
                                receiptProofImages: editProofItems.map(p => p.imageUrl),
                                receiptProofItems: editProofItems
                              });
                            }}
                          />
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-950/90 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/40 shadow">
                            Nota #{item.orderIndex}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProofItem(item.id, true)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-md bg-rose-950/90 text-rose-300 hover:bg-rose-600 hover:text-white transition-all opacity-80 group-hover:opacity-100 border border-rose-500/30"
                            title="Hapus foto ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={item.proofNumber}
                            onChange={(e) => {
                              const newNum = e.target.value;
                              setEditProofItems(prev => prev.map(p => p.id === item.id ? { ...p, proofNumber: newNum } : p));
                            }}
                            placeholder="Nomor Nota (Urut)"
                            className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[10px] font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 font-bold"
                          />
                          <input
                            type="text"
                            value={item.caption || ''}
                            onChange={(e) => {
                              const newCap = e.target.value;
                              setEditProofItems(prev => prev.map(p => p.id === item.id ? { ...p, caption: newCap } : p));
                            }}
                            placeholder="Keterangan foto..."
                            className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[9.5px] text-slate-300 focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : editProofImage ? (
                  <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center relative">
                    <img 
                      src={editProofImage} 
                      alt="Bukti Nota" 
                      className="h-full w-auto object-contain" 
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
                      Nota #1 (NOTA-01)
                    </span>
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-500 bg-slate-900 rounded-xl border border-dashed border-slate-800">
                    Belum ada bukti foto fisik yang dilampirkan. Klik <b>"+ Tambah Foto Nota"</b> di atas.
                  </div>
                )}
              </div>

              {/* Tabel Rincian Item Barang yang Diterima */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Rincian Audit Barang Penerimaan &amp; Harga Nota
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Nilai Total: <b className="text-cyan-400 font-mono text-xs">{formatRupiah(editItems.reduce((acc, curr) => acc + (curr.totalPriceNota || 0), 0))}</b>
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-3 py-2">Nama Barang</th>
                        <th className="px-2 py-2 text-center w-16">Satuan</th>
                        <th className="px-2 py-2 text-center w-20">Qty Diterima</th>
                        <th className="px-2 py-2 text-center w-20">Qty Reject</th>
                        <th className="px-3 py-2 text-right w-28">Harga Nota (Audit)</th>
                        <th className="px-3 py-2 text-right w-32">Total Nota</th>
                        <th className="px-3 py-2 w-32">Alokasi Outlet</th>
                        <th className="px-3 py-2 w-28">Kondisi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {editItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium text-white">
                            <div>{item.itemName}</div>
                            {item.specification && (
                              <div className="text-[10px] text-slate-400">{item.specification}</div>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center font-mono">{item.unit}</td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.qtyReceived}
                              onChange={(e) => handleEditItemChange(idx, 'qtyReceived', Number(e.target.value))}
                              className="w-16 text-center px-1 py-1 rounded bg-slate-800 border border-slate-700 text-white font-mono"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.qtyRejected}
                              onChange={(e) => handleEditItemChange(idx, 'qtyRejected', Number(e.target.value))}
                              className="w-16 text-center px-1 py-1 rounded bg-slate-800 border border-slate-700 text-rose-300 font-mono"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              value={item.unitPriceNota}
                              onChange={(e) => handleEditItemChange(idx, 'unitPriceNota', Number(e.target.value))}
                              className="w-24 text-right px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-mono"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-cyan-300">
                            {formatRupiah(item.totalPriceNota)}
                          </td>
                          <td className="px-3 py-2">
                            {isStrictBppCoa(item.coaName || editingGrn.coaName, item.coaCode) ? (
                              <select
                                value={item.outletDestination === 'MICE' ? 'MICE' : 'NUKA'}
                                onChange={(e) => handleEditItemChange(idx, 'outletDestination', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-slate-800 border border-amber-500/50 text-amber-300 font-semibold text-[10px]"
                              >
                                <option value="NUKA">🏖️ NUKA BEACH CLUB</option>
                                <option value="MICE">🏛️ MICE Banquet</option>
                              </select>
                            ) : isEventCoa(item.coaName || editingGrn.coaName, item.coaCode) ? (
                              <select
                                value={item.outletDestination || 'NONE'}
                                onChange={(e) => handleEditItemChange(idx, 'outletDestination', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-slate-800 border border-purple-500/50 text-purple-300 font-semibold text-[10px]"
                              >
                                <option value="NUKA">🏖️ NUKA (Food Flash)</option>
                                <option value="MICE">🏛️ MICE (Food Flash)</option>
                                <option value="NONE">🚫 Tidak Keduanya (Non-BPP)</option>
                              </select>
                            ) : (
                              <span className="text-slate-500 text-[10px] italic">Non-BPP</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={item.condition}
                              onChange={(e) => handleEditItemChange(idx, 'condition', e.target.value as any)}
                              className="w-full px-1.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]"
                            >
                              <option value="Baik & Sesuai">Baik &amp; Sesuai</option>
                              <option value="Sebagian Rusak">Sebagian Rusak</option>
                              <option value="Kadaluarsa">Kadaluarsa</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-400">
                <span>Total Tagihan Audited: </span>
                <span className="text-sm font-black font-mono text-cyan-400 ml-1">
                  {formatRupiah(editItems.reduce((acc, curr) => acc + (curr.totalPriceNota || 0), 0))}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingGrn(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedGrn}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-600/30 flex items-center gap-2 transition-all hover:scale-105"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Bukti GRN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
