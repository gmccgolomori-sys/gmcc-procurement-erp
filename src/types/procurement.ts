export type UserRole = 
  | 'ADMIN' 
  | 'REQUESTOR' 
  | 'PURCHASING' 
  | 'DEPT_HEAD' 
  | 'GM' 
  | 'RECEIVING' 
  | 'MICE_OP' 
  | 'NUKA_OP';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  department: string;
  jobTitle?: string;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  password: string; // Password authentication
  pin?: string;
  email: string;
  signatureUrl?: string; // Digital signature image / data URL
  avatarUrl?: string;
  lastLogin?: string;
  createdAt?: string;
}

// Separate Department and Cost Center as 2 distinct master entities
export interface Department {
  id: string;
  code?: string;
  name: string;
  headOfDepartment: string;
  description?: string;
}

export type DepartmentCostCenter = Department; // Alias for backward compatibility

export interface CostCenter {
  id: string;
  code: string; // e.g., CC-FB-01
  name: string; // e.g., F&B Culinary Kitchen
  departmentName: string;
  budgetAllocation: number; // e.g., 250000000
  headOfDepartment?: string;
}

export interface ChartOfAccount {
  id: string;
  code: string; // e.g. COA-BPP, COA-NONBPP, COA-TRN, COA-EVT, COA-REE, COA-MEAL
  name: string; // e.g. BPP, NON BPP, Transport, Event Cost, Rental Equipment Event, Meal Employee
  category: string; // Operational, Logistics, Event, HR, General
  glAccountCode: string; // e.g. 732-001
  costCenterName?: string;
  description?: string;
  isActive: boolean;
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  category: 'Food & Beverage' | 'Dry Goods & Groceries' | 'Operating Supplies' | 'Engineering & MEP' | 'IT & Audio Visual';
  bankAccount: {
    bank: string;
    number: string;
    holder: string;
  };
  rating: number; // 1 - 5
}

export interface MasterItem {
  id: string;
  sku: string;
  name: string;
  specification?: string; // Kolom spesifikasi detail barang
  category: string;
  unit: string; // Dapat dipilih atau diisi custom sesuai kebutuhan
  lastPurchasePrice: number;
  lastPrice?: number; // Alias kompatibilitas
  departments: string[];
  stockQuantity: number;
  minimumStock: number;
}

export interface PRItemLine {
  id: string;
  itemId: string;
  itemName: string;
  specification?: string; // Spesifikasi detail/merk/tipe
  unit: string;
  quantityRequested: number;
  estimatedPrice: number;
  totalEstimated: number;
  costCenterName?: string; // Nama Cost Center (bukan hanya kode)
  coaId?: string; // ID Akun COA dari Master COA
  coaName?: string; // e.g. BPP, NON BPP, Transport, Event Cost, Rental Equipment Event, Meal Employee
  coaCode?: string; // e.g. COA-BPP, COA-NONBPP, etc.
  costControlCode?: string;
  costControlNotes?: string;
  notes?: string;
}

export type PRStatus = 
  | 'DRAFT'
  | 'WAITING_PURCHASING'
  | 'WAITING_FINANCE'
  | 'WAITING_HOD'
  | 'WAITING_GM'
  | 'APPROVED'
  | 'REJECTED'
  | 'PO_CREATED';

export interface PurchaseRequisition {
  id: string;
  prNumber: string; // e.g., PR/GMCC/2026/10/001
  requestDate: string;
  requiredDate: string;
  requesterId: string;
  requesterName: string;
  department: string;
  costCenterCode: string;
  costCenterName?: string;
  coaName?: string; // Default COA kategori pengajuan PR (e.g. BPP, NON BPP, Transport, dll.)
  coaCode?: string;
  costControlCode?: string;
  costControlReview?: string;
  suggestedVendorId?: string;
  suggestedVendorName?: string;
  purpose: string;
  items: PRItemLine[];
  subtotalEstimated: number;
  urgency: 'NORMAL' | 'URGENT' | 'CRITICAL' | 'EVENT_CRITICAL';
  status: PRStatus;
  approvalHistory: {
    stage: 'PURCHASING' | 'FINANCE' | 'HOD' | 'GM' | 'REQUISITION_REVISED';
    approverName: string;
    approvedAt: string;
    notes?: string;
  }[];
  rejectionReason?: string;
}

