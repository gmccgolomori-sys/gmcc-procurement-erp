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
  AuditLog 
} from '../types/procurement';

export const OFFICIAL_GMCC_ADDRESS = "Kawasan GOLO MORI CONVENTION CENTER by ITDC, Golo Mori, Labuan Bajo, Kabupaten Manggarai Barat, Nusa Tenggara Timur 86763";

// SVG Preset Signature Badges for Official Documents
export const SAMPLE_SIGNATURES = {
  CHEF: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='65' viewBox='0 0 180 65'><path d='M20 42 Q35 8, 50 35 T90 22 T135 38 T165 18' fill='none' stroke='%230284c7' stroke-width='2.5' stroke-linecap='round'/><circle cx='120' cy='32' r='2' fill='%230284c7'/><text x='20' y='56' font-family='sans-serif' font-size='9' font-weight='bold' fill='%2364748b'>I. Riky - Head Chef</text></svg>",
  PURCHASING: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='65' viewBox='0 0 180 65'><path d='M18 45 C35 12, 55 10, 70 38 S110 18, 140 28 S160 15, 168 38' fill='none' stroke='%230f766e' stroke-width='2.5' stroke-linecap='round'/><text x='18' y='56' font-family='sans-serif' font-size='9' font-weight='bold' fill='%2364748b'>Siti Handayani (Procurement)</text></svg>",
  FINANCE: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='65' viewBox='0 0 180 65'><path d='M15 38 C32 8, 52 16, 65 46 S102 12, 132 36 S155 24, 165 42' fill='none' stroke='%234338ca' stroke-width='2.5' stroke-linecap='round'/><text x='15' y='56' font-family='sans-serif' font-size='9' font-weight='bold' fill='%2364748b'>L. Bram (Finance Mgr)</text></svg>",
  GM: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='65' viewBox='0 0 180 65'><path d='M16 48 C32 10, 48 5, 65 32 S115 6, 138 36 S155 8, 168 40' fill='none' stroke='%23b45309' stroke-width='3' stroke-linecap='round'/><text x='16' y='56' font-family='sans-serif' font-size='9' font-weight='bold' fill='%23b45309'>Bonaventura D. Santosa (GM)</text></svg>",
  ADMIN: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='65' viewBox='0 0 180 65'><path d='M20 40 Q40 10, 60 35 T100 20 T140 40 T160 15' fill='none' stroke='%236366f1' stroke-width='2.5' stroke-linecap='round'/><text x='20' y='56' font-family='sans-serif' font-size='9' font-weight='bold' fill='%2364748b'>Admin IT Systems</text></svg>"
};

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'u-1',
    username: 'admin',
    name: 'Executive IT Administrator',
    role: 'ADMIN',
    department: 'Information Technology',
    password: 'admin123',
    pin: '123456',
    email: 'admin.it@golomori.id',
    signatureUrl: SAMPLE_SIGNATURES.ADMIN
  },
  {
    id: 'u-2',
    username: 'requestor_chef',
    name: 'Ignatius Riky (Head Chef)',
    role: 'REQUESTOR',
    department: 'Food & Beverage',
    password: 'chef123',
    pin: '123456',
    email: 'chef.riky@golomori.id',
    signatureUrl: SAMPLE_SIGNATURES.CHEF
  },
  {
    id: 'u-3',
    username: 'purchasing',
    name: 'Siti Handayani (Purchasing Mgr)',
    role: 'PURCHASING',
    department: 'Purchasing & Supply Chain',
    password: 'purchasing123',
    pin: '123456',
    email: 'purchasing@golomori.id',
    signatureUrl: SAMPLE_SIGNATURES.PURCHASING
  },
  {
    id: 'u-4',
    username: 'dept_head_fb',
    name: 'Laurentius Bram (HOD F&B / Finance)',
    role: 'DEPT_HEAD',
    department: 'Food & Beverage',
    password: 'finance123',
    pin: '123456',
    email: 'hod.fb@golomori.id',
    signatureUrl: SAMPLE_SIGNATURES.FINANCE
  },
  {
    id: 'u-5',
    username: 'gm',
    name: 'Bonaventura D. Santosa (General Manager)',
    role: 'GM',
    department: 'Executive Office',
    password: 'gm123',
    pin: '123456',
    email: 'gm@golomori.id',
    signatureUrl: SAMPLE_SIGNATURES.GM
  },
  {
    id: 'u-6',
    username: 'receiving',
    name: 'Fransiscus Doni (Purchasing & Receiving)',
    role: 'PURCHASING',
    department: 'Purchasing & Supply Chain',
    password: 'receiving123',
    pin: '123456',
    email: 'receiving@golomori.id',
    signatureUrl: SAMPLE_SIGNATURES.PURCHASING
  },
  {
    id: 'u-7',
    username: 'mice_op',
    name: 'Melania Sari (MICE Operations)',
    role: 'MICE_OP',
    department: 'MICE & Event Operations',
    password: 'mice123',
    pin: '123456',
    email: 'mice.op@golomori.id',
    signatureUrl: SAMPLE_SIGNATURES.CHEF
  },
  {
    id: 'u-8',
    username: 'nuka_op',
    name: 'Stefanus Gaku (Restoran Nuka)',
    role: 'NUKA_OP',
    department: 'Food & Beverage',
    password: 'nuka123',
    pin: '123456',
    email: 'nuka.op@golomori.id',
    signatureUrl: SAMPLE_SIGNATURES.CHEF
  }
];

