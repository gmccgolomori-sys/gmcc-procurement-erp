import React, { useState, useMemo } from 'react';
import { 
  ExpenseReceiptProof, 
  PettyCashSettlementPeriod, 
  PurchaseOrder, 
  GoodsReceipt, 
  UserAccount,
  ChartOfAccount,
  CostCenter,
  PettyCashBillingFile,
  ReceiptProofItem,
  formatItdcInvoiceNumber
} from '../types/procurement';
import { generateReceiptSvg, INITIAL_PETTY_CASH_PERIOD } from '../data/pettyCashMock';
import { INITIAL_CHART_OF_ACCOUNTS, INITIAL_COST_CENTERS, SAMPLE_SIGNATURES } from '../data/procurementMock';
import { GMCC_LOGO_DARK, GMCC_LOGO_WHITE } from '../data/gmccLogo';
import { 
  Receipt, 
  Calendar, 
  Filter, 
  Plus, 
  Download, 
  Printer, 
  FileCheck, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  DollarSign, 
  ArrowUpDown, 
  Search, 
  X, 
  FileText, 
  Upload, 
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Layers,
  ShieldCheck,
  Check,
  HelpCircle,
  Calculator,
  Lock,
  AlertTriangle,
  Smartphone
} from 'lucide-react';
import { getSpecimenSignature } from '../utils/signatureUtils';

interface PettyCashSettlementViewProps {
  periods: PettyCashSettlementPeriod[];
  onSavePeriod: (updatedPeriod: PettyCashSettlementPeriod) => void;
  onDeletePeriod?: (periodId: string) => void;
  pos: PurchaseOrder[];
  grns: GoodsReceipt[];
  currentUser: UserAccount;
  users?: UserAccount[];
  coas?: ChartOfAccount[];
  costCenters?: CostCenter[];
  billingFiles?: PettyCashBillingFile[];
  onSaveBillingFile?: (file: PettyCashBillingFile) => void;
  onNavigateToBillingFiles?: () => void;
}

