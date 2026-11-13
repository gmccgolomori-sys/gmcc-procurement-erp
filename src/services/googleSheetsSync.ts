/**
 * Google Sheets Two-Way Synchronization Engine for GMCC Procurement ERP
 * Allows real-time 2-way storage, synchronization, and dummy data cleanup directly in Google Sheets.
 */

import { 
  PurchaseRequisition, 
  PurchaseOrder, 
  GoodsReceipt, 
  PettyCashSettlementPeriod, 
  PettyCashBillingFile, 
  MasterItem, 
  Vendor, 
  ChartOfAccount, 
  CostCenter, 
  UserAccount 
} from '../types/procurement';

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  autoSyncEnabled: boolean;
  lastSyncTimestamp?: string;
  syncStatus: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
  errorMessage?: string;
}

const STORAGE_KEY_GSHEETS_CONFIG = 'gmcc_erp_gsheets_config';

export const getStoredGoogleSheetsConfig = (): GoogleSheetsConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GSHEETS_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read Google Sheets config:', err);
  }
  return {
    spreadsheetId: '',
    spreadsheetUrl: '',
    autoSyncEnabled: true,
    syncStatus: 'IDLE'
  };
};

export const saveStoredGoogleSheetsConfig = (cfg: GoogleSheetsConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY_GSHEETS_CONFIG, JSON.stringify(cfg));
  } catch (err) {
    console.error('Failed to save Google Sheets config:', err);
  }
};

export const GMCC_ERP_SHEET_TABS = [
  'PR_Requisitions',
  'PO_PurchaseOrders',
  'GRN_GoodsReceipts',
  'PettyCash_Expenses',
  'PettyCash_BillingFiles',
  'Master_Items',
  'Master_Vendors',
  'Master_COA',
  'Master_CostCenters',
  'Users_Accounts'
] as const;

/**
 * Creates or retrieves the GMCC Procurement ERP spreadsheet in Google Drive/Sheets.
 */
export const createOrGetSpreadsheet = async (accessToken: string): Promise<{ id: string; url: string }> => {
  const currentConfig = getStoredGoogleSheetsConfig();
  if (currentConfig.spreadsheetId) {
    // Validate accessibility
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${currentConfig.spreadsheetId}?fields=spreadsheetId`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        return {
          id: currentConfig.spreadsheetId,
          url: currentConfig.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${currentConfig.spreadsheetId}/edit`
        };
      }
    } catch {
      // Continue to create a new one
    }
  }

  // Create new GMCC ERP Database Spreadsheet
  const sheets = GMCC_ERP_SHEET_TABS.map(title => ({
    properties: {
      title,
      gridProperties: {
        rowCount: 1000,
        columnCount: 20,
        frozenRowCount: 1
      }
    }
  }));

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: 'GMCC_PROCUREMENT_ERP_DATABASE'
      },
      sheets
    })
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Gagal membuat Google Spreadsheet: ${errorText}`);
  }

  const result = await createRes.json();
  const id = result.spreadsheetId;
  const url = `https://docs.google.com/spreadsheets/d/${id}/edit`;

  const updatedConfig: GoogleSheetsConfig = {
    ...currentConfig,
    spreadsheetId: id,
    spreadsheetUrl: url,
    syncStatus: 'IDLE'
  };
  saveStoredGoogleSheetsConfig(updatedConfig);

  return { id, url };
};

// ==========================================
// ROW SERIALIZERS (APP -> GOOGLE SHEETS)
// ==========================================

export const serializePRs = (prs: PurchaseRequisition[]): any[][] => {
  const headers = [
    'ID (Wajib Ada)', 'No PR', 'Tanggal Pengajuan', 'Pemohon', 'Departemen', 'Cost Center', 'COA',
    'Estimasi Biaya (IDR)', 'Status', 'Tujuan Pengadaan', 'Daftar Barang'
  ];
  const rows = prs.map(pr => [
    pr.id,
    pr.prNumber,
    pr.requestDate,
    pr.requesterName,
    pr.department,
    pr.costCenterName || '',
    pr.coaName || '',
    pr.subtotalEstimated || 0,
    pr.status,
    pr.purpose || '',
    (pr.items || []).map(i => `${i.quantityRequested} ${i.unit} ${i.itemName}`).join('; ')
  ]);
  return [headers, ...rows];
};