// Master Departemen (Separate from Cost Center)
export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Food & Beverage Department', headOfDepartment: 'Laurentius Bram', description: 'Divisi operasional F&B, Culinary Kitchen, dan Restoran Nuka' },
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
  { id: 'cc-2', code: 'CC-FB-02', name: 'Restoran Nuka Beach & Bar', departmentName: 'Food & Beverage Department', budgetAllocation: 250000000, headOfDepartment: 'Stefanus Gaku' },
  { id: 'cc-3', code: 'CC-MICE-01', name: 'MICE Convention & Banquet Events', departmentName: 'MICE & Event Operations', budgetAllocation: 500000000, headOfDepartment: 'Melania Sari' },
  { id: 'cc-4', code: 'CC-HK-01', name: 'Housekeeping Public Areas & Linen', departmentName: 'Housekeeping & Facilities', budgetAllocation: 120000000, headOfDepartment: 'Fransiskus Tobi' },
  { id: 'cc-5', code: 'CC-ENG-01', name: 'Engineering, Utilities & MEP Hub', departmentName: 'Engineering, Utilities & MEP', budgetAllocation: 280000000, headOfDepartment: 'Arif Wahyudi' },
  { id: 'cc-6', code: 'CC-IT-01', name: 'IT Infrastructure & Sound Systems', departmentName: 'Information Technology & AV', budgetAllocation: 150000000, headOfDepartment: 'Hendrikus Dula' },
  { id: 'cc-7', code: 'CC-ADM-01', name: 'Executive Office & General Administration', departmentName: 'Executive Office & HR', budgetAllocation: 200000000, headOfDepartment: 'Bonaventura D. Santosa' }
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
    rating: 5
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
    rating: 5
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
    rating: 5
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
    rating: 4
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
    rating: 5
  }
];

export const INITIAL_ITEMS: MasterItem[] = [
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
  }
];

