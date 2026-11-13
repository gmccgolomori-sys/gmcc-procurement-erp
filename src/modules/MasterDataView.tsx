import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Vendor, MasterItem, Department, CostCenter, ChartOfAccount, UserAccount, CompanyBankAccount, getItemCoaCategory } from '../types/procurement';
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
  BookOpen,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCheck,
  FileText
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
  onBatchAddItems?: (items: MasterItem[]) => void;
  onEditItem?: (item: MasterItem) => void;
  onDeleteItem?: (itemId: string) => void;
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
  onBatchAddItems,
  onEditItem,
  onDeleteItem,
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
  // Role & Permissions:
  // "tambahkan akses requestor dapat buka dan isi modul katalog barang dan spesifikasi tapi tidak bisa didelete"
  const isRequestor = currentUser.role === 'REQUESTOR';
  const canDeleteItem = !isRequestor && (currentUser.role === 'ADMIN' || currentUser.role === 'GM' || currentUser.role === 'PURCHASING');
  const canDeleteMaster = !isRequestor && (currentUser.role === 'ADMIN' || currentUser.role === 'GM');

  // Requirement: "bagian master data vendor hanya tampil di gm admin dan finance."
  const isFinanceUser = currentUser.department.toLowerCase().includes('finance') || 
                        currentUser.name.toLowerCase().includes('finance') || 
                        currentUser.role === 'DEPT_HEAD';
  const canViewVendors = !isRequestor && (currentUser.role === 'ADMIN' || currentUser.role === 'GM' || isFinanceUser);

  const [activeTab, setActiveTab] = useState<'ITEMS' | 'VENDORS' | 'DEPTS' | 'COST_CENTERS' | 'COA' | 'BANK_ACCOUNTS'>('ITEMS');
  const [searchTerm, setSearchTerm] = useState('');

  // Excel Import States & Handlers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [parsedImportItems, setParsedImportItems] = useState<MasterItem[]>([]);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const handleDownloadTemplate = () => {
    const header = [
      ['No', 'Nama Barang', 'Spesifikasi / Standar', 'Kategori', 'Satuan', 'Harga Terakhir (Rp)']
    ];
    const sampleRows = [
      [1, 'Gula Aren', 'Gula aren Block', 'Dry', 'Kg', 35000],
      [2, 'Fresh Milks', 'Full cream 1 Liter (greenfields)', 'Dairy', 'Liter', 28000],
      [3, 'Sayur Organik Mix Segar Ruteng', 'Segar hidroponik dataran tinggi', 'Sayuran', 'Kg', 35000],
      [4, 'Ikan Kerapu Segar Live', 'Kerapu hidup dari nelayan Bajo', 'Seafood', 'Kg', 175000]
    ];
    const ws = XLSX.utils.aoa_to_sheet([...header, ...sampleRows]);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 32 },
      { wch: 36 },
      { wch: 18 },
      { wch: 12 },
      { wch: 22 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Master_Barang_GMCC');
    XLSX.writeFile(wb, 'Template_Master_Barang_GMCC.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setImportFileName(file.name);
    setImportNotice(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawData || rawData.length === 0) {
          alert('File Excel kosong atau tidak terbaca format tabelnya.');
          setIsProcessingFile(false);
          return;
        }

        const newItems: MasterItem[] = [];
        rawData.forEach((row, idx) => {
          const keys = Object.keys(row);
          const findKey = (candidates: string[]) => {
            const found = keys.find(k => candidates.some(c => k.toLowerCase().replace(/[\s_\/]/g, '').includes(c.toLowerCase())));
            return found ? row[found] : '';
          };

          const rawName = findKey(['namabarang', 'nama', 'itemname', 'deskripsi', 'barang']);
          if (!rawName || typeof rawName !== 'string' || !rawName.trim()) return;

          const rawSpec = findKey(['spesifikasi', 'standar', 'spec', 'keterangan']);
          const rawCat = findKey(['kategori', 'category', 'kat', 'jenis']);
          const rawUnit = findKey(['satuan', 'unit', 'uom']);
          const rawPrice = findKey(['hargaterakhir', 'harga', 'price', 'rp', 'cost']);

          let price = 0;
          if (typeof rawPrice === 'number') {
            price = rawPrice;
          } else if (typeof rawPrice === 'string') {
            const clean = rawPrice.replace(/[^\d]/g, '');
            price = clean ? parseInt(clean, 10) : 0;
          }

          const catName = rawCat && String(rawCat).trim() ? String(rawCat).trim() : 'Food & Beverage';
          const catPrefix = catName.substring(0, 3).toUpperCase();
          const cleanUnit = rawUnit && String(rawUnit).trim() ? String(rawUnit).trim().toUpperCase() : 'PCS';

          newItems.push({
            id: `item-imp-${Date.now()}-${idx + 1}`,
            sku: `GMCC-${catPrefix}-${String(items.length + idx + 1).padStart(3, '0')}`,
            name: String(rawName).trim(),
            specification: rawSpec ? String(rawSpec).trim() : 'Spesifikasi standar operasional GMCC',
            category: catName,
            unit: cleanUnit,
            lastPurchasePrice: price,
            departments: ['Food & Beverage Department', 'Human Resources & General'],
            stockQuantity: 100,
            minimumStock: 10
          });
        });

        if (newItems.length === 0) {
          alert('Tidak ada baris barang valid yang terbaca. Pastikan ada kolom "Nama Barang" pada file Excel.');
        } else {
          setParsedImportItems(newItems);
          setShowImportModal(true);
        }
      } catch (err: any) {
        alert('Gagal membaca file Excel: ' + (err.message || 'Format tidak valid.'));
      } finally {
        setIsProcessingFile(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    if (parsedImportItems.length === 0) return;

    if (onBatchAddItems) {
      onBatchAddItems(parsedImportItems);
    } else {
      parsedImportItems.forEach(it => onAddItem(it));
    }

    setImportNotice(`Sukses mengimpor ${parsedImportItems.length} item ke Master Katalog Barang GMCC!`);
    setShowImportModal(false);
    setParsedImportItems([]);
  };

  // Modals
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemSku, setEditItemSku] = useState('');
  const [editItemName, setEditItemName] = useState('');
  const [editItemSpec, setEditItemSpec] = useState('');
  const [editItemCat, setEditItemCat] = useState('');
  const [editItemUnit, setEditItemUnit] = useState('KG');
  const [editItemPrice, setEditItemPrice] = useState(0);
  const [editItemStock, setEditItemStock] = useState(0);
  const [editItemMinStock, setEditItemMinStock] = useState(0);
  const [editItemCoaCategory, setEditItemCoaCategory] = useState<'BPP' | 'NON_BPP'>('BPP');

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
    if (isRequestor) {
      alert('Requestor tidak memiliki izin menghapus data rekening bank.');
      return;
    }
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
  const [newItemCoaCategory, setNewItemCoaCategory] = useState<'BPP' | 'NON_BPP'>('BPP');

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
  const [newVenPaymentTerm, setNewVenPaymentTerm] = useState<'CASH_PURCHASE' | 'CREDIT'>('CASH_PURCHASE');
  const [newVenCreditLimit, setNewVenCreditLimit] = useState<number>(0);

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
      name: newItemName.trim(),
      specification: newItemSpec.trim(),
      category: newItemCat,
      unit: newItemUnit,
      lastPurchasePrice: Number(newItemPrice) || 0,
      departments: [departments[0]?.name || 'Food & Beverage Department'],
      stockQuantity: Number(newItemStock) || 0,
      minimumStock: Number(newItemMinStock) || 0,
      coaCategory: newItemCoaCategory
    };

    onAddItem(item);
    setShowAddItemModal(false);
    setNewItemName('');
    setNewItemSpec('');
  };

  const handleStartEditItem = (it: MasterItem) => {
    setEditingItemId(it.id);
    setEditItemSku(it.sku);
    setEditItemName(it.name);
    setEditItemSpec(it.specification || '');
    setEditItemCat(it.category || 'Food & Beverage');
    setEditItemUnit(it.unit || 'KG');
    setEditItemPrice(it.lastPurchasePrice || 0);
    setEditItemStock(it.stockQuantity || 0);
    setEditItemMinStock(it.minimumStock || 0);
    setEditItemCoaCategory(getItemCoaCategory(it));
    setShowEditItemModal(true);
  };

  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItemId || !editItemName.trim()) return;

    const updated: MasterItem = {
      id: editingItemId,
      sku: editItemSku,
      name: editItemName.trim(),
      specification: editItemSpec.trim(),
      category: editItemCat,
      unit: editItemUnit,
      lastPurchasePrice: Number(editItemPrice) || 0,
      departments: [departments[0]?.name || 'Food & Beverage Department'],
      stockQuantity: Number(editItemStock) || 0,
      minimumStock: Number(editItemMinStock) || 0,
      coaCategory: editItemCoaCategory
    };

    if (onEditItem) {
      onEditItem(updated);
    }
    setShowEditItemModal(false);
    alert(`Spesifikasi dan data barang "${updated.name}" berhasil diperbarui!`);
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
    setNewVenPaymentTerm('CASH_PURCHASE');
    setNewVenCreditLimit(0);
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
    setNewVenPaymentTerm(v.paymentTerm || (v.creditLimit && v.creditLimit > 0 ? 'CREDIT' : 'CASH_PURCHASE'));
    setNewVenCreditLimit(v.creditLimit || 0);
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
        rating: 5,
        paymentTerm: newVenPaymentTerm,
        creditLimit: newVenPaymentTerm === 'CREDIT' ? Number(newVenCreditLimit) || 0 : 0
      };

      if (onEditVendor) {
        onEditVendor(updatedVendor);
      }
      setShowEditVendorModal(false);
      alert(`Vendor rekanan ${updatedVendor.name} (${newVenPaymentTerm === 'CREDIT' ? 'Credit' : 'Cash Purchase'}) berhasil diperbarui!`);
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
        rating: 5,
        paymentTerm: newVenPaymentTerm,
        creditLimit: newVenPaymentTerm === 'CREDIT' ? Number(newVenCreditLimit) || 0 : 0
      };

      onAddVendor(vendor);
      setShowAddVendorModal(false);
      alert(`Rekanan vendor baru "${vendor.name}" (${vendor.code} - ${newVenPaymentTerm === 'CREDIT' ? 'Credit' : 'Cash Purchase'}) berhasil ditambahkan!`);
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
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
                title="Download template Excel resmi master barang GMCC"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download Template Excel</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>{isProcessingFile ? 'Membaca File...' : 'Import dari File Excel'}</span>
              </button>
              <button
                onClick={() => {
                  setNewItemSku(`ITM-${Math.floor(100 + Math.random() * 900)}`);
                  setShowAddItemModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Item Manual</span>
              </button>
            </div>
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

      {/* TAB 1: ITEMS (KATALOG BARANG & SPESIFIKASI) */}
      {activeTab === 'ITEMS' && (
        <div className="space-y-4">
          {/* Requestor Informative Banner */}
          {isRequestor && (
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-extrabold text-white text-sm flex items-center gap-2">
                    <span>Akses Requestor: Katalog Barang &amp; Spesifikasi Mutu</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                      Buka &amp; Isi Aktif
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Anda dapat mencari standar barang, menyesuaikan spesifikasi, atau menambah item baru ke katalog GMCC untuk kebutuhan pengajuan PR. Hak menghapus item dinonaktifkan demi integritas data.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewItemSku(`ITM-${Math.floor(100 + Math.random() * 900)}`);
                  setNewItemName('');
                  setNewItemSpec('');
                  setNewItemCat('Food & Beverage');
                  setNewItemUnit('KG');
                  setNewItemPrice(50000);
                  setNewItemStock(20);
                  setNewItemMinStock(5);
                  setShowAddItemModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Isi / Tambah Item Baru</span>
              </button>
            </div>
          )}

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
                    <th className="px-4 py-3">Klasifikasi COA</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3 text-center">Satuan</th>
                    <th className="px-4 py-3 text-right">Harga Terakhir</th>
                    <th className="px-4 py-3 text-center">Stok Fisik</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
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
                        <td className="px-4 py-3">
                          {getItemCoaCategory(it) === 'BPP' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                              BPP (Bahan Pokok)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
                              NON BPP (Supplies/Op)
                            </span>
                          )}
                        </td>
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
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditItem(it)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-300 transition-colors"
                              title="Edit Spesifikasi Barang"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {canDeleteItem && onDeleteItem && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Hapus item "${it.name}" dari katalog master?`)) {
                                    onDeleteItem(it.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                                title="Hapus Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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
                    {canDeleteMaster && onDeleteVendor && (
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

                <div className="flex items-center gap-1.5 flex-wrap">
                  {v.paymentTerm === 'CREDIT' || (v.creditLimit && v.creditLimit > 0) ? (
                    <span className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                      📑 Credit (Plafon: {formatRupiah(v.creditLimit)})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      💵 Cash Purchase (Tunai / Kas Kecil)
                    </span>
                  )}
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
                        {canDeleteMaster && (
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
                        )}
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
                        {canDeleteMaster && (
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
                        )}
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
                            {canDeleteMaster && (
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
                            )}
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
                            {canDeleteMaster && (
                              <button
                                onClick={() => handleDeleteBank(bank.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 transition-colors"
                                title="Hapus Rekening"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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

      {/* Modal: Preview & Konfirmasi Import Excel */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">
                    Preview Import Excel Master Barang
                  </h3>
                  <p className="text-xs text-slate-400">
                    File: <b className="text-emerald-300 font-mono">{importFileName}</b> • Terbaca <b className="text-white">{parsedImportItems.length}</b> baris data
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setShowImportModal(false); setParsedImportItems([]); }}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Item Terbaca</span>
                <span className="text-xl font-mono font-black text-emerald-400">{parsedImportItems.length}</span>
                <span className="text-[10px] text-slate-500 ml-1">Barang Baru</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Item Sudah Ada di Katalog</span>
                <span className="text-xl font-mono font-black text-cyan-400">
                  {parsedImportItems.filter(p => items.some(it => it.name.toLowerCase().trim() === p.name.toLowerCase().trim())).length}
                </span>
                <span className="text-[10px] text-slate-500 ml-1">Nama Cocok</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status Validasi Kolom</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Siap Ditambahkan</span>
                </span>
              </div>
            </div>

            {/* Table of items to import */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/90 text-slate-400 uppercase text-[10px] font-bold sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5 text-center w-10">No</th>
                    <th className="px-3 py-2.5">Nama Barang</th>
                    <th className="px-3 py-2.5">Spesifikasi Detail</th>
                    <th className="px-3 py-2.5">Kategori</th>
                    <th className="px-3 py-2.5 text-center">Satuan</th>
                    <th className="px-3 py-2.5 text-right">Harga (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300 font-mono text-[11px]">
                  {parsedImportItems.slice(0, 50).map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="px-3 py-2 text-center text-slate-500">{idx + 1}</td>
                      <td className="px-3 py-2 font-bold text-white font-sans">{it.name}</td>
                      <td className="px-3 py-2 text-slate-400 text-[10px] font-sans max-w-xs truncate">{it.specification}</td>
                      <td className="px-3 py-2 text-cyan-300 font-sans">{it.category}</td>
                      <td className="px-3 py-2 text-center">{it.unit}</td>
                      <td className="px-3 py-2 text-right font-bold text-amber-300">
                        {it.lastPurchasePrice ? formatRupiah(it.lastPurchasePrice) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedImportItems.length > 50 && (
                <div className="p-3 text-center text-xs text-slate-500 bg-slate-900 border-t border-slate-800">
                  ...dan {parsedImportItems.length - 50} item lainnya akan dimasukkan bersamaan.
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 shrink-0">
              <div className="text-[11px] text-slate-400">
                Seluruh item akan otomatis mendapatkan kode SKU GMCC dan langsung tersedia pada modul PR/PO.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setShowImportModal(false); setParsedImportItems([]); }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Konfirmasi &amp; Simpan ({parsedImportItems.length} Item)</span>
                </button>
              </div>
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

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Klasifikasi COA Resmi GMCC *
                </label>
                <select
                  value={newItemCoaCategory}
                  onChange={(e) => setNewItemCoaCategory(e.target.value as 'BPP' | 'NON_BPP')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500 text-xs"
                >
                  <option value="BPP">BPP - Bahan Pokok Penjualan (Food &amp; Beverage / Dapur / Bar)</option>
                  <option value="NON_BPP">NON BPP - Perlengkapan Operasional / Cleaning / AV / MEP / ATK</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Klasifikasi ini menghubungkan barang dengan filter akun COA pada pembuatan PR baru.
                </p>
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

      {/* Modal: Edit Item & Spesifikasi (Dapat diakses Requestor, Admin, Purchasing) */}
      {showEditItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Edit Katalog Barang &amp; Spesifikasi</h3>
              </div>
              <button 
                onClick={() => setShowEditItemModal(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEditItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">SKU Barang</label>
                  <input
                    type="text"
                    value={editItemSku}
                    disabled
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategori Barang</label>
                  <input
                    type="text"
                    value={editItemCat}
                    onChange={(e) => setEditItemCat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Barang *</label>
                <input
                  type="text"
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Spesifikasi Detail / Standar Mutu *
                </label>
                <textarea
                  rows={3}
                  value={editItemSpec}
                  onChange={(e) => setEditItemSpec(e.target.value)}
                  placeholder="Merk, kemasan, kualitas, standar fresh/dry..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Klasifikasi COA Resmi GMCC *
                </label>
                <select
                  value={editItemCoaCategory}
                  onChange={(e) => setEditItemCoaCategory(e.target.value as 'BPP' | 'NON_BPP')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500 text-xs"
                >
                  <option value="BPP">BPP - Bahan Pokok Penjualan (Food &amp; Beverage / Dapur / Bar)</option>
                  <option value="NON_BPP">NON BPP - Perlengkapan Operasional / Cleaning / AV / MEP / ATK</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Klasifikasi ini menentukan apakah item muncul saat memilih COA BPP atau Non-BPP di PR baru.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Satuan *</label>
                  <input
                    type="text"
                    value={editItemUnit}
                    onChange={(e) => setEditItemUnit(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estimasi Harga Terakhir (Rp)</label>
                  <input
                    type="number"
                    value={editItemPrice}
                    onChange={(e) => setEditItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditItemModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Simpan Perubahan
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

              {/* Syarat Pembayaran Rekanan (Payment Term): Cash Purchase vs Credit */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2.5">
                <label className="block text-slate-300 font-semibold">Syarat Pembayaran Rekanan (Payment Term) *</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNewVenPaymentTerm('CASH_PURCHASE');
                      setNewVenCreditLimit(0);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      newVenPaymentTerm === 'CASH_PURCHASE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 ring-1 ring-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-xs block">💵 Cash Purchase</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Tunai / Kas Kecil (Langsung Lunas)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewVenPaymentTerm('CREDIT');
                      if (!newVenCreditLimit || newVenCreditLimit <= 0) setNewVenCreditLimit(50000000);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      newVenPaymentTerm === 'CREDIT'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/60 ring-1 ring-indigo-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-xs block">📑 Credit (Tempo)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Fasilitas Kredit Hutang Dagang (AP)</span>
                  </button>
                </div>

                {newVenPaymentTerm === 'CREDIT' && (
                  <div className="pt-2 border-t border-slate-700/60 animate-in fade-in">
                    <label className="block text-slate-300 font-semibold mb-1">
                      Plafon Batas Kredit (Credit Limit) dalam Rupiah *
                    </label>
                    <input
                      type="number"
                      value={newVenCreditLimit}
                      onChange={(e) => setNewVenCreditLimit(Number(e.target.value) || 0)}
                      placeholder="Contoh: 50000000"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-mono font-bold text-xs"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Nominal: <b>{formatRupiah(newVenCreditLimit)}</b>
                    </span>
                  </div>
                )}
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
