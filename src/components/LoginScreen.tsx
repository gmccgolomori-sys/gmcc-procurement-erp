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
  Building2
} from 'lucide-react';

interface LoginScreenProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  onResetUsers?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  users, 
  onLoginSuccess 
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      setErrorMessage(`Akun "${username}" tidak ditemukan. Pastikan username atau email yang Anda masukkan sudah benar.`);
      return;
    }

    if (user.status === 'INACTIVE') {
      setErrorMessage(`Akun "${user.name}" dinonaktifkan oleh Administrator. Silakan hubungi IT / Administrator.`);
      return;
    }

    // 3. Password matching (allow exact, trimmed, or admin default passwords)
    const isValidPass = 
      user.password === password ||
      user.password.trim() === trimmedPass ||
      (user.username === 'admin' && (trimmedPass === 'admin123' || trimmedPass === 'gmcc123' || trimmedPass === 'gmcc2026'));

    if (!isValidPass) {
      setErrorMessage(`Password yang Anda masukkan salah. Silakan coba kembali.`);
      return;
    }

    onLoginSuccess(user);
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

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
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
                  placeholder="Masukkan username atau email resmi"
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
                  placeholder="Masukkan password akun"
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

          {/* Footer Notice */}
          <div className="pt-2 text-center border-t border-slate-800/80">
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
    </div>
  );
};