export const INITIAL_PURCHASE_REQUISITIONS: PurchaseRequisition[] = [
  {
    id: 'pr-1',
    prNumber: 'PR/GMCC/2026/10/001',
    requestDate: '2026-10-24',
    requiredDate: '2026-10-28',
    requesterId: 'u-2',
    requesterName: 'Ignatius Riky (Head Chef)',
    department: 'Food & Beverage Department',
    costCenterCode: 'CC-FB-01',
    costCenterName: 'F&B Culinary Central Kitchen',
    costControlCode: 'CC-FB-01',
    costControlReview: 'Cost Center F&B Central Kitchen verified. Anggaran tersedia.',
    suggestedVendorId: 'ven-1',
    suggestedVendorName: 'PT Flores Fresh Agro Mandiri',
    purpose: 'Kebutuhan Bahan Makanan Gala Dinner Delegasi KTT di Golo Mori Convention Center',
    items: [
      {
        id: 'pri-1',
        itemId: 'item-1',
        itemName: 'Daging Sapi Tenderloin Meltique Premium',
        specification: 'Grade MB4+, kemasan vakum pack 2kg, sertifikat Halal resmi MUI, cold chain 2-4°C',
        unit: 'KG',
        quantityRequested: 30,
        estimatedPrice: 285000,
        totalEstimated: 8550000,
        costCenterName: 'F&B Culinary Central Kitchen',
        costControlCode: 'CC-FB-01',
        costControlNotes: 'Alokasi menu Gala Dinner',
        notes: 'Suhu pengiriman wajib di bawah 4°C dengan mobil thermoking'
      },
      {
        id: 'pri-2',
        itemId: 'item-3',
        itemName: 'Sayur Organik Mix Segar Ruteng (Selada & Tomat Cherry)',
        specification: 'Pertanian hidroponik dingin dataran Ruteng, daun renyah bersih, grade A',
        unit: 'KG',
        quantityRequested: 50,
        estimatedPrice: 35000,
        totalEstimated: 1750000,
        costCenterName: 'F&B Culinary Central Kitchen',
        costControlCode: 'CC-FB-01',
        costControlNotes: 'Alokasi salad bar',
        notes: 'Panen H-1 sebelum diantar ke Golo Mori'
      }
    ],
    subtotalEstimated: 10300000,
    urgency: 'CRITICAL',
    status: 'PO_CREATED',
    approvalHistory: [
      {
        stage: 'PURCHASING',
        approverName: 'Siti Handayani (Purchasing Mgr)',
        approvedAt: '2026-10-24 14:15 WITA',
        notes: 'Vendor rekanan aktif terdaftar & harga sesuai kontrak pengadaan.'
      },
      {
        stage: 'HOD',
        approverName: 'Laurentius Bram (HOD F&B / Finance)',
        approvedAt: '2026-10-24 16:30 WITA',
        notes: 'Anggaran CC-FB-01 mencukupi dan alokasi event terverifikasi.'
      },
      {
        stage: 'GM',
        approverName: 'Bonaventura D. Santosa (General Manager)',
        approvedAt: '2026-10-25 09:00 WITA',
        notes: 'Disetujui untuk pengadaan prioritas event konvensi delegasi.'
      }
    ]
  },
  {
    id: 'pr-2',
    prNumber: 'PR/GMCC/2026/10/002',
    requestDate: '2026-10-26',
    requiredDate: '2026-10-30',
    requesterId: 'u-8',
    requesterName: 'Stefanus Gaku (Restoran Nuka)',
    department: 'Food & Beverage Department',
    costCenterCode: 'CC-FB-02',
    costCenterName: 'Restoran Nuka Beach & Bar',
    costControlCode: 'CC-FB-02',
    costControlReview: 'Cost Center Restoran Nuka terverifikasi.',
    suggestedVendorId: 'ven-2',
    suggestedVendorName: 'CV Komodo Bahari Sejahtera',
    purpose: 'Kebutuhan Seafood Segar Ikan Salmon Fillet untuk Restoran Nuka & Bar',
    items: [
      {
        id: 'pri-3',
        itemId: 'item-2',
        itemName: 'Ikan Salmon Segar Fillet (Norwegian)',
        specification: 'Fresh air-flown Norwegian Salmon, fillet skin-on, tanpa tulang pin-bone out',
        unit: 'KG',
        quantityRequested: 20,
        estimatedPrice: 340000,
        totalEstimated: 6800000,
        costCenterName: 'Restoran Nuka Beach & Bar',
        costControlCode: 'CC-FB-02',
        costControlNotes: 'Alokasi A La Carte Nuka',
        notes: 'Kualitas Sashimi Grade'
      }
    ],
    subtotalEstimated: 6800000,
    urgency: 'URGENT',
    status: 'WAITING_HOD',
    approvalHistory: [
      {
        stage: 'PURCHASING',
        approverName: 'Siti Handayani (Purchasing Mgr)',
        approvedAt: '2026-10-26 11:20 WITA',
        notes: 'Harga penawaran CV Komodo Bahari terverifikasi.'
      }
    ]
  },
  {
    id: 'pr-3',
    prNumber: 'PR/GMCC/2026/10/003',
    requestDate: '2026-10-27',
    requiredDate: '2026-11-02',
    requesterId: 'u-7',
    requesterName: 'Melania Sari (MICE Operations)',
    department: 'MICE & Event Operations',
    costCenterCode: 'CC-MICE-01',
    costCenterName: 'MICE Convention & Banquet Events',
    costControlCode: 'CC-MICE-01',
    costControlReview: 'Cost Center MICE Convention Event verified.',
    suggestedVendorId: 'ven-3',
    suggestedVendorName: 'PT Bali Gourmet Prima',
    purpose: 'Kebutuhan Biji Kopi Arabika Bajawa untuk Coffee Break 500 Peserta Konvensi',
    items: [
      {
        id: 'pri-4',
        itemId: 'item-4',
        itemName: 'Biji Kopi Arabika Bajawa Flores Specialty (Medium Roast)',
        specification: 'Single origin 100% Arabika Bajawa, cupping score > 84, medium roast',
        unit: 'KG',
        quantityRequested: 40,
        estimatedPrice: 165000,
        totalEstimated: 6600000,
        costCenterName: 'MICE Convention & Banquet Events',
        costControlCode: 'CC-MICE-01',
        costControlNotes: 'Budget coffee break meeting',
        notes: 'Roast date maksimal 10 hari sebelum event'
      }
    ],
    subtotalEstimated: 6600000,
    urgency: 'NORMAL',
    status: 'WAITING_PURCHASING',
    approvalHistory: []
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-1',
    poNumber: 'PO/GMCC/2026/10/001',
    prId: 'pr-1',
    prNumber: 'PR/GMCC/2026/10/001',
    orderDate: '2026-10-25',
    expectedDeliveryDate: '2026-10-28',
    vendorId: 'ven-1',
    vendorName: 'PT Flores Fresh Agro Mandiri',
    vendorAddress: 'Jl. Trans Flores KM 4, Ruteng, Manggarai, NTT',
    vendorPhone: '0812-3982-1100',
    deliveryAddress: OFFICIAL_GMCC_ADDRESS,
    department: 'Food & Beverage Department',
    costCenterName: 'F&B Culinary Central Kitchen',
    items: [
      {
        id: 'poi-1',
        itemId: 'item-1',
        itemName: 'Daging Sapi Tenderloin Meltique Premium',
        specification: 'Grade MB4+, kemasan vakum pack 2kg, sertifikat Halal resmi MUI',
        unit: 'KG',
        quantityOrdered: 30,
        unitPrice: 285000,
        totalPrice: 8550000,
        quantityReceived: 30,
        outletDestination: 'MICE'
      },
      {
        id: 'poi-2',
        itemId: 'item-3',
        itemName: 'Sayur Organik Mix Segar Ruteng (Selada & Tomat Cherry)',
        specification: 'Pertanian hidroponik dingin dataran Ruteng, daun renyah bersih',
        unit: 'KG',
        quantityOrdered: 50,
        unitPrice: 35000,
        totalPrice: 1750000,
        quantityReceived: 50,
        outletDestination: 'NUKA'
      }
    ],
    subtotal: 10300000,
    taxPpn: 1133000, // 11% PPN
    grandTotal: 11433000,
    paymentTerms: 'Net 30 Days (Transfer Bank Mandiri)',
    status: 'COMPLETED',
    signatures: {
      requestor: { 
        name: 'Ignatius Riky (Head Chef)', 
        date: '2026-10-24', 
        signed: true, 
        signatureUrl: SAMPLE_SIGNATURES.CHEF 
      },
      purchasingOfficer: { 
        name: 'Siti Handayani (Purchasing Mgr)', 
        date: '2026-10-25', 
        signed: true, 
        signatureUrl: SAMPLE_SIGNATURES.PURCHASING 
      },
      financeManager: { 
        name: 'Laurentius Bram (Finance Mgr)', 
        date: '2026-10-25', 
        signed: true, 
        signatureUrl: SAMPLE_SIGNATURES.FINANCE 
      },
      generalManager: { 
        name: 'Bonaventura D. Santosa (General Manager)', 
        date: '2026-10-25', 
        signed: true, 
        signatureUrl: SAMPLE_SIGNATURES.GM 
      }
    }
  }
];