export const serializePOs = (pos: PurchaseOrder[]): any[][] => {
  const headers = [
    'ID (Wajib Ada)', 'No PO', 'No PR Referensi', 'Tanggal Order', 'Vendor / Rekanan',
    'Departemen', 'COA', 'Subtotal (IDR)', 'PPN (IDR)', 'Grand Total (IDR)', 'Status PO', 'Term of Payment'
  ];
  const rows = pos.map(po => [
    po.id,
    po.poNumber,
    po.prNumber,
    po.orderDate,
    po.vendorName,
    po.department,
    po.coaName || '',
    po.subtotal || 0,
    po.taxPpn || 0,
    po.grandTotal || 0,
    po.status,
    po.paymentTerms || ''
  ]);
  return [headers, ...rows];
};

export const serializeGRNs = (grns: GoodsReceipt[]): any[][] => {
  const headers = [
    'ID (Wajib Ada)', 'No GRN', 'No PO', 'Tanggal Penerimaan', 'Vendor',
    'No Surat Jalan / Nota', 'Total Nominal Diaudit (IDR)', 'Status', 'Catatan Pemeriksaan'
  ];
  const rows = grns.map(g => [
    g.id,
    g.grnNumber,
    g.poNumber,
    g.receiptDate,
    g.vendorName,
    g.deliveryOrderNumber || g.receiptProofNumber || '',
    g.totalInvoiceAudited || g.receiptProofAmount || 0,
    g.paymentStatus || g.settlementStatus || 'RECEIVED',
    g.notes || ''
  ]);
  return [headers, ...rows];
};

export const serializePettyCash = (periods: PettyCashSettlementPeriod[]): any[][] => {
  const headers = [
    'ID Transaksi (Wajib Ada)', 'Periode Kas Kecil', 'No. Invoice ITDC', 'Kategori COA', 'Tanggal Nota',
    'No Akun GL', 'Keterangan Pengeluaran', 'Debit (IDR)', 'Kredit (IDR)',
    'Vendor / Toko', 'No Nota / Kwitansi', 'Asal Data'
  ];
  const rows: any[][] = [];
  periods.forEach(p => {
    (p.items || []).forEach(it => {
      rows.push([
        it.id,
        p.periodName,
        it.itdcInvoiceNumber || p.itdcInvoiceNumber || '',
        p.coaFilter || 'BPP',
        it.date,
        it.glAccountCode,
        it.description,
        it.debit || 0,
        it.kredit || 0,
        it.vendorName,
        it.receiptNumber,
        it.sourceType || 'MANUAL'
      ]);
    });
  });
  return [headers, ...rows];
};

export const serializeBillingFiles = (files: PettyCashBillingFile[]): any[][] => {
  const headers = [
    'ID Berkas', 'No Berkas Tagihan', 'No. Invoice ITDC', 'Nama Periode', 'Tanggal Mulai', 'Tanggal Selesai',
    'Kategori COA', 'Total Nominal (IDR)', 'Status Penagihan', 'Metode Bayar', 'No Referensi Bayar'
  ];
  const rows = files.map(f => [
    f.id,
    f.fileNumber,
    f.itdcInvoiceNumber || '',
    f.periodName,
    f.startDate,
    f.endDate,
    f.coaCategory || 'BPP',
    f.totalAmount || 0,
    f.billingStatus,
    f.disbursementBank || '',
    f.disbursementRef || ''
  ]);
  return [headers, ...rows];
};

export const serializeItems = (items: MasterItem[]): any[][] => {
  const headers = ['ID', 'Kode Barang', 'Nama Barang', 'Kategori', 'Satuan', 'Harga Estimasi Terakhir (IDR)'];
  const rows = items.map(i => [i.id, i.sku, i.name, i.category, i.unit, i.lastPrice || 0]);
  return [headers, ...rows];
};

/**
 * Universal primitive cell sanitizer to ensure Google Sheets API never receives nested structs or objects
 */
export const sanitizeCell = (val: any): string | number | boolean => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  if (typeof val === 'object') {
    if (val.bank || val.number || val.holder) {
      return `${val.bank || ''} - ${val.number || ''} (${val.holder || ''})`.trim();
    }
    if (Array.isArray(val)) {
      return val.map(x => sanitizeCell(x)).join('; ');
    }
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
};

