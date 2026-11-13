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

export type OutletDestination = 'NUKA' | 'MICE' | 'NONE';

/**
 * Strict validator to check whether a COA represents BPP (Biaya Pokok Penjualan / Bahan Baku Makanan & Minuman).
 * CRITICAL: 'NON BPP' or 'COA-NONBPP' is explicitly NOT BPP.
 */
export const isStrictBppCoa = (coaName?: string, coaCode?: string): boolean => {
  const name = (coaName || '').trim().toUpperCase();
  const code = (coaCode || '').trim().toUpperCase();
  
  if (!name && !code) return false;
  
  // Explicitly reject anything containing 'NON' or 'NON BPP' or 'NON-BPP'
  if (name.includes('NON') || code.includes('NON')) return false;

  // Reject other standard non-food COAs
  if (name.includes('TRANSPORT') || code.includes('TRN')) return false;
  if (name.includes('EVENT') || code.includes('EVT')) return false;
  if (name.includes('RENTAL') || code.includes('REE')) return false;
  if (name.includes('MEAL') || code.includes('MEAL')) return false;
  if (name.includes('ENGINEERING') || name.includes('ATK') || name.includes('OFFICE')) return false;

  // Strictly check for BPP
  if (name === 'BPP' || code === 'COA-BPP' || name === 'BIAYA POKOK PENJUALAN' || name === 'BAHAN POKOK PENJUALAN') {
    return true;
  }
  
  return false;
};

/**
 * Validator to check whether a COA represents Event (e.g. Event Cost, COA-EVT).
 * USER REQUEST: COA Event bisa berupa BPP (bahan makanan/minuman) atau Non-BPP (perlengkapan/dekorasi),
 * sehingga memiliki 3 pilihan: NUKA, MICE, atau TIDAK KEDUANYA.
 */
export const isEventCoa = (coaName?: string, coaCode?: string): boolean => {
  const name = (coaName || '').trim().toUpperCase();
  const code = (coaCode || '').trim().toUpperCase();
  if (!name && !code) return false;

  return name.includes('EVENT') || code.includes('EVT');
};

/**
 * Determines whether an item or transaction enters Daily Food Flash:
 * 1. COA BPP: Selalu masuk Daily Food Flash (NUKA atau MICE)
 * 2. COA Event: HANYA masuk Daily Food Flash jika dipilih NUKA atau MICE. Jika dipilih 'NONE' (Tidak Keduanya), TIDAK MASUK!
 * 3. COA Lainnya (NON BPP, Transport, Rental, dll): DINONAKTIFKAN & TIDAK MASUK!
 */
export const isFoodFlashEligible = (
  coaName?: string,
  coaCode?: string,
  outletDestination?: OutletDestination | string
): { eligible: boolean; outlet?: 'NUKA' | 'MICE' } => {
  if (isStrictBppCoa(coaName, coaCode)) {
    const outlet = outletDestination === 'MICE' ? 'MICE' : 'NUKA';
    return { eligible: true, outlet };
  }

  if (isEventCoa(coaName, coaCode)) {
    if (outletDestination === 'NUKA') return { eligible: true, outlet: 'NUKA' };
    if (outletDestination === 'MICE') return { eligible: true, outlet: 'MICE' };
    // Jika 'NONE' atau belum dipilih, berarti non-BPP event, jangan masukkan ke Daily Food Flash!
    return { eligible: false };
  }

  return { eligible: false };
};

export type VendorPaymentTerm = 'CASH_PURCHASE' | 'CREDIT';

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
  paymentTerm: VendorPaymentTerm; // 'CASH_PURCHASE' (Tunai / Kas Kecil) atau 'CREDIT' (Tempo Hutang Dagang)
  creditLimit?: number; // Plafon kredit hutang (AP limit). Wajib jika paymentTerm === 'CREDIT'.
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
  coaCategory?: 'BPP' | 'NON_BPP' | string; // Klasifikasi COA resmi: 'BPP' atau 'NON_BPP'
  coaName?: string; // Nama COA opsional (e.g. BPP, NON BPP, Event Cost, dll.)
}

/**
 * Mendapatkan klasifikasi COA ('BPP' atau 'NON_BPP') dari MasterItem
 */