export const INITIAL_GOODS_RECEIPTS: GoodsReceipt[] = [
  {
    id: 'grn-1',
    grnNumber: 'GRN/GMCC/2026/10/001',
    poId: 'po-1',
    poNumber: 'PO/GMCC/2026/10/001',
    deliveryOrderNumber: 'DO/FFA/2026/8892',
    receiptDate: '2026-10-27 10:30 WITA',
    receivedBy: 'Fransiscus Doni (Receiving Officer)',
    vendorName: 'PT Flores Fresh Agro Mandiri',
    totalInvoiceAudited: 10300000,
    items: [
      {
        itemId: 'item-1',
        itemName: 'Daging Sapi Tenderloin Meltique Premium',
        specification: 'Grade MB4+, kemasan vakum pack 2kg',
        unit: 'KG',
        qtyOrdered: 30,
        qtyReceived: 30,
        qtyRejected: 0,
        unitPricePO: 285000,
        unitPriceNota: 285000,
        totalPriceNota: 8550000,
        condition: 'Baik & Sesuai',
        outletDestination: 'MICE',
        remarks: 'Suhu cold storage mobil pendingin 3°C, kemasan vakum rapi'
      },
      {
        itemId: 'item-3',
        itemName: 'Sayur Organik Mix Segar Ruteng (Selada & Tomat Cherry)',
        specification: 'Pertanian hidroponik dingin dataran Ruteng',
        unit: 'KG',
        qtyOrdered: 50,
        qtyReceived: 50,
        qtyRejected: 0,
        unitPricePO: 35000,
        unitPriceNota: 35000,
        totalPriceNota: 1750000,
        condition: 'Baik & Sesuai',
        outletDestination: 'NUKA',
        remarks: 'Segar dan bersih'
      }
    ],
    notes: 'Penerimaan barang lengkap dan diaudit harga nota sesuai kesepakatan PO.'
  }
];

