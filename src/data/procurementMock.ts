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
  CompanyBankAccount
} from '../types/procurement';
import { GMCC_CATALOG_101_ITEMS } from './gmccCatalogItems';

export const OFFICIAL_GMCC_ADDRESS = "Kawasan GOLO MORI CONVENTION CENTER by ITDC, Golo Mori, Labuan Bajo, Kabupaten Manggarai Barat, Nusa Tenggara Timur 86763";

// SVG Preset Signature Badges for Official Documents
export const SAMPLE_SIGNATURES = {
  CHEF: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='65' viewBox='0 0 180 65'><path d='M20 42 Q35 8, 50 35 T90 22 T135 38 T165 18' fill='none' stroke='%230284c7' stroke-width='2.5' stroke-linecap='round'/><circle cx='120' cy='32' r='2' fill='%230284c7'/><text x='20' y='56' font-family='sans-serif' font-size='9' font-weight='bold' fill='%2364748b'>I. Riky - Head Chef</text></svg>",
  PURCHASING: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='65' viewBox='0 0 180 65'><path d='M18 45 C35 12, 55 10, 70 38 S110 18, 140 28 S160 15, 168 38' fill='none' stroke='%230f766e' stroke-width='2.5' stroke-linecap='round'/><text x='18' y='56' font-family='sans-serif' font-size='9' font-weight='bold' fill='%2364748b'>Siti Handayani (Procurement)</text></svg>",
  FINANCE: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='65' viewBox='0 0 180 65'><path d='M15 38 C32 8, 52 16, 65 46 S102 12, 132 36 S155 24, 165 42' fill='none' stroke='%234338ca' stroke-width='2.5' stroke-linecap='round'/><text x='15' y='56' font-family='sans-serif' font-size='9' font-weight='bold' fill='%2364748b'>Agus Setiabudi (Chief Acc)</text></svg>",
  GM: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='65' viewBox='0 0 180 65'><path d='M16 48 C32 10, 48 5, 65 32 S115 6, 138 36 S155 8, 168 40' fill='none' stroke='%23b45309' stroke-width='3' stroke-linecap='round'/><text x='16' y='56' font-family='sans-serif' font-size='9' font-weight='bold' fill='%23b45309'>Ari Soplanit (General Manager)</text></svg>",
  ADMIN: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='65' viewBox='0 0 180 65'><path d='M20 40 Q40 10, 60 35 T100 20 T140 40 T160 15' fill='none' stroke='%236366f1' stroke-width='2.5' stroke-linecap='round'/><text x='20' y='56' font-family='sans-serif' font-size='9' font-weight='bold' fill='%2364748b'>Admin IT Systems</text></svg>",
  AGUS_ACCOUNTING: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='65' viewBox='0 0 180 65'><path d='M18 42 C30 15, 45 12, 60 40 S100 10, 130 35 S155 20, 168 36' fill='none' stroke='%230369a1' stroke-width='2.5' stroke-linecap='round'/><text x='18' y='56' font-family='sans-serif' font-size='9' font-weight='bold' fill='%230369a1'>Agus Setiabudi - Chief Acc</text></svg>",
  PUTU_OPERATION: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='65' viewBox='0 0 180 65'><path d='M20 44 C35 18, 50 25, 75 16 S120 42, 145 22 S165 30, 170 38' fill='none' stroke='%23047857' stroke-width='2.5' stroke-linecap='round'/><text x='20' y='56' font-family='sans-serif' font-size='9' font-weight='bold' fill='%23047857'>I Putu Ari Suyoga - Op Head</text></svg>",
  ARI_GM: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='65' viewBox='0 0 180 65'><path d='M15 46 C32 12, 52 8, 70 35 S118 8, 142 32 S158 14, 170 42' fill='none' stroke='%23b45309' stroke-width='3' stroke-linecap='round'/><text x='15' y='56' font-family='sans-serif' font-size='9' font-weight='bold' fill='%23b45309'>Ari Soplanit (General Manager)</text></svg>"
};

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'u-1',
    username: 'admin',
    name: 'Executive IT Administrator',
    role: 'ADMIN',
    department: 'Information Technology & AV',
    jobTitle: 'Senior Systems & Network Administrator',
    phone: '+62 812-3456-7890',
    status: 'ACTIVE',
    password: 'admin123',
    pin: '123456',
    email: 'gmccgolomori@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    signatureUrl: SAMPLE_SIGNATURES.ADMIN,
    createdAt: '2026-01-01',
    lastLogin: 'Hari ini, 08:30 WITA'
  },
  {
    id: 'u-gm',
    username: 'ari_gm',
    name: 'Ari Soplanit',
    role: 'GM',
    department: 'Executive Office',
    jobTitle: 'General Manager GOLO MORI CONVENTION CENTER',
    phone: '+62 811-9876-5432',
    status: 'ACTIVE',
    password: 'gm123',
    pin: '123456',
    email: 'ari.soplanit@golomori.id',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    signatureUrl: SAMPLE_SIGNATURES.ARI_GM,
    createdAt: '2026-01-01',
    lastLogin: 'Hari ini, 09:15 WITA'
  },
  {
    id: 'u-agus',
    username: 'agus_finance',
    name: 'Lalu Agus SetiaBudi',
    role: 'DEPT_HEAD',
    department: 'Finance & Supply Chain',
    jobTitle: 'Chief Accounting / Finance Dept Head',
    phone: '+62 813-2345-6789',
    status: 'ACTIVE',
    password: 'finance123',
    pin: '123456',
    email: 'agus.setiabudi@golomori.id',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    signatureUrl: SAMPLE_SIGNATURES.AGUS_ACCOUNTING,
    createdAt: '2026-01-01',
    lastLogin: 'Hari ini, 09:40 WITA'
  },
  {
    id: 'u-putu',
    username: 'putu_operation',
    name: 'I Putu Ari Suyoga',
    role: 'DEPT_HEAD',
    department: 'Operations & MICE',
    jobTitle: 'Operation The Nusa Dua Department Head',
    phone: '+62 812-7654-3210',
    status: 'ACTIVE',
    password: 'putu123',
    pin: '123456',
    email: 'putu.suyoga@golomori.id',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    signatureUrl: SAMPLE_SIGNATURES.PUTU_OPERATION,
    createdAt: '2026-01-05',
    lastLogin: 'Kemarin, 16:20 WITA'
  },
  {
    id: 'u-purchasing',
    username: 'purchasing',
    name: 'Siti Handayani',
    role: 'PURCHASING',
    department: 'Purchasing & Supply Chain',
    jobTitle: 'Purchasing & Supply Chain Manager',
    phone: '+62 821-4321-8765',
    status: 'ACTIVE',
    password: 'purchasing123',
    pin: '123456',
    email: 'purchasing@golomori.id',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    signatureUrl: SAMPLE_SIGNATURES.PURCHASING,
    createdAt: '2026-01-02',
    lastLogin: 'Hari ini, 10:05 WITA'
  },
  {
    id: 'u-receiving',
    username: 'receiving',
    name: 'Fransiscus Doni',
    role: 'PURCHASING',
    department: 'Purchasing & Supply Chain',
    jobTitle: 'Goods Receiving & Inventory Officer',
    phone: '+62 852-6789-0123',
    status: 'ACTIVE',
    password: 'receiving123',
    pin: '123456',
    email: 'receiving@golomori.id',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    signatureUrl: SAMPLE_SIGNATURES.PURCHASING,
    createdAt: '2026-01-10',
    lastLogin: 'Hari ini, 11:20 WITA'
  },
  {
    id: 'u-chef',
    username: 'requestor_chef',
    name: 'Ignatius Riky',
    role: 'REQUESTOR',
    department: 'Food & Beverage',
    jobTitle: 'Executive Chef GOLO MORI & NUKA',
    phone: '+62 812-9988-7766',
    status: 'ACTIVE',
    password: 'chef123',
    pin: '123456',
    email: 'chef.riky@golomori.id',
    avatarUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&auto=format&fit=crop&q=80',
    signatureUrl: SAMPLE_SIGNATURES.CHEF,
    createdAt: '2026-01-03',
    lastLogin: 'Hari ini, 07:45 WITA'
  },
  {
    id: 'u-engineering',
    username: 'engineering',
    name: 'Ahmad Suhendra',
    role: 'REQUESTOR',
    department: 'Engineering, Utilities & MEP',
    jobTitle: 'Chief Engineer & MEP Supervisor',
    phone: '+62 813-5566-7788',
    status: 'ACTIVE',
    password: 'eng123',
    pin: '123456',
    email: 'ahmad.suhendra@golomori.id',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    signatureUrl: SAMPLE_SIGNATURES.PURCHASING,
    createdAt: '2026-01-12',
    lastLogin: 'Kemarin, 14:10 WITA'
  },
  {
    id: 'u-mice',
    username: 'mice_op',
    name: 'Melania Sari',
    role: 'MICE_OP',
    department: 'MICE & Event Operations',
    jobTitle: 'MICE Convention & Banquet Lead',
    phone: '+62 811-2233-4455',
    status: 'ACTIVE',
    password: 'mice123',
    pin: '123456',
    email: 'mice.op@golomori.id',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    signatureUrl: SAMPLE_SIGNATURES.CHEF,
    createdAt: '2026-01-08',
    lastLogin: '2 hari yang lalu'
  },
  {
    id: 'u-nuka',
    username: 'nuka_op',
    name: 'Stefanus Gaku',
    role: 'NUKA_OP',
    department: 'Food & Beverage',
    jobTitle: 'NUKA BEACH CLUB Supervisor',
    phone: '+62 813-8899-0011',
    status: 'ACTIVE',
    password: 'nuka123',
    pin: '123456',
    email: 'nuka.op@golomori.id',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    signatureUrl: SAMPLE_SIGNATURES.CHEF,
    createdAt: '2026-01-15',
    lastLogin: 'Hari ini, 10:50 WITA'
  }
];

