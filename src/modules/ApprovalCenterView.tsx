import React, { useState } from 'react';
import { 
  PurchaseRequisition, 
  PurchaseOrder, 
  UserAccount, 
  POItemLine,
  isStrictBppCoa,
  isEventCoa,
  OutletDestination
} from '../types/procurement';
import { OFFICIAL_GMCC_ADDRESS, SAMPLE_SIGNATURES } from '../data/procurementMock';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  UserCheck, 
  Package,
  FileCheck,
  Building2,
  DollarSign,
  RefreshCw
} from 'lucide-react';

interface ApprovalCenterViewProps {
  prs: PurchaseRequisition[];
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onUpdatePRStatus: (updatedPr: PurchaseRequisition) => void;
  onCreatePOFromApprovedPR: (newPO: PurchaseOrder) => void;
}

export const ApprovalCenterView: React.FC<ApprovalCenterViewProps> = ({
  prs,
  currentUser,
  allUsers,
  onUpdatePRStatus,
  onCreatePOFromApprovedPR
}) => {
  const [selectedPrForAction, setSelectedPrForAction] = useState<PurchaseRequisition | null>(null);
  const [actionType, setActionType] = useState<'PURCHASING' | 'FINANCE' | 'HOD' | 'GM' | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isConfirmingApproval, setIsConfirmingApproval] = useState(false);
  const [activeApprovalTab, setActiveApprovalTab] = useState<'PENDING' | 'REJECTED' | 'APPROVED'>('PENDING');

  const formatRupiah = (val?: number) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const pendingPrs = prs.filter(p => p.status === 'WAITING_PURCHASING' || p.status === 'WAITING_FINANCE' || p.status === 'WAITING_HOD' || p.status === 'WAITING_GM');
  const rejectedPrs = prs.filter(p => p.status === 'REJECTED');
  const approvedPrs = prs.filter(p => p.status === 'APPROVED' || p.status === 'PO_CREATED');

  const openApprovalModal = (pr: PurchaseRequisition, stage: 'PURCHASING' | 'FINANCE' | 'HOD' | 'GM') => {
    setSelectedPrForAction(pr);
    setActionType(stage);
    setApprovalNotes('');
    setIsConfirmingApproval(true);
  };

  // Direct approval execution - NO password prompt needed, identity is verified via system login!
  const executeApprovalDirectly = () => {
    if (!selectedPrForAction || !actionType) return;

    const pr = selectedPrForAction;
    const nowStr = new Date().toLocaleString('id-ID', { hour12: false });

    let nextStatus = pr.status;
    if (actionType === 'PURCHASING') {
      nextStatus = 'WAITING_FINANCE';
    } else if (actionType === 'FINANCE' || actionType === 'HOD') {
      nextStatus = 'WAITING_GM';
    } else if (actionType === 'GM') {
      nextStatus = 'PO_CREATED';
    }

    const updatedPr: PurchaseRequisition = {
      ...pr,
      status: nextStatus,
      approvalHistory: [
        ...pr.approvalHistory,
        {
          stage: actionType,
          approverName: currentUser.name,
          approverRole: currentUser.role,
          approvedAt: `${nowStr} WITA`,
          notes: approvalNotes || `Disetujui oleh ${currentUser.name} (${currentUser.role})`,
          signatureUrl: currentUser.signatureUrl || (
            actionType === 'PURCHASING' ? SAMPLE_SIGNATURES.PURCHASING :
            actionType === 'FINANCE' ? SAMPLE_SIGNATURES.FINANCE :
            actionType === 'GM' ? SAMPLE_SIGNATURES.GM : SAMPLE_SIGNATURES.CHEF
          )
        }
      ]
    };

    onUpdatePRStatus(updatedPr);

    // If GM approves, auto-create the official PO with Purchasing's tax determination
    if (actionType === 'GM') {
      const isPrBpp = isStrictBppCoa(pr.coaName, pr.coaCode);
      const isPrEvent = isEventCoa(pr.coaName, pr.coaCode);

      const poItems: POItemLine[] = pr.items.map((it, idx) => {
        const itemCoa = it.coaName || pr.coaName;
        const itemCoaCode = it.coaCode || pr.coaCode;
        const isItemBpp = isStrictBppCoa(itemCoa, itemCoaCode);
        const isItemEvent = isEventCoa(itemCoa, itemCoaCode);
        const initialOutlet: OutletDestination | undefined = isItemBpp
          ? (it.outletDestination === 'MICE' ? 'MICE' : 'NUKA')
          : (isItemEvent ? (it.outletDestination || 'NONE') : undefined);

        return {
          id: `poi-${Date.now()}-${idx}`,
          itemId: it.itemId,
          itemName: it.itemName,
          specification: it.specification,
          unit: it.unit,
          quantityOrdered: it.quantityRequested,
          unitPrice: it.estimatedPrice,
          totalPrice: it.totalEstimated,
          quantityReceived: 0,
          outletDestination: initialOutlet,
          coaName: itemCoa,
          coaCode: itemCoaCode,
          costCenterName: it.costCenterName || pr.costCenterName
        };
      });

      const subtotal = pr.subtotalEstimated;
      const isTaxable = false;
      const taxRate = 0;
      const taxPpn = 0;
      const grandTotal = subtotal;
      const poNumber = `PO/GMCC/2026/10/${Math.floor(100 + Math.random() * 900)}`;

      // Fetch requester signature if available
      const requesterAccount = allUsers.find(u => u.id === pr.requesterId || u.name === pr.requesterName);
      const purchasingAccount = allUsers.find(u => u.role === 'PURCHASING');
      const financeAccount = allUsers.find(u => u.role === 'DEPT_HEAD' || u.department.includes('Finance'));

      const newPO: PurchaseOrder = {
        id: `po-${Date.now()}`,
        poNumber,
        prId: pr.id,
        prNumber: pr.prNumber,
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: pr.requiredDate,
        vendorId: pr.suggestedVendorId || 'ven-1',
        vendorName: pr.suggestedVendorName || 'PT Flores Fresh Agro Mandiri',
        vendorAddress: 'Jl. Trans Flores, Labuan Bajo, NTT',
        vendorPhone: '0812-3982-1100',
        deliveryAddress: OFFICIAL_GMCC_ADDRESS,
        department: pr.department,
        costCenterName: pr.costCenterName,
        coaName: pr.coaName || pr.items[0]?.coaName,
        coaCode: pr.coaCode || pr.items[0]?.coaCode,
        outletDestination: (isPrBpp || isPrEvent) ? pr.outletDestination : undefined,
        items: poItems,
        subtotal,
        isTaxable,
        taxRate,
        taxPpn,
        grandTotal,
        paymentTerms: 'Net 30 Days (Transfer Bank)',
        status: 'ISSUED',
        signatures: {
          requestor: { 
            name: pr.requesterName, 
            date: pr.requestDate, 
            signed: true,
            signatureUrl: requesterAccount?.signatureUrl || SAMPLE_SIGNATURES.CHEF
          },
          purchasingOfficer: { 
            name: purchasingAccount?.name || 'Siti Handayani (Purchasing Mgr)', 
            date: new Date().toISOString().split('T')[0], 
            signed: true,
            signatureUrl: purchasingAccount?.signatureUrl || SAMPLE_SIGNATURES.PURCHASING
          },
          financeManager: { 
            name: financeAccount?.name || 'Laurentius Bram (Finance Mgr)', 
            date: new Date().toISOString().split('T')[0], 
            signed: true,
            signatureUrl: financeAccount?.signatureUrl || SAMPLE_SIGNATURES.FINANCE
          },
          generalManager: { 
            name: currentUser.name, 
            date: new Date().toISOString().split('T')[0], 
            signed: true,
            signatureUrl: currentUser.signatureUrl || SAMPLE_SIGNATURES.GM
          }
        }
      };

      onCreatePOFromApprovedPR(newPO);
      alert(`Selamat! PR ${pr.prNumber} disetujui penuh oleh GM dan Surat Pesanan resmi ${poNumber} telah otomatis diterbitkan!`);
    } else {
      alert(`Tahap persetujuan ${actionType} berhasil! Dokumen PR diteruskan ke tahap berikutnya.`);
    }

    setIsConfirmingApproval(false);
    setSelectedPrForAction(null);
    setActionType(null);
    setApprovalNotes('');
  };

  const handleReject = (pr: PurchaseRequisition) => {
    const reason = prompt('Masukkan alasan penolakan PR ini (Dokumen akan dikembalikan ke Requester untuk diaudit):', 'Anggaran cost center tidak mencukupi atau spesifikasi item perlu diverifikasi ulang');
    if (reason && reason.trim()) {
      const nowStr = new Date().toLocaleString('id-ID', { hour12: false });
      const updatedPr: PurchaseRequisition = {
        ...pr,
        status: 'REJECTED',
        rejectionReason: reason.trim(),
        approvalHistory: [
          ...pr.approvalHistory,
          {
            stage: 'REQUISITION_REVISED',
            approverName: `${currentUser.name} (${currentUser.role})`,
            approvedAt: `${nowStr} WITA`,
            notes: `DITOLAK / DIKEMBALIKAN KE REQUESTER: ${reason.trim()}`
          }
        ]
      };
      onUpdatePRStatus(updatedPr);
      alert(`PR ${pr.prNumber} ditolak dan dikembalikan ke requester (${pr.requesterName}) untuk diaudit ulang dengan catatan: "${reason.trim()}"`);
    }
  };

  const handleResubmitPR = (pr: PurchaseRequisition) => {
    const nowStr = new Date().toLocaleString('id-ID', { hour12: false });
    const updatedPr: PurchaseRequisition = {
      ...pr,
      status: 'WAITING_PURCHASING',
      approvalHistory: [
        ...pr.approvalHistory,
        {
          stage: 'PURCHASING',
          approverName: `${currentUser.name} (${currentUser.role})`,
          approvedAt: `${nowStr} WITA`,
          notes: 'Diajukan kembali oleh Requester ke antrian audit Purchasing setelah revisi dokumen'
        }
      ]
    };
    onUpdatePRStatus(updatedPr);
    alert(`PR ${pr.prNumber} berhasil diajukan kembali ke alur audit Purchasing!`);
  };

  // Helper check for eligible role - HOD removed, strictly Dept Head Finance
  const canApprovePurchasing = currentUser.role === 'PURCHASING' || currentUser.role === 'ADMIN';
  const canApproveFinance = currentUser.role === 'DEPT_HEAD' || currentUser.department.toLowerCase().includes('finance') || currentUser.role === 'ADMIN';
  const canApproveGM = currentUser.role === 'GM' || currentUser.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          Approval Center (Alur Persetujuan Bertingkat)
        </h1>
        <p className="text-xs text-slate-400">
          Persetujuan pengadaan diverifikasi langsung berdasarkan login pengguna aktif tanpa input password ulang.
        </p>
      </div>

      {/* Sequential Flow Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl text-xs">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">
            1
          </div>
          <div>
            <div className="font-bold text-white">Pengajuan Requestor</div>
            <div className="text-[10px] text-slate-400">Head Chef & Dept Staff</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center shrink-0">
            2
          </div>
          <div>
            <div className="font-bold text-white">Audit Purchasing</div>
            <div className="text-[10px] text-slate-400">Verifikasi penawaran vendor</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">
            3
          </div>
          <div>
            <div className="font-bold text-white">Persetujuan Finance</div>
            <div className="text-[10px] text-slate-400">Oleh Dept Head Finance</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
            4
          </div>
          <div>
            <div className="font-bold text-white">General Manager</div>
            <div className="text-[10px] text-slate-400">Otorisasi & Penerbitan PO</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation: Menunggu, Ditolak/Revisi, Disetujui */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveApprovalTab('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeApprovalTab === 'PENDING'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Menunggu Persetujuan ({pendingPrs.length})</span>
        </button>

        <button
          onClick={() => setActiveApprovalTab('REJECTED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeApprovalTab === 'REJECTED'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Ditolak / Dikembalikan ({rejectedPrs.length})</span>
        </button>

        <button
          onClick={() => setActiveApprovalTab('APPROVED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeApprovalTab === 'APPROVED'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Riwayat Disetujui / Terbit PO ({approvedPrs.length})</span>
        </button>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {activeApprovalTab === 'PENDING' && (
          pendingPrs.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-70" />
              <div className="text-white font-bold text-base">Tidak Ada PR yang Menunggu Persetujuan</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Seluruh pengajuan barang telah diproses atau diterbitkan menjadi Purchase Order (PO).
              </p>
            </div>
          ) : (
            pendingPrs.map((pr) => {
              const isWaitingPurchasing = pr.status === 'WAITING_PURCHASING';
              const isWaitingFinance = pr.status === 'WAITING_FINANCE' || pr.status === 'WAITING_HOD';
              const isWaitingGM = pr.status === 'WAITING_GM';
              const canRejectCurrentPr = 
                (isWaitingPurchasing && canApprovePurchasing) ||
                (isWaitingFinance && canApproveFinance) ||
                (isWaitingGM && canApproveGM);

              return (
                <div 
                  key={pr.id} 
                  className="p-5 md:p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-xl space-y-4"
                >
                  {/* Top PR Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-400 font-bold text-sm bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
                          {pr.prNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pr.urgency === 'CRITICAL' || pr.urgency === 'EVENT_CRITICAL'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                            : pr.urgency === 'URGENT'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          Urgensi: {pr.urgency}
                        </span>
                        <span className="text-xs text-slate-400">• Tgl Pengajuan: {pr.requestDate}</span>
                      </div>
                      <div className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                        <span>Pemohon:</span>
                        <span className="text-white font-bold">{pr.requesterName}</span>
                        <span className="text-slate-500">|</span>
                        <span>Dept: <b className="text-slate-200">{pr.department}</b></span>
                        <span className="text-slate-500">|</span>
                        <span>Cost Center: <b className="text-cyan-300">{pr.costCenterName || pr.costCenterCode}</b></span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total Estimasi Anggaran</div>
                      <div className="text-lg font-black text-cyan-400 font-mono">
                        {formatRupiah(pr.subtotalEstimated)}
                      </div>
                    </div>
                  </div>

                  {/* Purpose & Cost Center Info */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
                    <div className="text-slate-400 font-medium">Tujuan / Keperluan Pengadaan:</div>
                    <div className="text-slate-200 font-medium">{pr.purpose}</div>
                    {pr.costControlReview && (
                      <div className="text-[11px] text-cyan-300 pt-1 border-t border-slate-800 mt-1">
                        <b>Verifikasi Anggaran:</b> {pr.costControlReview}
                      </div>
                    )}
                  </div>

                  {/* Items List Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 text-[11px] font-semibold">
                        <tr>
                          <th className="px-3 py-2">No</th>
                          <th className="px-3 py-2">Nama Barang &amp; Spesifikasi</th>
                          <th className="px-3 py-2 text-center">Satuan</th>
                          <th className="px-3 py-2 text-center">Qty</th>
                          <th className="px-3 py-2 text-right">Estimasi Harga</th>
                          <th className="px-3 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {pr.items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-800/30">
                            <td className="px-3 py-2 text-slate-500 font-mono">{idx + 1}</td>
                            <td className="px-3 py-2">
                              <div className="font-semibold text-white">{item.itemName}</div>
                              {item.specification && (
                                <div className="text-[10px] text-slate-400">{item.specification}</div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">{item.unit}</td>
                            <td className="px-3 py-2 text-center font-mono font-bold text-white">{item.quantityRequested}</td>
                            <td className="px-3 py-2 text-right font-mono">{formatRupiah(item.estimatedPrice)}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-cyan-400">{formatRupiah(item.totalEstimated)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Approval Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Status Saat Ini:</span>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {pr.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Tolak & Kembalikan hanya untuk approver sah pada tahap persetujuan ini, bukan untuk user requester */}
                      {canRejectCurrentPr && (
                        <button
                          onClick={() => handleReject(pr)}
                          className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak &amp; Kembalikan</span>
                        </button>
                      )}

                      {/* Step 1: Purchasing Approval */}
                      {isWaitingPurchasing && (
                        <button
                          onClick={() => openApprovalModal(pr, 'PURCHASING')}
                          disabled={!canApprovePurchasing}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                            canApprovePurchasing
                              ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Persetujuan Purchasing</span>
                        </button>
                      )}

                      {/* Step 2: Finance Approval */}
                      {isWaitingFinance && (
                        <button
                          onClick={() => openApprovalModal(pr, 'FINANCE')}
                          disabled={!canApproveFinance}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                            canApproveFinance
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Persetujuan Finance (Chief Acc)</span>
                        </button>
                      )}

                      {/* Step 3: GM Final Approval */}
                      {isWaitingGM && (
                        <button
                          onClick={() => openApprovalModal(pr, 'GM')}
                          disabled={!canApproveGM}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                            canApproveGM
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Persetujuan GM (Terbitkan PO)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* TAB 2: DITOLAK / DIKEMBALIKAN KE REQUESTER */}
        {activeApprovalTab === 'REJECTED' && (
          rejectedPrs.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-slate-500 mx-auto opacity-70" />
              <div className="text-white font-bold text-base">Tidak Ada Dokumen PR yang Ditolak</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Seluruh pengadaan berjalan lancar tanpa penolakan atau revisi anggaran.
              </p>
            </div>
          ) : (
            rejectedPrs.map((pr) => (
              <div key={pr.id} className="p-5 md:p-6 rounded-2xl bg-slate-900 border border-rose-500/30 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/20 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-rose-400 font-bold text-sm bg-rose-950/60 px-2.5 py-0.5 rounded border border-rose-800">
                        {pr.prNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        STATUS: DITOLAK / DIKEMBALIKAN KE REQUESTER
                      </span>
                      <span className="text-xs text-slate-400">• Tgl Pengajuan: {pr.requestDate}</span>
                    </div>
                    <div className="text-xs text-slate-300">
                      Pemohon: <b className="text-white">{pr.requesterName}</b> ({pr.department}) | Cost Center: <b className="text-cyan-300">{pr.costCenterName || pr.costCenterCode}</b>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Nilai Estimasi</div>
                    <div className="text-lg font-black text-rose-300 font-mono">{formatRupiah(pr.subtotalEstimated)}</div>
                  </div>
                </div>

                {/* Rejection Note Alert */}
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs space-y-1">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Catatan Penolakan &amp; Arahan Revisi:</span>
                  </div>
                  <div className="text-slate-200 pl-5 font-medium leading-relaxed">
                    "{pr.rejectionReason || 'Spesifikasi atau anggaran belum sesuai SOP pengadaan.'}"
                  </div>
                </div>

                {/* Audit & Resubmit Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400">
                    Dokumen ini tetap tersimpan di sistem untuk diaudit oleh pemohon dan tidak masuk ke daftar pembelian aktif.
                  </div>
                  <button
                    onClick={() => handleResubmitPR(pr)}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
                    title="Audit selesai, ajukan ulang ke antrian audit Purchasing"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ajukan Ulang ke Purchasing</span>
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {/* TAB 3: RIWAYAT DISETUJUI */}
        {activeApprovalTab === 'APPROVED' && (
          approvedPrs.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <div className="text-white font-bold text-base">Belum Ada Riwayat PR Disetujui</div>
            </div>
          ) : (
            approvedPrs.map((pr) => (
              <div key={pr.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-mono text-cyan-400 font-bold text-xs">{pr.prNumber}</div>
                  <div className="text-xs text-white font-medium">{pr.purpose}</div>
                  <div className="text-[11px] text-slate-400">{pr.requesterName} • {pr.department}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-400 font-mono">{formatRupiah(pr.subtotalEstimated)}</div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    PO Terbit / Disetujui
                  </span>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Confirmation Modal for Approval - FULL DATA & ITEMS LIST */}
      {isConfirmingApproval && selectedPrForAction && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-5 md:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Konfirmasi Persetujuan Pengadaan Barang</h3>
                  <p className="text-xs text-slate-400">
                    Tahap: <b className="text-cyan-400 font-bold">{actionType}</b> • No: <span className="font-mono text-cyan-300 font-bold">{selectedPrForAction.prNumber}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingApproval(false);
                  setSelectedPrForAction(null);
                  setActionType(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Comprehensive PR Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80">
              <div>
                <span className="text-slate-400 text-[11px] block">Pemohon & Departemen:</span>
                <span className="font-bold text-white text-xs">{selectedPrForAction.requesterName}</span>
                <span className="text-slate-400 text-[11px]"> ({selectedPrForAction.department})</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Cost Center Pembebanan:</span>
                <span className="font-bold text-cyan-300 text-xs">{selectedPrForAction.costCenterName || selectedPrForAction.costCenterCode}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Tanggal Pengajuan / Target Pakai:</span>
                <span className="font-mono text-slate-200">{selectedPrForAction.requestDate}</span>
                <span className="text-slate-400 mx-1">s/d</span>
                <span className="font-mono text-amber-300">{selectedPrForAction.requiredDate}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Usulan Rekanan Vendor:</span>
                <span className="font-bold text-emerald-300">{selectedPrForAction.suggestedVendorName || 'Belum Ditentukan'}</span>
              </div>
              <div className="sm:col-span-2 pt-1 border-t border-slate-700/60">
                <span className="text-slate-400 text-[11px] block">Keperluan / Alasan Pengadaan:</span>
                <span className="text-slate-200 italic font-medium">{selectedPrForAction.purpose}</span>
              </div>
            </div>

            {/* FULL DATA: Table of what is being purchased in this PR */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase text-[11px]">Daftar Barang yang Diajukan:</span>
                <span className="text-[11px] text-slate-400">{selectedPrForAction.items.length} Item Barang</span>
              </div>
              <div className="border border-slate-700 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] font-bold sticky top-0">
                    <tr>
                      <th className="px-3 py-2 w-8 text-center">No</th>
                      <th className="px-3 py-2">Nama Barang & Spesifikasi Detail</th>
                      <th className="px-3 py-2 text-center w-16">Satuan</th>
                      <th className="px-3 py-2 text-center w-16">Qty</th>
                      <th className="px-3 py-2 text-right w-28">Harga Est.</th>
                      <th className="px-3 py-2 text-right w-32">Total Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300 bg-slate-900/50">
                    {selectedPrForAction.items.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-slate-800/40">
                        <td className="px-3 py-2 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <div className="font-bold text-white">{it.itemName}</div>
                          {it.specification && (
                            <div className="text-[10px] text-cyan-300 font-normal">Spesifikasi: {it.specification}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-slate-400">{it.unit}</td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-white">{it.quantityRequested}</td>
                        <td className="px-3 py-2 text-right font-mono text-slate-400">{formatRupiah(it.estimatedPrice)}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-cyan-300">{formatRupiah(it.totalEstimated)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-800/90 font-bold border-t border-slate-700 text-white">
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-right uppercase text-[10px] text-slate-400">Total Estimasi Anggaran PR:</td>
                      <td className="px-3 py-2 text-right text-cyan-300 font-mono text-sm">{formatRupiah(selectedPrForAction.subtotalEstimated)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-12 w-28 bg-white/5 rounded-lg border border-slate-700 flex items-center justify-center p-1 overflow-hidden">
                  <img
                    src={currentUser.signatureUrl || (
                      currentUser.role === 'GM' ? SAMPLE_SIGNATURES.GM :
                      currentUser.role === 'PURCHASING' ? SAMPLE_SIGNATURES.PURCHASING :
                      currentUser.role === 'DEPT_HEAD' ? SAMPLE_SIGNATURES.FINANCE : SAMPLE_SIGNATURES.CHEF
                    )}
                    alt="Tanda Tangan Digital"
                    className="h-full w-auto object-contain filter invert contrast-125"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Tanda Tangan Digital Resmi Terlampir</div>
                  <div className="text-white font-bold text-xs">{currentUser.name}</div>
                  <div className="text-cyan-400 text-[10px]">{currentUser.role} • {currentUser.department}</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Siap Otorisasi</span>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Catatan Persetujuan (Opsional)
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Tuliskan catatan arahan, verifikasi penawaran harga, atau persetujuan..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingApproval(false);
                  setSelectedPrForAction(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeApprovalDirectly}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi Setujui PR</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