// ==========================================
// RECIPE COST CENTER & MENU ENGINEERING
// ==========================================
export interface RecipeIngredient {
  id: string;
  itemId: string; // References MasterItem
  itemName: string;
  specification?: string;
  unit: string; // e.g., KG, GRAM, LITER, ML, PCS
  quantity: number; // e.g. 0.25 (kg), 1 (pcs)
  unitCost: number; // pulled from MasterItem.lastPrice
  totalCost: number; // quantity * unitCost
}

export interface RecipeCostRecord {
  id: string;
  recipeCode?: string; // e.g. RCP-FB-001
  recipeName: string;
  category: string;
  costCenterId?: string;
  costCenterName: string;
  outlet: 'NUKA' | 'MICE' | 'ALL';
  portionYield?: number; // default 1 portion
  portions?: number; // alias
  ingredients: RecipeIngredient[];
  rawIngredientsCost?: number; // Biaya bahan baku mentah
  yieldLossPercent?: number; // Persentase yield / cooking / trimming loss diisi manual oleh Chef (%)
  yieldLossAmount?: number; // Nilai kerugian shrinkage / trimming
  effectiveRecipeCost?: number; // Biaya resep setelah yield loss
  totalRecipeCost: number; // total biaya resep (effective)
  costPerPortion?: number; // totalRecipeCost / portionYield
  portionCost?: number; // alias
  grossSellingPrice?: number; // Harga Jual Menu di POS/Buku Menu (termasuk 21% Tax & Service)
  taxAndServiceRate?: number; // 21% standar hospitality GMCC (10% PB1 + 11% Service)
  taxAndServiceAmount?: number; // Potongan 21%
  baseSellingPrice?: number; // Harga Dasar setelah dikurangi 21% Tax & Service
  sellingPrice: number; // Harga dasar acuan perhitungan food cost (IDR)
  actualFoodCostPercent?: number; // (costPerPortion / baseSellingPrice) * 100
  foodCostPercentage?: number; // alias
  targetFoodCostPercent?: number; // standard e.g. 30%
  targetCostPercentage?: number; // alias
  targetFoodCostAmount?: number; // baseSellingPrice * (targetFoodCostPercent / 100)
  recommendedSellingPrice?: number; // costPerPortion / (targetFoodCostPercent / 100)
  grossProfitPerPortion?: number; // baseSellingPrice - costPerPortion
  status: 'EXCELLENT' | 'HEALTHY' | 'HIGH' | 'CRITICAL' | 'WARNING' | 'ALERT';
  notes?: string;
  chefNotes?: string;
  lastUpdated: string;
}

export type POStatus = 'ISSUED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';

export interface POItemLine {
  id: string;
  itemId: string;
  itemName: string;
  specification?: string; // Spesifikasi detail barang
  unit: string;
  quantityOrdered: number;
  unitPrice: number;
  totalPrice: number;
  quantityReceived: number;
  outletDestination?: 'NUKA' | 'MICE';
  coaName?: string;
  coaCode?: string;
  costCenterName?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. PO/GMCC/2026/10/001
  prId: string;
  prNumber: string;
  orderDate: string;
  expectedDeliveryDate: string;
  vendorId: string;
  vendorName: string;
  vendorAddress: string;
  vendorPhone: string;
  deliveryAddress: string; // Kawasan GOLO MORI CONVENTION CENTER by ITDC, Labuan Bajo
  department: string;
  costCenterName?: string;
  coaName?: string;
  coaCode?: string;
  items: POItemLine[];
  subtotal: number;
  isTaxable?: boolean; // Ditentukan khusus oleh Purchasing: true = Kena PPN 11% (PKP), false = Bebas PPN (Non-PKP 0%)
  taxRate?: number; // 0.11 atau 0
  taxPpn: number; // Nilai PPN (0 jika Non-PKP)
  grandTotal: number;
  paymentTerms: string; // e.g. "Net 30 Days"
  paymentMethod?: 'PETTY_CASH' | 'AP_INVOICE' | 'COD_CASH' | 'BANK_TRANSFER';
  status: POStatus;
  signatures: {
    requestor: { name: string; date: string; signed: boolean; signatureUrl?: string }; // Ditambahkan: Requestor
    purchasingOfficer: { name: string; date: string; signed: boolean; signatureUrl?: string };
    financeManager: { name: string; date: string; signed: boolean; signatureUrl?: string };
    generalManager: { name: string; date: string; signed: boolean; signatureUrl?: string };
  };
}