export const getItemCoaCategory = (item: MasterItem): 'BPP' | 'NON_BPP' => {
  if (item.coaCategory) {
    const c = item.coaCategory.toUpperCase();
    if (c.includes('NON')) return 'NON_BPP';
    if (c.includes('BPP')) return 'BPP';
  }
  if (item.coaName) {
    const cn = item.coaName.toUpperCase();
    if (cn.includes('NON')) return 'NON_BPP';
    if (cn.includes('BPP')) return 'BPP';
  }

  // Fallback berdasarkan kategori F&B / bahan makanan
  const bppCategories = [
    'dry', 'sayuran', 'rempah', 'fresh fruit', 'buah', 'dairy', 'alcohol', 'coffee & tea',
    'juice', 'mineral water', 'mixer', 'soft drink', 'sugar', 'sweetener', 'syrup', 'garnish bar',
    'daging & unggas', 'seafood segar', 'dry goods & groceries', 'sayuran & buah', 'beverage & bar', 'food & beverage'
  ];
  const cat = (item.category || '').toLowerCase().trim();
  if (bppCategories.some(c => c === cat || cat.includes(c))) {
    return 'BPP';
  }
  return 'NON_BPP';
};

/**
 * Filter barang katalog saat pembuatan PR Baru berdasarkan COA yang dipilih:
 * USER RULE:
 * 1. Kalau pilih COA BPP: barang yang tampil adalah BPP
 * 2. Kecuali Event BPP: pilihan itemnya BPP (outlet NUKA atau MICE)
 * 3. Non-BPP Event: pilihan itemnya Non-BPP (outlet NONE / Non-BPP)
 * 4. Meal Employee: ambil data BPP dan Non-BPP
 * 5. COA lainnya (Non-BPP, Transport, Rental, dll): barang Non-BPP
 */
export const filterItemsByCoa = (
  items: MasterItem[],
  coaName?: string,
  outletDestination?: OutletDestination
): MasterItem[] => {
  if (!coaName) return items;
  const name = coaName.toUpperCase().trim();

  // Aturan 4: Meal Employee -> Mengambil kedua data BPP dan Non-BPP
  if (name.includes('MEAL') || name.includes('DUTY MEAL') || name.includes('KARYAWAN')) {
    return items;
  }

  // Aturan 2: Event BPP -> Hanya item BPP
  // Berlaku jika nama COA eksplisit 'EVENT BPP' atau COA Event dengan outlet NUKA/MICE
  const isExplicitEventBpp = name.includes('EVENT') && name.includes('BPP') && !name.includes('NON');
  const isEventWithBppOutlet = isEventCoa(name) && (outletDestination === 'NUKA' || outletDestination === 'MICE');
  if (isExplicitEventBpp || isEventWithBppOutlet) {
    return items.filter(it => getItemCoaCategory(it) === 'BPP');
  }

  // Aturan 3: Non BPP Event -> Hanya item Non-BPP
  // Berlaku jika nama COA eksplisit 'NON BPP EVENT'/'EVENT NON BPP' atau COA Event dengan outlet NONE
  const isExplicitNonBppEvent = name.includes('EVENT') && name.includes('NON');
  const isEventWithNonBppOutlet = isEventCoa(name) && outletDestination === 'NONE';
  if (isExplicitNonBppEvent || isEventWithNonBppOutlet) {
    return items.filter(it => getItemCoaCategory(it) === 'NON_BPP');
  }

  // Aturan 1: COA BPP murni -> Hanya item BPP
  if (name === 'BPP' || (name.includes('BPP') && !name.includes('NON'))) {
    return items.filter(it => getItemCoaCategory(it) === 'BPP');
  }

  // Aturan 5: COA Non BPP atau operasional lainnya -> Hanya item Non-BPP
  if (name === 'NON BPP' || name.includes('NON') || name.includes('TRANSPORT') || name.includes('RENTAL') || name.includes('ENGINEERING')) {
    return items.filter(it => getItemCoaCategory(it) === 'NON_BPP');
  }

  // Default fallback jika COA lain
  return items;
};

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
  outletDestination?: OutletDestination; // Khusus BPP (NUKA/MICE) atau Event (NUKA/MICE/NONE)
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
  outletDestination?: OutletDestination; // Khusus BPP (NUKA/MICE) atau Event (NUKA/MICE/NONE)
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
    approverRole?: string;
    approvedAt: string;
    signatureUrl?: string; // Digital signature of the approver
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
  outletDestination?: OutletDestination;
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
  outletDestination?: OutletDestination;
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
  outletDestination?: OutletDestination;
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