// Master Departemen (Separate from Cost Center)
export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Food & Beverage Department', headOfDepartment: 'Laurentius Bram', description: 'Divisi operasional F&B, Culinary Kitchen, dan NUKA BEACH CLUB' },
  { id: 'dept-2', name: 'MICE & Event Operations', headOfDepartment: 'Melania Sari', description: 'Operasional konvensi, ballroom, ruang konferensi KTT & pameran' },
  { id: 'dept-3', name: 'Housekeeping & Facilities', headOfDepartment: 'Fransiskus Tobi', description: 'Kebersihan, sanitasi, dan fasilitas publik Kawasan GOLO MORI CONVENTION CENTER' },
  { id: 'dept-4', name: 'Engineering, Utilities & MEP', headOfDepartment: 'Arif Wahyudi', description: 'Pemeliharaan genset, pendingin, listrik, air & kelistrikan gedung' },
  { id: 'dept-5', name: 'Information Technology & AV', headOfDepartment: 'Hendrikus Dula', description: 'Infrastruktur jaringan internet, audio visual & sistem komputer' },
  { id: 'dept-6', name: 'Finance & Supply Chain', headOfDepartment: 'Laurentius Bram', description: 'Purchasing, akuntansi, budgeting, dan manajemen vendor' },
  { id: 'dept-7', name: 'Executive Office & HR', headOfDepartment: 'Bonaventura D. Santosa', description: 'Manajemen umum, legal, hubungan masyarakat, dan kepatuhan' }
];

