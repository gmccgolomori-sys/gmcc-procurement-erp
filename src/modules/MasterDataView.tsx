import React, { useState } from 'react';
import { Vendor, MasterItem, Department, CostCenter, ChartOfAccount, UserAccount, CompanyBankAccount } from '../types/procurement';
import { getStoredBankAccounts, saveStoredBankAccounts } from '../utils/procurementStorage';
import { 
  Database, 
  Search, 
  Plus, 
  Building2, 
  Package, 
  Store, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard,
  Landmark,
  Edit2, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  PieChart,
  Tag,
  Globe,
  Layers,
  BookOpen
} from 'lucide-react';

interface MasterDataViewProps {
  vendors: Vendor[];
  items: MasterItem[];
  departments: Department[];
  costCenters: CostCenter[];
  coas?: ChartOfAccount[];
  currentUser: UserAccount;
  onAddVendor: (vendor: Vendor) => void;
  onEditVendor?: (vendor: Vendor) => void;
  onDeleteVendor?: (vendorId: string) => void;
  onAddItem: (item: MasterItem) => void;
  onAddDepartment: (dept: Department) => void;
  onEditDepartment: (dept: Department) => void;
  onDeleteDepartment: (deptId: string) => void;
  onAddCostCenter: (cc: CostCenter) => void;
  onEditCostCenter: (cc: CostCenter) => void;
  onDeleteCostCenter: (ccId: string) => void;
  onAddCoa?: (coa: ChartOfAccount) => void;
  onEditCoa?: (coa: ChartOfAccount) => void;
  onDeleteCoa?: (coaId: string) => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  vendors,
  items,
  departments,
  costCenters,
  coas = [],
  currentUser,
  onAddVendor,
  onEditVendor,
  onDeleteVendor,
  onAddItem,
  onAddDepartment,
  onEditDepartment,
  onDeleteDepartment,
  onAddCostCenter,
  onEditCostCenter,
  onDeleteCostCenter,
  onAddCoa,
  onEditCoa,
  onDeleteCoa
}) => {
  // Requirement: "bagian master data vendor hanya tampil di gm admin dan finance."
  const isFinanceUser = currentUser.department.toLowerCase().includes('finance') || 
                        currentUser.name.toLowerCase().includes('finance') || 
                        currentUser.role === 'DEPT_HEAD';
  const canViewVendors = currentUser.role === 'ADMIN' || currentUser.role === 'GM' || isFinanceUser;

  const [activeTab, setActiveTab] = useState<'ITEMS' | 'VENDORS' | 'DEPTS' | 'COST_CENTERS' | 'COA' | 'BANK_ACCOUNTS'>('ITEMS');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);

  const [showAddCcModal, setShowAddCcModal] = useState(false);
  const [showEditCcModal, setShowEditCcModal] = useState(false);
  const [editingCcId, setEditingCcId] = useState<string | null>(null);

  const [showAddCoaModal, setShowAddCoaModal] = useState(false);
  const [showEditCoaModal, setShowEditCoaModal] = useState(false);
  const [editingCoaId, setEditingCoaId] = useState<string | null>(null);

  // Bank Accounts State & Modals
  const [bankAccounts, setBankAccounts] = useState<CompanyBankAccount[]>(() => getStoredBankAccounts());
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);

  // Bank Form State
  const [bankName, setBankName] = useState('Bank Mandiri');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('PT ITDC KAWASAN GOLO MORI');
  const [bankPurpose, setBankPurpose] = useState('Rekening Operasional & Pengadaan Vendor GMCC');
  const [bankBalance, setBankBalance] = useState(100000000);
  const [bankIsActive, setBankIsActive] = useState(true);

  const handleSaveBankAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim()) return;

    let updated: CompanyBankAccount[];
    if (editingBankId) {
      updated = bankAccounts.map(b => b.id === editingBankId ? {
        ...b,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim() || 'PT ITDC KAWASAN GOLO MORI',
        purpose: bankPurpose.trim(),
        currentBalance: bankBalance,
        isActive: bankIsActive
      } : b);
      setShowEditBankModal(false);
    } else {
      const newBank: CompanyBankAccount = {
        id: `bank-${Date.now()}`,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim() || 'PT ITDC KAWASAN GOLO MORI',
        purpose: bankPurpose.trim(),
        currentBalance: bankBalance,
        isActive: bankIsActive
      };
      updated = [...bankAccounts, newBank];
      setShowAddBankModal(false);
    }
    setBankAccounts(updated);
    saveStoredBankAccounts(updated);
    setEditingBankId(null);
  };

  const startEditBank = (b: CompanyBankAccount) => {
    setEditingBankId(b.id);
    setBankName(b.bankName);
    setAccountNumber(b.accountNumber);
    setAccountHolder(b.accountHolder);
    setBankPurpose(b.purpose);
    setBankBalance(b.currentBalance || 0);
    setBankIsActive(b.isActive);
    setShowEditBankModal(true);
  };

  const handleDeleteBank = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus rekening bank ini dari master data?')) {
      const updated = bankAccounts.filter(b => b.id !== id);
      setBankAccounts(updated);
      saveStoredBankAccounts(updated);
    }
  };

  const handleToggleBankActive = (id: string) => {
    const updated = bankAccounts.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b);
    setBankAccounts(updated);
    saveStoredBankAccounts(updated);
  };

  // COA Form State
  const [coaCode, setCoaCode] = useState('COA-');
  const [coaName, setCoaName] = useState('BPP');
  const [coaCategory, setCoaCategory] = useState('Operational Procurement');
  const [coaGlCode, setCoaGlCode] = useState('732-001');
  const [coaCostCenter, setCoaCostCenter] = useState('F&B Culinary Central Kitchen');
  const [coaDescription, setCoaDescription] = useState('');

  // Item Form State (including specification)
  const [newItemSku, setNewItemSku] = useState(`ITM-${Math.floor(100 + Math.random() * 900)}`);
  const [newItemName, setNewItemName] = useState('');
  const [newItemSpec, setNewItemSpec] = useState('');
  const [newItemCat, setNewItemCat] = useState('Food & Beverage');
  const [newItemUnit, setNewItemUnit] = useState<string>('KG');
  const [newItemPrice, setNewItemPrice] = useState(100000);
  const [newItemStock, setNewItemStock] = useState(50);
  const [newItemMinStock, setNewItemMinStock] = useState(20);

  // Vendor Form State
  const [newVenCode, setNewVenCode] = useState(`VND-${Math.floor(100 + Math.random() * 900)}`);
  const [newVenName, setNewVenName] = useState('');
  const [newVenCategory, setNewVenCategory] = useState<'Food & Beverage' | 'Dry Goods & Groceries' | 'Operating Supplies' | 'Engineering & MEP' | 'IT & Audio Visual'>('Food & Beverage');
  const [newVenContact, setNewVenContact] = useState('');
  const [newVenPhone, setNewVenPhone] = useState('');
  const [newVenEmail, setNewVenEmail] = useState('');
  const [newVenAddress, setNewVenAddress] = useState('');
  const [newVenCity, setNewVenCity] = useState('Labuan Bajo');
  const [newVenBank, setNewVenBank] = useState('Bank Mandiri');
  const [newVenAcc, setNewVenAcc] = useState('');

  // Department Form State (Keterangan dihilangkan sesuai permintaan)
  const [deptName, setDeptName] = useState('');
  const [deptHead, setDeptHead] = useState('');

  // Cost Center Form State (Plafon budget & departemen terhubung tidak perlu, semua dept bisa akses)
  const [ccCode, setCcCode] = useState('');
  const [ccName, setCcName] = useState('');

  const formatRupiah = (val?: number) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Add Item
  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const item: MasterItem = {
      id: `item-${Date.now()}`,
      sku: newItemSku,
      name: newItemName,
      specification: newItemSpec,
      category: newItemCat,
      unit: newItemUnit,
      lastPurchasePrice: Number(newItemPrice) || 0,
      departments: [departments[0]?.name || 'Food & Beverage Department'],
      stockQuantity: Number(newItemStock) || 0,
      minimumStock: Number(newItemMinStock) || 0
    };

    onAddItem(item);
    setShowAddItemModal(false);
    setNewItemName('');
    setNewItemSpec('');
  };

  // Open Add Vendor Modal
  const startAddVendor = () => {
    setNewVenCode(`VND-${Math.floor(100 + Math.random() * 900)}`);
    setNewVenName('');
    setNewVenCategory('Food & Beverage');
    setNewVenContact('');
    setNewVenPhone('');
    setNewVenEmail('');
    setNewVenAddress('Kawasan Labuan Bajo & Sekitarnya, NTT');
    setNewVenCity('Labuan Bajo');
    setNewVenBank('Bank Mandiri');
    setNewVenAcc('');
    setEditingVendorId(null);
    setShowAddVendorModal(true);
  };

  const startEditVendor = (v: Vendor) => {
    setEditingVendorId(v.id);
    setNewVenCode(v.code);
    setNewVenName(v.name);
    setNewVenCategory(v.category);
    setNewVenContact(v.contactPerson);
    setNewVenPhone(v.phone);
    setNewVenEmail(v.email);
    setNewVenAddress(v.address);
    setNewVenCity(v.city);
    setNewVenBank(v.bankAccount.bank);
    setNewVenAcc(v.bankAccount.number);
    setShowEditVendorModal(true);
  };

  // Add or Edit Vendor
  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenName.trim()) {
      alert('Nama Vendor Rekanan wajib diisi.');
      return;
    }

    if (editingVendorId) {
      const updatedVendor: Vendor = {
        id: editingVendorId,
        code: newVenCode,
        name: newVenName.trim(),
        contactPerson: newVenContact || 'Bagian Penjualan',
        phone: newVenPhone || '0812-3456-7890',
        email: newVenEmail || 'order@vendor.com',
        address: newVenAddress || 'Labuan Bajo, NTT',
        city: newVenCity || 'Labuan Bajo',
        category: newVenCategory,
        bankAccount: {
          bank: newVenBank || 'Bank Mandiri',
          number: newVenAcc || '000-00-000000-0',
          holder: newVenName
        },
        rating: 5
      };

      if (onEditVendor) {
        onEditVendor(updatedVendor);
      }
      setShowEditVendorModal(false);
      alert(`Vendor rekanan ${updatedVendor.name} berhasil diperbarui!`);
    } else {
      const vendor: Vendor = {
        id: `ven-${Date.now()}`,
        code: newVenCode,
        name: newVenName.trim(),
        contactPerson: newVenContact || 'Bagian Penjualan',
        phone: newVenPhone || '0812-3456-7890',
        email: newVenEmail || 'order@vendor.com',
        address: newVenAddress || 'Labuan Bajo, NTT',
        city: newVenCity || 'Labuan Bajo',
        category: newVenCategory,
        bankAccount: {
          bank: newVenBank || 'Bank Mandiri',
          number: newVenAcc || '000-00-000000-0',
          holder: newVenName
        },
        rating: 5
      };

      onAddVendor(vendor);
      setShowAddVendorModal(false);
      alert(`Rekanan vendor baru "${vendor.name}" (${vendor.code}) berhasil ditambahkan dan langsung terhubung ke sistem pengadaan!`);
    }

    setNewVenName('');
    setEditingVendorId(null);
  };

  // Department CRUD (Keterangan dihilangkan)
  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptHead.trim()) return;

    if (editingDeptId) {
      onEditDepartment({
        id: editingDeptId,
        name: deptName,
        headOfDepartment: deptHead
      });
      setShowEditDeptModal(false);
    } else {
      onAddDepartment({
        id: `dept-${Date.now()}`,
        name: deptName,
        headOfDepartment: deptHead
      });
      setShowAddDeptModal(false);
    }
    setDeptName('');
    setDeptHead('');
    setEditingDeptId(null);
  };

  const startEditDepartment = (dept: Department) => {
    setEditingDeptId(dept.id);
    setDeptName(dept.name);
    setDeptHead(dept.headOfDepartment);
    setShowEditDeptModal(true);
  };

  // Cost Center CRUD (Plafon budget & departemen terhubung tidak perlu, semua dept bisa akses)
  const handleSaveCostCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ccCode.trim() || !ccName.trim()) return;

    if (editingCcId) {
      onEditCostCenter({
        id: editingCcId,
        code: ccCode.trim().toUpperCase(),
        name: ccName.trim(),
        departmentName: 'Semua Departemen (Akses Terbuka)',
        budgetAllocation: 0
      });
      setShowEditCcModal(false);
    } else {
      onAddCostCenter({
        id: `cc-${Date.now()}`,
        code: ccCode.trim().toUpperCase(),
        name: ccName.trim(),
        departmentName: 'Semua Departemen (Akses Terbuka)',
        budgetAllocation: 0
      });
      setShowAddCcModal(false);
    }
    setCcCode('');
    setCcName('');
    setEditingCcId(null);
  };

  const startEditCostCenter = (cc: CostCenter) => {
    setEditingCcId(cc.id);
    setCcCode(cc.code);
    setCcName(cc.name);
    setShowEditCcModal(true);
  };

  const handleSaveCoa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coaCode || !coaName) {
      alert('Kode Akun dan Nama COA wajib diisi.');
      return;
    }
    if (editingCoaId && onEditCoa) {
      const existing = coas.find(c => c.id === editingCoaId);
      onEditCoa({
        id: editingCoaId,
        code: coaCode.trim().toUpperCase(),
        name: coaName.trim(),
        category: coaCategory,
        glAccountCode: coaGlCode.trim(),
        costCenterName: coaCostCenter,
        description: coaDescription.trim(),
        isActive: existing ? existing.isActive : true
      });
      setShowEditCoaModal(false);
    } else if (onAddCoa) {
      onAddCoa({
        id: `coa-${Date.now()}`,
        code: coaCode.trim().toUpperCase(),
        name: coaName.trim(),
        category: coaCategory,
        glAccountCode: coaGlCode.trim(),
        costCenterName: coaCostCenter,
        description: coaDescription.trim(),
        isActive: true
      });
      setShowAddCoaModal(false);
    }
    setCoaCode('COA-');
    setCoaName('BPP');
    setCoaDescription('');
    setEditingCoaId(null);
  };

  const startEditCoa = (coa: ChartOfAccount) => {
    setEditingCoaId(coa.id);
    setCoaCode(coa.code);
    setCoaName(coa.name);
    setCoaCategory(coa.category || 'Operational Procurement');
    setCoaGlCode(coa.glAccountCode || '732-001');
    setCoaCostCenter(coa.costCenterName || (costCenters[0] ? costCenters[0].name : ''));
    setCoaDescription(coa.description || '');
    setShowEditCoaModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Master Data Management
          </h1>
          <p className="text-xs text-slate-400">
            Database referensi pengadaan GMCC: Katalog Barang, Rekanan Vendor, Departemen, dan Cost Center
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'ITEMS' && (
            <button
              onClick={() => {
                setNewItemSku(`ITM-${Math.floor(100 + Math.random() * 900)}`);
                setShowAddItemModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Item Baru</span>
            </button>
          )}

          {activeTab === 'VENDORS' && canViewVendors && (
            <button
              onClick={startAddVendor}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Rekanan Vendor</span>
            </button>
          )}

          {activeTab === 'DEPTS' && (
            <button
              onClick={() => {
                setDeptName('');
                setDeptHead('');
                setEditingDeptId(null);
                setShowAddDeptModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Departemen</span>
            </button>
          )}

          {activeTab === 'COST_CENTERS' && (
            <button
              onClick={() => {
                setCcCode(`CC-${Math.floor(100 + Math.random() * 900)}`);
                setCcName('');
                setEditingCcId(null);
                setShowAddCcModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Cost Center</span>
            </button>
          )}

          {activeTab === 'COA' && (
            <button
              onClick={() => {
                setCoaCode(`COA-${Math.floor(100 + Math.random() * 900)}`);
                setCoaName('BPP');
                setCoaCategory('Operational Procurement');
                setCoaGlCode('732-001');
                setCoaCostCenter(costCenters[0]?.name || 'F&B Culinary Central Kitchen');
                setCoaDescription('');
                setEditingCoaId(null);
                setShowAddCoaModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Akun COA Baru</span>
            </button>
          )}

          {activeTab === 'BANK_ACCOUNTS' && (
            <button
              onClick={() => {
                setBankName('Bank Mandiri');
                setAccountNumber('');
                setAccountHolder('PT ITDC KAWASAN GOLO MORI');
                setBankPurpose('Rekening Operasional & Pengadaan Vendor GMCC');
                setBankBalance(100000000);
                setBankIsActive(true);
                setEditingBankId(null);
                setShowAddBankModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Rekening Bank</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('ITEMS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ITEMS'
              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Katalog Barang & Spesifikasi ({items.length})</span>
        </button>

        {canViewVendors && (
          <button
            onClick={() => setActiveTab('VENDORS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'VENDORS'
                ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Rekanan Vendor ({vendors.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('DEPTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'DEPTS'
              ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Master Departemen ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('COST_CENTERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'COST_CENTERS'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Master Cost Center ({costCenters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('COA')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'COA'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Master COA ({coas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('BANK_ACCOUNTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'BANK_ACCOUNTS'
              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Rekening Kas &amp; Bank GMCC ({bankAccounts.length})</span>
        </button>
      </div>

      {/* TAB 1: ITEMS */}
      {activeTab === 'ITEMS' && (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari berdasarkan nama barang, sku, atau spesifikasi detail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="border border-slate-800 rounded-2xl bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/70 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Nama Barang</th>
                    <th className="px-4 py-3">Spesifikasi Detail</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3 text-center">Satuan</th>
                    <th className="px-4 py-3 text-right">Harga Terakhir</th>
                    <th className="px-4 py-3 text-center">Stok Fisik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {items
                    .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 (i.specification && i.specification.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                 i.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((it) => (
                      <tr key={it.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono text-cyan-400 font-bold">{it.sku}</td>
                        <td className="px-4 py-3 font-bold text-white">{it.name}</td>
                        <td className="px-4 py-3 text-slate-400 text-[11px] max-w-xs">{it.specification || '-'}</td>
                        <td className="px-4 py-3 text-slate-300">{it.category}</td>
                        <td className="px-4 py-3 text-center font-mono">{it.unit}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-cyan-300">{formatRupiah(it.lastPurchasePrice)}</td>
                        <td className="px-4 py-3 text-center font-mono">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            it.stockQuantity <= it.minimumStock 
                              ? 'bg-rose-500/10 text-rose-400' 
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {it.stockQuantity} {it.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VENDORS */}
      {activeTab === 'VENDORS' && canViewVendors && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">
              Total <b className="text-white">{vendors.length} Rekanan Vendor</b> terdaftar untuk seluruh pengadaan GMCC
            </span>
            <button
              onClick={startAddVendor}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Rekanan Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((v) => (
              <div key={v.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {v.code}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-bold border border-indigo-500/20">
                      {v.category}
                    </span>
                    <button
                      onClick={() => startEditVendor(v)}
                      className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                      title="Edit Vendor"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteVendor && (
                      <button
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus rekanan vendor ${v.name}?`)) {
                            onDeleteVendor(v.id);
                          }
                        }}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-rose-400"
                        title="Hapus Vendor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm">{v.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {v.city} • <span className="text-slate-300">{v.contactPerson}</span>
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{v.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{v.email}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>{v.bankAccount.bank}: <b className="font-mono">{v.bankAccount.number}</b></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTEMEN (KETERANGAN DIHILANGKAN SESUAI REQUEST) */}
      {activeTab === 'DEPTS' && (
        <div className="space-y-4">
          <div className="border border-slate-800 rounded-2xl bg-slate-900 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/70 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Nama Departemen</th>
                  <th className="px-4 py-3">Kepala Departemen (HOD)</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>{dept.name}</span>
                    </td>
                    <td className="px-4 py-3 text-cyan-300 font-semibold">{dept.headOfDepartment}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEditDepartment(dept)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                          title="Edit Departemen"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus departemen ${dept.name}?`)) {
                              onDeleteDepartment(dept.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 transition-colors"
                          title="Hapus Departemen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: COST CENTER (PLAFON BUDGET & DEPT TERHUBUNG DIHAPUS, SEMUA DEPT BISA AKSES) */}
      {activeTab === 'COST_CENTERS' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
            <Globe className="w-4 h-4 shrink-0" />
            <span>
              Semua Cost Center terbuka dan dapat dipilih oleh semua departemen GMCC pada saat pengajuan barang.
            </span>
          </div>

          <div className="border border-slate-800 rounded-2xl bg-slate-900 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/70 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 w-48">Kode Cost Center</th>
                  <th className="px-4 py-3">Nama Cost Center</th>
                  <th className="px-4 py-3">Hak Akses Departemen</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {costCenters.map((cc) => (
                  <tr key={cc.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">{cc.code}</td>
                    <td className="px-4 py-3 font-bold text-white">{cc.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Semua Dept Bisa Akses
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEditCostCenter(cc)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
                          title="Edit Cost Center"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus cost center ${cc.name} (${cc.code})?`)) {
                              onDeleteCostCenter(cc.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 transition-colors"
                          title="Hapus Cost Center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CHART OF ACCOUNTS (COA) */}
      {activeTab === 'COA' && (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari berdasarkan nama COA (BPP, NON BPP, Transport, Event Cost...), kode akun, atau akun GL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Integrasi Chart of Accounts (COA) &amp; Rekapitulasi Kas Kecil (Petty Cash)</p>
              <p className="text-[11px] text-emerald-300/80 mt-0.5">
                Master COA ini menjadi basis penarikan kas kecil GMCC (BPP, NON BPP, Transport, Event Cost, Rental Equipment Event, Meal Employee). Pengeluaran kas kecil dapat ditarik per periode &amp; COA dengan pagu maksimal <b>Rp 50.000.000 per file</b> serta aturan integritas tanggal utuh.
              </p>
            </div>
          </div>

          <div className="border border-slate-800 rounded-2xl bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/70 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Kode COA</th>
                    <th className="px-4 py-3">Nama Akun COA</th>
                    <th className="px-4 py-3">Kategori Beban</th>
                    <th className="px-4 py-3">No. Akun GL</th>
                    <th className="px-4 py-3">Keterangan / Fungsi Akun</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {coas
                    .filter((c) => 
                      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (c.category && c.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (c.glAccountCode && c.glAccountCode.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((coa) => (
                      <tr key={coa.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-emerald-300">
                          {coa.code}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {coa.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-medium">
                          {coa.category || 'Operasional'}
                        </td>
                        <td className="px-4 py-3 font-mono text-amber-300 font-semibold">
                          {coa.glAccountCode || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-[11px] max-w-sm">
                          {coa.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Aktif
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEditCoa(coa)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 transition-colors"
                              title="Edit Akun COA"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus akun COA ${coa.name} (${coa.code})?`)) {
                                  if (onDeleteCoa) onDeleteCoa(coa.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 transition-colors"
                              title="Hapus Akun COA"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MASTER REKENING KAS & BANK GMCC (UNTUK PELUNASAN HUTANG AP AGING) */}
      {activeTab === 'BANK_ACCOUNTS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cari berdasarkan nama bank, nomor rekening, atas nama, peruntukan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="text-[11px] text-slate-400">
              *Rekening yang berstatus <b>Aktif</b> otomatis muncul di modal Pelunasan AP Aging
            </div>
          </div>

          <div className="border border-slate-800 rounded-2xl bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/70 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-3 w-10 text-center">NO</th>
                    <th className="px-4 py-3">Nama Bank / Kas</th>
                    <th className="px-4 py-3">Nomor Rekening</th>
                    <th className="px-4 py-3">Atas Nama (Pemegang Rekening)</th>
                    <th className="px-4 py-3">Peruntukan Alokasi Dana</th>
                    <th className="px-4 py-3 text-right">Saldo Terkini</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {bankAccounts
                    .filter(b => 
                      b.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      b.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      b.accountHolder.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      b.purpose.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((bank, idx) => (
                      <tr key={bank.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-3 py-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20 font-bold">
                              <Landmark className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-white">{bank.bankName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-cyan-300">
                          {bank.accountNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-200">
                          {bank.accountHolder}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {bank.purpose}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(bank.currentBalance || 0)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleToggleBankActive(bank.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                              bank.isActive
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
                            }`}
                            title="Klik untuk mengubah status aktif/nonaktif"
                          >
                            {bank.isActive ? '✓ Aktif' : 'Non-Aktif'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEditBank(bank)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 transition-colors"
                              title="Edit Rekening"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBank(bank.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 transition-colors"
                              title="Hapus Rekening"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah Item */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Tambah Item Master Baru</h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Barang *</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Contoh: Daging Sirloin Meltique..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Spesifikasi Detail (Merk/Tipe/Kualitas) *</label>
                <input
                  type="text"
                  value={newItemSpec}
                  onChange={(e) => setNewItemSpec(e.target.value)}
                  placeholder="Contoh: Grade MB4+, vacuum pack, Halal MUI..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Satuan (Pilih / Ketik Sendiri) *</label>
                  <input
                    type="text"
                    list="master-unit-presets"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value.toUpperCase())}
                    placeholder="Contoh: KG, GRAM, BTL, DLL..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <datalist id="master-unit-presets">
                    <option value="KG">Kilogram (KG)</option>
                    <option value="GRAM">Gram (GRAM)</option>
                    <option value="LITER">Liter (LITER)</option>
                    <option value="ML">Mililiter (ML)</option>
                    <option value="PCS">Pieces (PCS)</option>
                    <option value="PACK">Pack / Kemasan (PACK)</option>
                    <option value="BOX">Karton / Dus (BOX)</option>
                    <option value="BTL">Botol (BTL)</option>
                    <option value="CAN">Kaleng (CAN)</option>
                    <option value="ROLL">Gulung (ROLL)</option>
                    <option value="LEMBAR">Lembar (LEMBAR)</option>
                    <option value="IKAT">Ikat (IKAT)</option>
                    <option value="PAIL">Pail / Ember (PAIL)</option>
                    <option value="SAK">Sak / Karung (SAK)</option>
                  </datalist>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['KG', 'GRAM', 'LITER', 'PCS', 'PACK', 'BOX', 'BTL'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setNewItemUnit(u)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-colors ${
                          newItemUnit === u ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Harga Terakhir (IDR)</label>
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Simpan Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah & Edit Rekanan Vendor (SUDAH TERSAMBUNG LENGKAP) */}
      {(showAddVendorModal || showEditVendorModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  {editingVendorId ? 'Edit Data Rekanan Vendor' : 'Tambah Rekanan Vendor Baru'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowAddVendorModal(false);
                  setShowEditVendorModal(false);
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kode Vendor</label>
                  <input
                    type="text"
                    value={newVenCode}
                    onChange={(e) => setNewVenCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategori Usaha *</label>
                  <select
                    value={newVenCategory}
                    onChange={(e) => setNewVenCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Dry Goods & Groceries">Dry Goods & Groceries</option>
                    <option value="Operating Supplies">Operating Supplies</option>
                    <option value="Engineering & MEP">Engineering & MEP</option>
                    <option value="IT & Audio Visual">IT & Audio Visual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Perusahaan / Supplier *</label>
                <input
                  type="text"
                  value={newVenName}
                  onChange={(e) => setNewVenName(e.target.value)}
                  placeholder="Contoh: PT Flores Fresh Agro Mandiri"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Person (PIC)</label>
                  <input
                    type="text"
                    value={newVenContact}
                    onChange={(e) => setNewVenContact(e.target.value)}
                    placeholder="Contoh: Emanuel Sura"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">No. Telepon / WhatsApp *</label>
                  <input
                    type="text"
                    value={newVenPhone}
                    onChange={(e) => setNewVenPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={newVenEmail}
                    onChange={(e) => setNewVenEmail(e.target.value)}
                    placeholder="sales@vendor.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kota Asal</label>
                  <input
                    type="text"
                    value={newVenCity}
                    onChange={(e) => setNewVenCity(e.target.value)}
                    placeholder="Labuan Bajo, Ruteng, Denpasar..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Alamat Gudang / Kantor</label>
                <input
                  type="text"
                  value={newVenAddress}
                  onChange={(e) => setNewVenAddress(e.target.value)}
                  placeholder="Jl. Trans Flores KM 4, Labuan Bajo..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Bank Pembayaran</label>
                  <input
                    type="text"
                    value={newVenBank}
                    onChange={(e) => setNewVenBank(e.target.value)}
                    placeholder="Bank Mandiri, BCA, BRI..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={newVenAcc}
                    onChange={(e) => setNewVenAcc(e.target.value)}
                    placeholder="161-00-xxxxxx-1"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddVendorModal(false);
                    setShowEditVendorModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30"
                >
                  {editingVendorId ? 'Perbarui Rekanan' : 'Simpan Rekanan Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah / Edit Departemen (Keterangan dihilangkan) */}
      {(showAddDeptModal || showEditDeptModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingDeptId ? 'Edit Departemen' : 'Tambah Departemen Baru'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddDeptModal(false);
                  setShowEditDeptModal(false);
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveDepartment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Departemen *</label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="Contoh: Food & Beverage Department"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Kepala Departemen (HOD) *</label>
                <input
                  type="text"
                  value={deptHead}
                  onChange={(e) => setDeptHead(e.target.value)}
                  placeholder="Contoh: Laurentius Bram"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDeptModal(false);
                    setShowEditDeptModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold"
                >
                  {editingDeptId ? 'Perbarui Departemen' : 'Simpan Departemen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah / Edit Cost Center (Plafon budget & departemen terhubung tidak perlu, semua dept bisa akses) */}
      {(showAddCcModal || showEditCcModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingCcId ? 'Edit Cost Center' : 'Tambah Cost Center Baru'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddCcModal(false);
                  setShowEditCcModal(false);
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCostCenter} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Kode Cost Center *</label>
                <input
                  type="text"
                  value={ccCode}
                  onChange={(e) => setCcCode(e.target.value)}
                  placeholder="Contoh: CC-FB-01"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Cost Center *</label>
                <input
                  type="text"
                  value={ccName}
                  onChange={(e) => setCcName(e.target.value)}
                  placeholder="Contoh: F&B Culinary Central Kitchen"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Cost Center ini dapat diakses dan digunakan oleh seluruh departemen GMCC.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCcModal(false);
                    setShowEditCcModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  {editingCcId ? 'Perbarui Cost Center' : 'Simpan Cost Center'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah / Edit COA */}
      {(showAddCoaModal || showEditCoaModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>{editingCoaId ? 'Edit Akun COA' : 'Tambah Akun COA Baru'}</span>
              </h3>
              <button 
                onClick={() => {
                  setShowAddCoaModal(false);
                  setShowEditCoaModal(false);
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCoa} className="space-y-3.5 text-xs">
              {/* Preset selection chips */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Pilihan Standar COA GMCC (Atau ketik nama kustom):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['BPP', 'NON BPP', 'Transport', 'Event Cost', 'Rental Equipment Event', 'Meal Employee'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setCoaName(preset);
                        if (preset === 'BPP') {
                          setCoaCode('COA-BPP');
                          setCoaCategory('Operational Procurement');
                          setCoaGlCode('732-001');
                        } else if (preset === 'NON BPP') {
                          setCoaCode('COA-NONBPP');
                          setCoaCategory('Direct Operational');
                          setCoaGlCode('732-002');
                        } else if (preset === 'Transport') {
                          setCoaCode('COA-TRN');
                          setCoaCategory('Logistics & Fleet');
                          setCoaGlCode('741-001');
                        } else if (preset === 'Event Cost') {
                          setCoaCode('COA-EVT');
                          setCoaCategory('MICE & Banquet');
                          setCoaGlCode('752-001');
                        } else if (preset === 'Rental Equipment Event') {
                          setCoaCode('COA-REE');
                          setCoaCategory('MICE & Equipment');
                          setCoaGlCode('752-002');
                        } else if (preset === 'Meal Employee') {
                          setCoaCode('COA-MEAL');
                          setCoaCategory('Human Capital & Staff');
                          setCoaGlCode('761-001');
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        coaName === preset
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kode Akun COA *</label>
                  <input
                    type="text"
                    value={coaCode}
                    onChange={(e) => setCoaCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: COA-BPP"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama COA *</label>
                  <input
                    type="text"
                    value={coaName}
                    onChange={(e) => setCoaName(e.target.value)}
                    placeholder="Contoh: BPP, NON BPP, Transport..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nomor Akun GL</label>
                  <input
                    type="text"
                    value={coaGlCode}
                    onChange={(e) => setCoaGlCode(e.target.value)}
                    placeholder="Contoh: 732-001"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategori Beban</label>
                  <input
                    type="text"
                    value={coaCategory}
                    onChange={(e) => setCoaCategory(e.target.value)}
                    placeholder="Contoh: Operational, Logistics, Event..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400 font-bold">ℹ️ Info SOP GMCC:</span>
                <span className="text-[11px] text-slate-400">
                  Cost Center tidak dikunci pada Master COA, melainkan dialokasikan secara dinamis oleh petugas Receiving saat fisik barang tiba.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Keterangan / Fungsi Akun</label>
                <textarea
                  value={coaDescription}
                  onChange={(e) => setCoaDescription(e.target.value)}
                  placeholder="Catatan fungsi dan peruntukan akun COA ini..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCoaModal(false);
                    setShowEditCoaModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {editingCoaId ? 'Perbarui COA' : 'Simpan COA Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah & Edit Rekening Kas & Bank GMCC */}
      {(showAddBankModal || showEditBankModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">
                  {editingBankId ? 'Edit Rekening Kas / Bank GMCC' : 'Tambah Rekening Kas / Bank Baru'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowAddBankModal(false);
                  setShowEditBankModal(false);
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBankAccount} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Bank / Sumber Kas *</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Contoh: Bank Mandiri, Bank BCA, Bank NTT, Kas Tunai..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nomor Rekening / Kode Kas *</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Contoh: 161-00-998877 atau CASH-01"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-cyan-300 font-mono font-bold focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Atas Nama Pemilik Rekening *</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Contoh: PT ITDC KAWASAN GOLO MORI"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Peruntukan Alokasi / Fungsi Rekening *</label>
                <input
                  type="text"
                  value={bankPurpose}
                  onChange={(e) => setBankPurpose(e.target.value)}
                  placeholder="Contoh: Rekening Pembayaran Vendor Rekanan, Event MICE, Kas Operasional..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Saldo Terkini (IDR)</label>
                  <input
                    type="number"
                    value={bankBalance}
                    onChange={(e) => setBankBalance(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status Penggunaan</label>
                  <select
                    value={bankIsActive ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) => setBankIsActive(e.target.value === 'ACTIVE')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="ACTIVE">✓ Aktif (Tampil di Pelunasan AP)</option>
                    <option value="INACTIVE">Non-Aktif (Arsip)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBankModal(false);
                    setShowEditBankModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  {editingBankId ? 'Perbarui Rekening' : 'Simpan Rekening Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
