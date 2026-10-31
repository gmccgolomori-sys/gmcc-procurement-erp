import React, { useState } from 'react';
import { UserAccount } from '../types/procurement';
import { KeyRound, X, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordModalProps {
  currentUser: UserAccount;
  onClose: () => void;
  onSaveNewPassword: (userId: string, newPass: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  currentUser,
  onClose,
  onSaveNewPassword
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPassword !== currentUser.password) {
      setError('Password lama yang Anda masukkan salah!');
      return;
    }
    if (newPassword.length < 4) {
      setError('Password baru minimal 4 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password baru tidak cocok!');
      return;
    }

    onSaveNewPassword(currentUser.id, newPassword);
    alert('Password akun Anda berhasil diganti!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Ganti Password Akun</h3>
              <p className="text-[11px] text-slate-400">{currentUser.name} (@{currentUser.username})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password Saat Ini *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={oldPassword}
              onChange={(e) => { setError(''); setOldPassword(e.target.value); }}
              placeholder="Masukkan password lama..."
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password Baru *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => { setError(''); setNewPassword(e.target.value); }}
              placeholder="Minimal 4 karakter..."
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-cyan-300 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Konfirmasi Password Baru *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => { setError(''); setConfirmPassword(e.target.value); }}
              placeholder="Ulangi password baru..."
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-cyan-300 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="showPass"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded"
            />
            <label htmlFor="showPass" className="text-slate-400 cursor-pointer">
              Tampilkan Password
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold"
            >
              Simpan Password Baru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
