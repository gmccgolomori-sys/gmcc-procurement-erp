import React, { useState } from 'react';
import { UserAccount } from '../types/procurement';
import { GMCC_LOGO_WHITE } from '../data/gmccLogo';
import { 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  MapPin,
  Building2,
  HelpCircle,
  KeyRound,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  X,
  Copy,
  ChevronRight
} from 'lucide-react';

interface LoginScreenProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  onResetUsers?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  users, 
  onLoginSuccess,
  onResetUsers 
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState(false);

  // Fallback to find admin account
  const adminAccount = users.find(u => u.username === 'admin') || users.find(u => u.role === 'ADMIN') || users[0];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedInput = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    // 1. Search by username or email
    let user = users.find(u => 
      u.username.toLowerCase() === trimmedInput || 
      (u.email && u.email.toLowerCase() === trimmedInput)
    );

    // 2. Fallback aliases for GMCC executive admin
    if (!user && (
      trimmedInput === 'gmccgolomori@gmail.com' ||
      trimmedInput === 'gmcc' ||
      trimmedInput === 'gmccgolomori' ||
      trimmedInput === 'admin' ||
      trimmedInput === 'administrator' ||
      trimmedInput === 'admin.it@golomori.id'
    )) {
      user = adminAccount;
    }

    if (!user) {
      setErrorMessage(`Akun "${username}" tidak terdaftar. Gunakan "admin" atau klik tombol "Bantuan Akun & Password" di bawah.`);
      return;
    }

    if (user.status === 'INACTIVE') {
      setErrorMessage(`Akun "${user.name}" dinonaktifkan oleh Administrator. Hubungi IT GMCC.`);
      return;
    }

    // 3. Password matching (allow exact, trimmed, or admin default passwords)
    const isValidPass = 
      user.password === password ||
      user.password.trim() === trimmedPass ||
      (user.username === 'admin' && (trimmedPass === 'admin123' || trimmedPass === 'gmcc123' || trimmedPass === 'gmcc2026'));

    if (!isValidPass) {
      setErrorMessage(`Password untuk akun "${user.username}" tidak sesuai. Gunakan password "admin123" atau klik "Masuk Cepat Sebagai Administrator".`);
      return;
    }

    onLoginSuccess(user);
  };

  const handleQuickLogin = (targetUser?: UserAccount) => {
    const userToLogin = targetUser || adminAccount;
    if (userToLogin) {
      onLoginSuccess(userToLogin);
    }
  };

  const handleAutoFillForm = (account: UserAccount) => {
    setUsername(account.username);
    setPassword(account.password);
    setShowHelpModal(false);
    setErrorMessage('');
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleResetDefaults = () => {
    if (onResetUsers) {
      onResetUsers();
      setResetSuccessMessage(true);
      setTimeout(() => setResetSuccessMessage(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-cyan-500 selection:text-white relative overflow-hidden">
      
      {/* Background Glow Atmosphere */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-900 z-10">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Kawasan Pariwisata The Golo Mori by ITDC • Labuan Bajo, NTT</span>
          <span className="sm:hidden">The Golo Mori by ITDC</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>SSL 256-bit Encrypted</span>
        </div>
      </header>

      {/* Main Single Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10 my-6">
        <div className="w-full max-w-md p-6 sm:p-9 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          
          {/* GMCC Logo Primer Putih */}
          <div className="text-center space-y-3">
            <img 
              src={GMCC_LOGO_WHITE} 
              alt="GOLO MORI CONVENTION CENTER" 
              className="h-14 sm:h-16 w-auto mx-auto object-contain drop-shadow-md"
            />
            <div>
              <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                GOLO MORI CONVENTION CENTER
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Procurement &amp; Supply Chain ERP Portal
              </p>
            </div>
          </div>

          {/* Error Message with Immediate Solution */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <div>{errorMessage}</div>
                <button
                  type="button"
                  onClick={() => handleQuickLogin()}
                  className="mt-1.5 inline-flex items-center gap-1 font-bold text-cyan-300 hover:text-white underline text-[11px]"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Klik di sini untuk Masuk Langsung Sebagai Admin</span>
                </button>
              </div>
            </div>
          )}

          {/* Secure Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username atau Email Akun
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Contoh: admin atau gmccgolomori@gmail.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs font-medium placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  required
                  autoFocus
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Password Akun</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-normal transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
                  placeholder="Contoh: admin123"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs font-medium placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Masuk ke Sistem</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Access Bar */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {/* 1-Click Fast Login as Admin */}
            <button
              type="button"
              onClick={() => handleQuickLogin()}
              className="w-full py-2.5 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition-all hover:border-cyan-400"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Masuk Cepat Sebagai Administrator (1-Klik)</span>
            </button>

            {/* Help / Directory Button */}
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="w-full py-2 text-center text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Bantuan Login &amp; Daftar Akun Resmi GMCC</span>
            </button>
          </div>

          {/* Footer Notice */}
          <div className="pt-2 text-center">
            <p className="text-[10px] text-slate-500">
              Akses sistem resmi GOLO MORI CONVENTION CENTER by ITDC.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[10px] text-slate-500 border-t border-slate-900 z-10">
        &copy; {new Date().getFullYear()} GOLO MORI CONVENTION CENTER by ITDC. Hak Cipta Dilindungi.
      </footer>

      {/* MODAL: BANTUAN LOGIN & DAFTAR AKUN RESMI GMCC */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Bantuan Login &amp; Daftar Akun Resmi GMCC
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pilih akun Anda di bawah untuk masuk otomatis atau melihat data otentikasi.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Reset Success Alert */}
              {resetSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Semua akun dan password telah berhasil dipulihkan ke pengaturan standar bawaan.</span>
                </div>
              )}

              <div className="text-slate-300 text-xs leading-relaxed">
                Berikut adalah kredensial akun bawaan sistem ERP GMCC. Anda dapat langsung mengklik tombol <b className="text-cyan-300">"Masuk Otomatis"</b> pada peran yang diinginkan:
              </div>

              {/* List of Accounts */}
              <div className="space-y-3">
                {users.map(u => (
                  <div 
                    key={u.id}
                    className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-slate-800 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-inner">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{u.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-700 text-cyan-300 border border-slate-600">
                            {u.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {u.jobTitle || u.department}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 font-mono text-[11px]">
                          <span className="text-slate-300">
                            Username: <b className="text-white">{u.username}</b>
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-300">
                            Password: <b className="text-amber-300">{u.password}</b>
                          </span>
                          {u.username === 'admin' && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px]">
                              Email: gmccgolomori@gmail.com
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleAutoFillForm(u)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors"
                        title="Tuliskan akun ini pada formulir login"
                      >
                        Isi di Form
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin(u)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition-all"
                      >
                        <span>Masuk Otomatis</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reset to Factory Default Button */}
              {onResetUsers && (
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 mt-4">
                  <div>
                    <span className="font-bold text-white block text-xs">Lupa Password Akun / Terkunci?</span>
                    <span className="text-[10px] text-slate-400">
                      Klik tombol ini untuk memulihkan seluruh akun dan password ke pengaturan awal.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Password Default</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Pilih salah satu peran untuk menguji alur kerja PR &rarr; Approval &rarr; PO &rarr; Receiving &rarr; Kas Kecil.
              </span>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