export interface GoodsReceiptItem {
  itemId: string;
  itemName: string;
  specification?: string;
  unit: string;
  qtyOrdered: number;
  qtyReceived: number;
  qtyRejected: number;
  unitPricePO: number;
  unitPriceNota: number; // Audit harga terbaru sesuai nota
  totalPriceNota: number; // qtyReceived * unitPriceNota
  condition: 'Baik & Sesuai' | 'Sebagian Rusak' | 'Kadaluarsa';
  rejectionReason?: string;
  remarks?: string;
  outletDestination?: 'NUKA' | 'MICE';
  coaName?: string;
  coaCode?: string;
  costCenterName?: string;
}

export type ReceiptProofType = 
  | 'NOTA_KONTAN' 
  | 'KWITANSI' 
  | 'FAKTUR_PAJAK' 
  | 'FAKTUR_TAGIHAN'
  | 'INVOICE' 
  | 'STRUK_EDC' 
  | 'STRUK_KASIR' 
  | 'BUKTI_TRANSFER';

export interface GoodsReceipt {
  id: string;
  grnNumber: string; // GRN/GMCC/2026/10/001
  poId: string;
  poNumber: string;
  deliveryOrderNumber: string; // Nomor Surat Jalan / Nota Vendor
  receiptDate: string;
  receivedBy: string;
  vendorName: string;
  totalInvoiceAudited: number;
  items: GoodsReceiptItem[];
  notes?: string;
  // Bukti Nota / Kwitansi / Struk Fisik
  receiptProofNumber?: string;
  receiptProofDate?: string;
  receiptProofVendor?: string;
  receiptProofAmount?: number;
  receiptProofImage?: string;
  receiptProofType?: ReceiptProofType;
  receiptProofNotes?: string;
  paymentMethod?: 'PETTY_CASH' | 'AP_INVOICE' | 'COD_CASH';
  settlementStatus?: 'UNSETTLED' | 'SETTLED_PETTY_CASH';
  costCenterName?: string;
  coaName?: string;
  
  // Fitur PPh 23 (2%) & AP Aging (Hutang Dagang Rekanan)
  taxPPh23Applicable?: boolean;
  taxPPh23Rate?: number; // 0.02 (2%) atau 0
  taxPPh23Method?: 'DIPOTONG' | 'DITAMBAHKAN'; // Pilihan PPh: Dipotong (-2%) atau Ditambahkan (+2%)
  taxPPh23Amount?: number; // Nilai potongan/tambahan PPh 23 2%
  netPaymentAmount?: number; // Total bersih yang harus dibayar
  paymentStatus?: 'PAID' | 'UNPAID_AP'; // Sudah dibayar vs Masuk AP Aging Rekanan
  termsOfPayment?: string; // 'COD', 'NET 7', 'NET 14', 'NET 30', 'NET 45', 'NET 60'
  dueDate?: string; // Tanggal jatuh tempo hutang
  invoiceNumber?: string; // No. Faktur / Tagihan Rekanan
  paidDate?: string; // Tanggal pelunasan
  paymentReference?: string; // Referensi transfer BCA/Mandiri/dll
  paymentProofImage?: string; // Bukti transfer bank / kuitansi lunas
  paymentSourceBank?: string; // Rekening sumber bank GMCC
}

// Master Rekening Kas & Bank GMCC (untuk sumber dana pelunasan hutang)
export interface CompanyBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  purpose: string;
  currentBalance?: number;
  isActive: boolean;
}

// Role Access Control Helper: Hanya Purchasing, Head Finance, GM, dan Admin
export const hasRestrictedModuleAccess = (user: UserAccount | null): boolean => {
  if (!user) return false;
  const role = user.role;
  const dept = (user.department || '').toLowerCase();
  const title = (user.jobTitle || '').toLowerCase();
  
  if (role === 'ADMIN' || role === 'GM' || role === 'PURCHASING') return true;
  if ((role as any) === 'FINANCE') return true;
  if (dept.includes('finance') || dept.includes('accounting') || title.includes('finance') || title.includes('accounting') || title.includes('chief acc')) return true;
  return false;
};

