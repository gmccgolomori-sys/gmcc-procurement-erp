import React from 'react';
import { UserRole } from '../types/procurement';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  ShieldCheck, 
  Package, 
  Truck, 
  Utensils, 
  Database, 
  Settings,
  Building2,
  LogOut,
  ChefHat,
  Receipt,
  Scale,
  KeyRound,
  FileCheck2,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard' 
  | 'pr-create' 
  | 'prs' 
  | 'approval-center' 
  | 'purchase-orders' 
  | 'receiving' 
  | 'spending-analytics'
  | 'ap-aging'
  | 'petty-cash'
  | 'billing-files'
  | 'reconciliation'
  | 'food-flash' 
  | 'recipe-cost'
  | 'google-sheets'
  | 'master-data' 
  | 'admin'
  | 'github';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingApprovalsCount: number;
  totalPOsCount: number;
  currentUserRole: UserRole;
  currentUser?: { department?: string; jobTitle?: string; role?: string };
  billingFilesCount?: number;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingApprovalsCount,
  totalPOsCount,
  currentUserRole,
  currentUser,
  billingFilesCount = 0,
  onOpenChangePassword,
  onLogout
}) => {
  const isAdminOrGm = currentUserRole === 'ADMIN' || currentUserRole === 'GM';
  
  // Wewenang Akses Terbatas (Hanya Purchasing, Head Finance, GM, dan Admin)
  const isFinanceUser = 
    (currentUser?.department || '').toLowerCase().includes('finance') || 
    (currentUser?.department || '').toLowerCase().includes('accounting') ||
    (currentUser?.jobTitle || '').toLowerCase().includes('chief acc');
  const canAccessRestricted = isAdminOrGm || currentUserRole === 'PURCHASING' || (currentUserRole as any) === 'FINANCE' || isFinanceUser;

  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string | number; badgeColor?: string; adminOnly?: boolean }[] = [
    { 
      id: 'dashboard', 
      label: 'Executive Dashboard', 
      icon: <LayoutDashboard className="w-4 h-4" /> 
    },
    { 
      id: 'pr-create', 
      label: 'Buat PR Baru', 
      icon: <PlusCircle className="w-4 h-4 text-cyan-400" /> 
    },
    { 
      id: 'approval-center', 
      label: 'Approval Center', 
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-black'
    },
    { 
      id: 'purchase-orders', 
      label: 'Purchase Orders (PO)', 
      icon: <Package className="w-4 h-4" />,
      badge: totalPOsCount,
      badgeColor: 'bg-cyan-500/20 text-cyan-300'
    },
    { 
      id: 'receiving', 
      label: 'Penerimaan Barang (GRN)', 
      icon: <Truck className="w-4 h-4" /> 
    },
    // Modul Daftar Belanja & Insight Pengadaan
    { 
      id: 'spending-analytics' as ActiveTab, 
      label: 'Daftar Belanja & Insight', 
      icon: <TrendingUp className="w-4 h-4 text-amber-400" />
    },
    // Modul AP Aging (Hutang Dagang Rekanan) - Akses Terbatas
    ...(canAccessRestricted ? [{ 
      id: 'ap-aging' as ActiveTab, 
      label: 'AP Aging (Hutang Rekanan)', 
      icon: <Receipt className="w-4 h-4 text-amber-400" />
    }] : []),
    // Modul Kas Kecil (Petty Cash Settlement) - Akses Terbatas
    ...(canAccessRestricted ? [{ 
      id: 'petty-cash' as ActiveTab, 
      label: 'Petty Cash & Settlement', 
      icon: <Receipt className="w-4 h-4 text-amber-400" />
    }] : []),
    // Modul Berkas Tagihan Kas Kecil (Dibakukan) - Akses Terbatas
    ...(canAccessRestricted ? [{ 
      id: 'billing-files' as ActiveTab, 
      label: 'Berkas Tagihan Kas Kecil', 
      icon: <FileCheck2 className="w-4 h-4 text-teal-400" />,
      badge: billingFilesCount > 0 ? billingFilesCount : undefined,
      badgeColor: 'bg-teal-500/20 text-teal-300 font-mono font-bold'
    }] : []),
    // Modul Rekonsiliasi Kas Kecil - Akses Terbatas
    ...(canAccessRestricted ? [{ 
      id: 'reconciliation' as ActiveTab, 
      label: 'Rekonsiliasi Kas Kecil', 
      icon: <Scale className="w-4 h-4 text-emerald-400" />
    }] : []),
    { 
      id: 'food-flash', 
      label: 'Daily Food Flash', 
      icon: <Utensils className="w-4 h-4 text-emerald-400" />
    },
    { 
      id: 'recipe-cost', 
      label: 'Recipe Cost Center', 
      icon: <ChefHat className="w-4 h-4 text-cyan-400" />
    },
    // Google Sheets Database (2-Way Sync)
    ...(canAccessRestricted ? [{ 
      id: 'google-sheets' as ActiveTab, 
      label: 'Google Sheets Database', 
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> 
    }] : []),
    // Master Data (Katalog Barang & Spesifikasi) - Requestor diizinkan membuka dan mengisi
    ...((canAccessRestricted || currentUserRole === 'REQUESTOR') ? [{ 
      id: 'master-data' as ActiveTab, 
      label: currentUserRole === 'REQUESTOR' ? 'Katalog & Spesifikasi' : 'Master Data', 
      icon: <Database className="w-4 h-4 text-cyan-400" /> 
    }] : []),
    // System admin only visible to ADMIN and GM
    ...(isAdminOrGm ? [{
      id: 'admin' as ActiveTab, 
      label: 'System Admin & User', 
      icon: <Settings className="w-4 h-4 text-cyan-400" />,
      adminOnly: true
    }] : [])
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 hidden md:flex">
      <div className="space-y-4">
        {/* Menu Items (Card image pertama dihapus sesuai permintaan) */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">
            Modul Procurement & Food Flash
          </div>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* System Status footer & Logout Button */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <div className="text-[11px] font-medium text-slate-300">GMCC ERP Hub</div>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10">
            Aktif (WITA)
          </span>
        </div>

        {onOpenChangePassword && (
          <button
            onClick={onOpenChangePassword}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            title="Ubah kata sandi akun aktif saat ini"
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ganti Password</span>
          </button>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar dari Sistem (Log Out)</span>
          </button>
        )}
      </div>
    </aside>
  );
};
