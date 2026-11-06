import React, { useState } from 'react';
import { 
  PurchaseRequisition, 
  PRItemLine, 
  Vendor, 
  MasterItem, 
  Department, 
  CostCenter,
  ChartOfAccount,
  UserAccount 
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
  CheckCircle2
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

  // Form States: Separate Department, Cost Center, and Linked COA
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.name || 'Food & Beverage Department');
  const [selectedCostCenterName, setSelectedCostCenterName] = useState(costCenters[0]?.name || 'F&B Culinary Central Kitchen');
  const [selectedCoaName, setSelectedCoaName] = useState(defaultCoa);
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
  const [itemLines, setItemLines] = useState<PRItemLine[]>([
    {
      id: `line-${Date.now()}-1`,
      itemId: items[0]?.id || 'item-1',
      itemName: items[0]?.name || 'Daging Sapi Tenderloin Meltique Premium',
      specification: items[0]?.specification || 'Grade MB4+, kemasan vakum pack 2kg',
      unit: items[0]?.unit || 'KG',
      quantityRequested: 10,
      estimatedPrice: items[0]?.lastPurchasePrice || 285000,
      totalEstimated: 10 * (items[0]?.lastPurchasePrice || 285000),
      costCenterName: costCenters[0]?.name || 'F&B Culinary Central Kitchen',
      coaName: defaultCoa,
      coaCode: defaultCoaObj?.code || 'COA-BPP',
      coaId: defaultCoaObj?.id,
      notes: ''
    }
  ]);

  const selectedCostCenterObj = costCenters.find(c => c.name === selectedCostCenterName) || costCenters[0];
  const selectedVendorObj = vendors.find(v => v.id === suggestedVendorId);

  const handleAddItemLine = () => {
    const defaultItem = items[0];
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      setError('Mohon tuliskan tujuan / peruntukan pengajuan barang ini.');
      return;
    }
    if (itemLines.length === 0) {
      setError('Mohon tambahkan minimal 1 barang pesanan.');
      return;
    }

    const coaMatch = coas.find(c => c.name === selectedCoaName);

    const newPR: PurchaseRequisition = {
      id: `pr-${Date.now()}`,
      prNumber: autoPrNumber,
      requestDate: new Date().toISOString().split('T')[0],
      requiredDate,
      requesterId: currentUser.id,
      requesterName: `${currentUser.name} (${currentUser.role})`,
      department: selectedDeptId,
      costCenterCode: selectedCostCenterObj?.code || 'CC-FB-01',
      costCenterName: selectedCostCenterName,
      coaName: selectedCoaName,
      coaCode: coaMatch?.code,
      costControlReview: costCenterReview || `Alokasi anggaran Cost Center ${selectedCostCenterName} & COA ${selectedCoaName} terhubung.`,
      suggestedVendorId: selectedVendorObj?.id,
      suggestedVendorName: selectedVendorObj?.name,
      purpose,
      items: itemLines,
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

          {/* Row 1: Departemen Pemohon, Cost Center & COA Kas Kecil */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Departemen Pemohon *
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 text-xs"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name} (HOD: {dept.headOfDepartment})
                  </option>
                ))}
              </select>
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
                <span>COA Kas Kecil *</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Link Master COA
                </span>
              </label>
              <select
                value={selectedCoaName}
                onChange={(e) => {
                  const coaVal = e.target.value;
                  const cObj = coas.find(c => c.name === coaVal);
                  setSelectedCoaName(coaVal);
                  setItemLines(prev => prev.map(l => ({
                    ...l,
                    coaName: coaVal,
                    coaCode: cObj?.code,
                    coaId: cObj?.id
                  })));
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
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="font-bold text-white uppercase tracking-wider text-xs">
              2. Daftar Barang & Spesifikasi Detail
            </span>
            <button
              type="button"
              onClick={handleAddItemLine}
              className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris Barang</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700">
                <tr>
                  <th className="px-3 py-2.5 w-52">Pilih Item Master</th>
                  <th className="px-3 py-2.5">Spesifikasi Detail (Merk/Ukuran/Grade)</th>
                  <th className="px-3 py-2.5 w-16 text-center">Satuan</th>
                  <th className="px-3 py-2.5 w-20 text-center">Qty</th>
                  <th className="px-3 py-2.5 w-28 text-right">Harga Est.</th>
                  <th className="px-3 py-2.5 w-32 text-right">Total Est.</th>
                  <th className="px-3 py-2.5 w-44">Cost Center (Nama)</th>
                  <th className="px-3 py-2.5 w-44">COA Kas Kecil</th>
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
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name}
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

                    {/* Kolom COA Kas Kecil (Link dengan Master COA) */}
                    <td className="px-3 py-2">
                      <select
                        value={line.coaName || selectedCoaName}
                        onChange={(e) => handleUpdateItemLine(line.id, 'coaName', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-emerald-500/50 text-emerald-300 font-medium text-[11px] focus:outline-none focus:border-emerald-400 truncate"
                        title="Tautkan dengan COA kas kecil untuk kemudahan penarikan petty cash settlement"
                      >
                        {coas.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name} ({c.code})
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

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-slate-800">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 max-w-xl">
              <span className="font-bold text-amber-300 block mb-0.5">ℹ️ Catatan Ketentuan Perpajakan GMCC:</span>
              <span>Formulir PR pemohon diajukan murni berdasarkan estimasi harga barang tanpa kalkulasi PPN. Penentuan status pajak (apakah rekanan dikenakan <b>PPN 11% (PKP)</b> atau <b>Bebas Pajak (Non-PKP 0%)</b>) akan ditetapkan seutuhnya oleh <b>Divisi Purchasing</b> pada saat verifikasi & penerbitan Purchase Order (PO).</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-4 shrink-0">
              <span className="text-slate-400 font-bold uppercase text-[11px]">Total Estimasi Anggaran:</span>
              <span className="text-xl font-black text-cyan-400 font-mono">
                {formatRupiah(subtotalEstimated)}
              </span>
            </div>
          </div>
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
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Pengajuan PR ke Purchasing</span>
          </button>
        </div>
      </form>
    </div>
  );
};
