import React, { useState, useMemo } from 'react';
import { UserAccount, AuditLog, UserRole, Department } from '../types/procurement';
import { SAMPLE_SIGNATURES } from '../data/procurementMock';
import { 
  ShieldCheck, 
  KeyRound, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Lock,
  Upload,
  PenTool,
  Search,
  Phone,
  Mail,
  Briefcase,
  Eye,
  EyeOff,
  Copy,
  Check,
  UserCheck,
  UserX,
  Filter,
  Shield,
  Building
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

  // Search & Filters for Users
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Password visibility map (userId -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // User CRUD Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedSignatureUser, setSelectedSignatureUser] = useState<UserAccount | null>(null);

  // User Form State with Complete Detail
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('REQUESTOR');
  const [formDepartment, setFormDepartment] = useState('Food & Beverage');
  const [formJobTitle, setFormJobTitle] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
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
        <h2 className="text-lg font-bold text-white">Akses Dibatasi (Admin &amp; General Manager Only)</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Modul System Administrator &amp; User Management hanya dapat diakses oleh akun dengan peran <b>ADMIN</b> atau <b>General Manager (GM)</b>.
        </p>
        <div className="text-[11px] text-slate-500 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
          Akun aktif saat ini: <span className="text-cyan-300 font-bold">{currentUser.name}</span> ({currentUser.role})
        </div>
      </div>
    );
  }

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.jobTitle && u.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.phone && u.phone.includes(searchQuery));
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchDept = deptFilter === 'ALL' || u.department === deptFilter;
      const matchStatus = statusFilter === 'ALL' || (u.status || 'ACTIVE') === statusFilter;
      return matchSearch && matchRole && matchDept && matchStatus;
    });
  }, [users, searchQuery, roleFilter, deptFilter, statusFilter]);

  // Statistics
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter(u => (u.status || 'ACTIVE') === 'ACTIVE').length;
  const adminGmCount = users.filter(u => u.role === 'ADMIN' || u.role === 'GM').length;
  const purchasingOpsCount = users.filter(u => u.role === 'PURCHASING' || u.role === 'MICE_OP' || u.role === 'NUKA_OP').length;

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle user status
  const handleToggleStatus = (u: UserAccount) => {
    if (u.id === currentUser.id) {
      alert('Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.');
      return;
    }
    const nextStatus = (u.status || 'ACTIVE') === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    onEditUser({ ...u, status: nextStatus });
  };

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
    setFormDepartment(departments[0]?.name || 'Food & Beverage');
    setFormJobTitle('Staff Pemohon');
    setFormPhone('+62 812-');
    setFormStatus('ACTIVE');
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
    setFormJobTitle(u.jobTitle || '');
    setFormPhone(u.phone || '');
    setFormStatus(u.status || 'ACTIVE');
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
        jobTitle: formJobTitle.trim() || undefined,
        phone: formPhone.trim() || undefined,
        status: formStatus,
        password: formPassword,
        email: formEmail || `${formUsername.toLowerCase()}@golomori.id`,
        signatureUrl: formSignatureUrl || existing.signatureUrl
      };

      onEditUser(updated);
      setShowEditUserModal(false);
      alert(`Akun pengguna @${updated.username} (${updated.name}) berhasil diperbarui!`);
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
        jobTitle: formJobTitle.trim() || undefined,
        phone: formPhone.trim() || undefined,
        status: formStatus,
        password: formPassword,
        email: formEmail || `${formUsername.toLowerCase()}@golomori.id`,
        signatureUrl: formSignatureUrl || SAMPLE_SIGNATURES.PURCHASING,
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: 'Baru dibuat'
      };

      onAddUser(newUser);
      setShowAddUserModal(false);
      alert(`Akun pengguna baru @${newUser.username} berhasil didaftarkan ke sistem GMCC!`);
    }
  };

  const handleDeleteUser = (u: UserAccount) => {
    if (u.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus akun @${u.username} (${u.name})? Tindakan ini akan menghapus akses login pengguna.`)) {
      onDeleteUser(u.id);
      alert(`Akun @${u.username} telah dihapus dari sistem.`);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              System Administration &amp; Manajemen Pengguna (User Accounts)
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Kelola akun resmi GMCC, otentikasi login, password, hak akses peran, profil departemen, dan tanda tangan otorisasi.
            </p>
          </div>
        </div>

        {activeTab === 'USERS' && (
          <button
            onClick={startAddUser}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Baru</span>
          </button>
        )}
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Akun Terdaftar</div>
          <div className="text-2xl font-black text-white font-mono mt-1">{totalUsersCount}</div>
          <div className="text-[11px] text-cyan-400 mt-1">Sistem GMCC Hub</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[10px] uppercase font-bold text-slate-400">Akun Aktif (Login Ready)</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{activeUsersCount}</div>
          <div className="text-[11px] text-emerald-300 mt-1">Otorisasi Berjalan</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[10px] uppercase font-bold text-slate-400">Manajemen GM &amp; Admin</div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">{adminGmCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Akses Penuh Sistem</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[10px] uppercase font-bold text-slate-400">Purchasing &amp; Operasional</div>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-1">{purchasingOpsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Pengadaan &amp; Receiving</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'USERS'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Akun Pengguna ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SIGNATURES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'SIGNATURES'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>Tanda Tangan Digital Otorisasi</span>
        </button>

        <button
          onClick={() => setActiveTab('PASSWORDS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'PASSWORDS'
              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Reset Password Pengguna</span>
        </button>
      </div>

      {/* TAB 1: USER MANAGEMENT WITH COMPLETE DETAILS & FILTERS */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, username, jabatan..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              >
                <option value="ALL">Semua Peran (Role)</option>
                <option value="ADMIN">ADMIN</option>
                <option value="GM">GM (General Manager)</option>
                <option value="DEPT_HEAD">DEPT_HEAD (Finance / HOD)</option>
                <option value="PURCHASING">PURCHASING &amp; RECEIVING</option>
                <option value="REQUESTOR">REQUESTOR (Pemohon)</option>
                <option value="MICE_OP">MICE Operations</option>
                <option value="NUKA_OP">NUKA Operations</option>
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              >
                <option value="ALL">Semua Departemen</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              >
                <option value="ALL">Semua Status Akun</option>
                <option value="ACTIVE">Aktif (Bisa Login)</option>
                <option value="INACTIVE">Nonaktif (Diblokir)</option>
              </select>
            </div>
          </div>

          {/* User Accounts Table */}
          <div className="border border-slate-800 rounded-2xl bg-slate-900 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Pengguna &amp; Username</th>
                    <th className="px-4 py-3">Jabatan &amp; Departemen</th>
                    <th className="px-4 py-3">Kontak (Email / Phone)</th>
                    <th className="px-4 py-3">Role Akses</th>
                    <th className="px-4 py-3">Password Login</th>
                    <th className="px-4 py-3 text-center">Tanda Tangan</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500 italic">
                        Tidak ada akun pengguna yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isPwdVisible = visiblePasswords[u.id] || false;
                      const isActive = (u.status || 'ACTIVE') === 'ACTIVE';

                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                          {/* User & Username */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-cyan-400 font-bold">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{u.name.substring(0, 2).toUpperCase()}</span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {u.id === currentUser.id && (
                                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold">
                                      Anda
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-mono text-cyan-400 font-semibold">
                                  @{u.username}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Jabatan & Departemen */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-200">
                              {u.jobTitle || 'Staf Operasional'}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {u.department}
                            </div>
                          </td>

                          {/* Kontak */}
                          <td className="px-4 py-3">
                            <div className="text-[11px] text-slate-300 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{u.email || '-'}</span>
                            </div>
                            {u.phone && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-emerald-400" />
                                <span>{u.phone}</span>
                              </div>
                            )}
                          </td>

                          {/* Role */}
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                              u.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' :
                              u.role === 'GM' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                              u.role === 'DEPT_HEAD' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' :
                              u.role === 'PURCHASING' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                              'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {u.role}
                            </span>
                          </td>

                          {/* Password Login */}
                          <td className="px-4 py-3">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono text-xs">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span className="text-amber-300">
                                {isPwdVisible ? u.password : '••••••••'}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(u.id)}
                                className="text-slate-400 hover:text-white ml-1 p-0.5"
                                title={isPwdVisible ? 'Sembunyikan password' : 'Lihat password'}
                              >
                                {isPwdVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => copyToClipboard(u.password, u.id)}
                                className="text-slate-400 hover:text-cyan-400 p-0.5"
                                title="Salin password"
                              >
                                {copiedId === u.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>

                          {/* Tanda Tangan */}
                          <td className="px-4 py-3 text-center">
                            {u.signatureUrl ? (
                              <button
                                onClick={() => setSelectedSignatureUser(u)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20 hover:bg-emerald-500/20"
                                title="Lihat pratinjau tanda tangan"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Terpasang</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Belum Ada</span>
                            )}
                          </td>

                          {/* Status Toggle */}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors inline-flex items-center gap-1 ${
                                isActive 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                              }`}
                              title="Klik untuk mengubah status aktif/nonaktif akun"
                            >
                              {isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                              <span>{isActive ? 'Aktif' : 'Nonaktif'}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
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
                      );
                    })
                  )}
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
              Tanda tangan digital ini otomatis disematkan pada dokumen Purchase Order (PO), Surat Penerimaan Barang (GRN), dan Settlement Kas Kecil GMCC.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => (
              <div key={u.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">{u.name}</h3>
                    <p className="text-[11px] text-cyan-400">@{u.username} • {u.role}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{u.jobTitle || u.department}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                    {u.department.split('(')[0]}
                  </span>
                </div>

                {/* Signature Preview Box */}
                <div className="h-24 rounded-xl bg-white flex items-center justify-center p-2 border border-slate-300 shadow-inner overflow-hidden">
                  {u.signatureUrl ? (
                    <img 
                      src={u.signatureUrl} 
                      alt={`TTD ${u.name}`} 
                      className="max-h-20 max-w-full object-contain" 
                    />
                  ) : (
                    <span className="text-slate-400 text-xs italic">Belum Ada Gambar TTD</span>
                  )}
                </div>

                {/* Upload or Set Preset Signature */}
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex-1 cursor-pointer py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-center text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Upload TTD</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSignatureFileUpload(e, u.id)}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => {
                      const preset = u.role === 'GM' ? SAMPLE_SIGNATURES.ARI_GM :
                                     u.role === 'DEPT_HEAD' ? SAMPLE_SIGNATURES.AGUS_ACCOUNTING :
                                     u.role === 'PURCHASING' ? SAMPLE_SIGNATURES.PURCHASING :
                                     SAMPLE_SIGNATURES.CHEF;
                      onUpdateUserSignature(u.id, preset);
                      alert(`Preset tanda tangan digital diterapkan untuk ${u.name}!`);
                    }}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold"
                    title="Gunakan Preset Tanda Tangan Digital Resmi"
                  >
                    Preset GMCC
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
                    {u.name} (@{u.username}) - {u.role} - {u.department}
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
              Simpan &amp; Perbarui Password
            </button>
          </form>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT USER DETAIL LENGKAP */}
      {(showAddUserModal || showEditUserModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60 shrink-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>{editingUserId ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna Baru'}</span>
              </h3>
              <button 
                onClick={() => {
                  setShowAddUserModal(false);
                  setShowEditUserModal(false);
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Username (Login ID) *</label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="Contoh: agus_finance, purchasing..."
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
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Lalu Agus SetiaBudi"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Jabatan Resmi (Job Title)</label>
                  <input
                    type="text"
                    value={formJobTitle}
                    onChange={(e) => setFormJobTitle(e.target.value)}
                    placeholder="Contoh: Chief Accounting / Dept Head"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Peran Akses (User Role) *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="REQUESTOR">REQUESTOR (Pemohon Pengadaan Barang)</option>
                    <option value="PURCHASING">PURCHASING &amp; RECEIVING (Pengadaan &amp; Gudang)</option>
                    <option value="DEPT_HEAD">DEPT_HEAD (Finance &amp; Akuntansi)</option>
                    <option value="GM">GM (General Manager GOLO MORI)</option>
                    <option value="ADMIN">ADMIN (Executive IT Systems)</option>
                    <option value="MICE_OP">MICE_OP (MICE Operations &amp; Banquet)</option>
                    <option value="NUKA_OP">NUKA_OP (NUKA BEACH CLUB Operations)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Departemen Pembebanan *</label>
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
                    <option value="Finance & Supply Chain">Finance &amp; Supply Chain</option>
                    <option value="Executive Office">Executive Office</option>
                    <option value="Operations & MICE">Operations &amp; MICE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+62 812-xxxx-xxxx"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status Akun</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ACTIVE">Aktif (Dapat Login ke Sistem)</option>
                    <option value="INACTIVE">Nonaktif (Akses Dinonaktifkan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Resmi GMCC</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="nama@golomori.id"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Tanda Tangan */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tanda Tangan Digital Otorisasi</label>
                <div className="flex items-center gap-3">
                  <div className="w-28 h-14 bg-white rounded-lg flex items-center justify-center p-1 border border-slate-300">
                    {formSignatureUrl ? (
                      <img src={formSignatureUrl} alt="TTD" className="max-h-12 max-w-full object-contain" />
                    ) : (
                      <span className="text-[9px] text-slate-400">Kosong</span>
                    )}
                  </div>
                  <label className="cursor-pointer py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Berkas TTD</span>
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
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-600/30"
                >
                  {editingUserId ? 'Simpan Perubahan Akun' : 'Daftarkan Akun Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ZOOM TANDA TANGAN */}
      {selectedSignatureUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-white text-xs">
                Tanda Tangan: {selectedSignatureUser.name}
              </h4>
              <button 
                onClick={() => setSelectedSignatureUser(null)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-28 bg-white rounded-xl flex items-center justify-center p-2 border border-slate-300">
              <img 
                src={selectedSignatureUser.signatureUrl} 
                alt="TTD Zoom" 
                className="max-h-24 max-w-full object-contain" 
              />
            </div>
            <div className="text-[11px] text-slate-400">
              Peran: <span className="text-cyan-300 font-bold">{selectedSignatureUser.role}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