// Master Cost Center (Separate entity with code, name, and budget allocation)
export const INITIAL_COST_CENTERS: CostCenter[] = [
  { id: 'cc-1', code: 'CC-FB-01', name: 'F&B Culinary Central Kitchen', departmentName: 'Food & Beverage Department', budgetAllocation: 350000000, headOfDepartment: 'Ignatius Riky' },
  { id: 'cc-2', code: 'CC-FB-02', name: 'NUKA BEACH CLUB', departmentName: 'Food & Beverage Department', budgetAllocation: 250000000, headOfDepartment: 'Stefanus Gaku' },
  { id: 'cc-3', code: 'CC-MICE-01', name: 'MICE Convention & Banquet Events', departmentName: 'MICE & Event Operations', budgetAllocation: 500000000, headOfDepartment: 'Melania Sari' },
  { id: 'cc-4', code: 'CC-HK-01', name: 'Housekeeping Public Areas & Linen', departmentName: 'Housekeeping & Facilities', budgetAllocation: 120000000, headOfDepartment: 'Fransiskus Tobi' },
  { id: 'cc-5', code: 'CC-ENG-01', name: 'Engineering, Utilities & MEP Hub', departmentName: 'Engineering, Utilities & MEP', budgetAllocation: 280000000, headOfDepartment: 'Arif Wahyudi' },
  { id: 'cc-6', code: 'CC-IT-01', name: 'IT Infrastructure & Sound Systems', departmentName: 'Information Technology & AV', budgetAllocation: 150000000, headOfDepartment: 'Hendrikus Dula' },
  { id: 'cc-7', code: 'CC-ADM-01', name: 'Executive Office & General Administration', departmentName: 'Executive Office & HR', budgetAllocation: 200000000, headOfDepartment: 'Bonaventura D. Santosa' }
];

