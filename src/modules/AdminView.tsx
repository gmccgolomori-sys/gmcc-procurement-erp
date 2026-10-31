import React, { useState } from 'react';
import { UserAccount, AuditLog, UserRole, Department } from '../types/procurement';
import { SAMPLE_SIGNATURES } from '../data/procurementMock';
import { 
  ShieldCheck, 
  KeyRound, 
  Users, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Lock,
  Upload,
  Image as ImageIcon,
  PenTool,
  UserCheck
} from 'lucide-react';

interface AdminViewProps {
  users: UserAccount[];
  currentUser: UserAccount;
  auditLogs: AuditLog[];
  departments: Department[];
  onAddUser: (user: UserAccount) => void;
  onEditUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUserPassword: (userId: string, newPass: string) => void;
  onUpdateUserSignature: (userId: string, signatureUrl: string) => void;
  onResetAllData: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  users,
  currentUser,
  auditLogs,
  departments,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onUpdateUserPassword,
  onUpdateUserSignature,
  onResetAllData
}) => {
  // Requirement: "system admin hanya diakses oleh admin dan GM"
  const isAuthorized = currentUser.role === 'ADMIN' || currentUser.role === 'GM';

  const [activeTab, setActiveTab] = useState<'USERS' | 'SIGNATURES' | 'PASSWORDS'>('USERS');

  // User CRUD Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // User Form State
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('REQUESTOR');
  const [formDepartment, setFormDepartment] = useState('Food & Beverage');
  const [formPassword, setFormPassword] = useState('pass123');
  const [formEmail, setFormEmail] = useState('');
  const [formSignatureUrl, setFormSignatureUrl] = useState('');

  // Password Reset Box State
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isAuthorized) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-lg mx-auto my-12 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white">Akses Dibatasi (Admin & General Manager Only)</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Modul System Administrator & User Management hanya dapat diakses oleh akun dengan peran <b>ADMIN</b> atau <b>General Manager (GM)</b>.
        </p>
        <div className="text-[11px] text-slate-500 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
          Akun aktif saat ini: <span className="text-cyan-300 font-bold">{currentUser.name}</span> ({currentUser.role})
        </div>
      </div>
    );
  }

  // Handle User File Signature Upload (Convert to Data URL)
  const handleSignatureFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetUserId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        if (targetUserId) {
          onUpdateUserSignature(targetUserId, base64data);
          alert('Tanda tangan digital pengguna berhasil diperbarui!');
        } else {
          setFormSignatureUrl(base64data);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startAddUser = () => {
    setFormUsername('');
    setFormName('');
    setFormRole('REQUESTOR');
    setFormDepartment(departments[0]?.name || 'Food & Beverage Department');
    setFormPassword('pass123');
    setFormEmail('');
    setFormSignatureUrl(SAMPLE_SIGNATURES.CHEF);
    setEditingUserId(null);
    setShowAddUserModal(true);
  };

  const startEditUser = (u: UserAccount) => {
    setEditingUserId(u.id);
    setFormUsername(u.username);
    setFormName(u.name);
    setFormRole(u.role);
    setFormDepartment(u.department);
    setFormPassword(u.password);
    setFormEmail(u.email);
    setFormSignatureUrl(u.signatureUrl || '');
    setShowEditUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || !formName.trim() || !formPassword.trim()) {
      alert('Username, Nama, dan Password wajib diisi.');
      return;
    }

    if (editingUserId) {
      const existing = users.find(u => u.id === editingUserId);
      if (!existing) return;

      const updated: UserAccount = {
        ...existing,
        username: formUsername.trim().toLowerCase(),
        name: formName.trim(),
        role: formRole,
        department: formDepartment,
        password: formPassword,
        email: formEmail || `${formUsername.toLowerCase()}@golomori.id`,
        signatureUrl: formSignatureUrl || existing.signatureUrl
      };

      onEditUser(updated);
      setShowEditUserModal(false);
      alert(`Akun pengguna @${updated.username} berhasil diperbarui!`);
    } else {
      // Check duplicate username
      if (users.some(u => u.username.toLowerCase() === formUsername.trim().toLowerCase())) {
        alert(`Username "${formUsername}" sudah digunakan. Gunakan username lain.`);
        return;
      }

      const newUser: UserAccount = {
        id: `u-${Date.now()}`,
        username: formUsername.trim().toLowerCase(),
        name: formName.trim(),
        role: formRole,
        department: formDepartment,
        password: formPassword,
        email: formEmail || `${formUsername.toLowerCase()}@golomori.id`,
        signatureUrl: formSignatureUrl || SAMPLE_SIGNATURES.PURCHASING
      };

      onAddUser(newUser);
      setShowAddUserModal(false);
      alert(`Akun pengguna baru @${newUser.username} berhasil ditambahkan!`);
    }
  };

  const handleDeleteUser = (u: UserAccount) => {
    if (u.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus akun @${u.username} (${u.name})?`)) {
      onDeleteUser(u.id);
      alert(`Akun @${u.username} telah dihapus.`);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = users.find(u => u.id === selectedUserId) || users[0];
    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'Password baru minimal 4 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok dengan password baru.' });
      return;
    }

    onUpdateUserPassword(targetUser.id, newPassword);
    setMessage({ 
      type: 'success', 
      text: `Password untuk akun ${targetUser.name} (@${targetUser.username}) berhasil diperbarui!` 
    });
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            System Administration & User Management
          </h1>
          <p className="text-xs text-slate-400">
            Kelola username, akun pengguna, reset password, dan tanda tangan digital resmi PO
          </p>
        </div>

        {activeTab === 'USERS' && (
          <button
            onClick={startAddUser}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah User Baru</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'USERS'
              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manajemen Pengguna ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SIGNATURES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'SIGNATURES'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>Modul Tanda Tangan Digital PO</span>
        </button>

        <button
          onClick={() => setActiveTab('PASSWORDS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'PASSWORDS'
              ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Reset Password Pengguna</span>
        </button>
      </div>

      {/* TAB 1: USER MANAGEMENT CRUD */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="border border-slate-800 rounded-2xl bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/70 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Nama Lengkap</th>
                    <th className="px-4 py-3">Password (Login)</th>
                    <th className="px-4 py-3">Peran (Role)</th>
                    <th className="px-4 py-3">Departemen</th>
                    <th className="px-4 py-3 text-center">Tanda Tangan Digital</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono text-cyan-400 font-bold">@{u.username}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono text-xs text-amber-300">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>{u.password || '123456'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-semibold text-[10px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{u.department}</td>
                      <td className="px-4 py-3 text-center">
                        {u.signatureUrl ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Terpasang</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Belum Diupload</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEditUser(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                            title="Edit Akun Pengguna"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 transition-colors"
                            title="Hapus Akun Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIGITAL SIGNATURES MODULE */}
      {activeTab === 'SIGNATURES' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <PenTool className="w-4 h-4 shrink-0" />
            <span>
              Tanda tangan digital ini otomatis disematkan pada lembar otorisasi dokumen Purchase Order (PO) resmi GMCC untuk Requestor, Purchasing, Finance, dan General Manager.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => (
              <div key={u.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">{u.name}</h3>
                    <p className="text-[11px] text-cyan-400">@{u.username} • {u.role}</p>
                  </div>
                  <span className="text-[10px] text-slate-400">{u.department.split('(')[0]}</span>
                </div>

                {/* Signature Preview Box */}
                <div className="h-20 rounded-xl bg-white flex items-center justify-center p-2 border border-slate-300 shadow-inner overflow-hidden">
                  {u.signatureUrl ? (
                    <img 
                      src={u.signatureUrl} 
                      alt={`TTD ${u.name}`} 
                      className="max-h-16 max-w-full object-contain" 
                    />
                  ) : (
                    <span className="text-slate-400 text-xs italic">Belum Ada Gambar TTD</span>
                  )}
                </div>

                {/* Upload or Set Preset Signature */}
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex-1 cursor-pointer py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-center text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Upload PNG/JPG</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSignatureFileUpload(e, u.id)}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => {
                      const preset = u.role === 'GM' ? SAMPLE_SIGNATURES.GM :
                                     u.role === 'DEPT_HEAD' ? SAMPLE_SIGNATURES.FINANCE :
                                     u.role === 'PURCHASING' ? SAMPLE_SIGNATURES.PURCHASING :
                                     SAMPLE_SIGNATURES.CHEF;
                      onUpdateUserSignature(u.id, preset);
                      alert(`Preset tanda tangan digital diterapkan untuk ${u.name}!`);
                    }}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold"
                    title="Gunakan Preset Tanda Tangan Digital Resmi"
                  >
                    Preset
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PASSWORDS RESET */}
      {activeTab === 'PASSWORDS' && (
        <div className="max-w-lg mx-auto p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Reset Password Akun Pengguna</h2>
          </div>

          {message && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-3.5">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Pilih Akun Pengguna</label>
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setMessage(null);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (@{u.username}) - {u.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 4 karakter..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Konfirmasi Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition-all"
            >
              Simpan & Perbarui Password
            </button>
          </form>
        </div>
      )}

      {/* Modal: Tambah / Edit User */}
      {(showAddUserModal || showEditUserModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingUserId ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna Baru'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddUserModal(false);
                  setShowEditUserModal(false);
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Username (Login ID) *</label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="Contoh: staff_fb, purchasing..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Password (Akses Login) *</span>
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Masukkan password login..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Password ini digunakan untuk login di halaman utama.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Stefanus Gaku (Restaurant Mgr)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Peran (User Role) *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="REQUESTOR">REQUESTOR (Pemohon Barang)</option>
                    <option value="PURCHASING">PURCHASING & RECEIVING (Pengadaan & Penerimaan Barang)</option>
                    <option value="DEPT_HEAD">DEPT_HEAD (Kepala Dept / Finance)</option>
                    <option value="GM">GM (General Manager)</option>
                    <option value="ADMIN">ADMIN (IT Administrator)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Departemen *</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    required
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                    {formDepartment && !departments.some(d => d.name === formDepartment) && (
                      <option value={formDepartment}>{formDepartment}</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Resmi</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="nama@golomori.id"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Signature Upload in User Form */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tanda Tangan Digital Resmi</label>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-12 bg-white rounded-lg flex items-center justify-center p-1 border border-slate-300">
                    {formSignatureUrl ? (
                      <img src={formSignatureUrl} alt="TTD" className="max-h-10 max-w-full object-contain" />
                    ) : (
                      <span className="text-[9px] text-slate-400">Kosong</span>
                    )}
                  </div>
                  <label className="cursor-pointer py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload TTD</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSignatureFileUpload(e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setShowEditUserModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  {editingUserId ? 'Perbarui Pengguna' : 'Simpan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