export const PettyCashSettlementView: React.FC<PettyCashSettlementViewProps> = ({
  periods,
  onSavePeriod,
  onDeletePeriod,
  pos,
  grns,
  currentUser,
  users = [],
  coas = INITIAL_CHART_OF_ACCOUNTS,
  costCenters = INITIAL_COST_CENTERS,
  billingFiles = [],
  onSaveBillingFile,
  onNavigateToBillingFiles
}) => {
  // Current active period
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(periods[0]?.id || 'period-current');
  const activePeriod = periods.find(p => p.id === selectedPeriodId) || periods[0] || INITIAL_PETTY_CASH_PERIOD;

  // Filtering & Sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedCoaFilter, setSelectedCoaFilter] = useState<string>('ALL');
  const [selectedDateFilterPreset, setSelectedDateFilterPreset] = useState<'ALL' | '1-15' | '16-31' | 'CUSTOM'>('ALL');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<'DATE_DESC' | 'DATE_ASC' | 'COA_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC'>('DATE_DESC');

  // Modals
  const [selectedProofModal, setSelectedProofModal] = useState<ExpenseReceiptProof | null>(null);
  const [proofModalActiveIndex, setProofModalActiveIndex] = useState<number>(0);
  const [selectedJvModal, setSelectedJvModal] = useState<ExpenseReceiptProof | null>(null);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPullModal, setShowPullModal] = useState(false);
  const [selectedGrnIdsToPull, setSelectedGrnIdsToPull] = useState<string[]>([]);
  const [pullGlAssignments, setPullGlAssignments] = useState<Record<string, { glCode: string; glName: string; department: string; paidBy: string }>>({});
  const [pullFilterType, setPullFilterType] = useState<'ALL' | 'PETTY_CASH' | 'UNPULLED'>('ALL');

  // Printout & Uniform Receipt Appendix Configuration
  const [printIncludeProofs, setPrintIncludeProofs] = useState(true);
  const [printLayout, setPrintLayout] = useState<'grid-2' | 'grid-3' | 'grid-4'>('grid-2');
  const [printScope, setPrintScope] = useState<'ALL' | 'FILTERED'>('ALL');

  // Generator State (COA, Cost Center, Periode, Maks 50jt & Integritas Tanggal)
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [genPeriodPreset, setGenPeriodPreset] = useState<'1-15' | '16-31' | 'CUSTOM'>('1-15');
  const [genMonth, setGenMonth] = useState<number>(10); // default Oktober
  const [genYear, setGenYear] = useState<number>(2026);
  const [genStartDate, setGenStartDate] = useState('2026-10-01');
  const [genEndDate, setGenEndDate] = useState('2026-10-15');
  const [genCoa, setGenCoa] = useState<string>('ALL');
  const [genCostCenter, setGenCostCenter] = useState<string>('ALL');
  const [genMaxLimit] = useState<number>(50000000); // Plafon 50 Juta
  const [newPeriodNameInput, setNewPeriodNameInput] = useState('');
  const [genItdcInvoiceNumber, setGenItdcInvoiceNumber] = useState('');
  const [selectedProofPreviewImage, setSelectedProofPreviewImage] = useState<string | null>(null);

  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handleUpdateGenDates = (preset: '1-15' | '16-31' | 'CUSTOM', m: number, y: number) => {
    setGenPeriodPreset(preset);
    setGenMonth(m);
    setGenYear(y);
    const mStr = String(m).padStart(2, '0');
    if (preset === '1-15') {
      setGenStartDate(`${y}-${mStr}-01`);
      setGenEndDate(`${y}-${mStr}-15`);
    } else if (preset === '16-31') {
      const lastDay = new Date(y, m, 0).getDate();
      setGenStartDate(`${y}-${mStr}-16`);
      setGenEndDate(`${y}-${mStr}-${String(lastDay).padStart(2, '0')}`);
    }
  };

  // Helper date parsers
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

  // State untuk Modal Konfirmasi & Standarisasi File Penagihan Baku
  const [showConfirmBillingModal, setShowConfirmBillingModal] = useState(false);
  const [confirmItdcInvoiceNumber, setConfirmItdcInvoiceNumber] = useState('');
  const [isEditingPeriodItdc, setIsEditingPeriodItdc] = useState(false);
  const [periodItdcInput, setPeriodItdcInput] = useState('');

  // Map of dates that have already been confirmed in a PettyCashBillingFile (Strict Date Lock)
  const lockedDatesMap = useMemo(() => {
    const map: Record<string, { fileNumber: string; totalAmount: number; title: string; periodName: string }> = {};
    (billingFiles || []).forEach(bf => {
      // 1. From startDate to endDate
      if (bf.startDate && bf.endDate) {
        const start = new Date(bf.startDate);
        const end = new Date(bf.endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const cur = new Date(start);
          while (cur <= end) {
            const iso = cur.toISOString().split('T')[0];
            map[iso] = {
              fileNumber: bf.fileNumber,
              totalAmount: bf.totalAmount,
              title: bf.title,
              periodName: bf.periodName
            };
            cur.setDate(cur.getDate() + 1);
          }
        }
      }
      // 2. Also map each item's date
      (bf.items || []).forEach(it => {
        const itemIso = toStandardIso(it.date);
        if (itemIso) {
          map[itemIso] = {
            fileNumber: bf.fileNumber,
            totalAmount: bf.totalAmount,
            title: bf.title,
            periodName: bf.periodName
          };
        }
      });
    });
    return map;
  }, [billingFiles]);

  // Cek apakah ada tanggal pada periode aktif yang sudah dibakukan ke file penagihan lain
  const activePeriodLockedDates = useMemo(() => {
    if (!activePeriod?.items) return [];
    const lockedList: { date: string; displayDate: string; fileNumber: string; count: number; total: number }[] = [];
    const dateCounts: Record<string, { count: number; total: number }> = {};
    activePeriod.items.forEach(it => {
      const iso = toStandardIso(it.date);
      if (iso && lockedDatesMap[iso]) {
        if (!dateCounts[iso]) dateCounts[iso] = { count: 0, total: 0 };
        dateCounts[iso].count++;
        dateCounts[iso].total += (it.debit || it.amount || 0);
      }
    });

    Object.keys(dateCounts).forEach(iso => {
      lockedList.push({
        date: iso,
        displayDate: toDisplayDate(iso),
        fileNumber: lockedDatesMap[iso].fileNumber,
        count: dateCounts[iso].count,
        total: dateCounts[iso].total
      });
    });

    return lockedList;
  }, [activePeriod, lockedDatesMap]);

  // Compute generator result with strict 50 juta limit and all-or-nothing date integrity
  interface GeneratorCandidate {
    grnId: string;
    isoDate: string;
    displayDate: string;
    amount: number;
    coaName: string;
    costCenterName: string;
    receiptNumber: string;
    vendorName: string;
    description: string;
    department: string;
    paidBy: string;
    glAccountCode: string;
    glAccountName: string;
    proofImageUrl: string;
    proofImages?: string[];
    receiptProofItems?: ReceiptProofItem[];
    proofType: ExpenseReceiptProof['proofType'];
    poNumber?: string;
    grnNumber?: string;
  }

  const generatorResult = useMemo(() => {
    const rawCandidates: GeneratorCandidate[] = [];

    grns.forEach(g => {
      const rawDate = g.receiptProofDate || g.receiptDate;
      const iso = toStandardIso(rawDate);
      if (!iso) return;

      // Filter by Date Range
      if (iso < genStartDate || iso > genEndDate) return;

      // Filter by COA
      const itemCoa = g.coaName || 'BPP';
      if (genCoa !== 'ALL' && itemCoa.toLowerCase() !== genCoa.toLowerCase()) return;

      // Filter by Cost Center
      const poRef = pos.find(p => p.id === g.poId || p.poNumber === g.poNumber);
      const itemCc = g.costCenterName || poRef?.costCenterName || 'F&B Culinary Central Kitchen';
      if (genCostCenter !== 'ALL' && itemCc.toLowerCase() !== genCostCenter.toLowerCase()) return;

      const amt = Number(g.totalInvoiceAudited) || Number(g.receiptProofAmount) || 0;
      if (amt <= 0) return;

      const desc = g.items && g.items.length > 0
        ? g.items.map(i => `${i.qtyReceived} ${i.unit} ${i.itemName}`).slice(0, 3).join(', ')
        : g.notes || 'Penerimaan barang operasional';

      const dispDate = toDisplayDate(iso);
      const proofImg = g.receiptProofImage || generateReceiptSvg(
        g.vendorName,
        g.receiptProofNumber || g.deliveryOrderNumber || g.grnNumber,
        dispDate,
        amt,
        desc
      );

      // GL mapping based on COA
      let glCode = '732-001';
      let glName = 'Operasional GMCC';
      if (itemCoa === 'BPP') {
        glCode = '732-001';
        glName = 'Kitchen & Operational Procurement (BPP)';
      } else if (itemCoa === 'NON BPP') {
        glCode = '732-002';
        glName = 'Direct Non-BPP Field Expenses';
      } else if (itemCoa === 'Transport') {
        glCode = '741-001';
        glName = 'Transportation & Fleet Fuel';
      } else if (itemCoa === 'Event Cost') {
        glCode = '752-001';
        glName = 'MICE Direct Event Costs';
      } else if (itemCoa === 'Rental Equipment Event') {
        glCode = '752-002';
        glName = 'MICE AV & Equipment Rental';
      } else if (itemCoa === 'Meal Employee') {
        glCode = '761-001';
        glName = 'Staff Meals & Overtime Consumption';
      }

      rawCandidates.push({
        grnId: g.id,
        isoDate: iso,
        displayDate: dispDate,
        amount: amt,
        coaName: itemCoa,
        costCenterName: itemCc,
        receiptNumber: g.receiptProofNumber || g.deliveryOrderNumber || g.grnNumber,
        vendorName: g.vendorName,
        description: desc,
        department: itemCc,
        paidBy: g.receivedBy.split('(')[0].trim() || 'Staf Receiving',
        glAccountCode: glCode,
        glAccountName: glName,
        proofImageUrl: proofImg,
        proofImages: (g.receiptProofImages && g.receiptProofImages.length > 0)
          ? g.receiptProofImages
          : (g.receiptProofImage ? [g.receiptProofImage] : [proofImg]),
        receiptProofItems: (g.receiptProofItems && g.receiptProofItems.length > 0)
          ? g.receiptProofItems
          : undefined,
        proofType: g.receiptProofType || 'NOTA_KONTAN',
        poNumber: g.poNumber,
        grnNumber: g.grnNumber
      });
    });

    // Group strictly by Date
    const byDate: Record<string, GeneratorCandidate[]> = {};
    rawCandidates.forEach(c => {
      if (!byDate[c.isoDate]) byDate[c.isoDate] = [];
      byDate[c.isoDate].push(c);
    });

    const sortedDates = Object.keys(byDate).sort();

    let runningTotal = 0;
    const acceptedCandidates: GeneratorCandidate[] = [];
    const skippedDateBlocks: { date: string; displayDate: string; totalAmount: number; count: number; reason: string }[] = [];
    const lockedDateBlocks: { date: string; displayDate: string; totalAmount: number; count: number; fileNumber: string; reason: string }[] = [];

    sortedDates.forEach(d => {
      const itemsOnDate = byDate[d];
      const sumOnDate = itemsOnDate.reduce((sum, it) => sum + it.amount, 0);

      // Check 1: Proteksi Anti-Double Billing (Tanggal sudah dibakukan di file penagihan lain)
      if (lockedDatesMap[d]) {
        const locked = lockedDatesMap[d];
        lockedDateBlocks.push({
          date: d,
          displayDate: toDisplayDate(d),
          totalAmount: sumOnDate,
          count: itemsOnDate.length,
          fileNumber: locked.fileNumber,
          reason: `Tanggal ${toDisplayDate(d)} (${itemsOnDate.length} transaksi = ${formatRupiah(sumOnDate)}) TELAH DIBAKUKAN ke dalam File Penagihan ${locked.fileNumber}. Tanggal ini TIDAK DAPAT ditarik kembali demi mencegah penagihan ganda (double billing)!`
        });
        return; // Lewati tanggal yang sudah dibakukan!
      }

      // Check 2: Rule Max 50jt & all-or-nothing per date
      if (runningTotal + sumOnDate <= genMaxLimit) {
        itemsOnDate.forEach(it => acceptedCandidates.push(it));
        runningTotal += sumOnDate;
      } else {
        skippedDateBlocks.push({
          date: d,
          displayDate: toDisplayDate(d),
          totalAmount: sumOnDate,
          count: itemsOnDate.length,
          reason: `Total transaksi tanggal ${toDisplayDate(d)} sebesar ${formatRupiah(sumOnDate)} melebihi sisa plafon (${formatRupiah(genMaxLimit - runningTotal)} tersisa dari batas Rp 50.000.000). Seluruh ${itemsOnDate.length} transaksi di tanggal ini dilewati utuh agar nota tidak terpotong sebagian.`
        });
      }
    });

    return {
      totalFound: rawCandidates.length,
      acceptedCount: acceptedCandidates.length,
      acceptedTotal: runningTotal,
      acceptedCandidates,
      skippedDateBlocks,
      lockedDateBlocks,
      remainingQuota: Math.max(0, genMaxLimit - runningTotal),
      quotaPercentage: Math.min(100, Math.round((runningTotal / genMaxLimit) * 100))
    };
  }, [grns, pos, genStartDate, genEndDate, genCoa, genCostCenter, genMaxLimit, lockedDatesMap]);

  // Simpan No. Invoice ITDC langsung pada periode Settlement aktif (dan tag semua item di dalamnya)
  const handleSavePeriodItdcInvoiceNumber = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activePeriod) return;
    const normalized = periodItdcInput.trim().toUpperCase();
    if (!normalized) {
      alert('No. Invoice ITDC (Wajib) tidak boleh kosong. Contoh format: INV/GMCC-ITDC/2026/X-001');
      return;
    }
    const updatedItems = (activePeriod.items || []).map(it => ({
      ...it,
      itdcInvoiceNumber: normalized
    }));
    const updatedPeriod: PettyCashSettlementPeriod = {
      ...activePeriod,
      itdcInvoiceNumber: normalized,
      items: updatedItems
    };
    onSavePeriod(updatedPeriod);
    setIsEditingPeriodItdc(false);
  };

  // Handler: Konfirmasi & Standarisasi File Penagihan Baku
  const handleOpenConfirmBillingModal = () => {
    if (!activePeriod?.items || activePeriod.items.length === 0) {
      alert('Periode kas kecil belum memiliki item transaksi nota. Silakan bangun kas kecil terlebih dahulu.');
      return;
    }

    if (totalDebit > 50000000) {
      alert(`Peringatan Pagu: Total pengeluaran periode ini (${formatRupiah(totalDebit)}) melebihi batas pagu Rp 50.000.000. Sesuai regulasi operasional GMCC, berkas penagihan tidak boleh lebih dari 50 juta. Harap gunakan tombol "Bangun Kas Kecil Otomatis" untuk memotong periode sesuai pagu dan menjaga keutuhan tanggal.`);
      return;
    }

    if (activePeriodLockedDates.length > 0) {
      alert(`Peringatan Integritas: Periode ini memuat transaksi pada tanggal yang sudah dibakukan ke dalam Berkas Penagihan lain (${activePeriodLockedDates.map(l => `${l.displayDate} di ${l.fileNumber}`).join(', ')}). Tanggal tersebut tidak dapat ditagihkan kembali!`);
      return;
    }

    setConfirmItdcInvoiceNumber(activePeriod.itdcInvoiceNumber || '');
    setShowConfirmBillingModal(true);
  };

  const handleExecuteConfirmBilling = () => {
    if (!activePeriod?.items || activePeriod.items.length === 0) return;

    const trimmedItdcInv = confirmItdcInvoiceNumber.trim().toUpperCase();
    if (!trimmedItdcInv) {
      alert('No. Invoice ITDC (Wajib) harus diisi (contoh: INV/GMCC-ITDC/2026/X-001) agar terdapat sambungan track record di aplikasi lain!');
      return;
    }

    const y = genYear || new Date().getFullYear();
    const m = String(genMonth || new Date().getMonth() + 1).padStart(2, '0');
    const autoSeq = String((billingFiles?.length || 0) + 1).padStart(3, '0');
    const fileNo = `TAGIHAN/GMCC-PC/${y}/${m}/${autoSeq}`;

    const sortedDatesFromItems = activePeriod.items
      .map(it => toStandardIso(it.date))
      .filter(Boolean)
      .sort();
    const stDate = sortedDatesFromItems[0] || genStartDate || '2026-10-01';
    const enDate = sortedDatesFromItems[sortedDatesFromItems.length - 1] || genEndDate || '2026-10-15';

    const taggedItems = activePeriod.items.map(it => ({
      ...it,
      itdcInvoiceNumber: trimmedItdcInv
    }));

    const newFile: PettyCashBillingFile = {
      id: `billing-${Date.now()}`,
      fileNumber: fileNo,
      itdcInvoiceNumber: trimmedItdcInv,
      periodName: activePeriodDisplayLabel,
      startDate: stDate,
      endDate: enDate,
      title: `BERKAS RESMI PENAGIHAN KAS KECIL - ${activePeriod.periodName}`,
      coaCategory: activePeriod.coaFilter || 'Semua COA',
      items: taggedItems,
      totalAmount: totalDebit,
      itemCount: taggedItems.length,
      confirmedAt: new Date().toISOString(),
      confirmedBy: {
        name: currentUser.name || currentUser.username || 'Agus Setiabudi',
        role: currentUser.role,
        jobTitle: currentUser.jobTitle || 'Chief Accounting'
      },
      billingStatus: 'SIAP_DITAGIHKAN',
      notes: `Dibakukan resmi dari periode kas kecil ${activePeriod.periodName} | No. Invoice ITDC: ${trimmedItdcInv}. Pagu Rp 50 Jt & integritas tanggal terpenuhi.`
    };

    onSaveBillingFile?.(newFile);

    // Update active period notes & ITDC invoice number
    const updatedPeriod: PettyCashSettlementPeriod = {
      ...activePeriod,
      itdcInvoiceNumber: trimmedItdcInv,
      items: taggedItems,
      status: 'VERIFIED',
      notes: `${activePeriod.notes || ''} | [DIBUKUKAN KE ${fileNo} | ITDC: ${trimmedItdcInv}]`
    };
    onSavePeriod(updatedPeriod);
    setShowConfirmBillingModal(false);

    alert(`Sukses! Data kas kecil periode ${activePeriodDisplayLabel} (${formatRupiah(totalDebit)}) berhasil DIBAKUKAN menjadi Berkas Penagihan Resmi: ${fileNo} dengan No. Invoice ITDC: ${trimmedItdcInv}.\n\nSeluruh tanggal transaksi di dalamnya telah dikunci secara permanen di modul Berkas Tagihan Kas Kecil.`);
  };

  // New Expense Form State
  const [newDate, setNewDate] = useState(() => new Date().toLocaleDateString('id-ID'));
  const [newVendor, setNewVendor] = useState('');
  const [newDepartment, setNewDepartment] = useState('Kitchen');
  const [newGlCode, setNewGlCode] = useState('732-001');
  const [newGlName, setNewGlName] = useState('Kitchen Operating Expense');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState<number>(0);
  const [newReceiptNumber, setNewReceiptNumber] = useState('');
  const [newProofType, setNewProofType] = useState<ExpenseReceiptProof['proofType']>('NOTA_KONTAN');
  const [newPaidBy, setNewPaidBy] = useState('Agus');
  const [newProofImage, setNewProofImage] = useState<string>('');

  const formatRupiah = (val?: number) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Distinct departments in active period
  const departmentsList = useMemo(() => {
    if (!activePeriod?.items) return [];
    const depts = new Set<string>();
    activePeriod.items.forEach(it => {
      if (it.department) depts.add(it.department);
    });
    return Array.from(depts);
  }, [activePeriod]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    if (!activePeriod?.items) return [];
    const items = activePeriod.items.filter(it => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        it.description.toLowerCase().includes(q) ||
        it.vendorName.toLowerCase().includes(q) ||
        it.receiptNumber.toLowerCase().includes(q) ||
        it.glAccountCode.toLowerCase().includes(q) ||
        (it.coaName && it.coaName.toLowerCase().includes(q)) ||
        (it.jvNumber && it.jvNumber.toLowerCase().includes(q)) ||
        (it.itdcInvoiceNumber && it.itdcInvoiceNumber.toLowerCase().includes(q)) ||
        (activePeriod.itdcInvoiceNumber && activePeriod.itdcInvoiceNumber.toLowerCase().includes(q));
      
      const matchDept = selectedDepartment === 'ALL' || it.department === selectedDepartment;
      
      const matchCoa = selectedCoaFilter === 'ALL' || 
        (it.coaName && it.coaName.toLowerCase() === selectedCoaFilter.toLowerCase()) ||
        (selectedCoaFilter === 'BPP' && (it.coaName === 'BPP' || it.glAccountCode === '732-001')) ||
        (selectedCoaFilter === 'NON BPP' && (it.coaName === 'NON BPP' || it.glAccountCode === '622-022' || it.glAccountCode === '732-002'));

      // Date parsing for preset (1-15, 16-31), month, and year
      const iso = toStandardIso(it.date);
      let matchDatePreset = true;
      let matchMonth = true;
      let matchYear = true;

      if (iso) {
        if (selectedDateFilterPreset === 'CUSTOM') {
          if (filterStartDate && iso < filterStartDate) {
            matchDatePreset = false;
          }
          if (filterEndDate && iso > filterEndDate) {
            matchDatePreset = false;
          }
        } else if (iso.includes('-')) {
          const parts = iso.split('-');
          if (parts.length === 3) {
            const y = parts[0];
            const m = parts[1];
            const d = parseInt(parts[2], 10);

            if (selectedYearFilter !== 'ALL' && y !== selectedYearFilter) {
              matchYear = false;
            }
            if (selectedMonthFilter !== 'ALL' && m !== selectedMonthFilter) {
              matchMonth = false;
            }
            if (selectedDateFilterPreset === '1-15' && (d < 1 || d > 15)) {
              matchDatePreset = false;
            } else if (selectedDateFilterPreset === '16-31' && d < 16) {
              matchDatePreset = false;
            }
          }
        }
      }

      return matchSearch && matchDept && matchCoa && matchDatePreset && matchMonth && matchYear;
    });

    // Sorting
    return [...items].sort((a, b) => {
      if (sortOption === 'DATE_DESC') {
        return toStandardIso(b.date).localeCompare(toStandardIso(a.date));
      }
      if (sortOption === 'DATE_ASC') {
        return toStandardIso(a.date).localeCompare(toStandardIso(b.date));
      }
      if (sortOption === 'COA_ASC') {
        const coaA = a.coaName || a.glAccountCode || '';
        const coaB = b.coaName || b.glAccountCode || '';
        return coaA.localeCompare(coaB);
      }
      if (sortOption === 'AMOUNT_DESC') {
        return (b.debit || b.amount || 0) - (a.debit || a.amount || 0);
      }
      if (sortOption === 'AMOUNT_ASC') {
        return (a.debit || a.amount || 0) - (b.debit || b.amount || 0);
      }
      return 0;
    });
  }, [
    activePeriod, 
    searchQuery, 
    selectedDepartment, 
    selectedCoaFilter, 
    selectedDateFilterPreset,
    filterStartDate,
    filterEndDate,
    selectedMonthFilter, 
    selectedYearFilter, 
    sortOption
  ]);

  // Dynamic period display label (never shows hardcoded 16 - 31 Oktober unless explicitly set)
  const activePeriodDisplayLabel = useMemo(() => {
    if (selectedDateFilterPreset === 'CUSTOM' && (filterStartDate || filterEndDate)) {
      return `${filterStartDate ? toDisplayDate(filterStartDate) : 'Awal'} s/d ${filterEndDate ? toDisplayDate(filterEndDate) : 'Akhir'}`;
    }
    if (selectedDateFilterPreset === '1-15') {
      const monthPart = selectedMonthFilter !== 'ALL' ? MONTH_NAMES[parseInt(selectedMonthFilter, 10) - 1]?.toUpperCase() : '';
      const yearPart = selectedYearFilter !== 'ALL' ? selectedYearFilter : '';
      return `TANGGAL 01 - 15 ${monthPart} ${yearPart}`.trim();
    }
    if (selectedDateFilterPreset === '16-31') {
      const monthPart = selectedMonthFilter !== 'ALL' ? MONTH_NAMES[parseInt(selectedMonthFilter, 10) - 1]?.toUpperCase() : '';
      const yearPart = selectedYearFilter !== 'ALL' ? selectedYearFilter : '';
      return `TANGGAL 16 - 31 ${monthPart} ${yearPart}`.trim();
    }
    return activePeriod.periodName;
  }, [selectedDateFilterPreset, filterStartDate, filterEndDate, selectedMonthFilter, selectedYearFilter, activePeriod.periodName]);

  // Prominent COA classification for banner above table
  const coaBannerInfo = useMemo(() => {
    const rawCoa = selectedCoaFilter.trim();
    if (rawCoa === 'ALL') {
      const pCoa = activePeriod.coaFilter;
      if (pCoa && pCoa !== 'ALL' && pCoa !== 'Semua COA') {
        const upper = pCoa.toUpperCase();
        return {
          title: `COA: ${upper}`,
          shortBadge: `COA ${upper}`,
          description: `Berdasarkan berkas aktif: ${activePeriod.periodName}`,
          badgeClass: upper.includes('BPP') && !upper.includes('NON') 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30'
            : upper.includes('NON BPP') || upper.includes('NON-BPP')
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30'
            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 ring-1 ring-cyan-500/30'
        };
      }
      return {
        title: 'SEMUA AKUN COA (GABUNGAN BPP & NON BPP)',
        shortBadge: 'SEMUA COA',
        description: 'Menampilkan seluruh transaksi pengeluaran kas kecil operasional',
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
        description: 'Pengeluaran Umum, Operasional, Engineering & Perlengkapan',
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
  }, [selectedCoaFilter, activePeriod.coaFilter, activePeriod.periodName, coas]);

  // Prominent Periode (Tanggal, Bulan, Tahun) info for banner above table
  const periodBannerInfo = useMemo(() => {
    let monthName = '';
    if (selectedMonthFilter !== 'ALL') {
      monthName = MONTH_NAMES[parseInt(selectedMonthFilter, 10) - 1] || '';
    } else {
      monthName = 'BULAN BERJALAN';
    }
    const monthUpper = monthName.toUpperCase();
    const yearStr = selectedYearFilter !== 'ALL' ? selectedYearFilter : '2026';

    let dateRangeText = '';
    let cycleLabel = '';
    let tanggalBadge = '';

    if (selectedDateFilterPreset === '1-15') {
      dateRangeText = `01 - 15 ${monthUpper} ${yearStr}`;
      cycleLabel = 'SIKLUS 1 (TGL 1 - 15)';
      tanggalBadge = '01 s/d 15';
    } else if (selectedDateFilterPreset === '16-31') {
      dateRangeText = `16 - 31 ${monthUpper} ${yearStr}`;
      cycleLabel = 'SIKLUS 2 (TGL 16 - 31)';
      tanggalBadge = '16 s/d 31';
    } else if (selectedDateFilterPreset === 'CUSTOM' && (filterStartDate || filterEndDate)) {
      dateRangeText = `${filterStartDate ? toDisplayDate(filterStartDate) : 'Awal'} s/d ${filterEndDate ? toDisplayDate(filterEndDate) : 'Akhir'}`;
      cycleLabel = 'PERIODE KUSTOM';
      tanggalBadge = `${filterStartDate || 'Awal'} - ${filterEndDate || 'Akhir'}`;
    } else {
      dateRangeText = activePeriodDisplayLabel || activePeriod.periodName;
      cycleLabel = 'PERIODE AKTIF';
      tanggalBadge = '01 s/d Akhir';
    }

    return {
      dateRangeText,
      cycleLabel,
      tanggalBadge,
      monthBadge: monthUpper,
      yearBadge: yearStr
    };
  }, [selectedDateFilterPreset, selectedMonthFilter, selectedYearFilter, filterStartDate, filterEndDate, activePeriodDisplayLabel, activePeriod.periodName]);

  // Specimen signatures linked with Admin User Management
  const preparedBySignatureUrl = useMemo(() => {
    return activePeriod.preparedBy?.signatureUrl || getSpecimenSignature(
      users,
      { name: activePeriod.preparedBy?.name || 'Agus Setiabudi', role: 'ACCOUNTING' },
      SAMPLE_SIGNATURES.AGUS_ACCOUNTING
    );
  }, [activePeriod.preparedBy, users]);

  const approvedBySignatureUrl = useMemo(() => {
    return activePeriod.approvedBy?.signatureUrl || getSpecimenSignature(
      users,
      { name: activePeriod.approvedBy?.name || 'Ari Soplanit', role: 'GM' },
      SAMPLE_SIGNATURES.ARI_GM
    );
  }, [activePeriod.approvedBy, users]);

  // Recalculate totals
  const totalDebit = useMemo(() => {
    return (activePeriod?.items || []).reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0);
  }, [activePeriod]);

  const totalKredit = useMemo(() => {
    return (activePeriod?.items || []).reduce((acc, curr) => acc + (Number(curr.kredit) || 0), 0);
  }, [activePeriod]);

  // Items to print in the appendix (respecting selected printScope)
  const itemsToPrint = useMemo(() => {
    if (printScope === 'FILTERED') {
      return filteredItems;
    }
    return activePeriod?.items || [];
  }, [printScope, filteredItems, activePeriod]);

  const itemsToPrintTotal = useMemo(() => {
    return itemsToPrint.reduce((acc, curr) => acc + (Number(curr.amount) || Number(curr.debit) || 0), 0);
  }, [itemsToPrint]);

  // Isolated Clean Landscape Print Handler (Image 2 style, no dark dashboard)
  const handlePrintDocument = () => {
    const printContent = document.getElementById('petty-cash-print-sheet');
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
            <title>Petty_Cash_${activePeriod.periodName.replace(/[\/\s]/g, '_')}</title>
            <meta charset="utf-8">
            <style>
              @page {
                size: A4 landscape;
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
                padding: 12px;
                font-size: 10px;
                line-height: 1.35;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-container {
                width: 100%;
                max-width: 100%;
                margin: 0 auto;
                background: #ffffff;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 8px;
                margin-bottom: 12px;
              }
              th, td {
                border: 1px solid #cbd5e1;
                padding: 4px 6px;
                font-size: 9px;
              }
              th {
                background-color: #f1f5f9;
                font-weight: 800;
                text-transform: uppercase;
                color: #1e293b;
              }
              .avoid-page-break {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .sig-table {
                width: 100% !important;
                border-collapse: collapse !important;
                margin-top: 18px !important;
                border-top: 2px solid #0f172a !important;
                page-break-inside: avoid !important;
              }
              .sig-table td {
                width: 50% !important;
                border: none !important;
                padding: 12px 24px !important;
                vertical-align: top !important;
                text-align: center !important;
              }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .font-mono { font-family: monospace; }
              .font-bold { font-weight: 700; }
              .font-black { font-weight: 900; }
              .invert { filter: invert(1); }
              /* Strict Logo Sizing in Print Engine */
              img.gmcc-logo, .gmcc-logo {
                max-height: 36px !important;
                height: 36px !important;
                max-width: 140px !important;
                width: auto !important;
                object-fit: contain !important;
                display: block !important;
              }
              .break-before-page {
                page-break-before: always;
                break-before: page;
              }
              /* 2 Nota per baris, pas muat dalam lembar cetak */
              .receipt-grid-container {
                display: grid !important;
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 12px !important;
                width: 100% !important;
                margin-top: 10px !important;
              }
              .receipt-card-item {
                border: 1.5px solid #0f172a !important;
                border-radius: 8px !important;
                overflow: hidden !important;
                background: #ffffff !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
              }
              .receipt-card-header {
                background: #0f172a !important;
                color: #ffffff !important;
                padding: 4px 8px !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                font-size: 9px !important;
              }
              .receipt-card-sub {
                background: #f8fafc !important;
                border-bottom: 1px solid #e2e8f0 !important;
                padding: 3px 8px !important;
                display: flex !important;
                justify-content: space-between !important;
                font-size: 8px !important;
                color: #334155 !important;
              }
              .receipt-card-imgbox {
                height: 150px !important;
                max-height: 150px !important;
                background: #f8fafc !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 4px !important;
                position: relative !important;
                overflow: hidden !important;
              }
              .receipt-card-imgbox img {
                max-height: 140px !important;
                max-width: 100% !important;
                object-fit: contain !important;
              }
              .receipt-card-footer {
                background: #f8fafc !important;
                border-top: 1px solid #e2e8f0 !important;
                padding: 4px 8px !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                font-size: 8px !important;
                color: #475569 !important;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
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
          if (document.body.contains(printIframe)) {
            document.body.removeChild(printIframe);
          }
        }, 1200);
      }, 300);
    }
  };

  // Pull data from PO & Goods Receiving (GRN) that have receipt proofs - INTERACTIVE MODAL
  const handleOpenPullModal = () => {
    if (!activePeriod) return;

    // Look for GRNs that have received status, audited invoices, and have NOT been pulled yet
    const unpulledEligibleGrns = grns.filter(g => {
      if (g.totalInvoiceAudited <= 0) return false;
      const alreadyInActive = (activePeriod?.items || []).some(it => it.grnNumber === g.grnNumber);
      const alreadyInAny = (periods || []).some(p => (p.items || []).some(it => it.grnNumber === g.grnNumber));
      return !alreadyInActive && !alreadyInAny;
    });

    if (unpulledEligibleGrns.length === 0) {
      alert('Semua data Penerimaan Barang (GRN) berbukti nota telah berhasil ditarik ke dalam kas kecil. Tidak ada data baru yang belum ditarik.');
      return;
    }

    // Default select unpulled items
    const initialSelected = unpulledEligibleGrns.map(g => g.id);
    const initialGlMap: Record<string, { glCode: string; glName: string; department: string; paidBy: string }> = {};

    unpulledEligibleGrns.forEach(grn => {
      const poRef = pos.find(p => p.id === grn.poId || p.poNumber === grn.poNumber);
      const isFood = poRef?.department?.toLowerCase().includes('food') || grn.items.some(it => it.itemName.toLowerCase().includes('ayam') || it.itemName.toLowerCase().includes('salmon') || it.itemName.toLowerCase().includes('beras'));
      const isEng = poRef?.department?.toLowerCase().includes('engin') || grn.items.some(it => it.itemName.toLowerCase().includes('lampu') || it.itemName.toLowerCase().includes('cat'));
      const isHk = poRef?.department?.toLowerCase().includes('house') || grn.items.some(it => it.itemName.toLowerCase().includes('linen') || it.itemName.toLowerCase().includes('sabun'));

      let glCode = '732-001';
      let glName = 'Kitchen Operating Expense';
      let dept = 'Kitchen';

      if (isEng) {
        glCode = '210-003';
        glName = 'Repairs & Maintenance Engineering';
        dept = 'Engineering';
      } else if (isHk) {
        glCode = '702-003';
        glName = 'Housekeeping & Laundry Supplies';
        dept = 'HK';
      } else if (!isFood) {
        glCode = '622-022';
        glName = 'General & Administration / ATK';
        dept = 'ATK';
      }

      initialGlMap[grn.id] = {
        glCode,
        glName,
        department: dept,
        paidBy: grn.receivedBy.split('(')[0].trim() || 'Staf Receiving'
      };
    });

    setSelectedGrnIdsToPull(initialSelected);
    setPullGlAssignments(initialGlMap);
    setShowPullModal(true);
  };

  const handleExecutePullSelected = () => {
    if (!activePeriod) return;
    const selectedGrns = grns.filter(g => selectedGrnIdsToPull.includes(g.id));
    if (selectedGrns.length === 0) {
      alert('Pilih minimal 1 data penerimaan barang (GRN) untuk ditarik ke kas kecil.');
      return;
    }

    const newItems: ExpenseReceiptProof[] = [...activePeriod.items];
    let pulledCount = 0;

    selectedGrns.forEach((grn, idx) => {
      const alreadyPulled = newItems.some(it => it.grnNumber === grn.grnNumber);
      if (!alreadyPulled) {
        const itemDate = grn.receiptDate.split(' ')[0] || '15/04/2026';
        const glInfo = pullGlAssignments[grn.id] || {
          glCode: '732-001',
          glName: 'Kitchen Operating Expense',
          department: 'Kitchen',
          paidBy: grn.receivedBy.split('(')[0].trim() || 'Staf Receiving'
        };

        const proofItem: ExpenseReceiptProof = {
          id: `pulled-grn-${Date.now()}-${idx}`,
          receiptNumber: grn.receiptProofNumber || grn.deliveryOrderNumber || `NOTA/GRN/${grn.grnNumber.split('/').pop()}`,
          itdcInvoiceNumber: activePeriod.itdcInvoiceNumber,
          date: itemDate,
          vendorName: grn.vendorName,
          department: glInfo.department,
          glAccountCode: glInfo.glCode,
          glAccountName: glInfo.glName,
          description: `Penerimaan Barang PO ${grn.poNumber}: ${grn.items.map(i => i.itemName).slice(0, 2).join(', ')}`,
          amount: grn.totalInvoiceAudited,
          debit: grn.totalInvoiceAudited,
          kredit: grn.totalInvoiceAudited,
          proofType: grn.receiptProofType || 'NOTA_KONTAN',
          jvNumber: `JV/GRN/${grn.grnNumber.split('/').pop()}`,
          sourceType: 'PO_RECEIVING',
          poNumber: grn.poNumber,
          grnNumber: grn.grnNumber,
          paidBy: glInfo.paidBy,
          status: 'VERIFIED',
          proofImageUrl: grn.receiptProofImage || generateReceiptSvg(
            grn.vendorName, 
            grn.deliveryOrderNumber, 
            itemDate, 
            grn.totalInvoiceAudited, 
            grn.items.map(i => `${i.qtyReceived} ${i.unit} ${i.itemName}`).join(', ')
          ),
          proofImages: (grn.receiptProofImages && grn.receiptProofImages.length > 0)
            ? grn.receiptProofImages
            : (grn.receiptProofImage ? [grn.receiptProofImage] : undefined),
          receiptProofItems: (grn.receiptProofItems && grn.receiptProofItems.length > 0)
            ? grn.receiptProofItems
            : undefined
        };

        newItems.push(proofItem);
        pulledCount++;
      }
    });

    if (pulledCount === 0) {
      alert('Semua data yang dipilih sudah ada dalam rekapitulasi kas kecil periode ini.');
      setShowPullModal(false);
      return;
    }

    const updatedPeriod: PettyCashSettlementPeriod = {
      ...activePeriod,
      items: newItems,
      totalDebit: newItems.reduce((acc, curr) => acc + curr.debit, 0),
      totalKredit: newItems.reduce((acc, curr) => acc + curr.kredit, 0)
    };

    onSavePeriod(updatedPeriod);
    setShowPullModal(false);
    alert(`Berhasil menarik ${pulledCount} data transaksi belanja barang dari PO & Receiving lengkap dengan bukti nota fisik ke periode ${activePeriod.periodName}!`);
  };

  // Handler: Apply Generator Items to Active Period
  const handleApplyGeneratorToActivePeriod = () => {
    if (!activePeriod) return;
    if (generatorResult.acceptedCandidates.length === 0) {
      alert('Tidak ada transaksi yang memenuhi kriteria periode dan COA yang dipilih.');
      return;
    }

    const appliedItdcNo = genItdcInvoiceNumber.trim().toUpperCase() || activePeriod.itdcInvoiceNumber || undefined;

    const convertedItems: ExpenseReceiptProof[] = generatorResult.acceptedCandidates.map((c, idx) => ({
      id: `pc-${c.grnId}-${Date.now()}-${idx}`,
      receiptNumber: c.receiptNumber,
      itdcInvoiceNumber: appliedItdcNo,
      date: c.displayDate,
      vendorName: c.vendorName,
      amount: c.amount,
      debit: c.amount,
      kredit: c.amount,
      department: c.department,
      costCenterName: c.costCenterName,
      coaName: c.coaName,
      glAccountCode: c.glAccountCode,
      glAccountName: c.glAccountName,
      description: c.description,
      proofImageUrl: c.proofImageUrl,
      proofType: c.proofType,
      jvNumber: `JV/${c.receiptNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
      sourceType: 'PO_RECEIVING',
      poNumber: c.poNumber,
      grnNumber: c.grnNumber,
      paidBy: c.paidBy,
      status: 'VERIFIED'
    }));

    const updatedPeriod: PettyCashSettlementPeriod = {
      ...activePeriod,
      itdcInvoiceNumber: appliedItdcNo,
      items: convertedItems,
      totalDebit: generatorResult.acceptedTotal,
      totalKredit: generatorResult.acceptedTotal,
      coaFilter: genCoa,
      costCenterFilter: genCostCenter,
      maxLimit: genMaxLimit,
      skippedDatesNote: generatorResult.skippedDateBlocks.length > 0 
        ? `${generatorResult.skippedDateBlocks.length} tanggal dilewati demi menjaga keutuhan data & batas Rp 50 jt`
        : undefined,
      preparedBy: {
        name: activePeriod.preparedBy?.name || 'Agus Setiabudi',
        title: activePeriod.preparedBy?.title || 'Chief Accounting',
        date: new Date().toLocaleDateString('id-ID')
      },
      approvedBy: {
        name: activePeriod.approvedBy?.name || 'Ari Soplanit',
        title: activePeriod.approvedBy?.title || 'General Manager',
        date: new Date().toLocaleDateString('id-ID')
      },
      checkedBy: undefined // Dihapus sesuai instruksi user
    };

    onSavePeriod(updatedPeriod);
    setShowGeneratorModal(false);
    alert(`Berhasil membangun kas kecil periode ${activePeriod.periodName}! ${convertedItems.length} transaksi senilai ${formatRupiah(generatorResult.acceptedTotal)} telah terpasang rapi dengan bukti kwitansi penerimaan barang.`);
  };

  // Handler: Create New Settlement Period from Generator
  const handleCreateNewPeriodFromGenerator = () => {
    if (generatorResult.acceptedCandidates.length === 0) {
      alert('Tidak ada transaksi yang memenuhi kriteria.');
      return;
    }

    const coaLabel = genCoa === 'ALL' ? 'GABUNGAN' : genCoa;
    const startDisp = toDisplayDate(genStartDate);
    const endDisp = toDisplayDate(genEndDate);
    const autoPeriodName = newPeriodNameInput.trim() || `${startDisp.split('/')[0]} - ${endDisp} (${coaLabel})`;
    const createdItdcNo = genItdcInvoiceNumber.trim().toUpperCase() || undefined;

    const convertedItems: ExpenseReceiptProof[] = generatorResult.acceptedCandidates.map((c, idx) => ({
      id: `pc-${c.grnId}-${Date.now()}-${idx}`,
      receiptNumber: c.receiptNumber,
      itdcInvoiceNumber: createdItdcNo,
      date: c.displayDate,
      vendorName: c.vendorName,
      amount: c.amount,
      debit: c.amount,
      kredit: c.amount,
      department: c.department,
      costCenterName: c.costCenterName,
      coaName: c.coaName,
      glAccountCode: c.glAccountCode,
      glAccountName: c.glAccountName,
      description: c.description,
      proofImageUrl: c.proofImageUrl,
      proofImages: c.proofImages,
      receiptProofItems: c.receiptProofItems,
      proofType: c.proofType,
      jvNumber: `JV/${c.receiptNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
      sourceType: 'PO_RECEIVING',
      poNumber: c.poNumber,
      grnNumber: c.grnNumber,
      paidBy: c.paidBy,
      status: 'VERIFIED'
    }));

    const newPeriod: PettyCashSettlementPeriod = {
      id: `period-${Date.now()}`,
      periodName: autoPeriodName,
      itdcInvoiceNumber: createdItdcNo,
      startDate: genStartDate,
      endDate: genEndDate,
      title: `GOLO MORI PETTY CASH - ${coaLabel}`,
      currency: 'IDR',
      items: convertedItems,
      totalDebit: generatorResult.acceptedTotal,
      totalKredit: generatorResult.acceptedTotal,
      status: 'DRAFT',
      coaFilter: genCoa,
      costCenterFilter: genCostCenter,
      maxLimit: genMaxLimit,
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
      checkedBy: undefined, // Dihapus sesuai instruksi user
      notes: `File kas kecil otomatis berdasarkan COA ${coaLabel} (Periode ${startDisp} - ${endDisp}). Pagu maksimal Rp 50.000.000 terjaga utuh per tanggal.`
    };

    onSavePeriod(newPeriod);
    setSelectedPeriodId(newPeriod.id);
    setShowGeneratorModal(false);
    alert(`File kas kecil baru "${autoPeriodName}" berhasil dibuat dan diisi ${convertedItems.length} transaksi (${formatRupiah(generatorResult.acceptedTotal)}) beserta bukti kwitansi penerimaan barang!`);
  };

  // Add Manual Expense
  const handleSaveNewExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim() || newAmount <= 0) {
      alert('Deskripsi dan nominal pengeluaran wajib diisi.');
      return;
    }

    const notaNo = newReceiptNumber.trim() || `NOTA/GMCC/${newDate.replace(/\//g, '')}/${Math.floor(100 + Math.random() * 900)}`;
    const proofSvg = newProofImage || generateReceiptSvg(
      newVendor || 'Vendor Mitra GMCC Labuan Bajo',
      notaNo,
      newDate,
      newAmount,
      newDescription
    );

    const newItem: ExpenseReceiptProof = {
      id: `exp-${Date.now()}`,
      receiptNumber: notaNo,
      itdcInvoiceNumber: activePeriod.itdcInvoiceNumber,
      date: newDate,
      vendorName: newVendor.trim() || 'Vendor Toko Labuan Bajo',
      department: newDepartment,
      glAccountCode: newGlCode,
      glAccountName: newGlName,
      description: newDescription.trim(),
      amount: newAmount,
      debit: newAmount,
      kredit: newAmount,
      proofType: newProofType,
      jvNumber: `JV/2604/${Math.floor(100 + Math.random() * 900)}`,
      sourceType: 'DIRECT_PETTY_CASH',
      paidBy: newPaidBy,
      status: 'VERIFIED',
      proofImageUrl: proofSvg
    };

    const updatedItems = [newItem, ...activePeriod.items];
    const updatedPeriod: PettyCashSettlementPeriod = {
      ...activePeriod,
      items: updatedItems,
      totalDebit: updatedItems.reduce((acc, curr) => acc + curr.debit, 0),
      totalKredit: updatedItems.reduce((acc, curr) => acc + curr.kredit, 0)
    };

    onSavePeriod(updatedPeriod);
    setShowAddExpenseModal(false);
    // Reset
    setNewDescription('');
    setNewAmount(0);
    setNewVendor('');
    setNewReceiptNumber('');
    setNewProofImage('');
    alert(`Pengeluaran baru ${newItem.receiptNumber} senilai ${formatRupiah(newItem.amount)} berhasil ditambahkan ke periode tarikan!`);
  };

  // Delete Item
  const handleDeleteItem = (itemId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus item pengeluaran ini dari daftar tarikan?')) {
      const updatedItems = activePeriod.items.filter(it => it.id !== itemId);
      const updatedPeriod: PettyCashSettlementPeriod = {
        ...activePeriod,
        items: updatedItems,
        totalDebit: updatedItems.reduce((acc, curr) => acc + curr.debit, 0),
        totalKredit: updatedItems.reduce((acc, curr) => acc + curr.kredit, 0)
      };
      onSavePeriod(updatedPeriod);
    }
  };

  // Handle image upload from computer
  const handleUploadReceiptImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Receipt className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight uppercase">
                GOLOMORI Petty Cash &amp; Expense Settlement
              </h1>
            </div>
          </div>
        </div>

        {/* Quick Period Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selection Dropdown */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  Periode: {p.periodName}
                </option>
              ))}
            </select>
          </div>

          {onDeletePeriod && periods.length > 1 && (
            <button
              onClick={() => {
                if (confirm(`Yakin ingin menghapus file / periode kas kecil "${activePeriod.periodName}"?`)) {
                  onDeletePeriod(activePeriod.id);
                  const remaining = periods.filter(p => p.id !== activePeriod.id);
                  if (remaining[0]) setSelectedPeriodId(remaining[0].id);
                }
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
              title="Hapus periode kas kecil ini"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Bangun Kas Kecil Otomatis (COA, Cost Center, Periode, Maks 50jt) */}
          <button
            onClick={() => setShowGeneratorModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all transform hover:scale-[1.02]"
            title="Bangun data kas kecil otomatis berdasarkan Periode & COA (BPP, NON BPP, Transport, Event, dll) dengan batas maksimal Rp 50 Juta & integritas tanggal utuh"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Bangun Kas Kecil Otomatis (50 Jt)</span>
          </button>

          {/* Konfirmasi & Standarisasi File Penagihan Baku */}
          <button
            onClick={handleOpenConfirmBillingModal}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-black shadow-lg shadow-teal-600/25 flex items-center gap-2 transition-all transform hover:scale-[1.02]"
            title="Konfirmasi & bakukan data kas kecil periode ini menjadi Berkas Penagihan Resmi (Maks 50 Juta & tanggal terkunci)"
          >
            <Lock className="w-3.5 h-3.5 text-teal-200" />
            <span>Konfirmasi Berkas Tagihan</span>
          </button>

          {/* Navigasi ke Modul Berkas Tagihan */}
          {onNavigateToBillingFiles && (
            <button
              onClick={onNavigateToBillingFiles}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Buka modul arsip berkas penagihan yang telah dibakukan"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Arsip Tagihan ({billingFiles.length})</span>
            </button>
          )}

          {/* Tarik Data dari PO & Receiving Button */}
          <button
            onClick={handleOpenPullModal}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition-all"
            title="Tarik data pengadaan barang dari PO & Receiving yang telah diterima di periode ini"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tarik dari Receiving</span>
          </button>

          {/* Cetak Format PDF Resmi */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Rekap PDF</span>
          </button>
        </div>
      </div>

      {/* WARNING ALERT: TANGGAL SUDAH DIBAKUKAN KE BERKAS PENAGIHAN LAIN */}
      {activePeriodLockedDates.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-3 shadow-xl animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-extrabold text-white text-sm flex items-center gap-2">
              <span>Peringatan Integritas: Tanggal Ini Telah Terkunci di Berkas Penagihan Baku!</span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono">
                Anti Double Billing
              </span>
            </div>
            <p className="text-[11px] text-rose-200/90 leading-relaxed">
              Ditemukan transaksi pada tanggal yang sudah dibakukan ke dalam Berkas Penagihan Kas Kecil yang lain. Demi mencegah penagihan ganda (double claiming), transaksi pada tanggal-tanggal berikut tidak dapat ditarik kembali:
            </p>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
              {activePeriodLockedDates.map((l, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-rose-900/60 border border-rose-700 text-white font-bold">
                  Tgl {l.displayDate}: {l.count} nota ({formatRupiah(l.total)}) di berkas <span className="text-amber-300">{l.fileNumber}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Debit (Pengeluaran)</div>
          <div className="text-lg font-black text-white font-mono mt-1">
            {formatRupiah(totalDebit)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{activePeriod.items.length} Bukti Nota Fisik</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Kredit (Seimbang)</div>
          <div className="text-lg font-black text-cyan-400 font-mono mt-1">
            {formatRupiah(totalKredit)}
          </div>
          <div className="text-[11px] text-cyan-300 mt-1">
            Status: Balance (Klir)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[10px] uppercase font-bold text-slate-400">Pagu / Batas Maksimal File</div>
          <div className="text-lg font-black text-emerald-400 font-mono mt-1">
            Rp 50.000.000
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            Sisa: {formatRupiah(Math.max(0, 50000000 - totalDebit))}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[10px] uppercase font-bold text-slate-400">Pengesahan Otorisasi</div>
          <div className="text-sm font-bold text-emerald-400 mt-1.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Otorisasi Resmi GMCC</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Chief Accounting &amp; General Manager
          </div>
        </div>
      </div>

      {/* FILTER & SORT CONTROLS BAR (COA, PERIODE TANGGAL, BULAN, TAHUN & SORTIR) */}
      <div className="space-y-2.5 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Department Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setSelectedDepartment('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                selectedDepartment === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Semua Dept ({activePeriod.items.length})
            </button>
            {departmentsList.map(dept => {
              const count = activePeriod.items.filter(i => i.department === dept).length;
              return (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                    selectedDepartment === dept
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {dept} ({count})
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nota, toko, akun, rincian..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Second Row: Specific Filters for COA, Periode Tanggal, Bulan, Tahun, and Sortir */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          {/* 1. Filter COA */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Filter COA:</span>
            </label>
            <select
              value={selectedCoaFilter}
              onChange={(e) => setSelectedCoaFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Semua Akun COA</option>
              <option value="BPP">COA: BPP (Kitchen &amp; Bahan Pokok)</option>
              <option value="NON BPP">COA: NON BPP (Operasional &amp; ATK)</option>
              <option value="Transport">COA: Transport (BBM &amp; Armada)</option>
              <option value="Event Cost">COA: Event Cost (MICE)</option>
              <option value="Rental Equipment Event">COA: Rental Equipment Event</option>
              <option value="Meal Employee">COA: Meal Employee (Konsumsi)</option>
            </select>
          </div>

          {/* 2. Filter Periode Tanggal (Pilihan Preset & Rentang Tanggal Range) */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-400" />
                <span>Periode Tanggal:</span>
              </span>
              {selectedDateFilterPreset === 'CUSTOM' && (filterStartDate || filterEndDate) && (
                <button 
                  onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setSelectedDateFilterPreset('ALL'); }}
                  className="text-[9px] text-rose-400 hover:underline"
                >
                  Reset
                </button>
              )}
            </label>
            <select
              value={selectedDateFilterPreset}
              onChange={(e) => setSelectedDateFilterPreset(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Semua Tanggal Bulan Ini</option>
              <option value="1-15">Periode: Tanggal 1 - 15</option>
              <option value="16-31">Periode: Tanggal 16 - 31</option>
              <option value="CUSTOM">📅 Rentang Tanggal Bebas (Date Range)...</option>
            </select>

            {selectedDateFilterPreset === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-1.5 mt-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block mb-0.5">Dari Tanggal:</span>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-[10px] font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block mb-0.5">Sampai Tanggal:</span>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-[10px] font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Filter Bulan */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>Bulan Transaksi:</span>
            </label>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Bulan</option>
              <option value="01">Januari</option>
              <option value="02">Februari</option>
              <option value="03">Maret</option>
              <option value="04">April</option>
              <option value="05">Mei</option>
              <option value="06">Juni</option>
              <option value="07">Juli</option>
              <option value="08">Agustus</option>
              <option value="09">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          </div>

          {/* 4. Filter Tahun */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-indigo-400" />
              <span>Tahun Transaksi:</span>
            </label>
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2026">2026 (Tahun Berjalan)</option>
              <option value="2025">2025</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* 5. Sortir Urutan */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-cyan-400" />
              <span>Urutkan Data:</span>
            </label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
            >
              <option value="DATE_DESC">Tanggal (Terbaru)</option>
              <option value="DATE_ASC">Tanggal (Kronologis)</option>
              <option value="COA_ASC">No. Akun COA (Ascending)</option>
              <option value="AMOUNT_DESC">Nominal (Terbesar)</option>
              <option value="AMOUNT_ASC">Nominal (Terkecil)</option>
            </select>
          </div>
        </div>
      </div>

      {/* BANNER INFORMASI RESMI COA & PERIODE KAS KECIL (TULISAN BESAR & JELAS DIATAS TABEL) */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-2 border-cyan-500/70 p-4 sm:p-5 shadow-2xl shadow-cyan-950/50 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* SISI KIRI: INFORMASI COA BESAR */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
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
              <span>Departemen: <strong className="text-slate-200">{selectedDepartment === 'ALL' ? 'Semua Departemen' : selectedDepartment}</strong></span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span>Total Item: <strong className="text-cyan-300">{filteredItems.length} Baris ({formatRupiah(totalDebit)})</strong></span>
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

      {/* MAIN SETTLEMENT TABLE (PERSIS SEPERTI LEMBAR 1 PDF DENGAN 39 BARIS & TOTAL SEIMBANG) */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900 overflow-hidden shadow-2xl">
        {/* Official Sheet Header Banner */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img 
              src={GMCC_LOGO_WHITE} 
              alt="GMCC Logo" 
              className="h-8 w-auto object-contain shrink-0" 
            />
            <div className="border-l border-slate-600 pl-3">
              <h2 className="text-sm font-extrabold text-white tracking-wide uppercase">
                GOLO MORI CONVENTION CENTER - PETTY CASH &amp; SETTLEMENT
              </h2>
              <div className="text-[11px] font-semibold text-cyan-400">
                PERIODE: {activePeriodDisplayLabel} • KAWASAN GOLO MORI CONVENTION CENTER
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* No. Invoice ITDC (Wajib) — Track Record Link */}
            {isEditingPeriodItdc ? (
              <form onSubmit={handleSavePeriodItdcInvoiceNumber} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-400 px-2.5 py-1 rounded-xl shadow-sm">
                <span className="text-[10px] font-bold text-emerald-900 whitespace-nowrap">No. Invoice ITDC (Wajib):</span>
                <input
                  type="text"
                  value={periodItdcInput}
                  onChange={(e) => setPeriodItdcInput(e.target.value.toUpperCase())}
                  placeholder="INV/GMCC-ITDC/2026/X-XXX"
                  className="w-52 px-2 py-1 rounded-lg bg-white border border-emerald-400 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setPeriodItdcInput(formatItdcInvoiceNumber(genYear || new Date().getFullYear(), genMonth || new Date().getMonth() + 1, (billingFiles?.length || 0) + 1))}
                  className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold border border-emerald-300"
                  title="Isi format otomatis"
                >
                  Auto
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPeriodItdc(false)}
                  className="px-1.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold"
                >
                  ✕
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                <div className="text-[11px]">
                  <span className="text-slate-400 font-semibold">No. Invoice ITDC (Wajib): </span>
                  {activePeriod.itdcInvoiceNumber ? (
                    <span className="font-mono font-black text-emerald-300 tracking-wide">{activePeriod.itdcInvoiceNumber}</span>
                  ) : (
                    <span className="font-mono text-amber-300 italic">Belum diisi (INV/GMCC-ITDC/2026/X-XXX)</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPeriodItdcInput(activePeriod.itdcInvoiceNumber || '');
                    setIsEditingPeriodItdc(true);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition-colors"
                >
                  {activePeriod.itdcInvoiceNumber ? 'Ubah' : 'Isi No. Invoice ITDC'}
                </button>
              </div>
            )}

            <div className="text-[11px] text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 font-mono">
              Mata Uang: <span className="text-amber-400 font-bold">IDR (Rupiah)</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/90 text-slate-300 uppercase text-[10px] font-bold border-b border-slate-700">
              <tr>
                <th className="px-3 py-3 text-center w-12">NO</th>
                <th className="px-3 py-3 w-24">DATE</th>
                <th className="px-3 py-3 w-28">NO. AKUN</th>
                <th className="px-4 py-3">KETERANGAN PENGELUARAN</th>
                <th className="px-3 py-3 text-right w-32">DEBIT (IDR)</th>
                <th className="px-3 py-3 text-right w-32">KREDIT (IDR)</th>
                <th className="px-3 py-3 text-center w-36">BUKTI NOTA / STRUK</th>
                <th className="px-3 py-3 text-right w-28">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-white text-sm">Belum Ada Transaksi Kas Kecil di Periode Ini</h3>
                      <p className="text-xs text-slate-400">
                        Data contoh BPP telah dibersihkan. Anda dapat menarik transaksi belanja riil dari Penerimaan Barang (GRN) yang terhubung dengan PO, atau mencatat nota pengeluaran baru.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          onClick={handleOpenPullModal}
                          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Tarik Data dari PO &amp; Receiving (GRN)</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                    {/* NO */}
                    <td className="px-3 py-2.5 text-center font-mono text-slate-400">
                      {index + 1}
                    </td>

                    {/* DATE */}
                    <td className="px-3 py-2.5 font-mono text-slate-300 whitespace-nowrap">
                      {item.date}
                    </td>

                    {/* NO AKUN */}
                    <td className="px-3 py-2.5 font-mono text-amber-300 font-bold">
                      {item.glAccountCode}
                    </td>

                    {/* KETERANGAN */}
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{item.description}</span>
                        {item.department && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 border border-slate-700 text-cyan-300">
                            {item.department}
                          </span>
                        )}
                        {item.sourceType === 'PO_RECEIVING' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            PO/GRN
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Rekanan: <span className="text-slate-300">{item.vendorName}</span> • PIC: {item.paidBy || 'Agus'}
                      </div>
                    </td>

                    {/* DEBIT */}
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-white">
                      {formatRupiah(item.debit)}
                    </td>

                    {/* KREDIT */}
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-cyan-300">
                      {formatRupiah(item.kredit)}
                    </td>

                    {/* BUKTI NOTA */}
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => setSelectedProofModal(item)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-[10px] inline-flex items-center gap-1.5 transition-all shadow-sm group"
                        title="Klik untuk melihat bukti fisik nota / struk / kwitansi"
                      >
                        <FileCheck className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="truncate max-w-[90px]">{item.receiptNumber}</span>
                      </button>
                    </td>

                    {/* AKSI */}
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedJvModal(item)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold transition-colors"
                          title="Lihat Formulir Journal Voucher (JV)"
                        >
                          JV Form
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Hapus baris pengeluaran"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* SUMMARY TOTAL ROW */}
            <tfoot className="bg-slate-800/95 border-t-2 border-slate-600 font-bold text-xs text-white">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-wider text-slate-300 font-extrabold">
                  TOTAL KESELURUHAN ({activePeriodDisplayLabel}):
                </td>
                <td className="px-3 py-3 text-right font-mono font-black text-amber-300 text-sm">
                  {formatRupiah(totalDebit)}
                </td>
                <td className="px-3 py-3 text-right font-mono font-black text-cyan-300 text-sm">
                  {formatRupiah(totalKredit)}
                </td>
                <td colSpan={2} className="px-3 py-3 text-center text-[10px] text-emerald-400 font-bold">
                  ✓ BALANCE / SEIMBANG
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* LEMBAR PENGESAHAN & OTORISASI (CHIEF ACCOUNTING & GENERAL MANAGER DENGAN TANDA TANGAN DIGITAL TERLAMPIR) */}
        <div className="p-6 bg-slate-950/70 border-t border-slate-800">
          <div className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            Lembar Pengesahan &amp; Otorisasi Pertanggungjawaban Kas Kecil GMCC (Tanda Tangan Digital Resmi)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* 1. DIPERSIAPKAN OLEH */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center flex flex-col justify-between shadow-lg">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dipersiapkan Oleh:</div>
                <div className="text-sm font-bold text-cyan-400 mt-0.5">Chief Accounting</div>
              </div>

              <div className="py-2.5 my-2 flex flex-col items-center justify-center border-y border-dashed border-slate-800/80">
                <div className="h-14 flex items-center justify-center">
                  <img
                    src={preparedBySignatureUrl}
                    alt="Tanda Tangan Chief Accounting"
                    className="max-h-12 w-auto object-contain filter invert contrast-125"
                  />
                </div>
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  <span>Diverifikasi Finance &amp; Accounting</span>
                </span>
                <span className="text-[9.5px] text-slate-500 mt-0.5">Sesuai Dokumen Kwitansi &amp; Nota GRN</span>
              </div>

              <div>
                <div className="font-extrabold text-white text-xs underline underline-offset-4 tracking-wide">
                  {activePeriod.preparedBy?.name || 'Agus Setiabudi'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Tanggal Otorisasi: {activePeriod.preparedBy?.date || '31/10/2026'}
                </div>
              </div>
            </div>

            {/* 2. DISETUJUI OLEH */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center flex flex-col justify-between shadow-lg">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disetujui Oleh:</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">General Manager</div>
              </div>

              <div className="py-2.5 my-2 flex flex-col items-center justify-center border-y border-dashed border-slate-800/80">
                <div className="h-14 flex items-center justify-center">
                  <img
                    src={approvedBySignatureUrl}
                    alt="Tanda Tangan General Manager"
                    className="max-h-12 w-auto object-contain filter invert contrast-125"
                  />
                </div>
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-amber-400" />
                  <span>Pengesahan Otorisasi Manajemen</span>
                </span>
                <span className="text-[9.5px] text-slate-500 mt-0.5">Disetujui Pencairan / Reimbursement</span>
              </div>

              <div>
                <div className="font-extrabold text-white text-xs underline underline-offset-4 tracking-wide">
                  {activePeriod.approvedBy?.name || 'Ari Soplanit'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Tanggal Otorisasi: {activePeriod.approvedBy?.date || '01/11/2026'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: LIHAT BUKTI FISIK NOTA / KWITANSI / STRUK */}
      {selectedProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-800/60 shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Bukti Fisik Nota / Struk Pengadaan Barang
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Nomor: {selectedProofModal.receiptNumber} • {selectedProofModal.vendorName}
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

            {/* Body */}
            {(() => {
              const modalProofList = (selectedProofModal.receiptProofItems && selectedProofModal.receiptProofItems.length > 0)
                ? selectedProofModal.receiptProofItems
                : (selectedProofModal.proofImages && selectedProofModal.proofImages.length > 0)
                ? selectedProofModal.proofImages.map((img, idx) => ({
                    id: `p-${idx}`,
                    orderIndex: idx + 1,
                    proofNumber: `${selectedProofModal.receiptNumber}-${String(idx + 1).padStart(2, '0')}`,
                    imageUrl: img,
                    caption: `Foto Nota #${idx + 1}`
                  }))
                : selectedProofModal.proofImageUrl
                ? [{
                    id: 'p-0',
                    orderIndex: 1,
                    proofNumber: `${selectedProofModal.receiptNumber}-01`,
                    imageUrl: selectedProofModal.proofImageUrl,
                    caption: 'Bukti Nota Utama'
                  }]
                : [];

              const currentPhoto = modalProofList[proofModalActiveIndex] || modalProofList[0];

              return (
                <div className="p-5 overflow-y-auto space-y-4">
                  {/* Multi-Photo Carousel / Tabs if > 1 photos */}
                  {modalProofList.length > 1 && (
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[80%]">
                        {modalProofList.map((item, idx) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setProofModalActiveIndex(idx)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                              proofModalActiveIndex === idx
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
                        {proofModalActiveIndex + 1} / {modalProofList.length}
                      </span>
                    </div>
                  )}

                  {/* Receipt Preview Image */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-2 shadow-inner relative">
                    {currentPhoto?.imageUrl ? (
                      <>
                        <img 
                          src={currentPhoto.imageUrl} 
                          alt={`Bukti ${currentPhoto.proofNumber}`}
                          className="max-h-[380px] w-auto object-contain rounded-lg shadow-lg"
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
                      <div className="p-8 text-center text-slate-500 italic">
                        Scan bukti nota fisik tidak tersedia.
                      </div>
                    )}
                  </div>

              {/* Transaction Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Tanggal Transaksi</span>
                  <span className="font-mono font-bold text-white">{selectedProofModal.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Total Nilai Nota</span>
                  <span className="font-mono font-bold text-cyan-400">{formatRupiah(selectedProofModal.amount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Departemen Pembebanan</span>
                  <span className="font-bold text-white">{selectedProofModal.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Akun GL Pembukuan</span>
                  <span className="font-mono text-amber-300 font-bold">{selectedProofModal.glAccountCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Petugas Penanggung Jawab</span>
                  <span className="font-bold text-slate-200">{selectedProofModal.paidBy || 'Agus'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Status Validasi</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    ✓ Disetujui Finance
                  </span>
                </div>
              </div>
            </div>
            ); })()}

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedJvModal(selectedProofModal);
                  setSelectedProofModal(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Lihat Formulir Journal Voucher (JV)</span>
              </button>
              <button
                onClick={() => setSelectedProofModal(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: JOURNAL VOUCHER (JV) ENTRY FORM SESUAI DOKUMEN PDF (HALAMAN 2-31) */}
      {selectedJvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <img 
                  src={GMCC_LOGO_DARK} 
                  alt="GMCC Logo" 
                  className="h-9 w-auto object-contain shrink-0" 
                />
                <div className="border-l border-slate-300 pl-3">
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-wide">
                    TRANSACTION ENTRY FORM - JOURNAL VOUCHER (JV)
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    GOLO MORI CONVENTION CENTER • FINANCE &amp; ACCOUNTING
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedJvModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* JV Document Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans">
              {/* JV Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-100 border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Voucher Type</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">JV (Journal Voucher)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Voucher No</span>
                  <span className="font-bold text-cyan-700 font-mono text-sm">{selectedJvModal.jvNumber || 'JV/2604/001'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Date</span>
                  <span className="font-mono text-slate-800 font-bold">{selectedJvModal.date}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Currency / Rate</span>
                  <span className="font-bold text-slate-800">IDR (1.00)</span>
                </div>
              </div>

              {/* JV Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-200 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-300">
                    <tr>
                      <th className="px-3 py-2.5">Account Code</th>
                      <th className="px-3 py-2.5">Account Name</th>
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-3 py-2.5 text-right">Debit (IDR)</th>
                      <th className="px-3 py-2.5 text-right">Credit (IDR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {/* Debit Row (Expense) */}
                    <tr>
                      <td className="px-3 py-2.5 font-mono font-bold text-cyan-800">{selectedJvModal.glAccountCode}</td>
                      <td className="px-3 py-2.5 font-medium">{selectedJvModal.glAccountName}</td>
                      <td className="px-4 py-2.5 font-medium">{selectedJvModal.description}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">{formatRupiah(selectedJvModal.debit)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-400">0</td>
                    </tr>
                    {/* Credit Row (Petty Cash Account) */}
                    <tr>
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-600">111-002</td>
                      <td className="px-3 py-2.5 font-medium">Petty Cash Operational GMCC</td>
                      <td className="px-4 py-2.5 text-slate-600">Penggantian Kas Kecil - {selectedJvModal.vendorName}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-400">0</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-cyan-800">{formatRupiah(selectedJvModal.kredit)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right uppercase">Total Voucher:</td>
                      <td className="px-3 py-2 text-right font-mono text-cyan-900">{formatRupiah(selectedJvModal.debit)}</td>
                      <td className="px-3 py-2 text-right font-mono text-cyan-900">{formatRupiah(selectedJvModal.kredit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Supporting Document Reference */}
              <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Lampiran Bukti Nota / Kwitansi Asli:</span>
                  <span className="text-slate-600 font-mono text-[11px]">
                    No: {selectedJvModal.receiptNumber} • Toko: {selectedJvModal.vendorName}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedProofModal(selectedJvModal);
                    setSelectedJvModal(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Buka Scan Bukti Fisik</span>
                </button>
              </div>

              {/* Signatures on Voucher */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                <div className="text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Prepared By:</div>
                  <div className="h-12 flex items-center justify-center font-serif text-sm italic text-slate-700">
                    Agus Setiabudi
                  </div>
                  <div className="border-t border-slate-300 pt-1 font-bold text-slate-800">Chief Accounting</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Approved By:</div>
                  <div className="h-12 flex items-center justify-center font-serif text-sm italic text-slate-700">
                    Ari Soplanit
                  </div>
                  <div className="border-t border-slate-300 pt-1 font-bold text-slate-800">General Manager</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedJvModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH NOTA / PENGELUARAN MANUAL */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-800/60 shrink-0">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Tambah Transaksi Nota Pengeluaran Baru</span>
              </h3>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewExpense} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tanggal Transaksi (DD/MM/YYYY) *</label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="15/04/2026"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nomor Nota / Kwitansi</label>
                  <input
                    type="text"
                    value={newReceiptNumber}
                    onChange={(e) => setNewReceiptNumber(e.target.value)}
                    placeholder="Contoh: NOTA/SINAR/2026/04/040"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Toko / Vendor *</label>
                  <input
                    type="text"
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                    placeholder="Contoh: Toko Sinar Pertama Labuan Bajo"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Departemen Pembebanan *</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => {
                      const dept = e.target.value;
                      setNewDepartment(dept);
                      if (dept === 'Kitchen') { setNewGlCode('732-001'); setNewGlName('Kitchen Operating Expense'); }
                      else if (dept === 'HK') { setNewGlCode('702-003'); setNewGlName('Housekeeping Cleaning Supplies'); }
                      else if (dept === 'Engineering') { setNewGlCode('210-003'); setNewGlName('Repairs & Maintenance Supplies'); }
                      else if (dept === 'ATK') { setNewGlCode('622-022'); setNewGlName('Office Stationery & Printing'); }
                      else if (dept === 'Transport') { setNewGlCode('628-001'); setNewGlName('Fuel & Transportation Expense'); }
                      else if (dept === 'Service NUKA') { setNewGlCode('735-001'); setNewGlName('NUKA Beach Club Bar Supplies'); }
                      else if (dept === 'Banquet') { setNewGlCode('117-003'); setNewGlName('Banquet & MICE Setup Expense'); }
                      else if (dept === 'Sales Kit') { setNewGlCode('625-001'); setNewGlName('Sales & Marketing Promotion'); }
                      else if (dept === 'IT') { setNewGlCode('624-002'); setNewGlName('IT & Internet Connectivity'); }
                      else if (dept === 'HC') { setNewGlCode('621-005'); setNewGlName('Employee Health & Welfare'); }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="Kitchen">Kitchen</option>
                    <option value="HK">Housekeeping (HK)</option>
                    <option value="Engineering">Engineering</option>
                    <option value="ATK">Administrasi Umum &amp; ATK</option>
                    <option value="Transport">Transport &amp; BBM</option>
                    <option value="Service NUKA">Service NUKA BEACH CLUB</option>
                    <option value="Banquet">Banquet &amp; MICE</option>
                    <option value="Sales Kit">Sales Kit &amp; Marketing</option>
                    <option value="IT">IT &amp; AV</option>
                    <option value="HC">Human Capital (HC / HRD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rincian Barang / Keterangan Pengeluaran *</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Contoh: Pembelian Bumbu Dapur & Daun Ketumbar Masakan Gala Dinner"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nominal Nota (IDR) *</label>
                  <input
                    type="number"
                    min="1"
                    value={newAmount || ''}
                    onChange={(e) => setNewAmount(Number(e.target.value) || 0)}
                    placeholder="Contoh: 350000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-cyan-300 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Jenis Bukti Fisik</label>
                  <select
                    value={newProofType}
                    onChange={(e) => setNewProofType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="NOTA_KONTAN">Nota Kontan Toko</option>
                    <option value="KWITANSI">Kwitansi Asli Lunas</option>
                    <option value="STRUK_KASIR">Struk Kasir / Mesin Kasir / SPBU</option>
                    <option value="BUKTI_TRANSFER">Bukti Transfer Bank / KlikBCA</option>
                    <option value="INVOICE">Faktur / Invoice Vendor</option>
                  </select>
                </div>
              </div>

              {/* Upload Bukti Nota atau Auto Generate */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="block text-slate-300 font-semibold">Unggah Foto / Scan Bukti Nota (Opsional)</label>
                <div className="flex items-center gap-3">
                  <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Berkas Foto Nota...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadReceiptImage}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {newProofImage ? '✓ Foto nota terunggah' : 'Jika tidak diunggah, sistem akan membuatkan visual struk otomatis.'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-600/30"
                >
                  Simpan Transaksi Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CETAK FORMAT PDF RESMI (REKAP KAS KECIL + LAMPIRAN BUKTI NOTA UKURAN SERAGAM) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden print:p-0 print:bg-white print:static">
          <div className="bg-white text-slate-900 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-300 print:border-none print:shadow-none print:max-h-none print:overflow-visible">
            
            {/* Top Toolbar (Screen Only - Hidden in Print) */}
            <div className="print:hidden px-4 sm:px-6 py-3.5 border-b border-slate-300 bg-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 shadow-sm">
              <div className="flex items-center gap-2 text-slate-800">
                <Printer className="w-5 h-5 text-cyan-700" />
                <div>
                  <span className="font-extrabold text-sm uppercase block">
                    Pratinjau Cetak &amp; PDF Resmi GMCC
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Rekapitulasi Kas Kecil &amp; Lampiran Bukti Nota Berukuran Seragam
                  </span>
                </div>
              </div>

              {/* Print Configuration Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Checkbox: Include Proofs */}
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-xs">
                  <input
                    type="checkbox"
                    checked={printIncludeProofs}
                    onChange={(e) => setPrintIncludeProofs(e.target.checked)}
                    className="rounded text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Sertakan Nota ({itemsToPrint.length})</span>
                </label>

                {/* Layout Density Selector (when proofs enabled) */}
                {printIncludeProofs && (
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 text-[11px] font-semibold">
                    <span className="text-[9px] text-slate-400 font-bold px-1 uppercase">Layout:</span>
                    <button
                      onClick={() => setPrintLayout('grid-2')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        printLayout === 'grid-2'
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title="2 Nota per baris - Ukuran standar besar & paling mudah dibaca"
                    >
                      2 Nota / Baris
                    </button>
                    <button
                      onClick={() => setPrintLayout('grid-3')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        printLayout === 'grid-3'
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title="3 Nota per baris - Format rapi arsip dokumen"
                    >
                      3 Nota / Baris
                    </button>
                    <button
                      onClick={() => setPrintLayout('grid-4')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        printLayout === 'grid-4'
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title="4 Nota per lembar - Grid 2x2 kompak"
                    >
                      4 per Lembar (2x2)
                    </button>
                  </div>
                )}

                {/* Filter Scope Selector */}
                {selectedDepartment !== 'ALL' && (
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 text-[11px] font-semibold">
                    <button
                      onClick={() => setPrintScope('ALL')}
                      className={`px-2 py-0.5 rounded ${
                        printScope === 'ALL'
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Semua ({activePeriod.items.length})
                    </button>
                    <button
                      onClick={() => setPrintScope('FILTERED')}
                      className={`px-2 py-0.5 rounded ${
                        printScope === 'FILTERED'
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {selectedDepartment} ({filteredItems.length})
                    </button>
                  </div>
                )}

                {/* Print Action Buttons */}
                <button
                  onClick={handlePrintDocument}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600"
                  title="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Container */}
            <div id="petty-cash-print-sheet" className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 bg-white font-sans text-xs print:p-0 print:overflow-visible">
              
              {/* LEMBAR 1: REKAPITULASI RESMI GMCC KAS KECIL */}
              <div className="space-y-6">
                {/* Official Letterhead Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={GMCC_LOGO_DARK} 
                      alt="GMCC Logo" 
                      className="gmcc-logo h-10 w-auto object-contain shrink-0" 
                      style={{ maxHeight: '36px', height: '36px', maxWidth: '140px', width: 'auto', objectFit: 'contain' }}
                    />
                    <div>
                      <h1 className="text-base font-black tracking-tight text-slate-950 uppercase">
                        GOLO MORI CONVENTION CENTER
                      </h1>
                      <div className="text-[10px] text-slate-600 font-semibold">
                        Kawasan Golo Mori, Labuan Bajo, Kabupaten Manggarai Barat, Nusa Tenggara Timur
                      </div>
                      <div className="text-[9px] text-slate-500">
                        Finance &amp; Accounting Department • ITDC Group
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm sm:text-base font-black uppercase text-cyan-950 tracking-wider">
                      {coaBannerInfo.title}
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5">
                      PERIODE: {periodBannerInfo.dateRangeText}
                    </div>
                    {activePeriod.itdcInvoiceNumber && (
                      <div className="text-[10.5px] font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-300 rounded px-2 py-0.5 inline-block mt-1">
                        NO. INVOICE ITDC: {activePeriod.itdcInvoiceNumber}
                      </div>
                    )}
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                      Dicetak pada: {new Date().toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* Printable Table */}
                <table className="w-full text-left text-[10px] border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 uppercase font-bold border-b border-slate-300">
                    <tr>
                      <th className="px-2 py-2 text-center border-r border-slate-300 w-8">NO</th>
                      <th className="px-2 py-2 text-center border-r border-slate-300 w-20">DATE</th>
                      <th className="px-2 py-2 border-r border-slate-300 w-20">NO. AKUN</th>
                      <th className="px-3 py-2 border-r border-slate-300">KETERANGAN PENGELUARAN</th>
                      <th className="px-2 py-2 text-right border-r border-slate-300 w-28">DEBIT (IDR)</th>
                      <th className="px-2 py-2 text-right border-r border-slate-300 w-28">KREDIT (IDR)</th>
                      <th className="px-2 py-2 text-center w-24">NO. NOTA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activePeriod.items.map((it, idx) => (
                      <tr key={it.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="px-2 py-1.5 text-center font-mono border-r border-slate-200">{idx + 1}</td>
                        <td className="px-2 py-1.5 text-center font-mono border-r border-slate-200">{it.date}</td>
                        <td className="px-2 py-1.5 font-mono font-bold text-slate-800 border-r border-slate-200">{it.glAccountCode}</td>
                        <td className="px-3 py-1.5 border-r border-slate-200">
                          <span className="font-semibold text-slate-900">{it.description}</span>
                          <span className="text-[9px] text-slate-500 ml-1">({it.department} - {it.vendorName})</span>
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono font-bold border-r border-slate-200">{formatRupiah(it.debit)}</td>
                        <td className="px-2 py-1.5 text-right font-mono font-bold border-r border-slate-200">{formatRupiah(it.kredit)}</td>
                        <td className="px-2 py-1.5 text-center font-mono text-[9px] text-slate-600">{it.receiptNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-200 border-t-2 border-slate-800 font-bold text-xs">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right uppercase">TOTAL:</td>
                      <td className="px-2 py-2 text-right font-mono font-black text-slate-950">{formatRupiah(totalDebit)}</td>
                      <td className="px-2 py-2 text-right font-mono font-black text-slate-950">{formatRupiah(totalKredit)}</td>
                      <td className="px-2 py-2 text-center font-semibold text-[9px] text-emerald-800">BALANCE</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Printable Signatures (Otorisasi Resmi GMCC: 2 Kolom Horizontal Kiri ke Kanan dengan TTD Asli) */}
                <table className="w-full mt-6 border-t-2 border-slate-800 border-collapse table-fixed avoid-page-break" style={{ width: '100%', borderCollapse: 'collapse', borderTop: '2px solid #0f172a' }}>
                  <tbody>
                    <tr>
                      {/* Kolom Kiri: Dipersiapkan Oleh Agus Setiabudi */}
                      <td className="w-1/2 text-center align-top p-4" style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', padding: '16px 24px', border: 'none' }}>
                        <div className="font-black text-slate-900 uppercase text-xs tracking-wider" style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a' }}>
                          Dipersiapkan Oleh:
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5" style={{ fontSize: '10px', color: '#64748b' }}>
                          Finance &amp; Accounting Department
                        </div>
                        <div className="h-14 flex items-center justify-center my-1" style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                          <img 
                            src={preparedBySignatureUrl} 
                            alt="TTD Agus Setiabudi" 
                            className="max-h-12 w-auto object-contain mx-auto"
                            style={{ maxHeight: '48px', width: 'auto', objectFit: 'contain', margin: '0 auto' }} 
                          />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 underline text-sm tracking-wide" style={{ fontSize: '12px', fontWeight: 900, textDecoration: 'underline', color: '#0f172a' }}>
                            {activePeriod.preparedBy?.name || 'Agus Setiabudi'}
                          </div>
                          <div className="text-xs font-bold text-slate-700" style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>
                            {activePeriod.preparedBy?.title || 'Chief Accounting'}
                          </div>
                          <div className="text-[9.5px] text-slate-500 font-mono mt-0.5" style={{ fontSize: '9.5px', color: '#64748b', fontFamily: 'monospace' }}>
                            Tgl: {activePeriod.preparedBy?.date || '31/10/2026'}
                          </div>
                        </div>
                      </td>

                      {/* Kolom Kanan: Disetujui Oleh Ari Soplanit */}
                      <td className="w-1/2 text-center align-top p-4" style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', padding: '16px 24px', border: 'none' }}>
                        <div className="font-black text-slate-900 uppercase text-xs tracking-wider" style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a' }}>
                          Disetujui Oleh:
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5" style={{ fontSize: '10px', color: '#64748b' }}>
                          Executive General Management
                        </div>
                        <div className="h-14 flex items-center justify-center my-1" style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                          <img 
                            src={approvedBySignatureUrl} 
                            alt="TTD Ari Soplanit" 
                            className="max-h-12 w-auto object-contain mx-auto"
                            style={{ maxHeight: '48px', width: 'auto', objectFit: 'contain', margin: '0 auto' }} 
                          />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 underline text-sm tracking-wide" style={{ fontSize: '12px', fontWeight: 900, textDecoration: 'underline', color: '#0f172a' }}>
                            {activePeriod.approvedBy?.name || 'Ari Soplanit'}
                          </div>
                          <div className="text-xs font-bold text-slate-700" style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>
                            {activePeriod.approvedBy?.title || 'General Manager'}
                          </div>
                          <div className="text-[9.5px] text-slate-500 font-mono mt-0.5" style={{ fontSize: '9.5px', color: '#64748b', fontFamily: 'monospace' }}>
                            Tgl: {activePeriod.approvedBy?.date || '01/11/2026'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* LEMBAR 2+: LAMPIRAN BUKTI FISIK NOTA & STRUK DENGAN UKURAN SERAGAM (SESUAI REQUEST USER) */}
              {printIncludeProofs && (
                <div className="break-before-page pt-8 border-t-2 border-slate-900 mt-8 space-y-5">
                  {/* Appendix Official Letterhead */}
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={GMCC_LOGO_DARK} 
                        alt="GMCC Logo" 
                        className="gmcc-logo h-8 w-auto object-contain shrink-0" 
                        style={{ maxHeight: '32px', height: '32px', maxWidth: '130px', width: 'auto', objectFit: 'contain' }}
                      />
                      <div>
                        <h2 className="text-sm font-black uppercase text-slate-950 tracking-wide">
                          LAMPIRAN BUKTI FISIK NOTA, KWITANSI &amp; STRUK PENGELUARAN
                        </h2>
                        <div className="text-[10px] text-slate-600 font-medium">
                          GOLO MORI CONVENTION CENTER • FINANCE &amp; ACCOUNTING HUBS
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-mono text-[10px] font-bold uppercase">
                        LAMPIRAN DOKUMEN PROOF
                      </span>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Periode: {activePeriodDisplayLabel}{activePeriod.itdcInvoiceNumber ? ` • Inv ITDC: ${activePeriod.itdcInvoiceNumber}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Appendix Audit Note & Summary */}
                  <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px]">
                    <div className="text-slate-700">
                      <b>Keterangan Lampiran:</b> Seluruh bukti fisik nota, struk kasir, faktur dan kwitansi di bawah ini telah diverifikasi keabsahannya dan dicocokkan dengan fisik barang oleh Tim Gudang &amp; Finance GMCC. Nomor urut (#) terindeks langsung dengan nomor baris rekapitulasi kas kecil di halaman 1.
                    </div>
                    <div className="shrink-0 font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                      Total Lampiran: <span className="text-cyan-800">{itemsToPrint.length} Nota</span> • Nilai: <span className="text-emerald-700">{formatRupiah(itemsToPrintTotal)}</span>
                    </div>
                  </div>

                  {/* UNIFORM RECEIPT PROOF GRID - 1 BARIS ISI 2 NOTA (SESUAI REQUEST USER) */}
                  <div 
                    className="receipt-grid-container grid grid-cols-2 gap-3.5 print:grid-cols-2"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: '12px',
                      width: '100%'
                    }}
                  >
                    {itemsToPrint.map((item, idx) => {
                      const proofSrc = item.proofImageUrl || generateReceiptSvg(
                        item.vendorName,
                        item.receiptNumber,
                        item.date,
                        item.amount,
                        item.description
                      );

                      return (
                        <div 
                          key={item.id}
                          className="receipt-card-item avoid-page-break border-2 border-slate-800 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col justify-between"
                          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                        >
                          {/* Card Header Strip */}
                          <div className="receipt-card-header bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 font-black text-xs font-mono">
                                #{idx + 1}
                              </span>
                              <span className="font-mono text-[10px] font-bold text-cyan-200 truncate max-w-[160px]">
                                {item.receiptNumber}
                              </span>
                            </div>
                            <span className="font-mono font-black text-amber-300 text-xs">
                              {formatRupiah(item.amount)}
                            </span>
                          </div>

                          {/* Secondary Meta Bar */}
                          <div className="receipt-card-sub px-2.5 py-1 bg-slate-100 border-b border-slate-200 text-[9px] flex items-center justify-between text-slate-700">
                            <div className="truncate max-w-[190px]">
                              <span>Tgl: <b className="font-mono">{item.date}</b></span>
                              <span className="mx-1">•</span>
                              <span className="font-semibold">{item.vendorName}</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-slate-200 text-slate-800 uppercase shrink-0">
                              {item.department} | {item.glAccountCode}
                            </span>
                          </div>

                          {/* Standardized Uniform Receipt Frame (Ukuran Seragam Pas 1 Baris 2 Nota) */}
                          <div 
                            className="receipt-card-imgbox h-40 p-2 bg-slate-50 flex items-center justify-center border-b border-slate-200 relative overflow-hidden"
                            style={{ height: '150px', maxHeight: '150px' }}
                          >
                            <img 
                              src={proofSrc} 
                              alt={`Bukti Nota #${idx + 1} - ${item.receiptNumber}`}
                              className="h-full w-full object-contain filter contrast-105"
                              style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain' }}
                              loading="lazy"
                            />
                            {/* Verified watermark badge */}
                            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[8px] font-black uppercase tracking-wider shadow">
                              ✓ VALIDATED FINANCE
                            </div>
                          </div>

                          {/* Card Footer Bar */}
                          <div className="receipt-card-footer p-2 bg-slate-50/80 text-[9px] flex items-center justify-between text-slate-600">
                            <div className="truncate max-w-[240px]">
                              <span className="font-semibold text-slate-900 block truncate">{item.description}</span>
                              <span className="block text-[8px] text-slate-500 font-mono">
                                PIC: {item.paidBy || 'Agus'} • Ref JV: {item.jvNumber || '-'}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                                LUNAS
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Appendix Verification Signoff */}
                  <div className="avoid-page-break pt-4 border-t border-slate-300 text-[10px] text-slate-500 flex items-center justify-between">
                    <div>
                      Lembar Lampiran Dokumen Bukti Fisik Kas Kecil (Petty Cash Settlement Proof Appendix) • GMCC by ITDC
                    </div>
                    <div className="font-mono">
                      Halaman Lampiran • Total {itemsToPrint.length} Bukti Terverifikasi Seragam
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* MODAL INTEGRASI TARIKAN DATA DARI PO & GOODS RECEIVING */}
      {showPullModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Integrasi Data PO &amp; Goods Receiving ke Kas Kecil (Petty Cash)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Target Periode Rekap: <b className="text-cyan-400">{activePeriod.periodName}</b> • Tarik otomatis bukti fisik nota penerimaan barang yang dibayar tunai / kas kecil.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPullModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Sub-Header & Controls */}
            {(() => {
              const unpulledEligibleList = grns.filter(g => {
                if (g.totalInvoiceAudited <= 0) return false;
                const alreadyInActive = (activePeriod?.items || []).some(it => it.grnNumber === g.grnNumber);
                const alreadyInAny = (periods || []).some(p => (p.items || []).some(it => it.grnNumber === g.grnNumber));
                if (alreadyInActive || alreadyInAny) return false;
                if (pullFilterType === 'PETTY_CASH' && g.paymentMethod === 'AP_INVOICE') return false;
                return true;
              });

              const allUnpulledCount = grns.filter(g => {
                if (g.totalInvoiceAudited <= 0) return false;
                const alreadyInActive = (activePeriod?.items || []).some(it => it.grnNumber === g.grnNumber);
                const alreadyInAny = (periods || []).some(p => (p.items || []).some(it => it.grnNumber === g.grnNumber));
                return !alreadyInActive && !alreadyInAny;
              }).length;

              return (
                <>
                  <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-semibold">Filter Data:</span>
                      <button
                        type="button"
                        onClick={() => setPullFilterType('ALL')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                          pullFilterType === 'ALL'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Semua GRN Siap Tarik ({allUnpulledCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPullFilterType('PETTY_CASH')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                          pullFilterType === 'PETTY_CASH'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        💰 Jalur Kas Kecil
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allEligible = unpulledEligibleList.map(g => g.id);
                          setSelectedGrnIdsToPull(allEligible);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold"
                      >
                        Pilih Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedGrnIdsToPull([])}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-[11px]"
                      >
                        Batal Pilih
                      </button>
                    </div>
                  </div>

                  {/* Table of GRNs to pull */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/90 text-slate-300 uppercase text-[10px] font-bold sticky top-0">
                          <tr>
                            <th className="px-3 py-2.5 text-center w-10">Pilih</th>
                            <th className="px-3 py-2.5">No. GRN &amp; PO</th>
                            <th className="px-3 py-2.5">Tgl &amp; Vendor</th>
                            <th className="px-3 py-2.5">Rincian Barang</th>
                            <th className="px-3 py-2.5 text-center">Jalur Pelunasan</th>
                            <th className="px-3 py-2.5 text-right w-28">Total Nota (Audit)</th>
                            <th className="px-3 py-2.5 w-44">Akun GL &amp; Beban</th>
                            <th className="px-3 py-2.5 w-28">Penanggung Jawab</th>
                            <th className="px-3 py-2.5 text-center w-20">Bukti Nota</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {unpulledEligibleList.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-12 text-center text-slate-400">
                                <div className="flex flex-col items-center justify-center">
                                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2 opacity-90" />
                                  <span className="text-sm font-bold text-white">Semua Data Penerimaan Barang Sudah Pernah Ditarik</span>
                                  <span className="text-xs text-slate-400 mt-1">Data yang sudah pernah ditarik otomatis dihapus dari daftar agar tidak terjadi duplikasi rekapitulasi.</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            unpulledEligibleList.map((grn) => {
                              const isSelected = selectedGrnIdsToPull.includes(grn.id);
                              const currentGl = pullGlAssignments[grn.id] || {
                                glCode: '732-001',
                                glName: 'Kitchen Operating Expense',
                                department: 'Kitchen',
                                paidBy: grn.receivedBy.split('(')[0].trim() || 'Staf Receiving'
                              };

                        return (
                          <tr key={grn.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-cyan-500/5' : ''}`}>
                            <td className="px-3 py-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedGrnIdsToPull(prev => [...prev, grn.id]);
                                  } else {
                                    setSelectedGrnIdsToPull(prev => prev.filter(id => id !== grn.id));
                                  }
                                }}
                                className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-800 border-slate-700 cursor-pointer"
                              />
                            </td>

                            <td className="px-3 py-2.5">
                              <span className="font-mono font-bold text-emerald-400 block">{grn.grnNumber}</span>
                              <span className="font-mono text-[10px] text-slate-400 block">{grn.poNumber}</span>
                            </td>

                            <td className="px-3 py-2.5">
                              <span className="font-semibold text-white block">{grn.vendorName}</span>
                              <span className="text-[10px] text-slate-400 font-mono block">{grn.receiptDate.split(' ')[0]}</span>
                            </td>

                            <td className="px-3 py-2.5 max-w-[200px]">
                              <span className="text-[11px] text-slate-200 block truncate" title={grn.items.map(i => `${i.qtyReceived} ${i.unit} ${i.itemName}`).join(', ')}>
                                {grn.items.map(i => `${i.qtyReceived} ${i.unit} ${i.itemName}`).join(', ')}
                              </span>
                            </td>

                            <td className="px-3 py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                                grn.paymentMethod !== 'AP_INVOICE'
                                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                                  : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                              }`}>
                                {grn.paymentMethod !== 'AP_INVOICE' ? '💰 Kas Kecil' : '📑 AP Tempo'}
                              </span>
                            </td>

                            <td className="px-3 py-2.5 text-right font-mono font-bold text-cyan-300">
                              {formatRupiah(grn.totalInvoiceAudited)}
                            </td>

                            {/* Dropdown Pemilihan Akun GL */}
                            <td className="px-3 py-2.5">
                              <select
                                value={currentGl.glCode}
                                onChange={(e) => {
                                  const code = e.target.value;
                                  let name = 'Kitchen Operating Expense';
                                  let dept = 'Kitchen';
                                  if (code === '732-002') { name = 'Beverage & Bar Operating Expense'; dept = 'Bar'; }
                                  else if (code === '702-003') { name = 'Housekeeping & Laundry Supplies'; dept = 'HK'; }
                                  else if (code === '210-003') { name = 'Repairs & Maintenance Engineering'; dept = 'Engineering'; }
                                  else if (code === '622-022') { name = 'General & Administration / ATK'; dept = 'ATK'; }
                                  else if (code === '117-003') { name = 'Food & Beverage Inventory'; dept = 'F&B'; }

                                  setPullGlAssignments(prev => ({
                                    ...prev,
                                    [grn.id]: { glCode: code, glName: name, department: dept, paidBy: currentGl.paidBy }
                                  }));
                                }}
                                className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] text-white focus:outline-none focus:border-cyan-500"
                              >
                                <option value="732-001">732-001 Kitchen Expense</option>
                                <option value="732-002">732-002 Beverage & Bar</option>
                                <option value="702-003">702-003 Housekeeping / Laundry</option>
                                <option value="210-003">210-003 Engineering M&amp;R</option>
                                <option value="622-022">622-022 General &amp; ATK</option>
                                <option value="117-003">117-003 F&amp;B Inventory</option>
                              </select>
                            </td>

                            {/* Staf Penanggung Jawab */}
                            <td className="px-3 py-2.5">
                              <input
                                type="text"
                                value={currentGl.paidBy}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPullGlAssignments(prev => ({
                                    ...prev,
                                    [grn.id]: { ...currentGl, paidBy: val }
                                  }));
                                }}
                                className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] text-white focus:outline-none focus:border-cyan-500 font-medium"
                              />
                            </td>

                            {/* Thumbnail Bukti Nota Fisik */}
                            <td className="px-3 py-2.5 text-center">
                              {grn.receiptProofImage ? (
                                <div className="h-9 w-12 mx-auto rounded overflow-hidden border border-slate-700 bg-slate-950">
                                  <img 
                                    src={grn.receiptProofImage} 
                                    alt="Nota" 
                                    className="h-full w-full object-cover" 
                                  />
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500">Auto SVG</span>
                              )}
                            </td>
                          </tr>
                        );
                      }))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          );
        })()}

            {/* Modal Bottom Sticky Bar */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-t border-slate-800 shrink-0">
              <div className="text-xs text-slate-300">
                <span>Terpilih: <b className="text-cyan-400 font-bold">{selectedGrnIdsToPull.length} Bukti Nota</b></span>
                <span className="mx-2">•</span>
                <span>Total Estimasi Tarikan: <b className="text-white font-mono font-bold">{formatRupiah(
                  grns
                    .filter(g => selectedGrnIdsToPull.includes(g.id))
                    .reduce((sum, g) => sum + g.totalInvoiceAudited, 0)
                )}</b></span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPullModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecutePullSelected}
                  disabled={selectedGrnIdsToPull.length === 0}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all ${
                    selectedGrnIdsToPull.length > 0
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-cyan-600/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Impor {selectedGrnIdsToPull.length} Nota ke Rekap Kas Kecil</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GENERATOR OTOMATIS: KAS KECIL SESUAI COA & PAGU MAKSIMAL 50 JUTA */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-slate-900 border border-cyan-500/30 text-slate-100 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-base">
                      Bangun Data Kas Kecil Otomatis Berdasarkan COA
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Pagu Maks. Rp 50 Jt
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Data ditarik dari Penerimaan Barang (GRN) lengkap dengan bukti kwitansi fisik. Aturan integritas tanggal: transaksi pada tanggal yang sama tidak akan dipotong separuh.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGeneratorModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Parameters Bar */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 shrink-0 space-y-4">
              {/* Row 1: Pilihan Siklus Periode Cepat & Bulan/Tahun */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                {/* Preset Button: 1-15, 16-31, Custom */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Pilihan Siklus Periode</span>
                    <span className="text-cyan-400 font-normal">Preset Cepat</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateGenDates('1-15', genMonth, genYear)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                        genPeriodPreset === '1-15'
                          ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      Tgl 1 - 15
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateGenDates('16-31', genMonth, genYear)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                        genPeriodPreset === '16-31'
                          ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      Tgl 16 - 31
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenPeriodPreset('CUSTOM')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                        genPeriodPreset === 'CUSTOM'
                          ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      Range Bebas
                    </button>
                  </div>
                </div>

                {/* Pilihan Bulan & Tahun */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Pilihan Bulan &amp; Tahun
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={genMonth}
                      onChange={(e) => handleUpdateGenDates(genPeriodPreset, Number(e.target.value), genYear)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={idx} value={idx + 1}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={genYear}
                      onChange={(e) => handleUpdateGenDates(genPeriodPreset, genMonth, Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
                    >
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                      <option value={2027}>2027</option>
                    </select>
                  </div>
                </div>

                {/* Indikator Range Tanggal Aktif */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Rentang Tanggal Efektif
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={genStartDate}
                      disabled={genPeriodPreset !== 'CUSTOM'}
                      onChange={(e) => setGenStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] text-white focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-80"
                    />
                    <input
                      type="date"
                      value={genEndDate}
                      disabled={genPeriodPreset !== 'CUSTOM'}
                      onChange={(e) => setGenEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] text-white focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-80"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Filter COA & Cost Center */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Filter COA */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                    <span>Kategori COA (Chart of Accounts) *</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Sinkron Master COA
                    </span>
                  </label>
                  <select
                    value={genCoa}
                    onChange={(e) => setGenCoa(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                  >
                    <option value="ALL">Semua COA</option>
                    {coas.map(c => (
                      <option key={c.id} value={c.name}>{c.code} - {c.name} ({c.glAccountCode})</option>
                    ))}
                  </select>
                </div>

                {/* Filter Cost Center */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Cost Center Pembebanan
                  </label>
                  <select
                    value={genCostCenter}
                    onChange={(e) => setGenCostCenter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    <option value="ALL">Semua Cost Center</option>
                    {costCenters.map(cc => (
                      <option key={cc.id} value={cc.name}>{cc.code} - {cc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: No. Invoice ITDC (Sambungan Track Record Lintas Aplikasi) */}
              <div className="p-3 rounded-2xl bg-emerald-50/95 border border-emerald-400/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-900">
                    No. Invoice ITDC (Wajib):
                  </label>
                  <button
                    type="button"
                    onClick={() => setGenItdcInvoiceNumber(formatItdcInvoiceNumber(genYear, genMonth, (billingFiles?.length || 0) + 1))}
                    className="px-2.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors"
                  >
                    Isi Format Otomatis
                  </button>
                </div>
                <input
                  type="text"
                  value={genItdcInvoiceNumber}
                  onChange={(e) => setGenItdcInvoiceNumber(e.target.value.toUpperCase())}
                  placeholder="INV/GMCC-ITDC/2026/X-XXX"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-emerald-400 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="text-[10px] text-emerald-800">
                  Digunakan sebagai nomor referensi penghubung track record kas kecil &amp; settlement dengan sistem/aplikasi ITDC lainnya.
                </div>
              </div>

              {/* Pagu Status Bar & Limit Meter */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Total Terkumpul: <b className="text-white font-mono">{formatRupiah(generatorResult.acceptedTotal)}</b>
                    </span>
                    <span className="text-slate-300 font-mono font-bold">
                      {generatorResult.quotaPercentage}% dari Plafon {formatRupiah(genMaxLimit)}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                    <div
                      className={`h-full transition-all duration-300 ${
                        generatorResult.quotaPercentage > 95
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-cyan-500 to-teal-400'
                      }`}
                      style={{ width: `${generatorResult.quotaPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Sisa Kuota File: <b className="text-cyan-400 font-mono">{formatRupiah(generatorResult.remainingQuota)}</b></span>
                    <span>Transaksi Terpilih: <b className="text-white font-bold">{generatorResult.acceptedCount} Nota</b> dari {generatorResult.totalFound} temuan</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <span className="text-xs text-slate-400">Batas Maksimal File:</span>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-mono font-bold text-xs text-cyan-300">
                    Rp 50.000.000
                  </div>
                </div>
              </div>

              {/* Notification Banner for Locked Dates (Anti-Double Billing) */}
              {generatorResult.lockedDateBlocks.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs space-y-1.5 shadow-md">
                  <div className="flex items-center gap-2 font-bold text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Proteksi Anti-Double Billing: Tanggal Sudah Dibakukan di File Tagihan Lain</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-rose-200/90 font-mono">
                    {generatorResult.lockedDateBlocks.map((b, idx) => (
                      <li key={idx}>
                        <span className="font-bold text-white">Tgl {b.displayDate} ({b.count} transaksi = {formatRupiah(b.totalAmount)}):</span> {b.reason}
                      </li>
                    ))}
                  </ul>
                  <div className="text-[10px] text-rose-300/80 italic pt-0.5">
                    * Catatan: Tanggal-tanggal di atas dilewati secara otomatis untuk menjamin tidak ada nota atau pengeluaran yang ditagihkan ganda.
                  </div>
                </div>
              )}

              {/* Notification Banner for Skipped Dates (All-or-Nothing Rule) */}
              {generatorResult.skippedDateBlocks.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Integritas Tanggal Aktif: Ada Tanggal yang Tidak Diambil Utuh</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-amber-200/90 font-mono">
                    {generatorResult.skippedDateBlocks.map((b, idx) => (
                      <li key={idx}>
                        <span className="font-bold text-amber-300">Tgl {b.displayDate} ({b.count} transaksi = {formatRupiah(b.totalAmount)}):</span> {b.reason}
                      </li>
                    ))}
                  </ul>
                  <div className="text-[10px] text-amber-300/80 italic pt-0.5">
                    * Catatan: Data tanggal yang di-skip tidak hilang dari database; data tersebut dapat ditarik pada file kas kecil periode berikutnya.
                  </div>
                </div>
              )}
            </div>

            {/* Table Content */}
            <div className="p-5 overflow-y-auto flex-1">
              {generatorResult.acceptedCandidates.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Receipt className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <div className="font-bold text-sm text-slate-300">Tidak ada transaksi GRN yang cocok dengan filter</div>
                  <div className="text-xs text-slate-500 max-w-md mx-auto">
                    Coba sesuaikan rentang tanggal, ubah filter COA atau pastikan ada bukti penerimaan barang (GRN) pada periode tersebut.
                  </div>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="px-3 py-3 text-center w-10">No</th>
                        <th className="px-3 py-3 w-24">Tanggal</th>
                        <th className="px-3 py-3 w-28">COA Akun</th>
                        <th className="px-3 py-3 w-28">Cost Center</th>
                        <th className="px-4 py-3">Vendor &amp; Deskripsi Pengadaan</th>
                        <th className="px-3 py-3 text-center w-24">Bukti Kwitansi</th>
                        <th className="px-3 py-3 text-right w-32">Nominal (IDR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-300">
                      {generatorResult.acceptedCandidates.map((cand, idx) => (
                        <tr key={cand.grnId + idx} className="hover:bg-slate-900/50 transition-colors">
                          <td className="px-3 py-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="px-3 py-2.5 font-mono text-cyan-300 font-semibold">{cand.displayDate}</td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold text-[10px]">
                              {cand.coaName}
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{cand.glAccountCode}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[10px]">
                              {cand.costCenterName}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="font-semibold text-white">{cand.description}</div>
                            <div className="text-[10px] text-slate-400">
                              Vendor: <span className="text-slate-200">{cand.vendorName}</span> • PO: <span className="font-mono text-cyan-400">{cand.poNumber}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {cand.proofImageUrl ? (
                              <button
                                type="button"
                                onClick={() => setSelectedProofModal({
                                  id: cand.grnId,
                                  receiptNumber: cand.receiptNumber,
                                  date: cand.displayDate,
                                  vendorName: cand.vendorName,
                                  department: cand.department,
                                  glAccountCode: cand.glAccountCode,
                                  glAccountName: cand.glAccountName,
                                  description: cand.description,
                                  amount: cand.amount,
                                  debit: cand.amount,
                                  kredit: cand.amount,
                                  proofType: cand.proofType,
                                  jvNumber: `JV/GRN/${cand.grnNumber}`,
                                  sourceType: 'PO_RECEIVING',
                                  poNumber: cand.poNumber,
                                  grnNumber: cand.grnNumber,
                                  proofImageUrl: cand.proofImageUrl,
                                  status: 'VERIFIED'
                                })}
                                className="group relative inline-block"
                                title="Klik untuk pratinjau bukti nota asli"
                              >
                                <div className="h-9 w-12 rounded overflow-hidden border border-slate-700 group-hover:border-cyan-400 transition-colors bg-slate-900 shadow">
                                  <img 
                                    src={cand.proofImageUrl} 
                                    alt="Nota" 
                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform" 
                                  />
                                </div>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500">Auto GRN</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-400">
                            {formatRupiah(cand.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-900 border-t-2 border-slate-700 font-bold text-xs text-white">
                      <tr>
                        <td colSpan={6} className="px-4 py-3 text-right uppercase tracking-wider text-slate-300">
                          Total Kas Kecil Terpilih ({generatorResult.acceptedCount} Nota):
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-black text-cyan-400 text-sm">
                          {formatRupiah(generatorResult.acceptedTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-950/95 border-t border-slate-800 shrink-0 gap-3">
              <div className="text-xs text-slate-400">
                <span>Total: <b className="text-white font-mono font-bold">{formatRupiah(generatorResult.acceptedTotal)}</b></span>
                <span className="mx-2">•</span>
                <span>Plafon Tersisa: <b className="text-cyan-400 font-mono font-bold">{formatRupiah(generatorResult.remainingQuota)}</b></span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowGeneratorModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyGeneratorToActivePeriod}
                  disabled={generatorResult.acceptedCandidates.length === 0}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    generatorResult.acceptedCandidates.length > 0
                      ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Terapkan ke Periode Aktif</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewPeriodFromGenerator}
                  disabled={generatorResult.acceptedCandidates.length === 0}
                  className={`px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-lg flex items-center gap-2 transition-all ${
                    generatorResult.acceptedCandidates.length > 0
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-cyan-600/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat File Kas Kecil Baru (Maks 50 Jt)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI & STANDARISASI FILE PENAGIHAN BAKU */}
      {showConfirmBillingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-slate-900 border border-teal-500/40 text-slate-100 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    Konfirmasi Berkas Penagihan Baku
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Standarisasi &amp; Kunci Permanen Arsip Penagihan Kas Kecil
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmBillingModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Target Periode:</span>
                  <span className="font-bold text-white text-xs">{activePeriodDisplayLabel}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Estimasi Nomor Berkas:</span>
                  <span className="font-mono font-bold text-teal-300">
                    TAGIHAN/GMCC-PC/{genYear || new Date().getFullYear()}/{String(genMonth || new Date().getMonth() + 1).padStart(2, '0')}/{String((billingFiles?.length || 0) + 1).padStart(3, '0')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Jumlah Bukti Nota Fisik:</span>
                  <span className="font-bold text-cyan-300">{activePeriod.items.length} Nota Kwitansi</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Total Nominal Tagihan:</span>
                  <span className="font-mono font-black text-amber-300 text-base">{formatRupiah(totalDebit)}</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Memenuhi Regulasi Pagu &le; Rp 50.000.000 &amp; Keutuhan Tanggal</span>
                </div>
              </div>

              {/* Input No. Invoice ITDC (Wajib) */}
              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-900">
                    No. Invoice ITDC (Wajib):
                  </label>
                  <button
                    type="button"
                    onClick={() => setConfirmItdcInvoiceNumber(formatItdcInvoiceNumber(genYear || new Date().getFullYear(), genMonth || new Date().getMonth() + 1, (billingFiles?.length || 0) + 1))}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors"
                  >
                    Generate Otomatis
                  </button>
                </div>
                <input
                  type="text"
                  value={confirmItdcInvoiceNumber}
                  onChange={(e) => setConfirmItdcInvoiceNumber(e.target.value.toUpperCase())}
                  placeholder="INV/GMCC-ITDC/2026/X-XXX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-emerald-400 text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <div className="text-[11px] text-emerald-800 font-medium">
                  Nomor ini disimpan pada periode Settlement, Berkas Tagihan Kas Kecil, PDF, dan Google Sheets agar terhubung dengan track record di aplikasi lain.
                </div>
              </div>

              {/* Warning explanation */}
              <div className="p-3.5 rounded-2xl bg-teal-950/30 border border-teal-500/30 text-teal-200 text-xs space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Perlindungan Anti-Double Claiming GMCC</span>
                </div>
                <p className="text-[11px] text-teal-200/90 leading-relaxed">
                  Setelah dikonfirmasi, berkas ini akan <b>DIBAKUKAN</b> dan disalin ke modul <b>Berkas Tagihan Kas Kecil</b>. Seluruh transaksi dan tanggal pada berkas ini akan dikunci permanen agar tidak dapat ditarik kembali pada periode penagihan berikutnya.
                </p>
              </div>

              <div className="text-[11px] text-slate-400 italic">
                * Pengesahan resmi dilakukan oleh Chief Accounting (Agus Setiabudi) &amp; General Manager (Ari Soplanit).
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-950/90 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowConfirmBillingModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmBilling}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-teal-950 flex items-center gap-2 transition-all transform hover:scale-[1.02]"
              >
                <Lock className="w-4 h-4" />
                <span>Konfirmasi &amp; Bakukan Berkas</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