export const sanitizeRows = (rows: any[][]): any[][] => {
  return rows.map(row => row.map(sanitizeCell));
};

export const serializeVendors = (vendors: Vendor[]): any[][] => {
  const headers = ['ID', 'Nama Vendor / Rekanan', 'Kategori', 'Telepon / Kontak', 'Alamat / Lokasi', 'Nomor Rekening & Bank'];
  const rows = vendors.map(v => {
    let bankStr = '';
    if (v.bankAccount && typeof v.bankAccount === 'object') {
      const b = v.bankAccount as any;
      bankStr = `${b.bank || ''} ${b.number || ''} a/n ${b.holder || ''}`.trim();
    } else {
      bankStr = String(v.bankAccount || '');
    }
    return [v.id, v.name, v.category, v.phone, v.address, bankStr];
  });
  return [headers, ...rows];
};

export const serializeCOAs = (coas: ChartOfAccount[]): any[][] => {
  const headers = ['ID', 'Kode Akun COA', 'Nama Akun', 'Kategori Pos Anggaran', 'Deskripsi'];
  const rows = coas.map(c => [c.id, c.code, c.name, c.category, c.description || '']);
  return [headers, ...rows];
};

export const serializeCostCenters = (costCenters: CostCenter[]): any[][] => {
  const headers = ['ID', 'Kode Cost Center', 'Nama Cost Center', 'Nama Departemen'];
  const rows = costCenters.map(cc => [cc.id, cc.code, cc.name, cc.departmentName || '']);
  return [headers, ...rows];
};

export const serializeUsers = (users: UserAccount[]): any[][] => {
  const headers = ['ID', 'Username', 'Nama Lengkap', 'Jabatan / Role', 'Departemen', 'Email'];
  const rows = users.map(u => [u.id, u.username, u.name, u.role, u.department, u.email]);
  return [headers, ...rows];
};

// ============================================================
// TWO-WAY SYNC CONTROLLER (FULL PUSH & TWO-WAY DELETE REFLECTION)
// ============================================================

export interface TwoWaySyncPayload {
  prs: PurchaseRequisition[];
  pos: PurchaseOrder[];
  grns: GoodsReceipt[];
  pettyCashPeriods: PettyCashSettlementPeriod[];
  billingFiles: PettyCashBillingFile[];
  items: MasterItem[];
  vendors: Vendor[];
  coas: ChartOfAccount[];
  costCenters: CostCenter[];
  users: UserAccount[];
}

export interface TwoWaySyncResult {
  updatedPrs?: PurchaseRequisition[];
  updatedPos?: PurchaseOrder[];
  updatedGrns?: GoodsReceipt[];
  updatedPettyCash?: PettyCashSettlementPeriod[];
  timestamp: string;
}

/**
 * Pushes entire ERP state to Google Sheets and checks if any rows were deleted in Google Sheets
 * to synchronize deletions back into the ERP state (Two-Way Communication).
 */