// Master Chart of Accounts (COA) resmi GMCC
export const INITIAL_CHART_OF_ACCOUNTS: ChartOfAccount[] = [
  {
    id: 'coa-1',
    code: 'COA-BPP',
    name: 'BPP',
    category: 'Operational Procurement',
    glAccountCode: '732-001',
    costCenterName: 'F&B Culinary Central Kitchen',
    description: 'Bukti Pengeluaran Pembelian (Belanja barang operasional via PO & Receiving GRN)',
    isActive: true
  },
  {
    id: 'coa-2',
    code: 'COA-NONBPP',
    name: 'NON BPP',
    category: 'Direct Operational',
    glAccountCode: '732-002',
    costCenterName: 'Housekeeping Public Areas & Linen',
    description: 'Non-BPP Pengeluaran Langsung Kas Kecil Harian Operasional Lapangan',
    isActive: true
  },
  {
    id: 'coa-3',
    code: 'COA-TRN',
    name: 'Transport',
    category: 'Logistics & Fleet',
    glAccountCode: '741-001',
    costCenterName: 'Transportation & Fleet GMCC',
    description: 'Biaya BBM Kendaraan Operasional, Tol, Tiket, Sewa Shuttle & Transportasi Tamu/Staf',
    isActive: true
  },
  {
    id: 'coa-4',
    code: 'COA-EVT',
    name: 'Event Cost',
    category: 'MICE & Banquet',
    glAccountCode: '752-001',
    costCenterName: 'MICE Convention & Banquet Events',
    description: 'Biaya Langsung Pelaksanaan Event, Dekorasi, Pengisi Acara & Logistik MICE GMCC',
    isActive: true
  },
  {
    id: 'coa-5',
    code: 'COA-REE',
    name: 'Rental Equipment Event',
    category: 'MICE & Equipment',
    glAccountCode: '752-002',
    costCenterName: 'MICE Convention & Banquet Events',
    description: 'Biaya Sewa Alat Audio Visual, Sound System, Lighting, Panggung & Rigging Event',
    isActive: true
  },
  {
    id: 'coa-6',
    code: 'COA-MEAL',
    name: 'Meal Employee',
    category: 'Human Capital & Staff',
    glAccountCode: '761-001',
    costCenterName: 'Executive Office & General Administration',
    description: 'Uang Makan Karyawan Lembur, Shift Operasional Event & Konsumsi Internal GMCC',
    isActive: true
  }
];

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'ven-1',
    code: 'VND-001',
    name: 'PT Flores Fresh Agro Mandiri',
    contactPerson: 'Emanuel Sura',
    phone: '0812-3982-1100',
    email: 'sales@floresfresh.com',
    address: 'Jl. Trans Flores KM 4, Ruteng, Manggarai, NTT',
    city: 'Ruteng',
    category: 'Food & Beverage',
    bankAccount: { bank: 'Bank Mandiri', number: '161-00-998877-1', holder: 'PT Flores Fresh Agro Mandiri' },
    rating: 5,
    paymentTerm: 'CREDIT',
    creditLimit: 100000000
  },
  {
    id: 'ven-2',
    code: 'VND-002',
    name: 'CV Komodo Bahari Sejahtera',
    contactPerson: 'Haji Rusli',
    phone: '0813-4455-8899',
    email: 'order@komodobahari.co.id',
    address: 'Pelabuhan Perikanan Labuan Bajo, Manggarai Barat',
    city: 'Labuan Bajo',
    category: 'Food & Beverage',
    bankAccount: { bank: 'Bank BRI', number: '0281-01-002938-50-2', holder: 'CV Komodo Bahari Sejahtera' },
    rating: 5,
    paymentTerm: 'CREDIT',
    creditLimit: 75000000
  },
  {
    id: 'ven-3',
    code: 'VND-003',
    name: 'PT Bali Gourmet Prima (Denpasar-Labuan Bajo)',
    contactPerson: 'Ni Made Ayu',
    phone: '0361-729900',
    email: 'logistics@baligourmet.com',
    address: 'Benoa Port Logistics, Denpasar & Hub Labuan Bajo',
    city: 'Denpasar',
    category: 'Food & Beverage',
    bankAccount: { bank: 'Bank BCA', number: '040-281-9922', holder: 'PT Bali Gourmet Prima' },
    rating: 5,
    paymentTerm: 'CREDIT',
    creditLimit: 150000000
  },
  {
    id: 'ven-4',
    code: 'VND-004',
    name: 'CV Manggarai Surya Elektrik',
    contactPerson: 'Markus Watu',
    phone: '0821-4477-9911',
    email: 'surya.elektrik@gmail.com',
    address: 'Jl. Soekarno Hatta No. 45, Labuan Bajo',
    city: 'Labuan Bajo',
    category: 'Engineering & MEP',
    bankAccount: { bank: 'Bank BNI', number: '038-192-8374', holder: 'CV Manggarai Surya Elektrik' },
    rating: 4,
    paymentTerm: 'CREDIT',
    creditLimit: 50000000
  },
  {
    id: 'ven-5',
    code: 'VND-005',
    name: 'PT Nusa Pratama Hospitality Linen',
    contactPerson: 'David Sutanto',
    phone: '031-849920',
    email: 'order@nusapratama.co.id',
    address: 'Kawasan Rungkut Industri III, Surabaya, Jawa Timur',
    city: 'Surabaya',
    category: 'Operating Supplies',
    bankAccount: { bank: 'Bank BCA', number: '216-098-7711', holder: 'PT Nusa Pratama Hospitality' },
    rating: 5,
    paymentTerm: 'CREDIT',
    creditLimit: 80000000
  },
  {
    id: 'ven-felly',
    code: 'VND-006',
    name: 'Suplayer Fely (Bu Felly)',
    contactPerson: 'Ibu Felly',
    phone: '082 145 681 174',
    email: 'suplayerfely.bajo@gmail.com',
    address: 'Jl. Pasar Baru Sentral, Labuan Bajo, Manggarai Barat, NTT',
    city: 'Labuan Bajo',
    category: 'Food & Beverage',
    bankAccount: { bank: 'Bank BRI', number: '4612-01-008921-53-4', holder: 'Felly Suplayer Sayur Segar' },
    rating: 5,
    paymentTerm: 'CASH_PURCHASE',
    creditLimit: 0 // Non-Credit Limit (Tunai / Kas Kecil)
  },
  {
    id: 'ven-bali-print',
    code: 'VND-007',
    name: 'Bali Printing & Creative Advertising',
    contactPerson: 'Wayan Suartana',
    phone: '0361-892100',
    email: 'order@baliprinting.com',
    address: 'Jl. Teuku Umar No. 88, Denpasar, Bali',
    city: 'Denpasar',
    category: 'Operating Supplies',
    bankAccount: { bank: 'Bank BCA', number: '772-019-8231', holder: 'PT Bali Printing Creative' },
    rating: 5,
    paymentTerm: 'CREDIT',
    creditLimit: 30000000
  },
  {
    id: 'ven-theresa',
    code: 'VND-008',
    name: 'Toko Theresa Mart Labuan Bajo',
    contactPerson: 'Theresa Lin',
    phone: '0813-9821-4433',
    email: 'theresamart.bajo@gmail.com',
    address: 'Jl. Frans Nala No. 12, Labuan Bajo',
    city: 'Labuan Bajo',
    category: 'Dry Goods & Groceries',
    bankAccount: { bank: 'Bank Mandiri', number: '161-00-554433-2', holder: 'Toko Theresa Mart' },
    rating: 4,
    paymentTerm: 'CASH_PURCHASE',
    creditLimit: 0 // Non-Credit Limit (Tunai / Kas Kecil)
  }
];