export const INITIAL_FOOD_FLASH: FoodFlashRecord[] = [
  {
    id: 'ff-2026-10-27',
    date: '2026-10-27',
    // Nuka
    nukaRevenue: 16800000,
    nukaFoodCost: 4872000,
    nukaFoodCostPercentage: 29.0,
    // MICE
    miceRevenue: 48500000,
    miceFoodCost: 14065000,
    miceFoodCostPercentage: 29.0,
    // Combined
    combinedRevenue: 65300000,
    combinedFoodCost: 18937000,
    combinedFoodCostPercentage: 29.0,
    targetFoodCostPercentage: 32.0,
    notes: 'Gala Dinner Delegasi + Makan Siang Reguler Nuka Restaurant'
  },
  {
    id: 'ff-2026-10-26',
    date: '2026-10-26',
    nukaRevenue: 14200000,
    nukaFoodCost: 4260000,
    nukaFoodCostPercentage: 30.0,
    miceRevenue: 32000000,
    miceFoodCost: 9600000,
    miceFoodCostPercentage: 30.0,
    combinedRevenue: 46200000,
    combinedFoodCost: 13860000,
    combinedFoodCostPercentage: 30.0,
    targetFoodCostPercentage: 32.0,
    notes: 'Coffee break delegasi & Dinner buffet Nuka'
  },
  {
    id: 'ff-2026-10-25',
    date: '2026-10-25',
    nukaRevenue: 18500000,
    nukaFoodCost: 5735000,
    nukaFoodCostPercentage: 31.0,
    miceRevenue: 28000000,
    miceFoodCost: 8680000,
    miceFoodCostPercentage: 31.0,
    combinedRevenue: 46500000,
    combinedFoodCost: 14415000,
    combinedFoodCostPercentage: 31.0,
    targetFoodCostPercentage: 32.0,
    notes: 'Opening Conference Meeting Hall Golo Mori'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-10-27 10:35 WITA',
    username: 'receiving',
    module: 'Receiving',
    action: 'GOODS_RECEIPT',
    details: 'Penerimaan barang GRN/GMCC/2026/10/001 untuk PO/GMCC/2026/10/001 (PT Flores Fresh Agro)'
  },
  {
    id: 'log-2',
    timestamp: '2026-10-25 09:05 WITA',
    username: 'gm',
    module: 'Approval Center',
    action: 'APPROVE_PR_GM',
    details: 'General Manager menyetujui PR/GMCC/2026/10/001 dan menerbitkan PO/GMCC/2026/10/001'
  },
  {
    id: 'log-3',
    timestamp: '2026-10-24 14:15 WITA',
    username: 'purchasing',
    module: 'Approval Center',
    action: 'VERIFY_PR_PURCHASING',
    details: 'Purchasing memverifikasi harga penawaran dan spesifikasi barang PR/GMCC/2026/10/001'
  }
];

