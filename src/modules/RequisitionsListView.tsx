import React, { useState } from 'react';
import { PurchaseRequisition, UserAccount, PRItemLine, Vendor, MasterItem, CostCenter } from '../types/procurement';
import { 
  FileText, 
  Search, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ShieldCheck,
  Building2,
  Edit,
  Trash2,
  RotateCcw,
  PlusCircle,
  AlertTriangle,
  X
} from 'lucide-react';

interface RequisitionsListViewProps {
  prs: PurchaseRequisition[];
  currentUser: UserAccount;
  vendors?: Vendor[];
  items?: MasterItem[];
  costCenters?: CostCenter[];
  onNavigateToCreate: () => void;
  onNavigateToApproval: () => void;
  onEditPR?: (updatedPr: PurchaseRequisition) => void;
  onDeletePR?: (prId: string) => void;
}

export const RequisitionsListView: React.FC<RequisitionsListViewProps> = ({
  prs,
  currentUser,
  vendors = [],
  items = [],
  costCenters = [],
  onNavigateToCreate,
  onNavigateToApproval,
  onEditPR,
  onDeletePR
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedPrForDetail, setSelectedPrForDetail] = useState<PurchaseRequisition | null>(null);

  // State for PR Editing (Purchasing review adjustment or Dept Head revising rejected PR)
  const [prToEdit, setPrToEdit] = useState<PurchaseRequisition | null>(null);
  const [editPurpose, setEditPurpose] = useState('');
  const [editUrgency, setEditUrgency] = useState<'NORMAL' | 'URGENT' | 'CRITICAL' | 'EVENT_CRITICAL'>('NORMAL');
  const [editRequiredDate, setEditRequiredDate] = useState('');
  const [editSuggestedVendorId, setEditSuggestedVendorId] = useState('');
  const [editCostCenterCode, setEditCostCenterCode] = useState('');
  const [editCostCenterName, setEditCostCenterName] = useState('');
  const [editItems, setEditItems] = useState<PRItemLine[]>([]);

  const formatRupiah = (val?: number) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const isPurchasingOrAdmin = currentUser.role === 'PURCHASING' || currentUser.role === 'ADMIN';
  const isPrivileged = isPurchasingOrAdmin || currentUser.role === 'GM' || currentUser.role === 'DEPT_HEAD';

  const visiblePrs = isPrivileged
    ? prs
    : prs.filter(p => p.department.toLowerCase().includes(currentUser.department.toLowerCase()) || currentUser.department.toLowerCase().includes(p.department.toLowerCase()));

  const filteredPrs = visiblePrs.filter((p) => {
    const matchesSearch = 
      p.prNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Open Edit Modal
  const openEditModal = (pr: PurchaseRequisition) => {
    setPrToEdit(pr);
    setEditPurpose(pr.purpose);
    setEditUrgency(pr.urgency);
    setEditRequiredDate(pr.requiredDate);
    setEditSuggestedVendorId(pr.suggestedVendorId || '');
    setEditCostCenterCode(pr.costCenterCode || '');
    setEditCostCenterName(pr.costCenterName || '');
    setEditItems(pr.items.map(it => ({ ...it })));
  };

  const handleEditItemChange = (idx: number, field: keyof PRItemLine, value: any) => {
    const updated = [...editItems];
    const item = { ...updated[idx], [field]: value };
    
    if (field === 'quantityRequested' || field === 'estimatedPrice') {
      const qty = field === 'quantityRequested' ? Number(value) || 0 : item.quantityRequested;
      const price = field === 'estimatedPrice' ? Number(value) || 0 : item.estimatedPrice;
      item.totalEstimated = qty * price;
    }
    
    updated[idx] = item;
    setEditItems(updated);
  };

  const handleAddNewItemLine = () => {
    const defaultMaster = items[0];
    const newLine: PRItemLine = {
      id: `pr-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId: defaultMaster ? defaultMaster.id : 'item-custom',
      itemName: defaultMaster ? defaultMaster.name : 'Barang Baru',
      specification: '',
      unit: defaultMaster ? defaultMaster.unit : 'PCS',
      quantityRequested: 1,
      estimatedPrice: defaultMaster ? (defaultMaster.lastPurchasePrice || defaultMaster.lastPrice || 0) : 0,
      totalEstimated: defaultMaster ? (defaultMaster.lastPurchasePrice || defaultMaster.lastPrice || 0) : 0,
      costCenterName: editCostCenterName || 'F&B Culinary Central Kitchen'
    };
    setEditItems([...editItems, newLine]);
  };

  const handleRemoveItemLine = (idx: number) => {
    if (editItems.length <= 1) {
      alert('PR minimal harus memiliki 1 baris barang.');
      return;
    }
    setEditItems(editItems.filter((_, i) => i !== idx));
  };

  const handleSaveEditedPR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prToEdit || !onEditPR) return;

    const subtotal = editItems.reduce((acc, it) => acc + (it.totalEstimated || 0), 0);
    const selectedVendor = vendors.find(v => v.id === editSuggestedVendorId);

    // If PR was previously REJECTED, re-submitting resets status to WAITING_PURCHASING
    const isRevisingRejected = prToEdit.status === 'REJECTED';
    const nextStatus = isRevisingRejected ? 'WAITING_PURCHASING' : prToEdit.status;

    const updatedPR: PurchaseRequisition = {
      ...prToEdit,
      purpose: editPurpose,
      urgency: editUrgency,
      requiredDate: editRequiredDate,
      suggestedVendorId: editSuggestedVendorId || prToEdit.suggestedVendorId,
      suggestedVendorName: selectedVendor?.name || prToEdit.suggestedVendorName,
      costCenterCode: editCostCenterCode || prToEdit.costCenterCode,
      costCenterName: editCostCenterName || prToEdit.costCenterName,
      items: editItems,
      subtotalEstimated: subtotal,
      status: nextStatus,
      rejectionReason: isRevisingRejected ? undefined : prToEdit.rejectionReason,
      approvalHistory: isRevisingRejected 
        ? [
            ...prToEdit.approvalHistory,
            {
              stage: 'REQUISITION_REVISED',
              approverName: currentUser.name,
              approvedAt: new Date().toLocaleString('id-ID', { hour12: false }) + ' WITA',
              notes: `PR direvisi dan diajukan ulang oleh ${currentUser.name}`
            }
          ]
        : prToEdit.approvalHistory
    };

    onEditPR(updatedPR);
    setPrToEdit(null);
    alert(isRevisingRejected
      ? `PR ${updatedPR.prNumber} berhasil disesuaikan dan dikirim ulang untuk approval Purchasing & GM!`
      : `Perubahan data PR ${updatedPR.prNumber} berhasil disimpan oleh Purchasing!`
    );
  };

  const handleDeleteRejectedPR = (pr: PurchaseRequisition) => {
    if (!onDeletePR) return;
    if (confirm(`Apakah Anda yakin ingin menghapus PR ${pr.prNumber} secara permanen? Data yang dihapus tidak dapat dipulihkan.`)) {
      onDeletePR(pr.id);
      alert(`PR ${pr.prNumber} telah berhasil dihapus dari sistem.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Daftar Purchase Requisitions (PR)</span>
          </h1>
          <p className="text-xs text-slate-400">
            {isPrivileged 
              ? 'Seluruh pengajuan barang GOLO MORI CONVENTION CENTER (Purchasing, Dept Head, GM & Finance)'
              : `Menampilkan berkas PR khusus Departemen ${currentUser.department}`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToApproval}
            className="px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span>Approval Center</span>
          </button>
          <button
            onClick={onNavigateToCreate}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 flex items-center gap-1.5 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Buat PR Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor PR, keperluan, pemohon, atau departemen..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">Semua Status</option>
          <option value="WAITING_PURCHASING">Menunggu Purchasing</option>
          <option value="WAITING_HOD">Menunggu HOD / Finance</option>
          <option value="WAITING_GM">Menunggu General Manager</option>
          <option value="PO_CREATED">PO Telah Diterbitkan</option>
          <option value="REJECTED">Ditolak (Perlu Revisi / Hapus)</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700">
              <tr>
                <th className="px-5 py-3.5">Nomor PR</th>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Keperluan & Alasan</th>
                <th className="px-4 py-3.5">Pemohon & Dept</th>
                <th className="px-4 py-3.5">Estimasi Total</th>
                <th className="px-4 py-3.5">Urgensi</th>
                <th className="px-4 py-3.5">Status Approval</th>
                <th className="px-5 py-3.5 text-right">Aksi & Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredPrs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Tidak ditemukan dokumen PR pada departemen ini sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredPrs.map((pr) => {
                  const isRejected = pr.status === 'REJECTED';
                  const canDeptHeadModify = isRejected && (currentUser.role === 'DEPT_HEAD' || currentUser.role === 'ADMIN' || currentUser.name === pr.requesterName);

                  return (
                    <tr key={pr.id} className={`transition-colors ${isRejected ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'hover:bg-slate-800/40'}`}>
                      <td className="px-5 py-3.5 font-mono font-bold text-cyan-400 whitespace-nowrap">
                        {pr.prNumber}
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 font-mono whitespace-nowrap">
                        {pr.requestDate}
                      </td>

                      <td className="px-4 py-3.5 max-w-xs text-slate-200">
                        <div className="truncate font-medium">{pr.purpose}</div>
                        {isRejected && pr.rejectionReason && (
                          <div className="text-[10px] text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                            <span className="truncate">Alasan Tolak: {pr.rejectionReason}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{pr.requesterName}</div>
                        <div className="text-[10px] text-slate-400">{pr.department}</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-white whitespace-nowrap">
                        {formatRupiah(pr.subtotalEstimated)}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pr.urgency === 'CRITICAL' || pr.urgency === 'EVENT_CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300'
                            : pr.urgency === 'URGENT'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {pr.urgency}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          pr.status === 'PO_CREATED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isRejected
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {pr.status === 'PO_CREATED' ? <CheckCircle2 className="w-3 h-3" /> : isRejected ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {pr.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setSelectedPrForDetail(pr)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white transition-colors"
                            title="Lihat Detail Item PR"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Purchasing Edit adjustment */}
                          {isPurchasingOrAdmin && pr.status !== 'PO_CREATED' && (
                            <button
                              onClick={() => openEditModal(pr)}
                              className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              title="Purchasing dapat menyesuaikan spesifikasi, qty, harga, atau vendor"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Sesuaikan</span>
                            </button>
                          )}

                          {/* Dept Head workflow when PR is rejected: Edit & Re-submit OR Delete */}
                          {canDeptHeadModify && (
                            <>
                              <button
                                onClick={() => openEditModal(pr)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="Edit & Ajukan Kembali ke Purchasing"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Revisi & Ajukan</span>
                              </button>
                              <button
                                onClick={() => handleDeleteRejectedPR(pr)}
                                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                                title="Hapus PR yang ditolak"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PR Detail Modal */}
      {selectedPrForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden p-6 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">
                  Rincian PR: <span className="text-cyan-400 font-mono">{selectedPrForDetail.prNumber}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Diajukan oleh {selectedPrForDetail.requesterName} ({selectedPrForDetail.department}) pada {selectedPrForDetail.requestDate}
                </p>
              </div>
              <button
                onClick={() => setSelectedPrForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1.5">
              <div><span className="text-slate-400 font-semibold">Tujuan Pengadaan: </span><span className="text-white font-medium">{selectedPrForDetail.purpose}</span></div>
              <div><span className="text-slate-400 font-semibold">Cost Center: </span><span className="font-mono text-cyan-300">{selectedPrForDetail.costCenterName || selectedPrForDetail.costCenterCode}</span></div>
              {selectedPrForDetail.suggestedVendorName && (
                <div><span className="text-slate-400 font-semibold">Usulan Vendor: </span><span className="text-emerald-300">{selectedPrForDetail.suggestedVendorName}</span></div>
              )}
              {selectedPrForDetail.rejectionReason && (
                <div className="text-rose-300 bg-rose-950/40 p-2 rounded border border-rose-800 mt-1">
                  <b>Alasan Penolakan:</b> {selectedPrForDetail.rejectionReason}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-3 py-2">Nama Barang & Spesifikasi</th>
                    <th className="px-3 py-2 text-center">Satuan</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Harga Satuan</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {selectedPrForDetail.items.map((it) => (
                    <tr key={it.id}>
                      <td className="px-3 py-2 font-medium text-white">
                        <div>{it.itemName}</div>
                        {it.specification && <div className="text-[10px] text-slate-400">Spesifikasi: {it.specification}</div>}
                      </td>
                      <td className="px-3 py-2 text-center text-slate-400">{it.unit}</td>
                      <td className="px-3 py-2 text-center font-bold text-white font-mono">{it.quantityRequested}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-400">{formatRupiah(it.estimatedPrice)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-cyan-400">{formatRupiah(it.totalEstimated)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-800/80 font-bold border-t border-slate-700 text-white">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right uppercase text-[10px] text-slate-400">Total Estimasi Anggaran:</td>
                    <td className="px-3 py-2 text-right text-cyan-300 font-mono text-sm">{formatRupiah(selectedPrForDetail.subtotalEstimated)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPrForDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive PR Edit Modal (Purchasing Review Adjustment or Dept Head Revising Rejected PR) */}
      {prToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden p-6 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Edit className="w-4 h-4 text-cyan-400" />
                  <span>
                    {prToEdit.status === 'REJECTED' ? 'Revisi & Ajukan Kembali PR: ' : 'Sesuaikan & Review PR oleh Purchasing: '}
                    <span className="text-cyan-400 font-mono">{prToEdit.prNumber}</span>
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {prToEdit.status === 'REJECTED'
                    ? 'Perbaiki spesifikasi, jumlah, atau harga barang sebelum diajukan kembali ke alur persetujuan.'
                    : 'Purchasing dapat menyesuaikan spesifikasi barang, harga estimasi, kuantitas, dan vendor rekanan.'}
                </p>
              </div>
              <button
                onClick={() => setPrToEdit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedPR} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Keperluan & Alasan Pengadaan</label>
                  <input
                    type="text"
                    value={editPurpose}
                    onChange={(e) => setEditPurpose(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tingkat Urgensi</label>
                  <select
                    value={editUrgency}
                    onChange={(e) => setEditUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="URGENT">URGENT</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="EVENT_CRITICAL">EVENT CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dibutuhkan Sebelum</label>
                  <input
                    type="date"
                    value={editRequiredDate}
                    onChange={(e) => setEditRequiredDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Usulan Rekanan / Vendor</label>
                  <select
                    value={editSuggestedVendorId}
                    onChange={(e) => setEditSuggestedVendorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Pilih Rekanan Vendor...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cost Center Pembebanan</label>
                  <select
                    value={editCostCenterName}
                    onChange={(e) => {
                      const cc = costCenters.find(c => c.name === e.target.value);
                      setEditCostCenterName(e.target.value);
                      if (cc) setEditCostCenterCode(cc.code);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    {costCenters.map(c => (
                      <option key={c.id} value={c.name}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Table in Edit Modal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white uppercase text-[11px]">Daftar Item Barang (Dapat Disesuaikan):</span>
                  <button
                    type="button"
                    onClick={handleAddNewItemLine}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-semibold flex items-center gap-1 text-[11px]"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Tambah Baris Barang</span>
                  </button>
                </div>

                <div className="border border-slate-700 rounded-xl overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] font-bold sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Nama Barang</th>
                        <th className="px-3 py-2">Spesifikasi Detail (Merk/Grade)</th>
                        <th className="px-3 py-2 w-16 text-center">Satuan</th>
                        <th className="px-3 py-2 w-20 text-center">Qty</th>
                        <th className="px-3 py-2 w-28 text-right">Harga Satuan (IDR)</th>
                        <th className="px-3 py-2 w-28 text-right">Total Est.</th>
                        <th className="px-2 py-2 w-10 text-center">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 bg-slate-900/60">
                      {editItems.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="px-2.5 py-2">
                            <input
                              type="text"
                              value={it.itemName}
                              onChange={(e) => handleEditItemChange(idx, 'itemName', e.target.value)}
                              className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs font-semibold"
                              required
                            />
                          </td>
                          <td className="px-2.5 py-2">
                            <input
                              type="text"
                              value={it.specification || ''}
                              onChange={(e) => handleEditItemChange(idx, 'specification', e.target.value)}
                              placeholder="Merk / Grade / Ukuran..."
                              className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-[11px]"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={it.unit}
                              onChange={(e) => handleEditItemChange(idx, 'unit', e.target.value)}
                              className="w-full px-1.5 py-1 rounded bg-slate-800 border border-slate-700 text-white text-center text-xs font-mono"
                              required
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="1"
                              value={it.quantityRequested}
                              onChange={(e) => handleEditItemChange(idx, 'quantityRequested', e.target.value)}
                              className="w-full px-1.5 py-1 rounded bg-slate-800 border border-slate-700 text-white text-center text-xs font-bold font-mono"
                              required
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={it.estimatedPrice}
                              onChange={(e) => handleEditItemChange(idx, 'estimatedPrice', e.target.value)}
                              className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-300 text-right text-xs font-mono font-bold"
                              required
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-white whitespace-nowrap">
                            {formatRupiah(it.totalEstimated)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemLine(idx)}
                              className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-800/90 font-bold border-t border-slate-700 text-white">
                      <tr>
                        <td colSpan={5} className="px-3 py-2 text-right uppercase text-[10px] text-slate-400">Total Baru Setelah Penyesuaian:</td>
                        <td className="px-3 py-2 text-right text-cyan-300 font-mono text-sm whitespace-nowrap">
                          {formatRupiah(editItems.reduce((acc, it) => acc + (it.totalEstimated || 0), 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPrToEdit(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {prToEdit.status === 'REJECTED' ? 'Simpan Revisi & Ajukan Kembali PR' : 'Simpan Penyesuaian Purchasing'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
