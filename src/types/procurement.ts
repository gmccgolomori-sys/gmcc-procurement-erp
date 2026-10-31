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
  password: string; // Password authentication
  pin?: string;
  email: string;
  signatureUrl?: string; // Digital signature image / data URL
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
  items: POItemLine[];
  subtotal: number;
  taxPpn: number; // 11% PPN
  grandTotal: number;
  paymentTerms: string; // e.g. "Net 30 Days"
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
}

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
