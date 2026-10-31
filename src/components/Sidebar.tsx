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
  ChefHat
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard' 
  | 'pr-create' 
  | 'prs' 
  | 'approval-center' 
  | 'purchase-orders' 
  | 'receiving' 
  | 'food-flash' 
  | 'recipe-cost'
  | 'master-data' 
  | 'admin'
  | 'github';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingApprovalsCount: number;
  totalPOsCount: number;
  currentUserRole: UserRole;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingApprovalsCount,
  totalPOsCount,
  currentUserRole,
  onLogout
}) => {
  const isAdminOrGm = currentUserRole === 'ADMIN' || currentUserRole === 'GM';

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
      id: 'prs', 
      label: 'Daftar Requisition (PR)', 
      icon: <FileText className="w-4 h-4" /> 
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
    { 
      id: 'food-flash', 
      label: 'Daily Food Flash', 
      icon: <Utensils className="w-4 h-4 text-emerald-400" />,
      badge: '3 View',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 font-semibold'
    },
    { 
      id: 'recipe-cost', 
      label: 'Recipe Cost Center', 
      icon: <ChefHat className="w-4 h-4 text-cyan-400" />,
      badge: 'Menu Cost',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 font-semibold'
    },
    { 
      id: 'master-data', 
      label: 'Master Data', 
      icon: <Database className="w-4 h-4" /> 
    },
    // System admin only visible to ADMIN and GM
    ...(isAdminOrGm ? [{
      id: 'admin' as ActiveTab, 
      label: 'System Admin', 
      icon: <Settings className="w-4 h-4 text-amber-400" />,
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