export interface FoodFlashRecord {
  id: string;
  date: string; // YYYY-MM-DD
  // Nuka Restaurant
  nukaRevenue: number;
  nukaFoodCost: number; // Auto dari receiving outlet Nuka
  nukaFoodCostPercentage: number;
  // MICE Convention & Banquet
  miceRevenue: number;
  miceFoodCost: number; // Auto dari receiving outlet MICE
  miceFoodCostPercentage: number;
  // Gabungan Total GMCC
  combinedRevenue: number;
  combinedFoodCost: number;
  combinedFoodCostPercentage: number;
  targetFoodCostPercentage: number; // default 32%
  notes: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  module: string;
  details: string;
}

export interface GitHubSyncConfig {
  repoName: string;
  username: string;
  token?: string;
  description: string;
  isPrivate: boolean;
  branch: string;
  remoteUrl?: string;
  status: 'DISCONNECTED' | 'CONNECTED';
}

// ==========================================
// PETTY CASH & EXPENSE SETTLEMENT (COA & COST CENTER DRIVEN)
// ==========================================
export interface ExpenseReceiptProof {
  id: string;
  receiptNumber: string; // Nomor Nota / Kwitansi / Struk (e.g. NOTA/2026/04/001)
  date: string; // Tanggal Nota (YYYY-MM-DD or DD/MM/YYYY)
  vendorName: string; // Nama Toko / Vendor (e.g. Toko Sinar Pertama, Bintang Bangunan, Manna Print)
  amount: number; // Nilai Pengeluaran / Nota
  debit: number;
  kredit: number;
  department: string; // Kitchen, HK, Engineering, ATK, Banquet, Sales Kit, HC, NUKA, IT, Transport
  costCenterName?: string; // F&B Culinary Central Kitchen, NUKA, MICE, etc.
  coaName?: string; // BPP, NON BPP, Transport, Event Cost, Rental Equipment Event, Meal Employee, etc.
  glAccountCode: string; // e.g. 732-001, 702-003, 210-003, 622-022, 117-003
  glAccountName: string; // e.g. Kitchen Expense, Repairs & Maintenance, Laundry Expense
  description: string; // Keterangan transaksi / rincian barang
  proofImageUrl?: string; // Data URL or Image URL bukti fisik nota / transfer
  proofType: ReceiptProofType;
  jvNumber?: string; // Journal Voucher Number (e.g. JV/2604/001)
  sourceType: 'PO_RECEIVING' | 'DIRECT_PETTY_CASH';
  poNumber?: string;
  grnNumber?: string;
  paidBy?: string; // Nama staf penanggung jawab (e.g. Agus, Ahmad Suhendra)
  status: 'VERIFIED' | 'PENDING_AUDIT' | 'SETTLED';
}

export interface PettyCashSettlementPeriod {
  id: string;
  periodName: string; // e.g. "01 - 15 OKTOBER 2026"
  startDate: string; // 2026-10-01
  endDate: string; // 2026-10-15
  title: string; // "GOLOMORI PETTY CASH SETTLEMENT"
  currency: 'IDR';
  items: ExpenseReceiptProof[];
  totalDebit: number;
  totalKredit: number;
  status: 'DRAFT' | 'SETTLED' | 'VERIFIED' | 'APPROVED';
  coaFilter?: string; // 'ALL' | 'BPP' | 'NON BPP' | 'Transport' | 'Event Cost' | 'Rental Equipment Event' | 'Meal Employee'
  costCenterFilter?: string;
  maxLimit?: number; // 50000000 (Maks 50 jt)
  skippedDatesNote?: string;
  preparedBy: {
    name: string;
    title: string;
    date: string;
    signatureUrl?: string;
  };
  checkedBy?: {
    name: string;
    title: string;
    date: string;
    signatureUrl?: string;
  };
  approvedBy: {
    name: string;
    title: string;
    date: string;
    signatureUrl?: string;
  };
  notes?: string;
}