// ==========================================
// MASTER RECIPE COST CENTER & MENU ENGINEERING
// ==========================================
import { RecipeCostRecord } from '../types/procurement';

export const INITIAL_RECIPES: RecipeCostRecord[] = [
  {
    id: 'rcp-1',
    recipeCode: 'RCP-FB-001',
    recipeName: 'Nuka Wagyu Tenderloin Steak 200g',
    category: 'A LA CARTE',
    costCenterName: 'Restoran Nuka Beach & Bar',
    outlet: 'NUKA',
    portionYield: 1,
    sellingPrice: 225000,
    targetFoodCostPercent: 30,
    status: 'EXCELLENT',
    notes: 'Menu andalan Restoran Nuka, disajikan dengan saus truffle red wine jus dan sayuran organik Ruteng.',
    chefNotes: 'Potongan tenderloin tepat 200 gram, simpan suhu -2°C sebelum di-grill medium rare.',
    lastUpdated: '2026-10-28',
    ingredients: [
      {
        id: 'ing-1-1',
        itemId: 'item-1',
        itemName: 'Daging Sapi Tenderloin Meltique Premium',
        specification: 'Grade MB4+, potongan center cut 200g',
        unit: 'KG',
        quantity: 0.2,
        unitCost: 285000,
        totalCost: 57000
      },
      {
        id: 'ing-1-2',
        itemId: 'item-2',
        itemName: 'Sayur Organik Mix Segar Ruteng (Selada & Tomat Cherry)',
        specification: 'Selada hidroponik & baby carrots',
        unit: 'KG',
        quantity: 0.1,
        unitCost: 35000,
        totalCost: 3500
      },
      {
        id: 'ing-1-3',
        itemId: 'item-5',
        itemName: 'Minyak Goreng Sawit Kelapa 5L',
        specification: 'Minyak untuk searing & butter emulsion',
        unit: 'PACK',
        quantity: 0.05,
        unitCost: 95000,
        totalCost: 4750
      }
    ],
    totalRecipeCost: 65250,
    costPerPortion: 65250,
    actualFoodCostPercent: 29.0,
    recommendedSellingPrice: 217500,
    grossProfitPerPortion: 159750
  },
  {
    id: 'rcp-2',
    recipeCode: 'RCP-FB-002',
    recipeName: 'Flores Grilled Salmon Fillet with Herb Butter',
    category: 'A LA CARTE',
    costCenterName: 'Restoran Nuka Beach & Bar',
    outlet: 'NUKA',
    portionYield: 1,
    sellingPrice: 235000,
    targetFoodCostPercent: 32,
    status: 'HEALTHY',
    notes: 'Salmon trout segar dengan rempah lokal Manggarai dan roasted baby potato.',
    chefNotes: 'Pan sear bagian kulit hingga crispy selama 4 menit, balik 2 menit.',
    lastUpdated: '2026-10-28',
    ingredients: [
      {
        id: 'ing-2-1',
        itemId: 'item-3',
        itemName: 'Salmon Trout Norwegia Fillet Segar',
        specification: 'Grade sashimi quality, cut portion 220g',
        unit: 'KG',
        quantity: 0.22,
        unitCost: 320000,
        totalCost: 70400
      },
      {
        id: 'ing-2-2',
        itemId: 'item-2',
        itemName: 'Sayur Organik Mix Segar Ruteng (Selada & Tomat Cherry)',
        specification: 'Garnish & side salad',
        unit: 'KG',
        quantity: 0.1,
        unitCost: 35000,
        totalCost: 3500
      }
    ],
    totalRecipeCost: 73900,
    costPerPortion: 73900,
    actualFoodCostPercent: 31.4,
    recommendedSellingPrice: 230938,
    grossProfitPerPortion: 161100
  },
  {
    id: 'rcp-3',
    recipeCode: 'RCP-MICE-001',
    recipeName: 'Gala Dinner MICE 3-Course VIP Banquet Set',
    category: 'BANQUET SET',
    costCenterName: 'MICE Convention & Banquet Events',
    outlet: 'MICE',
    portionYield: 10,
    sellingPrice: 350000,
    targetFoodCostPercent: 30,
    status: 'HEALTHY',
    notes: 'Paket jamuan makan malam resmi delegasi konferensi internasional di Grand Ballroom GMCC.',
    chefNotes: 'Yield 10 pax plating, batch cooking di Culinary Central Kitchen.',
    lastUpdated: '2026-10-27',
    ingredients: [
      {
        id: 'ing-3-1',
        itemId: 'item-1',
        itemName: 'Daging Sapi Tenderloin Meltique Premium',
        specification: 'Daging tenderloin untuk 10 porsi main course',
        unit: 'KG',
        quantity: 2.0,
        unitCost: 285000,
        totalCost: 570000
      },
      {
        id: 'ing-3-2',
        itemId: 'item-3',
        itemName: 'Salmon Trout Norwegia Fillet Segar',
        specification: 'Salmon appetizer carpaccio',
        unit: 'KG',
        quantity: 1.0,
        unitCost: 320000,
        totalCost: 320000
      },
      {
        id: 'ing-3-3',
        itemId: 'item-2',
        itemName: 'Sayur Organik Mix Segar Ruteng (Selada & Tomat Cherry)',
        specification: 'Sayuran pendamping banquet',
        unit: 'KG',
        quantity: 1.5,
        unitCost: 35000,
        totalCost: 52500
      },
      {
        id: 'ing-3-4',
        itemId: 'item-4',
        itemName: 'Beras Organik Manggarai Super (Karung 25kg)',
        specification: 'Nasi butter rice banquet',
        unit: 'KG',
        quantity: 2.0,
        unitCost: 19000,
        totalCost: 38000
      }
    ],
    totalRecipeCost: 980500,
    costPerPortion: 98050,
    actualFoodCostPercent: 28.0,
    recommendedSellingPrice: 326833,
    grossProfitPerPortion: 251950
  },
  {
    id: 'rcp-4',
    recipeCode: 'RCP-FB-003',
    recipeName: 'Nasi Goreng Komodo Nuka Spesial',
    category: 'A LA CARTE',
    costCenterName: 'Restoran Nuka Beach & Bar',
    outlet: 'NUKA',
    portionYield: 1,
    sellingPrice: 95000,
    targetFoodCostPercent: 32,
    status: 'EXCELLENT',
    notes: 'Nasi goreng rempah khas Flores dengan irisan daging meltique dan kerupuk.',
    chefNotes: 'Gunakan nasi dingin dari beras organik Manggarai.',
    lastUpdated: '2026-10-26',
    ingredients: [
      {
        id: 'ing-4-1',
        itemId: 'item-4',
        itemName: 'Beras Organik Manggarai Super (Karung 25kg)',
        specification: 'Nasi pulen dingin 250g',
        unit: 'KG',
        quantity: 0.25,
        unitCost: 19000,
        totalCost: 4750
      },
      {
        id: 'ing-4-2',
        itemId: 'item-1',
        itemName: 'Daging Sapi Tenderloin Meltique Premium',
        specification: 'Irisan daging topping',
        unit: 'KG',
        quantity: 0.07,
        unitCost: 285000,
        totalCost: 19950
      },
      {
        id: 'ing-4-3',
        itemId: 'item-2',
        itemName: 'Sayur Organik Mix Segar Ruteng (Selada & Tomat Cherry)',
        specification: 'Acar dan selada pendamping',
        unit: 'KG',
        quantity: 0.05,
        unitCost: 35000,
        totalCost: 1750
      }
    ],
    totalRecipeCost: 26450,
    costPerPortion: 26450,
    actualFoodCostPercent: 27.8,
    recommendedSellingPrice: 82656,
    grossProfitPerPortion: 68550
  }
];