export const INITIAL_ITEMS: MasterItem[] = [
  ...GMCC_CATALOG_101_ITEMS,
  {
    id: 'item-1',
    sku: 'FB-BEEF-001',
    name: 'Daging Sapi Tenderloin Meltique Premium',
    specification: 'Grade MB4+, kemasan vakum pack 2kg, sertifikat Halal resmi MUI, cold chain 2-4°C',
    category: 'Daging & Unggas',
    unit: 'KG',
    lastPurchasePrice: 285000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 45,
    minimumStock: 20
  },
  {
    id: 'item-2',
    sku: 'FB-FISH-002',
    name: 'Ikan Salmon Segar Fillet (Norwegian)',
    specification: 'Fresh air-flown Norwegian Salmon, fillet skin-on, tanpa tulang pin-bone out',
    category: 'Seafood Segar',
    unit: 'KG',
    lastPurchasePrice: 340000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 30,
    minimumStock: 15
  },
  {
    id: 'item-3',
    sku: 'FB-VEG-003',
    name: 'Sayur Organik Mix Segar Ruteng (Selada & Tomat Cherry)',
    specification: 'Pertanian hidroponik dingin dataran Ruteng, daun renyah bersih, grade A',
    category: 'Sayuran & Buah',
    unit: 'KG',
    lastPurchasePrice: 35000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 60,
    minimumStock: 25
  },
  {
    id: 'item-4',
    sku: 'FB-COF-004',
    name: 'Biji Kopi Arabika Bajawa Flores Specialty (Medium Roast)',
    specification: 'Single origin 100% Arabika Bajawa, cupping score > 84, medium roast, roast date < 14 hari',
    category: 'Beverage & Bar',
    unit: 'KG',
    lastPurchasePrice: 165000,
    departments: ['Food & Beverage Department', 'MICE & Event Operations'],
    stockQuantity: 80,
    minimumStock: 30
  },
  {
    id: 'item-5',
    sku: 'FB-GROC-005',
    name: 'Beras Ramos Super Premium Pandan Wangi (25kg)',
    specification: 'Beras bulir utuh patahan < 5%, pulen harum wangi alami, karung laminasi 25kg',
    category: 'Dry Goods & Groceries',
    unit: 'BOX',
    lastPurchasePrice: 420000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 25,
    minimumStock: 10
  },
  {
    id: 'item-6',
    sku: 'ENG-LAMP-006',
    name: 'Lampu LED Downlight 18W Philips (Auditorium & Ballroom)',
    specification: 'Philips SmartBright LED 18W, 4000K Neutral White, Dimmable 0-10V, IP44',
    category: 'Engineering & MEP',
    unit: 'PCS',
    lastPurchasePrice: 85000,
    departments: ['Engineering, Utilities & MEP'],
    stockQuantity: 50,
    minimumStock: 20
  },
  {
    id: 'item-7',
    sku: 'HK-CHEM-007',
    name: 'Multi-Surface Floor Sanitizer & Disinfectant (5 Liter)',
    specification: 'Ecolab Floor Sanitizer konsentrat 1:120, aroma lavender, izin Kemenkes RI',
    category: 'Chemical & Cleaning',
    unit: 'CAN',
    lastPurchasePrice: 195000,
    departments: ['Housekeeping & Facilities'],
    stockQuantity: 40,
    minimumStock: 15
  },
  {
    id: 'item-felly-1',
    sku: 'FB-VEG-FELLY01',
    name: 'Tomat Segar Pilihan Grade A (Bu Felly)',
    specification: 'Tomat merah segar buah padat pilihan, kemasan peti kayu 10kg, bersih',
    category: 'Sayuran & Buah',
    unit: 'KG',
    lastPurchasePrice: 18000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 120,
    minimumStock: 30
  },
  {
    id: 'item-felly-2',
    sku: 'FB-VEG-FELLY02',
    name: 'Bawang Bombay Impor Pilihan Super',
    specification: 'Bawang bombay kulit bersih kering, diameter 7-9cm, kemasan karung jaring 20kg',
    category: 'Sayuran & Buah',
    unit: 'KG',
    lastPurchasePrice: 32000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 90,
    minimumStock: 25
  },
  {
    id: 'item-felly-3',
    sku: 'FB-VEG-FELLY03',
    name: 'Nenas Madu Manis Super Khas NTT',
    specification: 'Nenas madu matang pohon, rasa manis segar, bebas memar, kemasan krat 15 buah',
    category: 'Sayuran & Buah',
    unit: 'PCS',
    lastPurchasePrice: 15000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 65,
    minimumStock: 20
  },
  {
    id: 'item-felly-4',
    sku: 'FB-VEG-FELLY04',
    name: 'Melon Hijau Manis Segar (Honeydew)',
    specification: 'Melon grade super, jaring rapat rapi, berat 1.8 - 2.2 kg/buah',
    category: 'Sayuran & Buah',
    unit: 'KG',
    lastPurchasePrice: 24000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 50,
    minimumStock: 15
  },
  {
    id: 'item-felly-5',
    sku: 'FB-VEG-FELLY05',
    name: 'Cabe Merah Keriting Segar Super',
    specification: 'Cabe merah keriting pedas segar, tangkai hijau, sortiran bebas busuk',
    category: 'Sayuran & Buah',
    unit: 'KG',
    lastPurchasePrice: 65000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 40,
    minimumStock: 10
  },
  {
    id: 'item-bpp-chick',
    sku: 'FB-MEAT-CHICK01',
    name: 'Ayam Broiler Karkas Bersih Utuh (1.2 - 1.4 kg)',
    specification: 'Karkas ayam segar dingin Halal MUI, tanpa jeroan & kepala, higienis',
    category: 'Daging & Unggas',
    unit: 'KG',
    lastPurchasePrice: 48000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 80,
    minimumStock: 30
  },
  {
    id: 'item-mice-kit',
    sku: 'MICE-KIT-01',
    name: 'MICE Delegate Conference Kit & Booklet Agenda GMCC',
    specification: 'Tas goody bag kanvas GMCC, notebook agenda hardcover, ballpoint eksklusif, booklet profil',
    category: 'MICE Supplies',
    unit: 'SET',
    lastPurchasePrice: 75000,
    departments: ['MICE & Event Operations'],
    stockQuantity: 300,
    minimumStock: 50
  },
  {
    id: 'item-trn-pertamax',
    sku: 'TRN-BBM-PERT',
    name: 'BBM Pertamax Operasional Shuttle Bus Tamu VIP',
    specification: 'BBM Ron 92 SPBU Pertamina Komodo untuk armada shuttle bus GMCC',
    category: 'Logistics & Fleet',
    unit: 'LITER',
    lastPurchasePrice: 13700,
    departments: ['Operations & MICE'],
    stockQuantity: 500,
    minimumStock: 100
  },
  {
    id: 'item-felly-6',
    sku: 'FB-VEG-FELLY06',
    name: 'Bawang Merah Bima Super Pilihan',
    specification: 'Bawang merah Bima kering tua, umbi padat merah keunguan, kemasan karung 15kg',
    category: 'Sayuran & Buah',
    unit: 'KG',
    lastPurchasePrice: 38000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 75,
    minimumStock: 20
  },
  {
    id: 'item-felly-7',
    sku: 'FB-VEG-FELLY07',
    name: 'Bawang Putih Kating Super Bersih',
    specification: 'Bawang putih kating siung besar, aroma kuat bersih tanpa tanah, karung 20kg',
    category: 'Sayuran & Buah',
    unit: 'KG',
    lastPurchasePrice: 45000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 80,
    minimumStock: 25
  },
  {
    id: 'item-felly-8',
    sku: 'FB-VEG-FELLY08',
    name: 'Wortel Segar Manis Brastagi / Ruteng',
    specification: 'Wortel segar lurus bersih tanpa daun, kemasan kantong 10kg, grade super',
    category: 'Sayuran & Buah',
    unit: 'KG',
    lastPurchasePrice: 22000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 60,
    minimumStock: 15
  },
  {
    id: 'item-felly-9',
    sku: 'FB-VEG-FELLY09',
    name: 'Kentang Granola Super Dieng / Flores',
    specification: 'Kentang granola umbi bulat mulus ukuran sedang-besar, karung 25kg',
    category: 'Sayuran & Buah',
    unit: 'KG',
    lastPurchasePrice: 26000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 100,
    minimumStock: 30
  },
  {
    id: 'item-felly-10',
    sku: 'FB-VEG-FELLY10',
    name: 'Jeruk Nipis Segar Peras',
    specification: 'Jeruk nipis kulit tipis banyak air, segar petik pohon, kemasan krat 10kg',
    category: 'Sayuran & Buah',
    unit: 'KG',
    lastPurchasePrice: 25000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 40,
    minimumStock: 15
  },
  {
    id: 'item-felly-11',
    sku: 'FB-VEG-FELLY11',
    name: 'Daun Bawang & Seledri Segar Ruteng',
    specification: 'Daun bawang batang putih kokoh dan seledri daun rimbun wangi segar',
    category: 'Sayuran & Buah',
    unit: 'KG',
    lastPurchasePrice: 28000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 30,
    minimumStock: 10
  },
  {
    id: 'item-felly-12',
    sku: 'FB-VEG-FELLY12',
    name: 'Jahe Merah & Lengkuas Segar',
    specification: 'Rimpang jahe merah tua dan lengkuas segar bersih, kemasan kantong 5kg',
    category: 'Sayuran & Buah',
    unit: 'KG',
    lastPurchasePrice: 35000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 35,
    minimumStock: 10
  },
  {
    id: 'item-fish-kerapu',
    sku: 'FB-FISH-003',
    name: 'Ikan Kerapu Segar Live & Udang Vaname',
    specification: 'Kerapu hidup segar dan Udang Vaname size 40, es curah cold chain terjaga',
    category: 'Seafood Segar',
    unit: 'KG',
    lastPurchasePrice: 125000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 40,
    minimumStock: 15
  },
  {
    id: 'item-fish-cumi',
    sku: 'FB-FISH-004',
    name: 'Cumi-Cumi Segar Sero Labuan Bajo',
    specification: 'Cumi segar sero tangkapan lokal Bajo, daging kenyal putih bening, size 15-20cm',
    category: 'Seafood Segar',
    unit: 'KG',
    lastPurchasePrice: 95000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 35,
    minimumStock: 10
  },
  {
    id: 'item-egg-001',
    sku: 'FB-EGG-001',
    name: 'Telur Ayam Negeri Super Curah (30 Butir)',
    specification: 'Telur ayam ras segar cangkang coklat bersih, berat 60-65g/butir, tray karton isi 30',
    category: 'Daging & Unggas',
    unit: 'TRAY',
    lastPurchasePrice: 55000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 120,
    minimumStock: 40
  },
  {
    id: 'item-oil-001',
    sku: 'FB-OIL-001',
    name: 'Minyak Goreng Kelapa Sawit Bimoli 5L',
    specification: 'Minyak goreng sawit murni fortifikasi Vitamin A, jeriken segel pabrik 5 Liter',
    category: 'Dry Goods & Groceries',
    unit: 'JRC',
    lastPurchasePrice: 95000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 50,
    minimumStock: 20
  },
  {
    id: 'item-sug-001',
    sku: 'FB-SUG-001',
    name: 'Gula Pasir Kristal Putih Premium (50kg)',
    specification: 'Gula pasir kristal putih SNI, bersih tanpa kotoran, karung dobel plastik 50kg',
    category: 'Dry Goods & Groceries',
    unit: 'SAK',
    lastPurchasePrice: 750000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 15,
    minimumStock: 5
  },
  {
    id: 'item-slt-001',
    sku: 'FB-SLT-001',
    name: 'Garam Dapur Beryodium Refined Salt (25kg)',
    specification: 'Garam halus beryodium mutu pangan KIO3 > 30 ppm, karung 25kg kering',
    category: 'Dry Goods & Groceries',
    unit: 'SAK',
    lastPurchasePrice: 120000,
    departments: ['Food & Beverage Department'],
    stockQuantity: 20,
    minimumStock: 8
  },
  {
    id: 'item-bev-001',
    sku: 'FB-BEV-001',
    name: 'Mineral Water GMCC Botol Kaca 330ml',
    specification: 'Air mineral pegunungan alami botol kaca ramah lingkungan 330ml, dus isi 24 botol',
    category: 'Beverage & Bar',
    unit: 'DUS',
    lastPurchasePrice: 85000,
    departments: ['Food & Beverage Department', 'MICE & Event Operations'],
    stockQuantity: 200,
    minimumStock: 50
  },
  {
    id: 'item-trn-dexlite',
    sku: 'TRN-BBM-DEX',
    name: 'BBM Dexlite & Pertamax Shuttle Operasional Delegasi',
    specification: 'BBM solar Dexlite Cetane 51 untuk bus & operasional kendaraan shuttle delegasi ITDC',
    category: 'Logistics & Fleet',
    unit: 'LITER',
    lastPurchasePrice: 14500,
    departments: ['Operations & MICE'],
    stockQuantity: 600,
    minimumStock: 150
  },
  {
    id: 'item-evt-av01',
    sku: 'EVT-AV-001',
    name: 'Sewa Wireless Mic & Stage Lighting Par LED',
    specification: 'Paket sewa wireless microphone Shure UHF 4 unit + 12 unit LED Par 54x3W RGBW',
    category: 'Audio Visual & Event',
    unit: 'SET',
    lastPurchasePrice: 2500000,
    departments: ['MICE & Event Operations'],
    stockQuantity: 5,
    minimumStock: 1
  },
  {
    id: 'item-evt-pwr02',
    sku: 'EVT-PWR-002',
    name: 'Sewa Genset Silent 150 KVA Backup Plenary',
    specification: 'Genset silent 150 KVA Cummins include operator, solar murni dan instalasi kabel ATS',
    category: 'Engineering & MEP',
    unit: 'UNIT',
    lastPurchasePrice: 8000000,
    departments: ['Engineering, Utilities & MEP', 'MICE & Event Operations'],
    stockQuantity: 2,
    minimumStock: 1
  },
  {
    id: 'item-meal-001',
    sku: 'FB-MEAL-001',
    name: 'Nasi Kotak & Konsumsi Karyawan Shift Event',
    specification: 'Paket nasi kotak 4 sehat 5 sempurna menu ayam/ikan, sayur, buah & air mineral botol',
    category: 'Food & Beverage',
    unit: 'PAX',
    lastPurchasePrice: 35000,
    departments: ['Food & Beverage Department', 'MICE & Event Operations'],
    stockQuantity: 500,
    minimumStock: 50
  },
  {
    id: 'item-hk-lin01',
    sku: 'HK-LIN-001',
    name: 'Linen Duvet & Pillow Cover Katun 300TC GMCC',
    specification: 'Linen katun putih satin stripe 300 thread count, bordir logo GMCC elegan',
    category: 'Housekeeping & Facilities',
    unit: 'PCS',
    lastPurchasePrice: 280000,
    departments: ['Housekeeping & Facilities'],
    stockQuantity: 150,
    minimumStock: 40
  },
  {
    id: 'item-evt-sound',
    sku: 'EVT-AV-002',
    name: 'Rental Sound System Line Array & Subwoofer Event',
    specification: 'Sound system MICE 20.000 Watt line array, digital mixer 32 channel & sound engineer',
    category: 'Audio Visual & Event',
    unit: 'SET',
    lastPurchasePrice: 15000000,
    departments: ['MICE & Event Operations'],
    stockQuantity: 4,
    minimumStock: 1
  },
  {
    id: 'item-evt-led',
    sku: 'EVT-LED-001',
    name: 'Rental LED Videotron P3.9 Indoor 6x3m',
    specification: 'Videotron kabinet magnesium alloy P3.9 high refresh 3840Hz include processor & rigging',
    category: 'Audio Visual & Event',
    unit: 'SET',
    lastPurchasePrice: 22000000,
    departments: ['MICE & Event Operations'],
    stockQuantity: 2,
    minimumStock: 1
  },
  {
    id: 'item-evt-tenda',
    sku: 'EVT-TND-001',
    name: 'Tenda Roder VIP Event 20x30m',
    specification: 'Tenda bentang transparan almunium roder 20x30m lengkap flooring kayu karpet & AC portable',
    category: 'Audio Visual & Event',
    unit: 'UNIT',
    lastPurchasePrice: 35000000,
    departments: ['MICE & Event Operations'],
    stockQuantity: 2,
    minimumStock: 1
  },
  {
    id: 'item-trn-hiace',
    sku: 'TRN-BUS-001',
    name: 'Shuttle Bus Pariwisata HiAce Commuter Harian',
    specification: 'Toyota HiAce Commuter 15 seat AC dingin, driver berlisensi pariwisata Bajo, durasi 12 jam',
    category: 'Logistics & Fleet',
    unit: 'DAY',
    lastPurchasePrice: 1500000,
    departments: ['Operations & MICE'],
    stockQuantity: 10,
    minimumStock: 2
  },
  {
    id: 'item-meal-002',
    sku: 'FB-MEAL-002',
    name: 'Meal Employee Staff Cafeteria Paket Bulanan',
    specification: 'Katering kafetaria karyawan GMCC menu rotasi harian higienis standar gizi ITDC',
    category: 'Food & Beverage',
    unit: 'PAX',
    lastPurchasePrice: 25000,
    departments: ['Human Resources & General'],
    stockQuantity: 1000,
    minimumStock: 100
  }
];

