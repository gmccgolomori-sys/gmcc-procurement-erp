import React, { useState, useMemo } from 'react';
import { 
  PurchaseRequisition, 
  PRItemLine, 
  Vendor, 
  MasterItem, 
  Department, 
  CostCenter,
  ChartOfAccount,
  UserAccount,
  isStrictBppCoa,
  isEventCoa,
  OutletDestination,
  filterItemsByCoa,
  getItemCoaCategory,
  MAX_PR_LIMIT
} from '../types/procurement';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Send, 
  Building2, 
  AlertCircle, 
  ShieldCheck,
  Tag,
  DollarSign,
  PieChart,
  CheckCircle2,
  UserCheck,
  Utensils,
  Sparkles,
  Ban,
  CalendarDays
} from 'lucide-react';

interface RequisitionCreateViewProps {
  currentUser: UserAccount;
  vendors: Vendor[];
  items: MasterItem[];
  departments: Department[];
  costCenters: CostCenter[];
  coas: ChartOfAccount[];
  onSavePR: (pr: PurchaseRequisition) => void;
  onNavigateToList: () => void;
}

export const RequisitionCreateView: React.FC<RequisitionCreateViewProps> = ({
  currentUser,
  vendors,
  items,
  departments,
  costCenters,
  coas,
  onSavePR,
  onNavigateToList
}) => {
  const formatRupiah = (val?: number) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const autoPrNumber = `PR/GMCC/2026/10/${Math.floor(100 + Math.random() * 900)}`;

  // Default COA from master data
  const defaultCoa = coas[0]?.name || 'BPP';
  const defaultCoaObj = coas[0];

  // Match current user's department
  const matchedDept = departments.find(d => 
    d.name.toLowerCase().includes(currentUser.department.toLowerCase()) || 
    currentUser.department.toLowerCase().includes(d.name.toLowerCase())
  );
  const initialDept = matchedDept ? matchedDept.name : (currentUser.department || departments[0]?.name || 'Food & Beverage Department');

  // Form States: Separate Department, Cost Center, and Linked COA
  const [selectedDeptId, setSelectedDeptId] = useState(initialDept);
  const [selectedCostCenterName, setSelectedCostCenterName] = useState(costCenters[0]?.name || 'F&B Culinary Central Kitchen');
  const [selectedCoaName, setSelectedCoaName] = useState(defaultCoa);
  const selectedCoaObj = coas.find(c => c.name === selectedCoaName);
  const isBppCoa = isStrictBppCoa(selectedCoaName, selectedCoaObj?.code);
  const isEventCoaSelected = isEventCoa(selectedCoaName, selectedCoaObj?.code);

  // USER REQUEST: Untuk BPP ada pilihan NUKA/MICE; untuk Event ada NUKA, MICE, dan TIDAK KEDUANYA (karena event bisa BPP bisa tidak)
  const initialOutlet: OutletDestination = isBppCoa ? 'NUKA' : (isEventCoaSelected ? 'NONE' : 'NONE');
  const [outletDestination, setOutletDestination] = useState<OutletDestination>(initialOutlet);

  const [requiredDate, setRequiredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [suggestedVendorId, setSuggestedVendorId] = useState(vendors[0]?.id || '');
  const [urgency, setUrgency] = useState<'NORMAL' | 'URGENT' | 'CRITICAL'>('NORMAL');
  const [purpose, setPurpose] = useState('');
  const [costCenterReview, setCostCenterReview] = useState('');
  const [error, setError] = useState('');

  // Item lines state with Cost Center & COA column & detail specification
  const [itemLines, setItemLines] = useState<PRItemLine[]>(() => {
    const initialFiltered = filterItemsByCoa(items, defaultCoa, initialOutlet);
    const firstItem = initialFiltered[0] || items[0];
    return [
      {
        id: `line-${Date.now()}-1`,
        itemId: firstItem?.id || 'item-1',
        itemName: firstItem?.name || 'Daging Sapi Tenderloin Meltique Premium',
        specification: firstItem?.specification || 'Grade MB4+, kemasan vakum pack 2kg',
        unit: firstItem?.unit || 'KG',
        quantityRequested: 10,
        estimatedPrice: firstItem?.lastPurchasePrice || 285000,
        totalEstimated: 10 * (firstItem?.lastPurchasePrice || 285000),
        costCenterName: costCenters[0]?.name || 'F&B Culinary Central Kitchen',
        coaName: defaultCoa,
        coaCode: defaultCoaObj?.code || 'COA-BPP',
        coaId: defaultCoaObj?.id,
        outletDestination: isStrictBppCoa(defaultCoa, defaultCoaObj?.code) ? 'NUKA' : undefined,
        notes: ''
      }
    ];
  });

  const selectedCostCenterObj = costCenters.find(c => c.name === selectedCostCenterName) || costCenters[0];
  const selectedVendorObj = vendors.find(v => v.id === suggestedVendorId);

  // USER REQUIREMENT: Filter item katalog berdasarkan COA yang dipilih
  // - COA BPP: Hanya item BPP
  // - Event BPP: Hanya item BPP
  // - Non BPP Event: Hanya item Non-BPP
  // - Meal Employee: Ambil kedua data BPP dan Non-BPP
  // - COA Non-BPP/lainnya: Hanya item Non-BPP
  const availableCatalogItems = useMemo(() => {
    return filterItemsByCoa(items, selectedCoaName, outletDestination);
  }, [items, selectedCoaName, outletDestination]);

  const syncLinesWithCoaFilter = (nextCoaName: string, nextOutlet: OutletDestination, cObj?: ChartOfAccount) => {
    const isBpp = isStrictBppCoa(nextCoaName, cObj?.code);
    const isEvt = isEventCoa(nextCoaName, cObj?.code);
    const nextFiltered = filterItemsByCoa(items, nextCoaName, nextOutlet);
    const fallbackItem = nextFiltered[0] || items[0];

    setItemLines(prev => prev.map(l => {
      const stillValid = nextFiltered.some(it => it.id === l.itemId);
      const baseLine: PRItemLine = {
        ...l,
        coaName: nextCoaName,
        coaCode: cObj?.code,
        coaId: cObj?.id,
        outletDestination: (isBpp || isEvt) ? nextOutlet : undefined
      };
      if (!stillValid && fallbackItem) {
        return {
          ...baseLine,
          itemId: fallbackItem.id,
          itemName: fallbackItem.name,
          specification: fallbackItem.specification || '',
          unit: fallbackItem.unit,
          estimatedPrice: fallbackItem.lastPurchasePrice,
          totalEstimated: l.quantityRequested * fallbackItem.lastPurchasePrice
        };
      }
      return baseLine;
    }));
  };

  const handleAddItemLine = () => {
    const defaultItem = availableCatalogItems[0] || items[0];
    const coaObj = coas.find(c => c.name === selectedCoaName) || defaultCoaObj;
    const newLine: PRItemLine = {
      id: `line-${Date.now()}-${itemLines.length + 1}`,
      itemId: defaultItem?.id || '',
      itemName: defaultItem?.name || '',
      specification: defaultItem?.specification || '',
      unit: defaultItem?.unit || 'PCS',
      quantityRequested: 1,
      estimatedPrice: defaultItem?.lastPurchasePrice || 50000,
      totalEstimated: defaultItem?.lastPurchasePrice || 50000,
      costCenterName: selectedCostCenterName,
      coaName: selectedCoaName,
      coaCode: coaObj?.code,
      coaId: coaObj?.id,
      outletDestination: (isBppCoa || isEventCoaSelected) ? outletDestination : undefined,
      notes: ''
    };
    setItemLines([...itemLines, newLine]);
  };

  const handleUpdateItemLine = (id: string, field: keyof PRItemLine, value: any) => {
    setItemLines(prev => prev.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value };
        if (field === 'itemId') {
          const itemMaster = items.find(i => i.id === value);
          if (itemMaster) {
            updated.itemName = itemMaster.name;
            updated.unit = itemMaster.unit;
            updated.specification = itemMaster.specification || '';
            updated.estimatedPrice = itemMaster.lastPurchasePrice;
            updated.totalEstimated = updated.quantityRequested * itemMaster.lastPurchasePrice;
          }
        }
        if (field === 'coaName') {
          const coaMatch = coas.find(c => c.name === value);
          if (coaMatch) {
            updated.coaCode = coaMatch.code;
            updated.coaId = coaMatch.id;
          }
        }
        if (field === 'quantityRequested' || field === 'estimatedPrice') {
          const qty = field === 'quantityRequested' ? Number(value) : line.quantityRequested;
          const price = field === 'estimatedPrice' ? Number(value) : line.estimatedPrice;
          updated.totalEstimated = (qty || 0) * (price || 0);
        }
        return updated;
      }
      return line;
    }));
  };

  const handleDeleteItemLine = (id: string) => {
    if (itemLines.length === 1) {
      alert('Minimal harus ada 1 barang dalam pengajuan PR.');
      return;
    }
    setItemLines(itemLines.filter(l => l.id !== id));
  };

  const subtotalEstimated = itemLines.reduce((acc, curr) => acc + (Number(curr.totalEstimated) || 0), 0);
  const isOverPrLimit = subtotalEstimated > MAX_PR_LIMIT;
  const overPrAmount = Math.max(0, subtotalEstimated - MAX_PR_LIMIT);
  const remainingPrQuota = Math.max(0, MAX_PR_LIMIT - subtotalEstimated);
  const prUsagePercent = Math.min(100, Math.round((subtotalEstimated / MAX_PR_LIMIT) * 100));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!purpose.trim()) {
      setError('Mohon tuliskan tujuan / peruntukan pengajuan barang ini.');
      return;
    }
    if (itemLines.length === 0) {
      setError('Mohon tambahkan minimal 1 barang pesanan.');
      return;
    }
    if (subtotalEstimated > MAX_PR_LIMIT) {
      setError(`Total pengajuan PR (${formatRupiah(subtotalEstimated)}) melebihi batas maksimal ${formatRupiah(MAX_PR_LIMIT)} (kelebihan ${formatRupiah(subtotalEstimated - MAX_PR_LIMIT)}). Silakan kurangi jumlah/item atau pecah ke PR terpisah agar pagu Petty Cash Rp 50.000.000 tetap aman.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const coaMatch = coas.find(c => c.name === selectedCoaName);

    const newPR: PurchaseRequisition = {
      id: `pr-${Date.now()}`,
      prNumber: autoPrNumber,
      requestDate: new Date().toISOString().split('T')[0],
      requiredDate,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      department: selectedDeptId || currentUser.department,
      costCenterCode: selectedCostCenterObj?.code || 'CC-FB-01',
      costCenterName: selectedCostCenterName,
      coaName: selectedCoaName,
      coaCode: coaMatch?.code,
      outletDestination: (isBppCoa || isEventCoaSelected) ? outletDestination : undefined,
      costControlReview: costCenterReview || `Alokasi anggaran Cost Center ${selectedCostCenterName} & COA ${selectedCoaName}${isBppCoa || isEventCoaSelected ? ` (Outlet: ${outletDestination})` : ''} terhubung.`,
      suggestedVendorId: selectedVendorObj?.id,
      suggestedVendorName: selectedVendorObj?.name,
      purpose,
      items: itemLines.map(l => ({ ...l, outletDestination: (isBppCoa || isEventCoaSelected) ? outletDestination : undefined })),
      subtotalEstimated,
      urgency,
      status: 'WAITING_PURCHASING',
      approvalHistory: []
    };

    onSavePR(newPR);
    alert(`Pengajuan Purchase Requisition ${autoPrNumber} dengan COA "${selectedCoaName}" berhasil dibuat dan diteruskan ke Purchasing!`);
    onNavigateToList();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Formulir Pembuatan Purchase Requisition (PR)
          </h1>
          <p className="text-xs text-slate-400">
            Pengajuan kebutuhan barang resmi GMCC terhubung langsung dengan alokasi Cost Center departemen.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToList}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold self-start sm:self-auto border border-slate-700 transition-colors"
        >
          Lihat Daftar PR
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Info Departemen & Cost Center (Dibuat Terpisah) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              1. Departemen & Pembebanan Cost Center
            </span>
            <div className="font-mono text-cyan-400 font-bold bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
              {autoPrNumber}
            </div>
          </div>

          {/* Row 1: Pemohon (Ditetapkan dengan User yang Login), Departemen, Cost Center & COA */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Pemohon (Requester) *</span>
                <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  User Login
                </span>
              </label>
              <div className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white flex items-center justify-between">
                <div className="truncate">
                  <div className="font-bold text-white text-xs truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{currentUser.role} • {currentUser.department}</div>
                </div>
                <UserCheck className="w-4 h-4 text-cyan-400 shrink-0 ml-1.5" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Departemen Pemohon *</span>
                <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  Dept User
                </span>
              </label>
              <div className="w-full px-3 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-semibold text-xs flex items-center justify-between">
                <span className="truncate">{currentUser.department}</span>
                <Building2 className="w-4 h-4 text-cyan-400 shrink-0 ml-1.5" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Cost Center Pembebanan * <span className="text-[11px] text-cyan-400 font-normal ml-1">(Kode &amp; Nama)</span>
              </label>
              <select
                value={selectedCostCenterName}
                onChange={(e) => {
                  const ccVal = e.target.value;
                  setSelectedCostCenterName(ccVal);
                  setItemLines(prev => prev.map(l => ({ ...l, costCenterName: ccVal })));
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-cyan-700/80 text-cyan-200 font-medium focus:outline-none focus:border-cyan-400 text-xs"
              >
                {costCenters.map((cc) => (
                  <option key={cc.id} value={cc.name}>
                    {cc.name} ({cc.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Kategori Akun COA Pengadaan *</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Link Master COA
                </span>
              </label>
              <select
                value={selectedCoaName}
                onChange={(e) => {
                  const coaVal = e.target.value;
                  const cObj = coas.find(c => c.name === coaVal);
                  const isBpp = isStrictBppCoa(coaVal, cObj?.code);
                  const isEvt = isEventCoa(coaVal, cObj?.code);
                  setSelectedCoaName(coaVal);
                  const nextOutlet: OutletDestination = isBpp ? 'NUKA' : (isEvt ? 'NONE' : 'NONE');
                  setOutletDestination(nextOutlet);
                  syncLinesWithCoaFilter(coaVal, nextOutlet, cObj);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-emerald-500/50 text-emerald-300 font-semibold focus:outline-none focus:border-emerald-400 text-xs"
              >
                {coas.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.code} - {c.name} ({c.glAccountCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* USER REQUEST:
              1. Khusus COA BPP: Ada 2 pilihan (NUKA atau MICE) -> Masuk ke Daily Food Flash
              2. Khusus COA EVENT: Ada 3 pilihan (NUKA, MICE, dan TIDAK KEDUANYA) -> Karena event bisa BPP bisa Non-BPP
              3. Di luar itu (Non-BPP): Dinonaktifkan & Tidak Masuk ke Daily Food Flash
          */}
          {isBppCoa ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-amber-950/40 border border-amber-500/40 space-y-2.5 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-amber-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-bold text-amber-300 text-xs uppercase tracking-wide">
                    Alokasi Outlet Pembelian (Khusus COA BPP - Biaya Pokok Penjualan F&amp;B) *
                  </span>
                </div>
                <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30 self-start sm:self-auto">
                  ⚡ Otomatis Masuk ke Daily Food Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Pengadaan untuk COA <b>BPP (Bahan Makanan &amp; Minuman)</b> wajib dialokasikan ke unit operasional terkait. Data penerimaan barang (GRN) ini akan otomatis ditarik dan dihitung pada laporan harian <b>Daily Food Flash</b>:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOutletDestination('NUKA');
                    setItemLines(prev => prev.map(l => ({ ...l, outletDestination: 'NUKA' })));
                  }}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    outletDestination === 'NUKA'
                      ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-500/40 shadow-lg text-white'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🏖️</span>
                    <div className="text-left">
                      <div className="font-bold text-xs text-white">NUKA BEACH CLUB</div>
                      <div className="text-[10px] text-slate-400">Restoran, Beach Club &amp; Bar GMCC</div>
                    </div>
                  </div>
                  {outletDestination === 'NUKA' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
                      Terpilih ✓
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOutletDestination('MICE');
                    setItemLines(prev => prev.map(l => ({ ...l, outletDestination: 'MICE' })));
                  }}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    outletDestination === 'MICE'
                      ? 'bg-indigo-500/20 border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg text-white'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🏛️</span>
                    <div className="text-left">
                      <div className="font-bold text-xs text-white">MICE BANQUET</div>
                      <div className="text-[10px] text-slate-400">Convention Center &amp; Event Banquet</div>
                    </div>
                  </div>
                  {outletDestination === 'MICE' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white">
                      Terpilih ✓
                    </span>
                  )}
                </button>
              </div>
            </div>
          ) : isEventCoaSelected ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-500/40 space-y-2.5 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-purple-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-bold text-purple-300 text-xs uppercase tracking-wide">
                    Alokasi COA Event (Bisa BPP atau Non-BPP) *
                  </span>
                </div>
                <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full font-bold border border-purple-500/30 self-start sm:self-auto">
                  🎉 Fleksibel: F&amp;B / Non-F&amp;B
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Pengadaan untuk <b>COA Event</b> dapat berupa konsumsi makanan/minuman (BPP) atau kebutuhan non-makanan (dekorasi, sound system, panggung). Tentukan peruntukan belanja ini:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOutletDestination('NUKA');
                    syncLinesWithCoaFilter(selectedCoaName, 'NUKA', selectedCoaObj);
                  }}
                  className={`p-3 rounded-xl border flex flex-col justify-between gap-2 text-left transition-all ${
                    outletDestination === 'NUKA'
                      ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-500/40 shadow-lg text-white'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg">🏖️</span>
                    {outletDestination === 'NUKA' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-slate-950">
                        Masuk Food Flash ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">NUKA BEACH CLUB</div>
                    <div className="text-[10px] text-amber-300/80">Event BPP F&amp;B (Tampilkan Item BPP)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOutletDestination('MICE');
                    syncLinesWithCoaFilter(selectedCoaName, 'MICE', selectedCoaObj);
                  }}
                  className={`p-3 rounded-xl border flex flex-col justify-between gap-2 text-left transition-all ${
                    outletDestination === 'MICE'
                      ? 'bg-indigo-500/20 border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg text-white'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg">🏛️</span>
                    {outletDestination === 'MICE' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500 text-white">
                        Masuk Food Flash ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">MICE BANQUET</div>
                    <div className="text-[10px] text-indigo-300/80">Event BPP F&amp;B (Tampilkan Item BPP)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOutletDestination('NONE');
                    syncLinesWithCoaFilter(selectedCoaName, 'NONE', selectedCoaObj);
                  }}
                  className={`p-3 rounded-xl border flex flex-col justify-between gap-2 text-left transition-all ${
                    outletDestination === 'NONE'
                      ? 'bg-rose-500/20 border-rose-400 ring-2 ring-rose-500/40 shadow-lg text-white'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg">🚫</span>
                    {outletDestination === 'NONE' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500 text-white">
                        Non-Food Flash ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">TIDAK KEDUANYA</div>
                    <div className="text-[10px] text-rose-300/80">Non-BPP (Dekorasi/Panggung/Audio)</div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-400 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                <span>
                  Kategori COA: <b className="text-slate-200">{selectedCoaName}</b> • Opsi alokasi outlet NUKA/MICE <b>dinonaktifkan</b> (pengadaan non-BPP tidak masuk ke Daily Food Flash).
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
                Non-BPP (Bukan Food Cost)
              </span>
            </div>
          )}

          {/* Row 2: Tingkat Urgensi, Tanggal Dibutuhkan & Rekomendasi Vendor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Tingkat Urgensi (Priority) *
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 text-xs"
              >
                <option value="NORMAL">NORMAL (Pengadaan Rutin)</option>
                <option value="URGENT">URGENT (Stok Kritis)</option>
                <option value="CRITICAL">CRITICAL (Event Konvensi &amp; Banquet)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Tanggal Dibutuhkan (Required Date) *
              </label>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 truncate" title="Rekomendasi Rekanan Vendor (Opsional)">
                Rekomendasi Rekanan Vendor (Opsional)
              </label>
              <select
                value={suggestedVendorId}
                onChange={(e) => setSuggestedVendorId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 text-xs"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.city}) - {v.category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Tujuan / Alasan Pengadaan */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Tujuan / Alasan Pengadaan *
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Contoh: Kebutuhan Gala Dinner Konvensi Delegasi di Grand Ballroom GOLO MORI CONVENTION CENTER..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 text-xs"
              required
            />
          </div>
        </div>

        {/* Step 2: Daftar Item Barang dengan Kolom Spesifikasi Detail & Cost Center */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-bold text-white uppercase tracking-wider text-xs">
                2. Daftar Barang &amp; Spesifikasi Detail
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-cyan-400" />
                <span>COA: <b>{selectedCoaName}</b> ({availableCatalogItems.length} item katalog sesuai)</span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddItemLine}
              className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 font-semibold flex items-center gap-1 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris Barang</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700">
                <tr>
                  <th className="px-3 py-2.5 w-56">Pilih Item Master (Sesuai COA)</th>
                  <th className="px-3 py-2.5">Spesifikasi Detail (Merk/Ukuran/Grade)</th>
                  <th className="px-3 py-2.5 w-16 text-center">Satuan</th>
                  <th className="px-3 py-2.5 w-20 text-center">Qty</th>
                  <th className="px-3 py-2.5 w-28 text-right">Harga Est.</th>
                  <th className="px-3 py-2.5 w-32 text-right">Total Est.</th>
                  <th className="px-3 py-2.5 w-44">Cost Center (Nama)</th>
                  <th className="px-2 py-2.5 w-10 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {itemLines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-3 py-2">
                      <select
                        value={line.itemId}
                        onChange={(e) => handleUpdateItemLine(line.id, 'itemId', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500 text-xs"
                      >
                        {!availableCatalogItems.some((it) => it.id === line.itemId) && line.itemId && (
                          <option value={line.itemId}>
                            {line.itemName} (Item Terpilih)
                          </option>
                        )}
                        {availableCatalogItems.map((it) => (
                          <option key={it.id} value={it.id}>
                            [{getItemCoaCategory(it)}] {it.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Kolom Spesifikasi Detail */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={line.specification || ''}
                        onChange={(e) => handleUpdateItemLine(line.id, 'specification', e.target.value)}
                        placeholder="Contoh: Grade MB4+, Kemasan vakum 2kg..."
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </td>

                    <td className="px-2 py-2 text-center w-20">
                      <input
                        type="text"
                        list="pr-unit-presets"
                        value={line.unit}
                        onChange={(e) => handleUpdateItemLine(line.id, 'unit', e.target.value.toUpperCase())}
                        className="w-full text-center px-1 py-1 rounded bg-slate-800 border border-slate-700 text-white font-mono uppercase text-xs focus:outline-none focus:border-cyan-500"
                        title="Pilih atau ketik satuan barang sendiri"
                      />
                    </td>

                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="1"
                        value={line.quantityRequested}
                        onChange={(e) => handleUpdateItemLine(line.id, 'quantityRequested', e.target.value)}
                        className="w-full text-center px-1.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </td>

                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="1000"
                        value={line.estimatedPrice}
                        onChange={(e) => handleUpdateItemLine(line.id, 'estimatedPrice', e.target.value)}
                        className="w-full text-right px-1.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </td>

                    <td className="px-3 py-2 text-right font-mono font-bold text-cyan-300">
                      {formatRupiah(line.totalEstimated)}
                    </td>

                    {/* Kolom Cost Center (Dropdown menampilkan NAMA Cost Center bukan kode) */}
                    <td className="px-3 py-2">
                      <select
                        value={line.costCenterName || selectedCostCenterName}
                        onChange={(e) => handleUpdateItemLine(line.id, 'costCenterName', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-cyan-800/80 text-cyan-200 font-medium text-[11px] focus:outline-none focus:border-cyan-500 truncate"
                      >
                        {costCenters.map((cc) => (
                          <option key={cc.id} value={cc.name}>
                            {cc.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteItemLine(line.id)}
                        className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 pt-3 border-t border-slate-800">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 max-w-xl">
              <span className="font-bold text-amber-300 block mb-0.5">ℹ️ Catatan Ketentuan Perpajakan &amp; Plafon PR GMCC:</span>
              <span>Formulir PR pemohon diajukan murni berdasarkan estimasi harga barang tanpa kalkulasi PPN (penentuan PKP 11% / Non-PKP oleh Purchasing). Maksimal nilai 1 dokumen PR adalah <b className="text-emerald-300">{formatRupiah(MAX_PR_LIMIT)}</b> agar batas Petty Cash Rp 50.000.000 tetap aman.</span>
            </div>

            <div className={`p-3.5 rounded-xl border flex flex-col gap-2 shrink-0 min-w-[290px] transition-colors ${
              isOverPrLimit
                ? 'bg-rose-950/40 border-rose-500/60'
                : 'bg-slate-800/80 border-slate-700'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <span className={`font-bold uppercase text-[11px] ${isOverPrLimit ? 'text-rose-300' : 'text-slate-400'}`}>
                  Total Estimasi Anggaran:
                </span>
                <span className={`text-xl font-black font-mono ${isOverPrLimit ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {formatRupiah(subtotalEstimated)}
                </span>
              </div>

              <div className="space-y-1">
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isOverPrLimit ? 'bg-rose-500' : prUsagePercent >= 85 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${prUsagePercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Batas Maks PR: {formatRupiah(MAX_PR_LIMIT)}</span>
                  {isOverPrLimit ? (
                    <span className="text-rose-400 font-bold">Lebih {formatRupiah(overPrAmount)}!</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">Sisa Kuota: {formatRupiah(remainingPrQuota)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isOverPrLimit && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-rose-300">
                  Pengajuan Melebihi Batas Maksimal PR ({formatRupiah(MAX_PR_LIMIT)})
                </div>
                <p className="text-[11px] text-rose-200/90 leading-relaxed">
                  Total biaya PR saat ini sebesar <b>{formatRupiah(subtotalEstimated)}</b> (melebihi <b>{formatRupiah(overPrAmount)}</b>). Pembuatan PR biaya tidak boleh melebihi <b>Rp 40.000.000</b> agar realisasi Petty Cash tidak melewati pagu Rp 50.000.000. Harap kurangi Qty/item atau pecah menjadi beberapa PR terpisah.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onNavigateToList}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isOverPrLimit}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              isOverPrLimit
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-70 border border-rose-500/40'
                : 'bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white shadow-lg shadow-cyan-600/30 hover:scale-105'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{isOverPrLimit ? 'Melebihi Batas Maks. Rp 40 Juta' : 'Kirim Pengajuan PR ke Purchasing'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
