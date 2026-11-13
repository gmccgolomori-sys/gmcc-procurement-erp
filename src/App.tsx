import React, { useState, useEffect } from 'react';
import { 
  UserAccount, 
  Department,
  CostCenter, 
  ChartOfAccount,
  Vendor, 
  MasterItem, 
  PurchaseRequisition, 
  PurchaseOrder, 
  GoodsReceipt, 
  FoodFlashRecord,
  AuditLog,
  GitHubSyncConfig,
  RecipeCostRecord,
  PettyCashSettlementPeriod,
  PettyCashBillingFile,
  hasRestrictedModuleAccess,
  hasItAdminAccess
} from './types/procurement';
import { 
  getStoredUsers, 
  saveStoredUsers, 
  getStoredDepartments, 
  saveStoredDepartments, 
  getStoredCostCenters, 
  saveStoredCostCenters, 
  getStoredCOAs, 
  saveStoredCOAs, 
  getStoredVendors, 
  saveStoredVendors, 
  getStoredItems, 
  saveStoredItems, 
  getStoredPRs, 
  saveStoredPRs, 
  getStoredPOs, 
  saveStoredPOs, 
  getStoredGRNs, 
  saveStoredGRNs, 
  getStoredFoodFlash, 
  saveStoredFoodFlash, 
  getStoredRecipes, 
  saveStoredRecipes, 
  getStoredPettyCashPeriods, 
  saveStoredPettyCashPeriods, 
  getStoredBillingFiles,
  saveStoredBillingFiles,
  getStoredAuditLogs, 
  saveStoredAuditLogs, 
  getStoredGitHubConfig, 
  saveStoredGitHubConfig, 
  getStoredAuthUser, 
  saveStoredAuthUser, 
  resetUsersToDefault
} from './utils/procurementStorage';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { DashboardOverview } from './modules/DashboardOverview';
import { RequisitionCreateView } from './modules/RequisitionCreateView';
import { RequisitionsListView } from './modules/RequisitionsListView';
import { ApprovalCenterView } from './modules/ApprovalCenterView';
import { PurchaseOrdersView } from './modules/PurchaseOrdersView';
import { GoodsReceivingView } from './modules/GoodsReceivingView';
import { DailyFoodFlashView } from './modules/DailyFoodFlashView';
import { RecipeCostCenterView } from './modules/RecipeCostCenterView';
import { PettyCashSettlementView } from './modules/PettyCashSettlementView';
import { PettyCashBillingView } from './modules/PettyCashBillingView';
import { PettyCashReconciliationView } from './modules/PettyCashReconciliationView';
import { ApAgingView } from './modules/ApAgingView';
import { SpendingAnalyticsView } from './modules/SpendingAnalyticsView';
import { GoogleSheetsSyncView } from './modules/GoogleSheetsSyncView';
import { MasterDataView } from './modules/MasterDataView';
import { AdminView } from './modules/AdminView';
import { GitHubRightDrawer } from './components/GitHubRightDrawer';
import { 
  LayoutDashboard, 
  FileText, 
  ShieldCheck, 
  Package, 
  Utensils, 
  Github,
  LogOut,
  Receipt,
  Scale,
  ShieldAlert,
  PlusCircle
} from 'lucide-react';

