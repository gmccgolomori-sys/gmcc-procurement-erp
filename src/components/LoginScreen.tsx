import React, { useState } from 'react';
import { UserAccount } from '../types/procurement';
import { 
  Building2, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Eye,
  EyeOff,
  MapPin,
  Clock,
  Package,
  Truck,
  Utensils,
  FileText,
  KeyRound,
  ChevronRight
} from 'lucide-react';

interface LoginScreenProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLoginSuccess }) => {
  const [username, setUsername] = useState('purchasing');
  const [password, setPassword] = useState('purchasing123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedUser = username.trim().toLowerCase();
    const user = users.find(u => u.username.toLowerCase() === trimmedUser);

    if (!user) {
      setErrorMessage(`Username "${username}" tidak terdaftar di sistem GMCC.`);
      return;
    }

    if (user.password !== password) {
      setErrorMessage('Password salah. Silakan periksa kembali password akun Anda.');
      return;
    }

    onLoginSuccess(user);
  };

  const selectPresetAccount = (targetUser: UserAccount) => {
    setUsername(targetUser.username);
    setPassword(targetUser.password);
    setErrorMessage('');
  };

  const quickLoginAs = (targetUser: UserAccount) => {
    setUsername(targetUser.username);
    setPassword(targetUser.password);
    onLoginSuccess(targetUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Corporate Landing Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <img 
            src={`${import.meta.env.BASE_URL}assets/aistudio/GMCC___Logo_Primer___Putih_8d762ffb.png`}
            alt="GMCC - GOLO MORI CONVENTION CENTER Logo" 
            className="h-10 sm:h-12 w-auto object-contain shrink-0" 
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm md:text-base tracking-tight text-white uppercase">
                GOLO MORI CONVENTION CENTER
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Enterprise ERP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>Convention Center by ITDC • Labuan Bajo, Manggarai Barat, NTT</span>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-cyan-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Waktu Baku WITA</span>
        </div>
      </header>

      {/* Main Landing Page Hero & Login Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-8 lg:gap-14 my-auto">
        
        {/* Left Side: System Profile & ERP Overview */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sistem Pengadaan Resmi & Manajemen Rantai Pasok Terpadu</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight uppercase">
              GOLO MORI CONVENTION CENTER
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-light leading-relaxed">
              Platform ERP pengadaan barang, verifikasi anggaran cost center multi-departemen, persetujuan bertingkat, penerbitan Purchase Order resmi, audit nota penerimaan, dan analisa Daily Food Flash.
            </p>
          </div>

          {/* Quick Pillar Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 pt-2 text-left">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2 font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Purchase Requisition</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Pengajuan barang oleh Kepala Departemen & verifikasi Purchasing.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Approval Center</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Persetujuan bertingkat transparan tanpa hambatan birokrasi.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 font-bold">
                <Package className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">PO & Receiving Hub</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Surat Pesanan A4 resmi & audit nota fisik pos penerimaan barang.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-2 font-bold">
                <Utensils className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Daily Food Flash</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Pemantauan food cost aktual 2 outlet: Nuka Resto & MICE Banquet.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Secure Login Portal Card */}
        <div className="w-full max-w-md shrink-0 space-y-4">
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>Portal Masuk Pengguna</span>
                </h2>
                <p className="text-[11px] text-slate-400">Silakan masukkan Username & Password akun Anda</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                SSL Secured
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username Akun
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Contoh: purchasing, gm, chef, admin..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Password Akun</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-normal"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Sembunyikan' : 'Perlihatkan'}</span>
                  </button>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Masukkan password akun..."
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <span>Masuk ke Dashboard ERP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Official User Credentials Directory */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Daftar Akun & Password Resmi (Demo Testing):
                </span>
                <span className="text-[9px] text-cyan-400">Klik untuk masuk</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => quickLoginAs(u)}
                    className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/40 text-left transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                        <span>{u.name}</span>
                        <span className="text-[10px] font-normal text-slate-400">({u.role})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>User: <b className="text-slate-200 font-mono">@{u.username}</b></span>
                        <span>•</span>
                        <span>Pass: <b className="text-cyan-300 font-mono">{u.password}</b></span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-500">
            GOLO MORI CONVENTION CENTER by ITDC • Hak Cipta Dilindungi
          </p>
        </div>
      </main>
    </div>
  );
};
