import React, { useState } from 'react';
import { 
  UserAccount, 
  Department,
  CostCenter, 
  Vendor, 
  MasterItem, 
  PurchaseRequisition, 
  PurchaseOrder, 
  GoodsReceipt, 
  FoodFlashRecord,
  AuditLog,
  GitHubSyncConfig,
  RecipeCostRecord
} from './types/procurement';
import { 
  getStoredUsers, 
  saveStoredUsers, 
  getStoredDepartments, 
  saveStoredDepartments, 
  getStoredCostCenters,
  saveStoredCostCenters,
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
  getStoredAuditLogs, 
  saveStoredAuditLogs, 
  getStoredGitHubConfig, 
  saveStoredGitHubConfig,
  getStoredAuthUser,
  saveStoredAuthUser
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
import { MasterDataView } from './modules/MasterDataView';
import { GitHubSyncView } from './modules/GitHubSyncView';
import { AdminView } from './modules/AdminView';
import { 
  LayoutDashboard, 
  FileText, 
  ShieldCheck, 
  Package, 
  Utensils, 
  Github,
  LogOut
} from 'lucide-react';

export default function App() {
  // Main Data States
  const [users, setUsers] = useState<UserAccount[]>(() => getStoredUsers());
  const [departments, setDepartments] = useState<Department[]>(() => getStoredDepartments());
  const [costCenters, setCostCenters] = useState<CostCenter[]>(() => getStoredCostCenters());
  const [vendors, setVendors] = useState<Vendor[]>(() => getStoredVendors());
  const [items, setItems] = useState<MasterItem[]>(() => getStoredItems());
  const [prs, setPrs] = useState<PurchaseRequisition[]>(() => getStoredPRs());
  const [pos, setPos] = useState<PurchaseOrder[]>(() => getStoredPOs());
  const [grns, setGrns] = useState<GoodsReceipt[]>(() => getStoredGRNs());
  const [foodFlash, setFoodFlash] = useState<FoodFlashRecord[]>(() => getStoredFoodFlash());
  const [recipes, setRecipes] = useState<RecipeCostRecord[]>(() => getStoredRecipes());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getStoredAuditLogs());
  const [githubConfig, setGithubConfig] = useState<GitHubSyncConfig>(() => getStoredGitHubConfig());

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = getStoredAuthUser();
    if (saved && users.some(u => u.id === saved.id)) return saved;
    return users[0] || getStoredUsers()[0];
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!getStoredAuthUser();
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

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

  // If not authenticated, render LoginScreen
  if (!isAuthenticated) {
    return <LoginScreen users={users} onLoginSuccess={handleLoginSuccess} />;
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
        onNavigateToApprovals={() => setActiveTab('approval-center')}
        onOpenChangePassword={() => setShowChangePasswordModal(true)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Top card removed as requested) */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          pendingApprovalsCount={pendingApprovalsCount}
          totalPOsCount={pos.length}
          currentUserRole={currentUser.role}
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
            onClick={() => setActiveTab('prs')}
            className={`flex flex-col items-center gap-1 p-1 ${activeTab === 'prs' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            <FileText className="w-4 h-4" />
            <span>PR</span>
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
            />
          )}

          {activeTab === 'receiving' && (
            <GoodsReceivingView
              grns={grns}
              pos={pos}
              currentUser={currentUser}
              onSaveGRN={handleSaveGRN}
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

          {activeTab === 'master-data' && (
            <MasterDataView
              vendors={vendors}
              items={items}
              departments={departments}
              costCenters={costCenters}
              currentUser={currentUser}
              onAddVendor={handleAddVendor}
              onEditVendor={handleEditVendor}
              onDeleteVendor={handleDeleteVendor}
              onAddItem={handleAddItem}
              onAddDepartment={handleAddDepartment}
              onEditDepartment={handleEditDepartment}
              onDeleteDepartment={handleDeleteDepartment}
              onAddCostCenter={handleAddCostCenter}
              onEditCostCenter={handleEditCostCenter}
              onDeleteCostCenter={handleDeleteCostCenter}
            />
          )}

          {activeTab === 'github' && (
            <GitHubSyncView
              config={githubConfig}
              onSaveConfig={(cfg) => {
                setGithubConfig(cfg);
                saveStoredGitHubConfig(cfg);
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
