import React, { useState, useMemo } from 'react';
import { 
  GoodsReceipt, 
  PurchaseOrder, 
  PettyCashSettlementPeriod, 
  ExpenseReceiptProof,
  ChartOfAccount, 
  CostCenter, 
  UserAccount,
  ReceiptProofItem,
  formatItdcInvoiceNumber
} from '../types/procurement';
import { SAMPLE_SIGNATURES } from '../data/procurementMock';
import { 
  Scale, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Calendar, 
  Plus, 
  FileText, 
  Eye, 
  X, 
  Receipt, 
  Layers, 
  Building2, 
  Download, 
  HelpCircle, 
  CheckSquare, 
  Square,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

interface PettyCashReconciliationViewProps {
  grns: GoodsReceipt[];
  pos: PurchaseOrder[];
  pettyCashPeriods: PettyCashSettlementPeriod[];
  coas: ChartOfAccount[];
  costCenters: CostCenter[];
  currentUser: UserAccount;
  onSavePettyCashPeriod: (period: PettyCashSettlementPeriod) => void;
  onNavigateToPettyCash: () => void;
}

interface ReconciliationItem {
  id: string; // grn.id
  grnNumber: string;
  poNumber: string;
  receiptDate: string; // display date
  isoDate: string;
  vendorName: string;
  totalInvoiceAudited: number;
  deliveryOrderNumber: string;
  receiptProofNumber: string;
  receiptProofType: string;
  receiptProofImage?: string;
  receiptProofImages?: string[];
  receiptProofItems?: ReceiptProofItem[];
  coaName: string;
  costCenterName: string;
  description: string;
  // Settlement reconciliation status
  settlementStatus: 'SETTLED' | 'UNSETTLED' | 'SKIPPED_LIMIT';
  settledInPeriodName?: string;
  settledInPeriodId?: string;
  itdcInvoiceNumber?: string;
  jvNumber?: string;
  settledDate?: string;
  daysUnsettled: number;
}

export const PettyCashReconciliationView: React.FC<PettyCashReconciliationViewProps> = ({
  grns,
  pos,
  pettyCashPeriods,
  coas,
  costCenters,
  currentUser,
  onSavePettyCashPeriod,
  onNavigateToPettyCash
}) => {
  const formatRupiah = (val?: number) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const toStandardIso = (dateStr?: string): string => {
    if (!dateStr) return '';
    const clean = dateStr.trim().split(' ')[0];
    if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts[0].length === 4) return clean;
    } else if (clean.includes('/')) {
      const parts = clean.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return clean;
  };

  const toDisplayDate = (isoStr?: string): string => {
    if (!isoStr) return '';
    if (isoStr.includes('-')) {
      const parts = isoStr.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return isoStr;
  };

  // State Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNSETTLED' | 'SETTLED' | 'SKIPPED_LIMIT'>('ALL');
  const [selectedCoa, setSelectedCoa] = useState<string>('ALL');
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('ALL');
  const [periodPreset, setPeriodPreset] = useState<'ALL' | '1-15' | '16-31' | 'CUSTOM'>('ALL');
  // Default to current month and year
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    return new Date().getMonth() + 1; // 1-12
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return new Date().getFullYear();
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected IDs for batch settlement
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectedProofModal, setSelectedProofModal] = useState<ReconciliationItem | null>(null);
  const [reconcileProofModalIndex, setReconcileProofModalIndex] = useState<number>(0);
  const [showSopGuide, setShowSopGuide] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPeriodNameInput, setNewPeriodNameInput] = useState('');
  const [newItdcInvoiceInput, setNewItdcInvoiceInput] = useState('');

  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Map each GRN against all Petty Cash Periods items to evaluate settlement status
  const reconciliationData: ReconciliationItem[] = useMemo(() => {
    // Map of all items settled across any petty cash periods
    const settledMap: Record<string, { periodName: string; periodId: string; itdcInvoiceNumber?: string; jvNumber?: string; settledDate: string }> = {};

    pettyCashPeriods.forEach(period => {
      period.items.forEach(item => {
        const invNo = item.itdcInvoiceNumber || period.itdcInvoiceNumber;
        if (item.grnNumber) {
          settledMap[item.grnNumber] = {
            periodName: period.periodName,
            periodId: period.id,
            itdcInvoiceNumber: invNo,
            jvNumber: item.jvNumber || 'JV/2604/001',
            settledDate: item.date
          };
        }
        if (item.receiptNumber) {
          settledMap[item.receiptNumber] = {
            periodName: period.periodName,
            periodId: period.id,
            itdcInvoiceNumber: invNo,
            jvNumber: item.jvNumber || 'JV/2604/001',
            settledDate: item.date
          };
        }
      });
    });

    const now = new Date('2026-11-04T12:00:00Z');

    return grns.map(grn => {
      const rawDate = grn.receiptProofDate || grn.receiptDate;
      const iso = toStandardIso(rawDate) || '2026-10-15';
      const dispDate = toDisplayDate(iso);

      const poRef = pos.find(p => p.id === grn.poId || p.poNumber === grn.poNumber);
      const coa = grn.coaName || (poRef?.items[0] as any)?.coaName || poRef?.coaName || 'BPP';
      const costCenter = grn.costCenterName || poRef?.costCenterName || 'F&B Culinary Central Kitchen';

      // Check if settled in any period
      const matchByGrn = settledMap[grn.grnNumber];
      const matchByReceipt = grn.receiptProofNumber ? settledMap[grn.receiptProofNumber] : undefined;
      const match = matchByGrn || matchByReceipt;

      const isSettled = !!match;

      // Calculate days elapsed since receipt
      const receiptDateObj = new Date(iso);
      const diffMs = Math.max(0, now.getTime() - receiptDateObj.getTime());
      const daysUnsettled = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // Determine skipped status from period notes or high value
      let status: 'SETTLED' | 'UNSETTLED' | 'SKIPPED_LIMIT' = isSettled ? 'SETTLED' : 'UNSETTLED';
      if (!isSettled && daysUnsettled > 10) {
        status = 'SKIPPED_LIMIT'; // Tertahan pagu atau tanggal sebelumnya
      }

      const desc = grn.items && grn.items.length > 0
        ? grn.items.map(i => `${i.qtyReceived} ${i.unit} ${i.itemName}`).slice(0, 3).join(', ')
        : grn.notes || 'Penerimaan barang operasional';

      return {
        id: grn.id,
        grnNumber: grn.grnNumber,
        poNumber: grn.poNumber,
        receiptDate: dispDate,
        isoDate: iso,
        vendorName: grn.vendorName,
        totalInvoiceAudited: grn.totalInvoiceAudited || grn.receiptProofAmount || 0,
        deliveryOrderNumber: grn.deliveryOrderNumber || '-',
        receiptProofNumber: grn.receiptProofNumber || grn.deliveryOrderNumber || grn.grnNumber,
        receiptProofType: grn.receiptProofType || 'NOTA_KONTAN',
        receiptProofImage: grn.receiptProofImage,
        receiptProofImages: (grn.receiptProofImages && grn.receiptProofImages.length > 0)
          ? grn.receiptProofImages
          : (grn.receiptProofImage ? [grn.receiptProofImage] : undefined),
        receiptProofItems: (grn.receiptProofItems && grn.receiptProofItems.length > 0)
          ? grn.receiptProofItems
          : undefined,
        coaName: coa,
        costCenterName: costCenter,
        description: desc,
        settlementStatus: status,
        settledInPeriodName: match?.periodName,
        settledInPeriodId: match?.periodId,
        itdcInvoiceNumber: match?.itdcInvoiceNumber,
        jvNumber: match?.jvNumber,
        settledDate: match?.settledDate,
        daysUnsettled
      };
    });
  }, [grns, pos, pettyCashPeriods]);

  // Handle Preset Date changes
  const handlePresetChange = (preset: 'ALL' | '1-15' | '16-31' | 'CUSTOM', m: number, y: number) => {
    setPeriodPreset(preset);
    setSelectedMonth(m);
    setSelectedYear(y);
    // Clear manual overrides when changing presets or dropdowns
    setStartDate('');
    setEndDate('');
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return reconciliationData.filter(item => {
      // Status filter
      if (statusFilter !== 'ALL' && item.settlementStatus !== statusFilter) return false;

      // COA filter
      if (selectedCoa !== 'ALL' && item.coaName.toLowerCase() !== selectedCoa.toLowerCase()) return false;

      // Cost Center filter
      if (selectedCostCenter !== 'ALL' && item.costCenterName.toLowerCase() !== selectedCostCenter.toLowerCase()) return false;

      // Date filtering (Year, Month, and 1-15 / 16-31 cycle presets)
      if (item.isoDate) {
        const parts = item.isoDate.split('-');
        if (parts.length === 3) {
          const itemYear = parseInt(parts[0], 10);
          const itemMonth = parseInt(parts[1], 10);
          const itemDay = parseInt(parts[2], 10);

          // Check Year
          if (selectedYear && itemYear !== selectedYear) return false;

          // Check Month (if selectedMonth === 0, show all months)
          if (selectedMonth > 0 && itemMonth !== selectedMonth) return false;

          // Check Cycle Preset
          if (periodPreset === '1-15' && (itemDay < 1 || itemDay > 15)) return false;
          if (periodPreset === '16-31' && (itemDay < 16 || itemDay > 31)) return false;
        }
      }

      // Custom Date Range filter if explicitly set
      if (startDate && item.isoDate < startDate) return false;
      if (endDate && item.isoDate > endDate) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          item.grnNumber.toLowerCase().includes(q) ||
          item.poNumber.toLowerCase().includes(q) ||
          item.vendorName.toLowerCase().includes(q) ||
          item.receiptProofNumber.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.costCenterName.toLowerCase().includes(q) ||
          item.coaName.toLowerCase().includes(q) ||
          (item.itdcInvoiceNumber && item.itdcInvoiceNumber.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [reconciliationData, statusFilter, selectedCoa, selectedCostCenter, selectedYear, selectedMonth, periodPreset, startDate, endDate, searchQuery]);

  // Financial & Reconciliation Metrics (dynamically calculated for the active filtered period)
  const metrics = useMemo(() => {
    const totalCount = filteredData.length;
    const totalAmount = filteredData.reduce((sum, it) => sum + it.totalInvoiceAudited, 0);

    const settledItems = filteredData.filter(it => it.settlementStatus === 'SETTLED');
    const settledCount = settledItems.length;
    const settledAmount = settledItems.reduce((sum, it) => sum + it.totalInvoiceAudited, 0);

    const unsettledItems = filteredData.filter(it => it.settlementStatus === 'UNSETTLED');
    const unsettledCount = unsettledItems.length;
    const unsettledAmount = unsettledItems.reduce((sum, it) => sum + it.totalInvoiceAudited, 0);

    const skippedItems = filteredData.filter(it => it.settlementStatus === 'SKIPPED_LIMIT');
    const skippedCount = skippedItems.length;
    const skippedAmount = skippedItems.reduce((sum, it) => sum + it.totalInvoiceAudited, 0);

    const percentSettled = totalAmount > 0 ? Math.round((settledAmount / totalAmount) * 100) : 100;

    return {
      totalCount,
      totalAmount,
      settledCount,
      settledAmount,
      unsettledCount,
      unsettledAmount,
      skippedCount,
      skippedAmount,
      percentSettled
    };
  }, [filteredData]);

  // Prominent COA display label and styling for the table header banner
  const coaBannerInfo = useMemo(() => {
    const rawCoa = selectedCoa.trim();
    if (rawCoa === 'ALL') {
      return {
        title: 'SEMUA AKUN COA (GABUNGAN BPP & NON BPP)',
        shortBadge: 'SEMUA COA',
        description: 'Menampilkan seluruh pengeluaran operasional lintas pos anggaran',
        badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 ring-1 ring-cyan-500/30'
      };
    }
    const upper = rawCoa.toUpperCase();
    if (upper === 'BPP' || (upper.includes('BPP') && !upper.includes('NON'))) {
      return {
        title: 'COA: BPP (BAHAN POKOK PRODUKSI)',
        shortBadge: 'COA BPP',
        description: 'Bahan Pokok Produksi, Kitchen MICE, Fresh Ingredients & F&B',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30'
      };
    }
    if (upper === 'NON BPP' || upper.includes('NON BPP') || upper.includes('NON-BPP')) {
      return {
        title: 'COA: NON BPP (OPERASIONAL & PERLENGKAPAN)',
        shortBadge: 'COA NON BPP',
        description: 'Pengeluaran Umum, Engineering, Housekeeping & Office Supplies',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30'
      };
    }
    const foundCoa = coas.find(c => c.name.toLowerCase() === rawCoa.toLowerCase());
    return {
      title: `COA: ${foundCoa?.code ? `${foundCoa.code} - ` : ''}${rawCoa.toUpperCase()}`,
      shortBadge: `COA ${rawCoa.toUpperCase()}`,
      description: foundCoa?.description || 'Pos Akun Anggaran Kas Kecil Terpilih',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40 ring-1 ring-purple-500/30'
    };
  }, [selectedCoa, coas]);

  // Prominent Periode (Tanggal, Bulan, Tahun) info for the table header banner
  const periodBannerInfo = useMemo(() => {
    const monthName = selectedMonth > 0 ? MONTH_NAMES[selectedMonth - 1] : 'SEMUA BULAN';
    const monthUpper = monthName.toUpperCase();
    let dateRangeText = '';
    let cycleLabel = '';
    let tanggalBadge = '';

    if (periodPreset === '1-15') {
      dateRangeText = `01 - 15 ${monthUpper} ${selectedYear}`;
      cycleLabel = 'SIKLUS 1 (TGL 1 - 15)';
      tanggalBadge = '01 s/d 15';
    } else if (periodPreset === '16-31') {
      const lastDay = selectedMonth > 0 ? new Date(selectedYear, selectedMonth, 0).getDate() : 31;
      dateRangeText = `16 - ${lastDay} ${monthUpper} ${selectedYear}`;
      cycleLabel = 'SIKLUS 2 (TGL 16 - 31)';
      tanggalBadge = `16 s/d ${lastDay}`;
    } else if (startDate && endDate) {
      dateRangeText = `${toDisplayDate(startDate)} s/d ${toDisplayDate(endDate)}`;
      cycleLabel = 'PERIODE KUSTOM';
      tanggalBadge = `${toDisplayDate(startDate)} - ${toDisplayDate(endDate)}`;
    } else if (selectedMonth > 0) {
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      dateRangeText = `01 - ${lastDay} ${monthUpper} ${selectedYear}`;
      cycleLabel = 'BULAN PENUH (01 - AKHIR)';
      tanggalBadge = `01 s/d ${lastDay}`;
    } else {
      dateRangeText = `01 JANUARI - 31 DESEMBER ${selectedYear}`;
      cycleLabel = `TAHUN BUKU ${selectedYear}`;
      tanggalBadge = '01 Jan - 31 Des';
    }

    return {
      dateRangeText,
      cycleLabel,
      tanggalBadge,
      monthBadge: monthUpper,
      yearBadge: String(selectedYear)
    };
  }, [periodPreset, selectedMonth, selectedYear, startDate, endDate, MONTH_NAMES]);

  // Batch Selection Stats
  const selectedItems = useMemo(() => {
    return reconciliationData.filter(it => selectedItemIds.includes(it.id));
  }, [reconciliationData, selectedItemIds]);

  const selectedTotalAmount = useMemo(() => {
    return selectedItems.reduce((sum, it) => sum + it.totalInvoiceAudited, 0);
  }, [selectedItems]);

  const isLimitExceeded = selectedTotalAmount > 50000000;

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllUnsettled = () => {
    const unsettledIds = filteredData
      .filter(it => it.settlementStatus !== 'SETTLED')
      .map(it => it.id);
    setSelectedItemIds(unsettledIds);
  };

  const handleClearSelection = () => {
    setSelectedItemIds([]);
  };

  // Create new Petty Cash Period from selected items
  const handleExecuteCreateNewPeriod = () => {
    if (selectedItems.length === 0) {
      alert('Pilih minimal 1 transaksi yang belum ditagihkan.');
      return;
    }
    if (isLimitExceeded) {
      alert(`Total nominal transaksi terpilih (${formatRupiah(selectedTotalAmount)}) melebihi batas pagu Rp 50.000.000. Silakan kurangi pilihan Anda agar sesuai aturan pagu per file.`);
      return;
    }

    const itdcNo = newItdcInvoiceInput.trim().toUpperCase();
    if (!itdcNo) {
      alert('No. Invoice ITDC (Wajib) harus diisi (contoh: INV/GMCC-ITDC/2026/X-001) agar terdapat sambungan track record di aplikasi lain!');
      return;
    }

    const defaultName = newPeriodNameInput.trim() || `REKONSILIASI KAS KECIL - ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()}`;

    const newProofItems: ExpenseReceiptProof[] = selectedItems.map((it, idx) => ({
      id: `rec-settle-${Date.now()}-${idx}`,
      receiptNumber: it.receiptProofNumber,
      itdcInvoiceNumber: itdcNo,
      date: it.receiptDate,
      vendorName: it.vendorName,
      department: it.costCenterName,
      costCenterName: it.costCenterName,
      coaName: it.coaName,
      glAccountCode: it.coaName === 'BPP' ? '732-001' : it.coaName === 'NON BPP' ? '732-002' : it.coaName === 'Transport' ? '741-001' : '752-001',
      glAccountName: `${it.coaName} GMCC Operational`,
      description: it.description,
      amount: it.totalInvoiceAudited,
      debit: it.totalInvoiceAudited,
      kredit: it.totalInvoiceAudited,
      proofType: it.receiptProofType as any,
      jvNumber: `JV/REC/${Date.now().toString().slice(-4)}/${idx + 1}`,
      sourceType: 'PO_RECEIVING',
      poNumber: it.poNumber,
      grnNumber: it.grnNumber,
      paidBy: currentUser.name,
      status: 'VERIFIED',
      proofImageUrl: it.receiptProofImage,
      proofImages: it.receiptProofImages,
      receiptProofItems: it.receiptProofItems
    }));

    const newPeriod: PettyCashSettlementPeriod = {
      id: `period-rec-${Date.now()}`,
      periodName: defaultName,
      itdcInvoiceNumber: itdcNo,
      startDate: selectedItems[0]?.isoDate || '2026-10-01',
      endDate: selectedItems[selectedItems.length - 1]?.isoDate || '2026-10-31',
      title: 'GOLOMORI PETTY CASH SETTLEMENT',
      currency: 'IDR',
      items: newProofItems,
      totalDebit: selectedTotalAmount,
      totalKredit: selectedTotalAmount,
      status: 'VERIFIED',
      maxLimit: 50000000,
      coaFilter: selectedCoa,
      costCenterFilter: selectedCostCenter,
      preparedBy: {
        name: 'Agus Setiabudi',
        title: 'Chief Accounting',
        date: new Date().toLocaleDateString('id-ID'),
        signatureUrl: SAMPLE_SIGNATURES.AGUS_ACCOUNTING
      },
      approvedBy: {
        name: 'Ari Soplanit',
        title: 'General Manager',
        date: new Date().toLocaleDateString('id-ID'),
        signatureUrl: SAMPLE_SIGNATURES.ARI_GM
      },
      notes: `Dibuat melalui Modul Rekonsiliasi Kas Kecil (${selectedItems.length} transaksi GRN lunas) | No. Invoice ITDC: ${itdcNo}. Disahkan Chief Accounting & GM dengan tanda tangan digital resmi.`
    };

    onSavePettyCashPeriod(newPeriod);
    alert(`Sukses! File Kas Kecil baru "${defaultName}" (No. Invoice ITDC: ${itdcNo}) berhasil dibuat dengan ${selectedItems.length} nota senilai ${formatRupiah(selectedTotalAmount)}.`);
    setShowCreateModal(false);
    setSelectedItemIds([]);
    setNewItdcInvoiceInput('');
    onNavigateToPettyCash();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Rekonsiliasi Kas Kecil &amp; Audit Tagihan</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Zero Missed Invoices
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Pengawasan komprehensif agar seluruh pengadaan barang &amp; nota yang telah diterima (GRN) ditagihkan 100% ke Kas Kecil tanpa ada yang tercecer.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowSopGuide(!showSopGuide)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>{showSopGuide ? 'Tutup Panduan Alur' : 'Panduan Alur Bebas Miss'}</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToPettyCash}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>Buka Modul Kas Kecil</span>
          </button>
        </div>
      </div>

      {/* SOP BEST PRACTICE WORKFLOW GUIDE PANEL (Collapsible) */}
      {showSopGuide && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-white text-sm">
                SOP Rekomendasi GMCC: Alur Pengadaan Bebas Bocor &amp; Bebas Miss (Zero Missed Expenses)
              </h3>
            </div>
            <button
              onClick={() => setShowSopGuide(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs">1</span>
                <span className="font-bold text-white uppercase text-[11px]">Pengikatan COA Sejak PR</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Setiap departemen pemohon <b>wajib memilih kategori COA</b> (BPP, Non-BPP, Transport, Event, dll.) saat membuat PR. Pos pembebanan anggaran terkunci sejak awal dan mengalir ke Purchase Order.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center text-xs">2</span>
                <span className="font-bold text-white uppercase text-[11px]">Wajib Bukti Nota di Receiving</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Staf Purchasing &amp; Receiving memeriksa barang fisik, mencocokkan harga nota supplier, dan <b>mengunggah foto nota asli</b> ke GRN. Tanpa bukti nota riil, penerimaan tidak dapat disimpan.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs">3</span>
                <span className="font-bold text-white uppercase text-[11px]">Plafon 50 Jt &amp; Tanggal Utuh</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Generator menarik per siklus (Tgl 1-15 &amp; 16-31). Jika sisa plafon tidak cukup untuk satu hari belanja penuh, tanggal tersebut di-skip utuh dan diprioritaskan masuk ke file berikutnya.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">4</span>
                <span className="font-bold text-white uppercase text-[11px]">Rekonsiliasi Pra-Tutup Buku</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Finance memantau modul Rekonsiliasi ini. Jika status <b>"Belum Ditarik"</b> masih ada, lakukan penarikan massal ke Kas Kecil agar saldo <i>Unbilled Expense</i> menjadi <b>Rp 0</b>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pengadaan GRN */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Total Pengadaan Kas Kecil</span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {formatRupiah(metrics.totalAmount)}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Volume Transaksi:</span>
            <b className="text-cyan-400 font-mono">{metrics.totalCount} Nota GRN</b>
          </div>
        </div>

        {/* Card 2: Sudah Ditagihkan (Settled) */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span>Sudah Ditagihkan (Settled)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatRupiah(metrics.settledAmount)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Terklaim Kas Kecil:</span>
            <span className="font-mono font-bold text-emerald-300">
              {metrics.settledCount} Nota ({metrics.percentSettled}%)
            </span>
          </div>
        </div>

        {/* Card 3: Belum Ditagihkan (Outstanding / Unbilled) */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-rose-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-rose-400 font-semibold">
            <span>Belum Ditagihkan (Outstanding)</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {formatRupiah(metrics.unsettledAmount)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Wajib Ditagihkan:</span>
            <span className="font-mono font-bold text-rose-300">
              {metrics.unsettledCount} Nota Terbuka
            </span>
          </div>
        </div>

        {/* Card 4: Tertahan Plafon 50 Juta */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
            <span>Tertahan Plafon 50 Juta</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {formatRupiah(metrics.skippedAmount)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Prioritas File Baru:</span>
            <span className="font-mono font-bold text-amber-300">
              {metrics.skippedCount} Transaksi
            </span>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS & BATCH ACTION BAR */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 text-xs">
        {/* Row 1: Search & Status Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor GRN, nomor PO, nama toko/vendor, nota fisik, rincian barang..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
            >
              <option value="ALL">Semua Status Rekonsiliasi</option>
              <option value="UNSETTLED">🔴 Belum Ditagihkan (Outstanding)</option>
              <option value="SETTLED">🟢 Sudah Ditagihkan (Settled)</option>
              <option value="SKIPPED_LIMIT">🟡 Tertahan Plafon 50 Juta</option>
            </select>
          </div>
        </div>

        {/* Row 2: COA, Cost Center, Periode Presets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
          {/* Filter COA */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Kategori COA
            </label>
            <select
              value={selectedCoa}
              onChange={(e) => setSelectedCoa(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="ALL">Semua Akun COA</option>
              {coas.map(c => (
                <option key={c.id} value={c.name}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Cost Center */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Cost Center
            </label>
            <select
              value={selectedCostCenter}
              onChange={(e) => setSelectedCostCenter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="ALL">Semua Cost Center</option>
              {costCenters.map(cc => (
                <option key={cc.id} value={cc.name}>{cc.code} - {cc.name}</option>
              ))}
            </select>
          </div>

          {/* Periode Preset (1-15, 16-31, Custom) */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Siklus Kas Kecil
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => handlePresetChange('1-15', selectedMonth, selectedYear)}
                className={`py-2 rounded-lg text-[11px] font-bold transition-all ${
                  periodPreset === '1-15'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                1 - 15
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('16-31', selectedMonth, selectedYear)}
                className={`py-2 rounded-lg text-[11px] font-bold transition-all ${
                  periodPreset === '16-31'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                16 - 31
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('ALL', selectedMonth, selectedYear)}
                className={`py-2 rounded-lg text-[11px] font-bold transition-all ${
                  periodPreset === 'ALL'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Semua
              </button>
            </div>
          </div>

          {/* Bulan & Tahun */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Bulan &amp; Tahun
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={selectedMonth}
                onChange={(e) => handlePresetChange(periodPreset, Number(e.target.value), selectedYear)}
                className="px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value={0}>Semua Bulan ({selectedYear})</option>
                {MONTH_NAMES.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => handlePresetChange(periodPreset, selectedMonth, Number(e.target.value))}
                className="px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium font-mono"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY BATCH SETTLEMENT DRAWER / ACTION BAR (Appears when items are selected) */}
      {selectedItemIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/80 to-slate-900 border-2 border-cyan-500 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-4 z-30 animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-500 text-slate-950">
                {selectedItemIds.length} Nota Terpilih
              </span>
              <span className="text-xs text-slate-300">
                Total Nominal: <b className="text-white font-mono text-sm">{formatRupiah(selectedTotalAmount)}</b>
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {isLimitExceeded ? (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Peringatan: Melebihi plafon Rp 50.000.000 ({formatRupiah(selectedTotalAmount - 50000000)} kelebihan)
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">
                  ✓ Dalam batas pagu Rp 50 Juta (Sisa kuota: {formatRupiah(50000000 - selectedTotalAmount)})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Batalkan Pilihan
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              disabled={isLimitExceeded}
              className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-2 transition-all ${
                isLimitExceeded
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Bangun File Kas Kecil Baru ({selectedItemIds.length} Nota)</span>
            </button>
          </div>
        </div>
      )}

      {/* BANNER INFORMASI UTAMA COA & PERIODE KAS KECIL (TULISAN BESAR & JELAS DIATAS TABEL) */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-2 border-cyan-500/70 p-4 sm:p-5 shadow-2xl shadow-cyan-950/50 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* SISI KIRI: INFORMASI COA BESAR */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400 bg-cyan-950/90 px-2.5 py-0.5 rounded border border-cyan-800">
                KLASIFIKASI AKUN COA KAS KECIL
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border uppercase tracking-wider ${coaBannerInfo.badgeClass}`}>
                {coaBannerInfo.shortBadge}
              </span>
            </div>

            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-lg sm:text-xl">▶</span>
              <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent uppercase">
                {coaBannerInfo.title}
              </span>
            </div>

            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-slate-300 font-medium">{coaBannerInfo.description}</span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span>Cost Center: <strong className="text-slate-200">{selectedCostCenter === 'ALL' ? 'Semua Cost Center' : selectedCostCenter}</strong></span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span>Status: <strong className="text-cyan-300">{statusFilter === 'ALL' ? 'Semua Status' : statusFilter === 'UNSETTLED' ? '🔴 Belum Ditagihkan' : statusFilter === 'SETTLED' ? '🟢 Settled' : '🟡 Tertahan Plafon'}</strong></span>
            </div>
          </div>

          {/* SISI KANAN: INFORMASI PERIODE TANGGAL, BULAN, DAN TAHUN BESAR */}
          <div className="flex flex-col lg:items-end gap-2 shrink-0 bg-slate-950/70 p-3.5 sm:p-4 rounded-xl border border-slate-800 lg:min-w-[340px]">
            <div className="lg:text-right">
              <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center lg:justify-end gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>PERIODE TANGGAL, BULAN &amp; TAHUN</span>
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-black text-amber-300 font-mono tracking-tight mt-0.5">
                {periodBannerInfo.dateRangeText}
              </div>
            </div>

            {/* Badges Eksplisit Tanggal, Bulan, Tahun & Siklus */}
            <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
              <div className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">TGL:</span>
                <span className="text-white font-mono font-bold">{periodBannerInfo.tanggalBadge}</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">BULAN:</span>
                <span className="text-cyan-300 font-bold">{periodBannerInfo.monthBadge}</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">TAHUN:</span>
                <span className="text-amber-300 font-mono font-bold">{periodBannerInfo.yearBadge}</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black">
                {periodBannerInfo.cycleLabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECONCILIATION AUDIT TABLE */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden space-y-2">
        <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="font-bold text-white text-xs uppercase tracking-wider">
              Buku Audit Tagihan Kas Kecil ({filteredData.length} Transaksi)
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleSelectAllUnsettled}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pilih Semua yang Belum Ditagihkan</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700 sticky top-0">
              <tr>
                <th className="px-3 py-3 w-10 text-center">Pilih</th>
                <th className="px-3 py-3 w-32">Status Tagihan</th>
                <th className="px-3 py-3 w-28">Tgl Terima</th>
                <th className="px-3 py-3 w-36">No. GRN / PO</th>
                <th className="px-3 py-3 w-36">COA &amp; Cost Center</th>
                <th className="px-4 py-3">Vendor &amp; Deskripsi Barang</th>
                <th className="px-3 py-3 text-center w-24">Bukti Nota</th>
                <th className="px-3 py-3 text-right w-32">Nominal Diaudit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-500 space-y-3">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-cyan-500/40 mb-2" />
                    <div className="font-bold text-slate-300 text-sm">
                      Tidak ada transaksi untuk periode {selectedMonth > 0 ? `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}` : `Tahun ${selectedYear}`}
                    </div>
                    <div className="text-xs text-slate-400 max-w-md mx-auto">
                      Semua tagihan kas kecil pada periode ini sudah rapi atau tidak ada nota barang yang tercatat pada rentang filter ini.
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handlePresetChange('ALL', 0, selectedYear)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold border border-cyan-500/30 transition-colors"
                      >
                        Tampilkan Semua Bulan ({selectedYear})
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetChange('ALL', new Date().getMonth() + 1, new Date().getFullYear())}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold border border-slate-700 transition-colors"
                      >
                        Kembali ke Bulan Berjalan
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const isSelected = selectedItemIds.includes(item.id);
                  const isSettled = item.settlementStatus === 'SETTLED';

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-cyan-950/20' : isSettled ? 'opacity-90' : 'bg-slate-900/60'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(item.id)}
                          className="p-1 hover:text-cyan-400 text-slate-500"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Status Tagihan */}
                      <td className="px-3 py-3">
                        {item.settlementStatus === 'SETTLED' ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>SETTLED</span>
                            </span>
                            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]" title={item.settledInPeriodName}>
                              {item.settledInPeriodName}
                            </div>
                            {item.itdcInvoiceNumber && (
                              <div className="text-[9.5px] text-emerald-300 font-mono font-bold truncate max-w-[150px]" title={item.itdcInvoiceNumber}>
                                {item.itdcInvoiceNumber}
                              </div>
                            )}
                            <div className="text-[9px] text-cyan-400 font-mono">
                              {item.jvNumber}
                            </div>
                          </div>
                        ) : item.settlementStatus === 'SKIPPED_LIMIT' ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>TERTAHAN PLAFON</span>
                            </span>
                            <div className="text-[10px] text-amber-200/80 font-medium">
                              Prioritas File Baru
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3 text-rose-400 shrink-0" />
                              <span>BELUM DITARIK</span>
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Usia: {item.daysUnsettled} hari
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Tanggal Terima */}
                      <td className="px-3 py-3 font-mono text-cyan-300 font-semibold whitespace-nowrap">
                        {item.receiptDate}
                      </td>

                      {/* No GRN & PO */}
                      <td className="px-3 py-3">
                        <div className="font-mono font-bold text-white text-[11px]">{item.grnNumber}</div>
                        <div className="font-mono text-[10px] text-slate-400">PO: {item.poNumber}</div>
                      </td>

                      {/* COA & Cost Center */}
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 inline-block mb-1">
                          {item.coaName}
                        </span>
                        <div className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]" title={item.costCenterName}>
                          {item.costCenterName}
                        </div>
                      </td>

                      {/* Vendor & Deskripsi */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{item.vendorName}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{item.description}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Nota Toko: {item.receiptProofNumber}
                        </div>
                      </td>

                      {/* Thumbnail Bukti Nota Fisik */}
                      <td className="px-3 py-3 text-center">
                        {item.receiptProofImage ? (
                          <button
                            type="button"
                            onClick={() => setSelectedProofModal(item)}
                            className="group relative inline-block"
                            title="Klik untuk pratinjau bukti scan nota fisik"
                          >
                            <div className="h-9 w-12 rounded overflow-hidden border border-slate-700 group-hover:border-cyan-400 transition-colors bg-slate-950 shadow">
                              <img 
                                src={item.receiptProofImage} 
                                alt="Nota" 
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform" 
                              />
                            </div>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500">Auto GRN</span>
                        )}
                      </td>

                      {/* Nominal Diaudit */}
                      <td className="px-3 py-3 text-right font-mono font-black text-sm whitespace-nowrap">
                        <span className={item.settlementStatus === 'SETTLED' ? 'text-emerald-400' : 'text-cyan-400'}>
                          {formatRupiah(item.totalInvoiceAudited)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-950 border-t-2 border-slate-700 font-bold text-xs text-white">
              <tr>
                <td colSpan={7} className="px-4 py-3 text-right uppercase tracking-wider text-slate-300">
                  Total Nilai Buku Audit ({filteredData.length} Transaksi Terpilih):
                </td>
                <td className="px-3 py-3 text-right font-mono font-black text-cyan-400 text-sm">
                  {formatRupiah(filteredData.reduce((sum, it) => sum + it.totalInvoiceAudited, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MODAL 1: PREVIEW BUKTI FISIK SCAN NOTA */}
      {selectedProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-800/60">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Bukti Nota Fisik &amp; Surat Jalan Toko
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {selectedProofModal.receiptProofNumber} • {selectedProofModal.vendorName}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedProofModal(null)}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const modalProofList = (selectedProofModal.receiptProofItems && selectedProofModal.receiptProofItems.length > 0)
                ? selectedProofModal.receiptProofItems
                : (selectedProofModal.receiptProofImages && selectedProofModal.receiptProofImages.length > 0)
                ? selectedProofModal.receiptProofImages.map((img, idx) => ({
                    id: `p-${idx}`,
                    orderIndex: idx + 1,
                    proofNumber: `${selectedProofModal.receiptProofNumber}-${String(idx + 1).padStart(2, '0')}`,
                    imageUrl: img,
                    caption: `Foto Nota #${idx + 1}`
                  }))
                : selectedProofModal.receiptProofImage
                ? [{
                    id: 'p-0',
                    orderIndex: 1,
                    proofNumber: `${selectedProofModal.receiptProofNumber}-01`,
                    imageUrl: selectedProofModal.receiptProofImage,
                    caption: 'Bukti Nota Utama'
                  }]
                : [];

              const currentPhoto = modalProofList[reconcileProofModalIndex] || modalProofList[0];

              return (
                <div className="p-5 space-y-4">
                  {/* Multi-Photo Tabs */}
                  {modalProofList.length > 1 && (
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[80%]">
                        {modalProofList.map((item, idx) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setReconcileProofModalIndex(idx)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                              reconcileProofModalIndex === idx
                                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <span>Nota #{item.orderIndex}</span>
                            <span className="font-mono text-[10px] opacity-80">({item.proofNumber})</span>
                          </button>
                        ))}
                      </div>
                      <span className="text-[11px] font-mono text-cyan-400 font-bold shrink-0">
                        {reconcileProofModalIndex + 1} / {modalProofList.length}
                      </span>
                    </div>
                  )}

                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-2 relative shadow-inner">
                    {currentPhoto?.imageUrl ? (
                      <>
                        <img 
                          src={currentPhoto.imageUrl} 
                          alt={`Bukti ${currentPhoto.proofNumber}`}
                          className="max-h-[380px] w-auto object-contain rounded-lg" 
                        />
                        {currentPhoto.caption && (
                          <div className="mt-2 text-center text-xs text-slate-400 italic">
                            {currentPhoto.caption}
                          </div>
                        )}
                        <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-slate-950/85 text-cyan-300 font-mono text-[11px] font-bold border border-cyan-500/30">
                          {currentPhoto.proofNumber}
                        </span>
                      </>
                    ) : (
                      <div className="p-8 text-center text-slate-500">Scan nota fisik tidak tersedia</div>
                    )}
                  </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Nominal Nota</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">
                    {formatRupiah(selectedProofModal.totalInvoiceAudited)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">COA Akun</span>
                  <span className="font-bold text-white">
                    {selectedProofModal.coaName} ({selectedProofModal.costCenterName})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Status Settlement</span>
                  <span className={`font-bold ${selectedProofModal.settlementStatus === 'SETTLED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedProofModal.settlementStatus === 'SETTLED' ? `Sudah Masuk: ${selectedProofModal.settledInPeriodName}` : 'Belum Ditagihkan'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Nomor PO / GRN</span>
                  <span className="font-mono text-slate-300">
                    {selectedProofModal.poNumber} / {selectedProofModal.grnNumber}
                  </span>
                </div>
              </div>
            </div>
            ); })()}

            <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedProofModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: KONFIRMASI PEMBUATAN FILE KAS KECIL BARU DARI BATCH REKONSILIASI */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-white text-base">
                  Bangun File Kas Kecil Baru
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Anda akan menerbitkan 1 file rekapitulasi Kas Kecil resmi GMCC untuk <b>{selectedItems.length} transaksi GRN terpilih</b> dengan rincian berikut:
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Jumlah Transaksi:</span>
                <b className="text-white font-bold">{selectedItems.length} Nota Fisik</b>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Nilai Rekapitulasi:</span>
                <b className="text-cyan-400 font-mono font-black text-sm">{formatRupiah(selectedTotalAmount)}</b>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Batas Pagu File:</span>
                <b className="text-slate-300 font-mono">Rp 50.000.000 (Maksimal)</b>
              </div>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>Otorisasi Pengesahan:</span>
                <span className="text-emerald-400 font-semibold">Chief Accounting &amp; General Manager</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
                Nama Periode / Judul File Kas Kecil *
              </label>
              <input
                type="text"
                value={newPeriodNameInput}
                onChange={(e) => setNewPeriodNameInput(e.target.value)}
                placeholder={`Contoh: REKAP KAS KECIL - ${selectedCoa !== 'ALL' ? selectedCoa : 'BPP'} PERIODE ${selectedMonth}/${selectedYear}`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-emerald-900">
                  No. Invoice ITDC (Wajib):
                </label>
                <button
                  type="button"
                  onClick={() => setNewItdcInvoiceInput(formatItdcInvoiceNumber(selectedYear || new Date().getFullYear(), selectedMonth || new Date().getMonth() + 1, (pettyCashPeriods?.length || 0) + 1))}
                  className="px-2.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                >
                  Auto
                </button>
              </div>
              <input
                type="text"
                value={newItdcInvoiceInput}
                onChange={(e) => setNewItdcInvoiceInput(e.target.value.toUpperCase())}
                placeholder="INV/GMCC-ITDC/2026/X-XXX"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-emerald-400 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteCreateNewPeriod}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi &amp; Terbitkan File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