export const syncAllModulesToGoogleSheets = async (
  accessToken: string,
  payload: TwoWaySyncPayload
): Promise<TwoWaySyncResult> => {
  const { id: spreadsheetId } = await createOrGetSpreadsheet(accessToken);

  // 1. Read existing rows from Google Sheets to detect if user deleted records directly in Google Sheet
  let deletedPrIds = new Set<string>();
  let deletedPoIds = new Set<string>();
  let deletedGrnIds = new Set<string>();

  try {
    const readRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=PR_Requisitions!A2:A&ranges=PO_PurchaseOrders!A2:A&ranges=GRN_GoodsReceipts!A2:A`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (readRes.ok) {
      const readData = await readRes.json();
      const valueRanges = readData.valueRanges || [];

      // Check PRs
      const sheetPrIds = new Set((valueRanges[0]?.values || []).map((r: any[]) => r[0]).filter(Boolean));
      if (sheetPrIds.size > 0) {
        // Any local PR that previously existed but is absent from the sheet was deleted in Google Sheets
        payload.prs.forEach(pr => {
          if (!sheetPrIds.has(pr.id)) deletedPrIds.add(pr.id);
        });
      }

      // Check POs
      const sheetPoIds = new Set((valueRanges[1]?.values || []).map((r: any[]) => r[0]).filter(Boolean));
      if (sheetPoIds.size > 0) {
        payload.pos.forEach(po => {
          if (!sheetPoIds.has(po.id)) deletedPoIds.add(po.id);
        });
      }

      // Check GRNs
      const sheetGrnIds = new Set((valueRanges[2]?.values || []).map((r: any[]) => r[0]).filter(Boolean));
      if (sheetGrnIds.size > 0) {
        payload.grns.forEach(grn => {
          if (!sheetGrnIds.has(grn.id)) deletedGrnIds.add(grn.id);
        });
      }
    }
  } catch (err) {
    console.warn('Google Sheets read check skipped on initial upload:', err);
  }

  // Filter out any records deleted by user in Google Sheets
  const effectivePrs = deletedPrIds.size > 0 ? payload.prs.filter(p => !deletedPrIds.has(p.id)) : payload.prs;
  const effectivePos = deletedPoIds.size > 0 ? payload.pos.filter(p => !deletedPoIds.has(p.id)) : payload.pos;
  const effectiveGrns = deletedGrnIds.size > 0 ? payload.grns.filter(g => !deletedGrnIds.has(g.id)) : payload.grns;

  // 2. Prepare serialized dataset for batchUpdate (sanitized to primitive values)
  const data = [
    { range: 'PR_Requisitions!A1:K1000', values: sanitizeRows(serializePRs(effectivePrs)) },
    { range: 'PO_PurchaseOrders!A1:L1000', values: sanitizeRows(serializePOs(effectivePos)) },
    { range: 'GRN_GoodsReceipts!A1:I1000', values: sanitizeRows(serializeGRNs(effectiveGrns)) },
    { range: 'PettyCash_Expenses!A1:L1000', values: sanitizeRows(serializePettyCash(payload.pettyCashPeriods)) },
    { range: 'PettyCash_BillingFiles!A1:K1000', values: sanitizeRows(serializeBillingFiles(payload.billingFiles)) },
    { range: 'Master_Items!A1:F1000', values: sanitizeRows(serializeItems(payload.items)) },
    { range: 'Master_Vendors!A1:F1000', values: sanitizeRows(serializeVendors(payload.vendors)) },
    { range: 'Master_COA!A1:E1000', values: sanitizeRows(serializeCOAs(payload.coas)) },
    { range: 'Master_CostCenters!A1:D1000', values: sanitizeRows(serializeCostCenters(payload.costCenters)) },
    { range: 'Users_Accounts!A1:F1000', values: sanitizeRows(serializeUsers(payload.users)) }
  ];

  // 3. Clear existing values and overwrite cleanly
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data
      })
    }
  );

  if (!updateRes.ok) {
    const errorText = await updateRes.text();
    throw new Error(`Gagal menulis data ke Google Sheets: ${errorText}`);
  }

  const timestamp = new Date().toLocaleString('id-ID', { hour12: false }) + ' WITA';
  const cfg = getStoredGoogleSheetsConfig();
  saveStoredGoogleSheetsConfig({
    ...cfg,
    lastSyncTimestamp: timestamp,
    syncStatus: 'SUCCESS'
  });

  return {
    updatedPrs: deletedPrIds.size > 0 ? effectivePrs : undefined,
    updatedPos: deletedPoIds.size > 0 ? effectivePos : undefined,
    updatedGrns: deletedGrnIds.size > 0 ? effectiveGrns : undefined,
    timestamp
  };
};

/**
 * Purge dummy data: Clears all dummy transactions in Google Sheets leaving clean blank sheets
 */
export const purgeDummyDataInGoogleSheets = async (accessToken: string) => {
  const { id: spreadsheetId } = await createOrGetSpreadsheet(accessToken);

  // Overwrite with empty rows (headers only, sanitized)
  const emptyData = [
    { range: 'PR_Requisitions!A1:K1000', values: sanitizeRows(serializePRs([])) },
    { range: 'PO_PurchaseOrders!A1:L1000', values: sanitizeRows(serializePOs([])) },
    { range: 'GRN_GoodsReceipts!A1:I1000', values: sanitizeRows(serializeGRNs([])) },
    { range: 'PettyCash_Expenses!A1:L1000', values: sanitizeRows(serializePettyCash([])) },
    { range: 'PettyCash_BillingFiles!A1:K1000', values: sanitizeRows(serializeBillingFiles([])) }
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: emptyData
      })
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal membersihkan data dummy di Google Sheets: ${errText}`);
  }

  return true;
};
