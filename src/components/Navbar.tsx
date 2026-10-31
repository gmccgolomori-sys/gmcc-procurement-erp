import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types/procurement';
import { 
  Building2, 
  Clock, 
  Github, 
  Bell, 
  CheckCircle2, 
  MapPin,
  ChevronDown,
  UserCheck,
  KeyRound,
  Lock,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onSelectUser: (user: UserAccount) => void;
  pendingApprovalsCount: number;
  onNavigateToGitHub?: () => void;
  onNavigateToApprovals: () => void;
  onOpenChangePassword: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  pendingApprovalsCount,
  onNavigateToApprovals,
  onOpenChangePassword,
  onLogout
}) => {
  const [witaTime, setWitaTime] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Makassar',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      setWitaTime(now.toLocaleString('id-ID', options) + ' WITA');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 backdrop-blur sticky top-0 z-40 px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3.5">
          <img 
            src={`${import.meta.env.BASE_URL}assets/aistudio/GMCC___Logo_Primer___Putih_8d762ffb.png`}
            alt="GMCC - GOLO MORI CONVENTION CENTER Logo" 
            className="h-10 sm:h-12 w-auto object-contain shrink-0" 
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base lg:text-lg tracking-tight text-white uppercase">
                GOLO MORI CONVENTION CENTER
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Procurement ERP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 hidden sm:flex">
              <MapPin className="w-3 h-3 text-cyan-400" />
              Convention Center by ITDC • Labuan Bajo, Manggarai Barat, NTT
            </p>
          </div>
        </div>

        {/* Center: Live WITA Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-cyan-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{witaTime || 'Memuat Waktu WITA...'}</span>
        </div>

        {/* Right Actions: Notifications + User Menu */}
        <div className="flex items-center gap-2 lg:gap-3">

          {/* Pending Approval Notifications */}
          <button
            onClick={onNavigateToApprovals}
            className="relative p-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
            title={`${pendingApprovalsCount} PR menunggu persetujuan`}
          >
            <Bell className="w-4 h-4" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center animate-bounce">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          {/* User Switcher Dropdown & Logout */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center text-xs font-bold ring-1 ring-white/10 shrink-0">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden xl:block">
                <div className="text-xs font-bold text-slate-200 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="text-cyan-400 font-semibold">{currentUser.role}</span>
                  <span>•</span>
                  <span>{currentUser.department.split('(')[0]}</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-2">
                <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{currentUser.name}</div>
                    <div className="text-[10px] text-cyan-400">@{currentUser.username} • {currentUser.role}</div>
                  </div>
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      onOpenChangePassword();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold flex items-center gap-1 border border-slate-700"
                    title="Ganti Password Akun Saya"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Password</span>
                  </button>
                </div>

                <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Ganti Akun Pengguna (Switch Account):
                </div>

                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                        currentUser.id === u.id
                          ? 'bg-cyan-500/10 border border-cyan-500/30 text-white'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="w-7 h-7 rounded bg-slate-800 text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">
                        {u.role.substring(0, 2)}
                      </div>
                      <div className="overflow-hidden flex-1 text-xs">
                        <div className="font-semibold truncate flex items-center gap-1.5 text-slate-200">
                          {u.name}
                          {currentUser.id === u.id && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          @{u.username} • {u.department}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Logout Option */}
                {onLogout && (
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setShowRoleDropdown(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar dari Sistem (Log Out)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