export default function App() {
  // Main Data States
  const [users, setUsers] = useState<UserAccount[]>(() => getStoredUsers());
  const [departments, setDepartments] = useState<Department[]>(() => getStoredDepartments());
  const [costCenters, setCostCenters] = useState<CostCenter[]>(() => getStoredCostCenters());
  const [coas, setCoas] = useState<ChartOfAccount[]>(() => getStoredCOAs());
  const [vendors, setVendors] = useState<Vendor[]>(() => getStoredVendors());
  const [items, setItems] = useState<MasterItem[]>(() => getStoredItems());
  const [prs, setPrs] = useState<PurchaseRequisition[]>(() => getStoredPRs());
  const [pos, setPos] = useState<PurchaseOrder[]>(() => getStoredPOs());
  const [grns, setGrns] = useState<GoodsReceipt[]>(() => getStoredGRNs());
  const [foodFlash, setFoodFlash] = useState<FoodFlashRecord[]>(() => getStoredFoodFlash());
  const [recipes, setRecipes] = useState<RecipeCostRecord[]>(() => getStoredRecipes());
  const [pettyCashPeriods, setPettyCashPeriods] = useState<PettyCashSettlementPeriod[]>(() => getStoredPettyCashPeriods());
  const [billingFiles, setBillingFiles] = useState<PettyCashBillingFile[]>(() => getStoredBillingFiles());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getStoredAuditLogs());
  const [githubConfig, setGithubConfig] = useState<GitHubSyncConfig>(() => getStoredGitHubConfig());

  // Current User with auto-fallback to default Admin to prevent blank/locked state after cache clear
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = getStoredAuthUser();
    if (saved && users.some(u => u.id === saved.id)) return saved;
    const defaultUser = users.find(u => u.username === 'admin') || users[0] || getStoredUsers()[0];
    saveStoredAuthUser(defaultUser);
    return defaultUser;
  });

  // Always keep user active in ERP unless explicitly logging out
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // GitHub Right-Side Slide-Over Drawer state (Strictly on the right side - IT/Admin Only)
  const [isGitHubDrawerOpen, setIsGitHubDrawerOpen] = useState(false);
  const hasItAccess = hasItAdminAccess(currentUser);

  useEffect(() => {
    if (!hasItAccess && isGitHubDrawerOpen) {
      setIsGitHubDrawerOpen(false);
    }
  }, [hasItAccess, isGitHubDrawerOpen]);

  // Login handler
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    saveStoredAuthUser(user);
  };

  // Logout handler
  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem GMCC ERP?')) {
      setIsAuthenticated(false);
      saveStoredAuthUser(null);
    }
  };

  // 30-Minute Idle / Inactivity Auto-Logout
  const [idleLogoutNotice, setIdleLogoutNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // 30 minutes in milliseconds
    const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
    let timerId: ReturnType<typeof setTimeout>;

    const performAutoLogout = () => {
      setIsAuthenticated(false);
      saveStoredAuthUser(null);
      setIdleLogoutNotice('Sesi Anda telah berakhir secara otomatis karena tidak ada aktivitas selama 30 menit demi keamanan akun GMCC ERP. Silakan login kembali.');
    };

    const resetInactivityTimer = () => {
      clearTimeout(timerId);
      timerId = setTimeout(performAutoLogout, INACTIVITY_TIMEOUT_MS);
    };

    // User activity listeners
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetInactivityTimer, { passive: true }));

    resetInactivityTimer();

    return () => {
      clearTimeout(timerId);
      activityEvents.forEach(evt => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [isAuthenticated]);

  // PR & PO Handlers
  const handleSavePR = (newPR: PurchaseRequisition) => {
    const updated = [newPR, ...prs];
    setPrs(updated);
    saveStoredPRs(updated);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID', { hour12: false }) + ' WITA',
      username: currentUser.username,
      module: 'Requisitions',
      action: 'CREATE_PR',
      details: `Membuat PR ${newPR.prNumber} senilai Rp ${newPR.subtotalEstimated.toLocaleString('id-ID')}`
    };
    const updatedLogs = [log, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveStoredAuditLogs(updatedLogs);
  };

  const handleUpdatePRStatus = (updatedPR: PurchaseRequisition) => {
    const updated = prs.map(p => p.id === updatedPR.id ? updatedPR : p);
    setPrs(updated);
    saveStoredPRs(updated);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID', { hour12: false }) + ' WITA',
      username: currentUser.username,
      module: 'Approval Center',
      action: updatedPR.status === 'REJECTED' ? 'REJECT_PR' : 'APPROVE_PR_STAGE',
      details: `Memperbarui status PR ${updatedPR.prNumber} menjadi ${updatedPR.status}`
    };
    const updatedLogs = [log, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveStoredAuditLogs(updatedLogs);
  };

  const handleEditPR = (updatedPR: PurchaseRequisition) => {
    const updated = prs.map(p => p.id === updatedPR.id ? updatedPR : p);
    setPrs(updated);
    saveStoredPRs(updated);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID', { hour12: false }) + ' WITA',
      username: currentUser.username,
      module: 'Requisitions',
      action: 'EDIT_PR',
      details: `Menyesuaikan data PR ${updatedPR.prNumber} senilai Rp ${updatedPR.subtotalEstimated.toLocaleString('id-ID')}`
    };
    const updatedLogs = [log, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveStoredAuditLogs(updatedLogs);
  };

  const handleDeletePR = (prId: string) => {
    const targetPr = prs.find(p => p.id === prId);
    const updated = prs.filter(p => p.id !== prId);
    setPrs(updated);
    saveStoredPRs(updated);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID', { hour12: false }) + ' WITA',
      username: currentUser.username,
      module: 'Requisitions',
      action: 'DELETE_PR',
      details: `Menghapus dokumen PR ${targetPr?.prNumber || prId}`
    };
    const updatedLogs = [log, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveStoredAuditLogs(updatedLogs);
  };

  const handleCreatePOFromApprovedPR = (newPO: PurchaseOrder) => {
    const updatedPos = [newPO, ...pos];
    setPos(updatedPos);
    saveStoredPOs(updatedPos);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID', { hour12: false }) + ' WITA',
      username: currentUser.username,
      module: 'Purchase Orders',
      action: 'ISSUE_PO',
      details: `Menerbitkan Surat Pesanan resmi ${newPO.poNumber} untuk ${newPO.vendorName}`
    };
    const updatedLogs = [log, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveStoredAuditLogs(updatedLogs);
  };

  const handleUpdatePO = (updatedPO: PurchaseOrder) => {
    const updated = pos.map(p => p.id === updatedPO.id ? updatedPO : p);
    setPos(updated);
    saveStoredPOs(updated);
  };

  const handleSaveGRN = (newGRN: GoodsReceipt, updatedPO: PurchaseOrder) => {
    const updatedGrns = [newGRN, ...grns];
    setGrns(updatedGrns);
    saveStoredGRNs(updatedGrns);

    const updatedPos = pos.map(p => p.id === updatedPO.id ? updatedPO : p);
    setPos(updatedPos);
    saveStoredPOs(updatedPos);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID', { hour12: false }) + ' WITA',
      username: currentUser.username,
      module: 'Goods Receiving',
      action: 'RECEIVE_GOODS',
      details: `Menerbitkan GRN ${newGRN.grnNumber} untuk ${updatedPO.poNumber}`
    };
    const updatedLogs = [log, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveStoredAuditLogs(updatedLogs);
  };

  const handleUpdateGRN = (updatedGRN: GoodsReceipt) => {
    const updated = grns.map(g => g.id === updatedGRN.id ? updatedGRN : g);
    setGrns(updated);
    saveStoredGRNs(updated);
  };

  const handleUpdateFoodFlash = (updatedRec: FoodFlashRecord) => {
    const updated = foodFlash.map(f => f.id === updatedRec.id ? updatedRec : f);
    setFoodFlash(updated);
    saveStoredFoodFlash(updated);
  };

  const handleAddFoodFlash = (newRec: FoodFlashRecord) => {
    const updated = [newRec, ...foodFlash];
    setFoodFlash(updated);
    saveStoredFoodFlash(updated);
  };

  const handleAddVendor = (newVendor: Vendor) => {
    const updated = [newVendor, ...vendors];
    setVendors(updated);
    saveStoredVendors(updated);
  };

  const handleEditVendor = (updatedVendor: Vendor) => {
    const updated = vendors.map(v => v.id === updatedVendor.id ? updatedVendor : v);
    setVendors(updated);
    saveStoredVendors(updated);
  };

  const handleDeleteVendor = (vendorId: string) => {
    const updated = vendors.filter(v => v.id !== vendorId);
    setVendors(updated);
    saveStoredVendors(updated);
  };

  const handleAddItem = (newItem: MasterItem) => {
    const updated = [newItem, ...items];
    setItems(updated);
    saveStoredItems(updated);
  };

  const handleBatchAddItems = (newItems: MasterItem[]) => {
    const existingNames = new Set(items.map(i => i.name.toLowerCase().trim()));
    const filteredNew = newItems.filter(i => !existingNames.has(i.name.toLowerCase().trim()));
    const updated = [...filteredNew, ...items];
    setItems(updated);
    saveStoredItems(updated);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID', { hour12: false }) + ' WITA',
      username: currentUser.username,
      module: 'Master Data',
      action: 'IMPORT_EXCEL_ITEMS',
      details: `Import ${filteredNew.length} item katalog barang baru dari file Excel (total di katalog: ${updated.length})`
    };
    const updatedLogs = [log, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveStoredAuditLogs(updatedLogs);
  };

  const handleEditItem = (updatedItem: MasterItem) => {
    const updated = items.map(i => i.id === updatedItem.id ? updatedItem : i);
    setItems(updated);
    saveStoredItems(updated);
  };

  const handleDeleteItem = (itemId: string) => {
    // Requestor is strictly forbidden from deleting items
    if (currentUser.role === 'REQUESTOR') {
      alert('Akses Ditolak: Requestor hanya berhak melihat dan mengisi katalog barang, tidak dapat menghapus item.');
      return;
    }
    const updated = items.filter(i => i.id !== itemId);
    setItems(updated);
    saveStoredItems(updated);
  };

  // Department CRUD
  const handleAddDepartment = (newDept: Department) => {
    const updated = [...departments, newDept];
    setDepartments(updated);
    saveStoredDepartments(updated);
  };

  const handleEditDepartment = (updatedDept: Department) => {
    const updated = departments.map(d => d.id === updatedDept.id ? updatedDept : d);
    setDepartments(updated);
    saveStoredDepartments(updated);
  };

  const handleDeleteDepartment = (deptId: string) => {
    const updated = departments.filter(d => d.id !== deptId);
    setDepartments(updated);
    saveStoredDepartments(updated);
  };

  // Cost Center CRUD
  const handleAddCostCenter = (newCc: CostCenter) => {
    const updated = [...costCenters, newCc];
    setCostCenters(updated);
    saveStoredCostCenters(updated);
  };

  const handleEditCostCenter = (updatedCc: CostCenter) => {
    const updated = costCenters.map(c => c.id === updatedCc.id ? updatedCc : c);
    setCostCenters(updated);
    saveStoredCostCenters(updated);
  };

  const handleDeleteCostCenter = (ccId: string) => {
    const updated = costCenters.filter(c => c.id !== ccId);
    setCostCenters(updated);
    saveStoredCostCenters(updated);
  };

  // Chart of Accounts (COA) CRUD
  const handleAddCoa = (newCoa: ChartOfAccount) => {
    const updated = [...coas, newCoa];
    setCoas(updated);
    saveStoredCOAs(updated);
  };

  const handleEditCoa = (updatedCoa: ChartOfAccount) => {
    const updated = coas.map(c => c.id === updatedCoa.id ? updatedCoa : c);
    setCoas(updated);
    saveStoredCOAs(updated);
  };

  const handleDeleteCoa = (coaId: string) => {
    const updated = coas.filter(c => c.id !== coaId);
    setCoas(updated);
    saveStoredCOAs(updated);
  };

  // User Management CRUD
  const handleAddUser = (newUser: UserAccount) => {
    const updated = [...users, newUser];
    setUsers(updated);
    saveStoredUsers(updated);
  };

  const handleEditUser = (updatedUser: UserAccount) => {
    const updated = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updated);
    saveStoredUsers(updated);
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      saveStoredAuthUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    saveStoredUsers(updated);
  };

  // Recipe Cost Center CRUD
  const handleAddRecipe = (newRecipe: RecipeCostRecord) => {
    const updated = [newRecipe, ...recipes];
    setRecipes(updated);
    saveStoredRecipes(updated);
  };

  const handleEditRecipe = (updatedRecipe: RecipeCostRecord) => {
    const updated = recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r);
    setRecipes(updated);
    saveStoredRecipes(updated);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    const updated = recipes.filter(r => r.id !== recipeId);
    setRecipes(updated);
    saveStoredRecipes(updated);
  };

  // Petty Cash & Settlement CRUD
  const handleSavePettyCashPeriod = (updatedPeriod: PettyCashSettlementPeriod) => {
    const exists = pettyCashPeriods.some(p => p.id === updatedPeriod.id);
    const updated = exists 
      ? pettyCashPeriods.map(p => p.id === updatedPeriod.id ? updatedPeriod : p)
      : [updatedPeriod, ...pettyCashPeriods];
    setPettyCashPeriods(updated);
    saveStoredPettyCashPeriods(updated);
  };

  const handleDeletePettyCashPeriod = (periodId: string) => {
    if (pettyCashPeriods.length <= 1) {
      alert('Minimal harus ada 1 periode / file kas kecil.');
      return;
    }
    const updated = pettyCashPeriods.filter(p => p.id !== periodId);
    setPettyCashPeriods(updated);
    saveStoredPettyCashPeriods(updated);
  };

  const handleSaveBillingFile = (newFile: PettyCashBillingFile) => {
    const exists = billingFiles.some(f => f.id === newFile.id);
    const updated = exists 
      ? billingFiles.map(f => f.id === newFile.id ? newFile : f)
      : [newFile, ...billingFiles];
    setBillingFiles(updated);
    saveStoredBillingFiles(updated);
  };

  const handleUpdateBillingFile = (updatedFile: PettyCashBillingFile) => {
    const updated = billingFiles.map(f => f.id === updatedFile.id ? updatedFile : f);
    setBillingFiles(updated);
    saveStoredBillingFiles(updated);
  };

  const handleDeleteBillingFile = (fileId: string) => {
    const updated = billingFiles.filter(f => f.id !== fileId);
    setBillingFiles(updated);
    saveStoredBillingFiles(updated);
  };

  const handleUpdateUserPassword = (userId: string, newPassword: string) => {
    const updated = users.map(u => u.id === userId ? { ...u, password: newPassword } : u);
    setUsers(updated);
    saveStoredUsers(updated);
    if (currentUser.id === userId) {
      const updatedCurr = { ...currentUser, password: newPassword };
      setCurrentUser(updatedCurr);
      saveStoredAuthUser(updatedCurr);
    }
  };

  const handleUpdateUserSignature = (userId: string, signatureUrl: string) => {
    const updated = users.map(u => u.id === userId ? { ...u, signatureUrl } : u);
    setUsers(updated);
    saveStoredUsers(updated);
    if (currentUser.id === userId) {
      const updatedCurr = { ...currentUser, signatureUrl };
      setCurrentUser(updatedCurr);
      saveStoredAuthUser(updatedCurr);
    }
  };

  const handleResetAllData = () => {
    if (confirm('Apakah Anda yakin ingin mereset seluruh database GMCC ERP ke data awal?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // If not authenticated, render LoginScreen with idle notification if applicable
  if (!isAuthenticated) {
    return (
      <div className="relative">
        {idleLogoutNotice && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-4 rounded-2xl bg-amber-950/90 border-2 border-amber-500 text-amber-200 text-xs shadow-2xl flex items-start justify-between gap-3 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                <span>{idleLogoutNotice}</span>
              </div>
              <button 
                onClick={() => setIdleLogoutNotice(null)} 
                className="text-amber-300 hover:text-white p-1 rounded-lg hover:bg-amber-900/40 text-sm font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <LoginScreen 
          users={users} 
          onLoginSuccess={(u) => {
            setIdleLogoutNotice(null);
            handleLoginSuccess(u);
          }}
          onResetUsers={() => {
            const reset = resetUsersToDefault();
            setUsers(reset);
          }}
        />
      </div>
    );
  }

  const pendingApprovalsCount = prs.filter(p => p.status === 'WAITING_PURCHASING' || p.status === 'WAITING_HOD' || p.status === 'WAITING_GM').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Navbar
        currentUser={currentUser}
        allUsers={users}
        onSelectUser={(u) => {
          setCurrentUser(u);
          saveStoredAuthUser(u);
        }}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenGitHubDrawer={hasItAccess ? () => setIsGitHubDrawerOpen(true) : undefined}
        onNavigateToApprovals={() => setActiveTab('approval-center')}
        onOpenChangePassword={() => setShowChangePasswordModal(true)}
        onLogout={handleLogout}
        onNavigateTab={(tab) => {
          if (tab === 'github') {
            if (hasItAccess) setIsGitHubDrawerOpen(true);
          } else {
            setActiveTab(tab as ActiveTab);
          }
        }}
        activeTab={activeTab}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Top card removed as requested) */}
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === 'github') {
              if (hasItAccess) setIsGitHubDrawerOpen(true);
            } else {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          pendingApprovalsCount={pendingApprovalsCount}
          totalPOsCount={pos.length}
          currentUserRole={currentUser.role}
          currentUser={currentUser}
          billingFilesCount={billingFiles.length}
          onOpenChangePassword={() => setShowChangePasswordModal(true)}
          onLogout={handleLogout}
        />

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 px-2 py-1.5 flex items-center justify-around text-[10px]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 p-1 ${activeTab === 'dashboard' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('pr-create')}
            className={`flex flex-col items-center gap-1 p-1 ${activeTab === 'pr-create' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>Buat PR</span>
          </button>
          <button
            onClick={() => setActiveTab('approval-center')}
            className={`flex flex-col items-center gap-1 p-1 relative ${activeTab === 'approval-center' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Approval</span>
            {pendingApprovalsCount > 0 && (
              <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('purchase-orders')}
            className={`flex flex-col items-center gap-1 p-1 ${activeTab === 'purchase-orders' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            <Package className="w-4 h-4" />
            <span>PO</span>
          </button>
          {/* Prominent Mobile Kas Kecil (Petty Cash) button */}
          <button
            onClick={() => setActiveTab('petty-cash')}
            className={`flex flex-col items-center gap-1 p-1 ${
              activeTab === 'petty-cash' ? 'text-amber-400 font-bold' : 'text-amber-300/80 hover:text-amber-300'
            }`}
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>Kas Kecil</span>
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`flex flex-col items-center gap-1 p-1 ${
              activeTab === 'reconciliation' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>Rekonsiliasi</span>
          </button>
          <button
            onClick={() => setActiveTab('food-flash')}
            className={`flex flex-col items-center gap-1 p-1 ${activeTab === 'food-flash' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
          >
            <Utensils className="w-4 h-4" />
            <span>Food Flash</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 p-1 text-rose-400"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>

        {/* Main Content View */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              prs={prs}
              pos={pos}
              grns={grns}
              foodFlash={foodFlash}
              pettyCashPeriods={pettyCashPeriods}
              currentUser={currentUser}
              auditLogs={auditLogs}
              onNavigate={(tab) => setActiveTab(tab as ActiveTab)}
            />
          )}

          {activeTab === 'pr-create' && (
            <RequisitionCreateView
              currentUser={currentUser}
              vendors={vendors}
              items={items}
              departments={departments}
              costCenters={costCenters}
              coas={coas}
              onSavePR={handleSavePR}
              onNavigateToList={() => setActiveTab('prs')}
            />
          )}

          {activeTab === 'prs' && (
            <RequisitionsListView
              prs={prs}
              currentUser={currentUser}
              vendors={vendors}
              items={items}
              costCenters={costCenters}
              onNavigateToCreate={() => setActiveTab('pr-create')}
              onNavigateToApproval={() => setActiveTab('approval-center')}
              onEditPR={handleEditPR}
              onDeletePR={handleDeletePR}
            />
          )}

          {activeTab === 'approval-center' && (
            <ApprovalCenterView
              prs={prs}
              currentUser={currentUser}
              allUsers={users}
              onUpdatePRStatus={handleUpdatePRStatus}
              onCreatePOFromApprovedPR={handleCreatePOFromApprovedPR}
            />
          )}

          {activeTab === 'purchase-orders' && (
            <PurchaseOrdersView
              pos={pos}
              onUpdatePO={handleUpdatePO}
              users={users}
            />
          )}

          {activeTab === 'receiving' && (
            <GoodsReceivingView
              grns={grns}
              pos={pos}
              vendors={vendors}
              currentUser={currentUser}
              onSaveGRN={handleSaveGRN}
              onUpdateGRN={handleUpdateGRN}
            />
          )}

          {activeTab === 'spending-analytics' && (
            <SpendingAnalyticsView
              pos={pos}
              grns={grns}
              items={items}
              vendors={vendors}
              departments={departments}
              costCenters={costCenters}
              coas={coas}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'food-flash' && (
            <DailyFoodFlashView
              records={foodFlash}
              grns={grns}
              currentUser={currentUser}
              onUpdateRecord={handleUpdateFoodFlash}
              onAddRecord={handleAddFoodFlash}
            />
          )}

          {activeTab === 'recipe-cost' && (
            <RecipeCostCenterView
              recipes={recipes}
              items={items}
              costCenters={costCenters}
              currentUser={currentUser}
              onAddRecipe={handleAddRecipe}
              onEditRecipe={handleEditRecipe}
              onDeleteRecipe={handleDeleteRecipe}
            />
          )}

          {activeTab === 'ap-aging' && (
            hasRestrictedModuleAccess(currentUser) ? (
              <ApAgingView
                grns={grns}
                vendors={vendors}
                currentUser={currentUser}
                onUpdateGRN={handleUpdateGRN}
              />
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-lg mx-auto my-12 space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-white">Akses Modul Terbatas (Restricted Access)</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sesuai regulasi operasional GMCC: Modul AP Aging hanya dapat diakses oleh staf Purchasing, Head of Finance / Chief Accounting, General Manager, dan Administrator.
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            )
          )}

          {activeTab === 'master-data' && (
            (hasRestrictedModuleAccess(currentUser) || currentUser.role === 'REQUESTOR') ? (
              <MasterDataView
                vendors={vendors}
                items={items}
                departments={departments}
                costCenters={costCenters}
                coas={coas}
                currentUser={currentUser}
                onAddVendor={handleAddVendor}
                onEditVendor={handleEditVendor}
                onDeleteVendor={handleDeleteVendor}
                onAddItem={handleAddItem}
                onBatchAddItems={handleBatchAddItems}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
                onAddDepartment={handleAddDepartment}
                onEditDepartment={handleEditDepartment}
                onDeleteDepartment={handleDeleteDepartment}
                onAddCostCenter={handleAddCostCenter}
                onEditCostCenter={handleEditCostCenter}
                onDeleteCostCenter={handleDeleteCostCenter}
                onAddCoa={handleAddCoa}
                onEditCoa={handleEditCoa}
                onDeleteCoa={handleDeleteCoa}
              />
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-lg mx-auto my-12 space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-white">Akses Master Data Terbatas</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Perubahan Master COA, Departemen, Vendor, dan Item hanya dapat dilakukan oleh Purchasing, Finance, GM, dan Admin.
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            )
          )}

          {activeTab === 'petty-cash' && (
            hasRestrictedModuleAccess(currentUser) ? (
              <PettyCashSettlementView
                periods={pettyCashPeriods}
                onSavePeriod={handleSavePettyCashPeriod}
                onDeletePeriod={handleDeletePettyCashPeriod}
                pos={pos}
                grns={grns}
                currentUser={currentUser}
                users={users}
                coas={coas}
                costCenters={costCenters}
                billingFiles={billingFiles}
                onSaveBillingFile={handleSaveBillingFile}
                onNavigateToBillingFiles={() => setActiveTab('billing-files')}
              />
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-lg mx-auto my-12 space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-white">Akses Kas Kecil Terbatas</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pengelolaan file Petty Cash hanya dapat diakses oleh Purchasing, Head of Finance, GM, dan Administrator.
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            )
          )}

          {activeTab === 'billing-files' && (
            hasRestrictedModuleAccess(currentUser) ? (
              <PettyCashBillingView
                billingFiles={billingFiles}
                onUpdateBillingFile={handleUpdateBillingFile}
                onDeleteBillingFile={handleDeleteBillingFile}
                currentUser={currentUser}
                users={users}
                onNavigateToPettyCash={() => setActiveTab('petty-cash')}
              />
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-lg mx-auto my-12 space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-white">Akses Berkas Penagihan Terbatas</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pengelolaan Berkas Penagihan Kas Kecil hanya dapat diakses oleh Purchasing, Head of Finance, GM, dan Administrator.
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            )
          )}

          {activeTab === 'reconciliation' && (
            hasRestrictedModuleAccess(currentUser) ? (
              <PettyCashReconciliationView
                grns={grns}
                pos={pos}
                pettyCashPeriods={pettyCashPeriods}
                coas={coas}
                costCenters={costCenters}
                currentUser={currentUser}
                onSavePettyCashPeriod={handleSavePettyCashPeriod}
                onNavigateToPettyCash={() => setActiveTab('petty-cash')}
              />
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-lg mx-auto my-12 space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-white">Akses Rekonsiliasi Terbatas</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Audit tagihan dan rekonsiliasi kas kecil hanya dapat diakses oleh Purchasing, Head of Finance, GM, dan Administrator.
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            )
          )}

          {activeTab === 'google-sheets' && (
            <GoogleSheetsSyncView
              prs={prs}
              pos={pos}
              grns={grns}
              pettyCashPeriods={pettyCashPeriods}
              billingFiles={billingFiles}
              items={items}
              vendors={vendors}
              coas={coas}
              costCenters={costCenters}
              users={users}
              currentUser={currentUser}
              onUpdatePrs={(updated) => {
                setPrs(updated);
                saveStoredPRs(updated);
              }}
              onUpdatePos={(updated) => {
                setPos(updated);
                saveStoredPOs(updated);
              }}
              onUpdateGrns={(updated) => {
                setGrns(updated);
                saveStoredGRNs(updated);
              }}
            />
          )}

          {activeTab === 'admin' && (
            <AdminView
              users={users}
              currentUser={currentUser}
              auditLogs={auditLogs}
              departments={departments}
              onAddUser={handleAddUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onUpdateUserPassword={handleUpdateUserPassword}
              onUpdateUserSignature={handleUpdateUserSignature}
              onResetAllData={handleResetAllData}
            />
          )}
        </main>
      </div>

      {/* Persistent Floating GitHub Dock Button (Hanya di sebelah kanan layar - Khusus IT / Admin) */}
      {hasItAccess && (
        <button
          type="button"
          onClick={() => setIsGitHubDrawerOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-slate-900/95 hover:bg-slate-800 border-l border-y border-cyan-500/50 hover:border-cyan-400 text-slate-200 px-2 sm:px-2.5 py-3.5 rounded-l-2xl shadow-2xl flex flex-col items-center gap-2 group transition-all hover:pl-3.5 cursor-pointer backdrop-blur-md"
          title="Buka Sambungan GitHub & Skrip Terminal (Khusus IT / Admin)"
        >
          <div className="relative">
            <Github className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <span className="text-[10px] font-black tracking-wider uppercase [writing-mode:vertical-lr] rotate-180 text-slate-300 group-hover:text-cyan-300 py-1 font-mono">
            GitHub
          </span>
        </button>
      )}

      {/* Right-Side Slide-Over GitHub Drawer (Khusus IT / Admin) */}
      {hasItAccess && (
        <GitHubRightDrawer
          isOpen={isGitHubDrawerOpen}
          onClose={() => setIsGitHubDrawerOpen(false)}
          config={githubConfig}
          onSaveConfig={(cfg) => {
            setGithubConfig(cfg);
            saveStoredGitHubConfig(cfg);
          }}
        />
      )}

      {/* Change Password Modal for logged-in user */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          currentUser={currentUser}
          onClose={() => setShowChangePasswordModal(false)}
          onSaveNewPassword={handleUpdateUserPassword}
        />
      )}
    </div>
  );
}