export interface ReceiptProofItem {
  id: string;
  orderIndex: number; // 1, 2, 3... urutan foto nota
  proofNumber: string; // e.g. NOTA/2026/10/601-01 atau NOTA-01
  imageUrl: string;
  caption?: string;
  amount?: number;
  uploadedAt?: string;
}

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
  // Bukti Nota / Kwitansi / Struk Fisik (Mendukung upload banyak foto dengan nomor urut)
  receiptProofNumber?: string;
  receiptProofDate?: string;
  receiptProofVendor?: string;
  receiptProofAmount?: number;
  receiptProofImage?: string; // Foto nota utama / cover
  receiptProofImages?: string[]; // Kumpulan seluruh foto nota fisik
  receiptProofItems?: ReceiptProofItem[]; // Rincian lengkap foto nota dengan penomoran urut
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

// Role Access Control Helper: Khusus Tim IT & System Administrator (Panel Kanan / GitHub & Sistem IT)
export const hasItAdminAccess = (user: UserAccount | null): boolean => {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  const dept = (user.department || '').toLowerCase();
  const title = (user.jobTitle || '').toLowerCase();
  if (dept.includes('information technology') || /\bit\b/i.test(dept)) return true;
  if (title.includes('it administrator') || title.includes('it system') || /\bit\b/i.test(title)) return true;
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
  itdcInvoiceNumber?: string; // Nomor Invoice ITDC untuk track record lintas aplikasi (e.g. INV/GMCC-ITDC/2026/X-001)
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
  proofImageUrl?: string; // Data URL or Image URL bukti fisik nota / transfer utama
  proofImages?: string[]; // Kumpulan seluruh foto nota fisik
  receiptProofItems?: ReceiptProofItem[]; // Rincian lengkap foto nota dengan penomoran urut
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
  itdcInvoiceNumber?: string; // e.g. "INV/GMCC-ITDC/2026/X-001" (Wajib untuk sambungan track record lintas aplikasi)
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

// ==========================================
// FILE PENAGIHAN KAS KECIL TERKONFIRMASI (BAKU)
// ==========================================
export interface PettyCashBillingFile {
  id: string;
  fileNumber: string; // e.g. TAGIHAN/GMCC-PC/2026/10/001
  itdcInvoiceNumber?: string; // e.g. INV/GMCC-ITDC/2026/X-001 (Wajib untuk sambungan track record lintas aplikasi)
  periodName: string; // e.g. "01 - 15 OKTOBER 2026"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  title: string; // BERKAS PENAGIHAN KAS KECIL OPERASIONAL GMCC
  coaCategory?: string; // BPP, NON BPP, ALL
  items: ExpenseReceiptProof[];
  totalAmount: number; // Tidak lebih dari 50 Juta
  itemCount: number;
  confirmedAt: string;
  confirmedBy: {
    name: string;
    role: string;
    jobTitle?: string;
    signatureUrl?: string;
  };
  billingStatus: 'SIAP_DITAGIHKAN' | 'PROSES_VERIFIKASI' | 'DICAIRKAN' | 'SELESAI';
  disbursementBank?: string;
  disbursementDate?: string;
  disbursementRef?: string;
  notes?: string;
}

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export const toRomanMonth = (monthOneBased: number): string => {
  const idx = Math.max(0, Math.min(11, (Number(monthOneBased) || 1) - 1));
  return ROMAN_MONTHS[idx] || 'I';
};

export const formatItdcInvoiceNumber = (year: number, monthOneBased: number, seq: number): string => {
  const safeYear = year || new Date().getFullYear();
  const roman = toRomanMonth(monthOneBased || new Date().getMonth() + 1);
  const seqStr = String(Math.max(1, seq || 1)).padStart(3, '0');
  return `INV/GMCC-ITDC/${safeYear}/${roman}-${seqStr}`;
};

// Batas maksimal pembuatan 1 dokumen Purchase Requisition (PR) agar batch Petty Cash (Rp 50.000.000) tetap aman
export const MAX_PR_LIMIT = 40_000_000;

