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
  GitHubSyncConfig 
} from '../types/procurement';
import { 
  INITIAL_USERS, 
  INITIAL_DEPARTMENTS, 
  INITIAL_COST_CENTERS,
  INITIAL_VENDORS, 
  INITIAL_ITEMS, 
  INITIAL_PURCHASE_REQUISITIONS, 
  INITIAL_PURCHASE_ORDERS, 
  INITIAL_GOODS_RECEIPTS, 
  INITIAL_FOOD_FLASH,
  INITIAL_AUDIT_LOGS,
  INITIAL_RECIPES
} from '../data/procurementMock';
import { RecipeCostRecord } from '../types/procurement';

const KEYS = {
  USERS: 'gmcc_erp_users_v2',
  DEPARTMENTS: 'gmcc_erp_departments_v2',
  COST_CENTERS: 'gmcc_erp_cost_centers_v2',
  VENDORS: 'gmcc_erp_vendors_v2',
  ITEMS: 'gmcc_erp_items_v2',
  PRS: 'gmcc_erp_prs_v2',
  POS: 'gmcc_erp_pos_v2',
  GRNS: 'gmcc_erp_grns_v2',
  FOOD_FLASH: 'gmcc_erp_food_flash_v2',
  AUDIT_LOGS: 'gmcc_erp_audit_logs_v2',
  GITHUB_CONFIG: 'gmcc_erp_github_config_v2',
  AUTH_USER: 'gmcc_erp_auth_user_v2',
  RECIPES: 'gmcc_erp_recipes_v2'
};

function safeGet(key: string): string | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
  } catch (e) {
    console.warn('Storage read warning:', e);
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn('Storage write warning:', e);
  }
}

function getOrInit<T>(key: string, defaultValue: T): T {
  const item = safeGet(key);
  if (!item) {
    safeSet(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(item);
  } catch {
    return defaultValue;
  }
}

export const getStoredUsers = (): UserAccount[] => {
  const users = getOrInit(KEYS.USERS, INITIAL_USERS);
  // Auto-migrate legacy RECEIVING role to unified PURCHASING role
  return users.map(u => (u.role === ('RECEIVING' as any) ? { ...u, role: 'PURCHASING' } : u));
};
export const saveStoredUsers = (data: UserAccount[]) => safeSet(KEYS.USERS, JSON.stringify(data));

export const getStoredDepartments = (): Department[] => getOrInit(KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
export const saveStoredDepartments = (data: Department[]) => safeSet(KEYS.DEPARTMENTS, JSON.stringify(data));

export const getStoredCostCenters = (): CostCenter[] => getOrInit(KEYS.COST_CENTERS, INITIAL_COST_CENTERS);
export const saveStoredCostCenters = (data: CostCenter[]) => safeSet(KEYS.COST_CENTERS, JSON.stringify(data));

export const getStoredVendors = (): Vendor[] => getOrInit(KEYS.VENDORS, INITIAL_VENDORS);
export const saveStoredVendors = (data: Vendor[]) => safeSet(KEYS.VENDORS, JSON.stringify(data));

export const getStoredItems = (): MasterItem[] => getOrInit(KEYS.ITEMS, INITIAL_ITEMS);
export const saveStoredItems = (data: MasterItem[]) => safeSet(KEYS.ITEMS, JSON.stringify(data));

export const getStoredPRs = (): PurchaseRequisition[] => getOrInit(KEYS.PRS, INITIAL_PURCHASE_REQUISITIONS);
export const saveStoredPRs = (data: PurchaseRequisition[]) => safeSet(KEYS.PRS, JSON.stringify(data));

export const getStoredPOs = (): PurchaseOrder[] => getOrInit(KEYS.POS, INITIAL_PURCHASE_ORDERS);
export const saveStoredPOs = (data: PurchaseOrder[]) => safeSet(KEYS.POS, JSON.stringify(data));

export const getStoredGRNs = (): GoodsReceipt[] => getOrInit(KEYS.GRNS, INITIAL_GOODS_RECEIPTS);
export const saveStoredGRNs = (data: GoodsReceipt[]) => safeSet(KEYS.GRNS, JSON.stringify(data));

export const getStoredFoodFlash = (): FoodFlashRecord[] => getOrInit(KEYS.FOOD_FLASH, INITIAL_FOOD_FLASH);
export const saveStoredFoodFlash = (data: FoodFlashRecord[]) => safeSet(KEYS.FOOD_FLASH, JSON.stringify(data));

export const getStoredAuditLogs = (): AuditLog[] => getOrInit(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
export const saveStoredAuditLogs = (data: AuditLog[]) => safeSet(KEYS.AUDIT_LOGS, JSON.stringify(data));

export const getStoredAuthUser = (): UserAccount | null => {
  const item = safeGet(KEYS.AUTH_USER);
  if (!item) return null;
  try {
    return JSON.parse(item);
  } catch {
    return null;
  }
};
export const saveStoredAuthUser = (user: UserAccount | null) => {
  if (user) {
    safeSet(KEYS.AUTH_USER, JSON.stringify(user));
  } else {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(KEYS.AUTH_USER);
      }
    } catch {}
  }
};

export const getStoredGitHubConfig = (): GitHubSyncConfig => {
  const DEFAULT_CONFIG: GitHubSyncConfig = {
    repoName: 'gmcc-procurement-erp',
    username: '',
    token: '',
    description: 'GMCC Purchasing, Procurement & Daily Food Flash ERP System (Golo Mori Convention Center by ITDC, Labuan Bajo)',
    isPrivate: false,
    branch: 'main',
    remoteUrl: 'https://github.com/USERNAME/gmcc-procurement-erp.git',
    status: 'DISCONNECTED'
  };
  return getOrInit(KEYS.GITHUB_CONFIG, DEFAULT_CONFIG);
};
export const saveStoredGitHubConfig = (data: GitHubSyncConfig) => safeSet(KEYS.GITHUB_CONFIG, JSON.stringify(data));

export const getStoredRecipes = (): RecipeCostRecord[] => getOrInit(KEYS.RECIPES, INITIAL_RECIPES);
export const saveStoredRecipes = (data: RecipeCostRecord[]) => safeSet(KEYS.RECIPES, JSON.stringify(data));