export const INITIAL_PURCHASE_REQUISITIONS: PurchaseRequisition[] = [];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [];

export const INITIAL_GOODS_RECEIPTS: GoodsReceipt[] = [];

export const INITIAL_FOOD_FLASH: FoodFlashRecord[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

// ==========================================
// MASTER RECIPE COST CENTER & MENU ENGINEERING
// ==========================================
import { RecipeCostRecord } from '../types/procurement';

export const INITIAL_RECIPES: RecipeCostRecord[] = [];

export const INITIAL_COMPANY_BANK_ACCOUNTS: CompanyBankAccount[] = [
  {
    id: 'bank-1',
    bankName: 'Bank Mandiri',
    accountNumber: '161-00-998877-1',
    accountHolder: 'GOLO MORI CONVENTION CENTER',
    purpose: 'Rekening Operasional Utama & Pengadaan GMCC',
    currentBalance: 850000000,
    isActive: true
  },
  {
    id: 'bank-2',
    bankName: 'Bank BCA',
    accountNumber: '216-098-7711',
    accountHolder: 'PT ITDC KAWASAN GOLO MORI',
    purpose: 'Rekening Transaksi Event & MICE Hospitality',
    currentBalance: 420000000,
    isActive: true
  },
  {
    id: 'bank-3',
    bankName: 'Bank BRI',
    accountNumber: '0281-01-002938-50-2',
    accountHolder: 'GOLO MORI CONVENTION CENTER - VENDOR SETTLEMENT',
    purpose: 'Rekening Pembayaran Rekanan Vendor & Supplier Daerah',
    currentBalance: 310000000,
    isActive: true
  },
  {
    id: 'bank-4',
    bankName: 'Bank BNI',
    accountNumber: '038-192-8374-1',
    accountHolder: 'ITDC GOLO MORI OPERATIONAL',
    purpose: 'Rekening Escrow & Cadangan Kas Pelunasan Tagihan',
    currentBalance: 250000000,
    isActive: true
  },
  {
    id: 'bank-5',
    bankName: 'Kas Tunai / Brankas Finance',
    accountNumber: 'CASH-VAULT-01',
    accountHolder: 'Lalu Agus SetiaBudi (Chief Accounting)',
    purpose: 'Kas Operasional Tunai Brankas Finance GMCC',
    currentBalance: 50000000,
    isActive: true
  }
];


