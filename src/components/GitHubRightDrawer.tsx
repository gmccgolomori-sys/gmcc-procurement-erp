import React, { useState } from 'react';
import { GitHubSyncConfig } from '../types/procurement';
import { 
  Github, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  KeyRound, 
  FolderGit2, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  GitBranch,
  RefreshCw,
  Code2,
  Zap,
  X,
  ChevronRight,
  Database,
  Lock
} from 'lucide-react';

interface GitHubRightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: GitHubSyncConfig;
  onSaveConfig: (config: GitHubSyncConfig) => void;
}

export const GitHubRightDrawer: React.FC<GitHubRightDrawerProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  const [formData, setFormData] = useState<GitHubSyncConfig>({ ...config });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedOneLiner, setCopiedOneLiner] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'terminal' | 'config' | 'api'>('terminal');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const username = formData.username.trim() || 'gmccgolomori-sys';
  const repoName = formData.repoName.trim() || 'gmcc-procurement-erp';
  const branchName = formData.branch.trim() || 'main';
  const remoteHttpsUrl = `https://github.com/${username}/${repoName}.git`;
  const authenticatedUrl = formData.token?.trim() 
    ? `https://${formData.token.trim()}@github.com/${username}/${repoName}.git` 
    : remoteHttpsUrl;

  // Clean one-liner push command (auto-injects PAT token if provided)
  const oneLinerCommand = formData.token?.trim()
    ? `git remote add origin ${remoteHttpsUrl} 2>/dev/null || git remote set-url origin ${remoteHttpsUrl} && git branch -M ${branchName} && git push -u ${authenticatedUrl} ${branchName}`
    : `git remote add origin ${remoteHttpsUrl} 2>/dev/null || git remote set-url origin ${remoteHttpsUrl} && git branch -M ${branchName} && git push -u origin ${branchName}`;

  const gitSteps = [
    {
      title: '1. Periksa Status Repositori Lokal',
      command: 'git status',
      description: 'Memastikan semua berkas ERP dan Kas Kecil tercatat dalam Git'
    },
    {
      title: '2. Tautkan Remote URL GitHub',
      command: `git remote add origin ${remoteHttpsUrl} 2>/dev/null || git remote set-url origin ${remoteHttpsUrl}`,
      description: 'Menghubungkan folder lokal ini ke remote repository GitHub'
    },
    {
      title: `3. Pastikan Cabang Utama (${branchName})`,
      command: `git branch -M ${branchName}`,
      description: 'Menyelaraskan nama branch lokal ke standar GitHub'
    },
    {
      title: '4. Unggah (Push) ke GitHub',
      command: `git push -u origin ${branchName}`,
      description: 'Mengirim seluruh commit dan berkas ke GitHub'
    }
  ];

  const handleCopySingle = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyOneLiner = () => {
    navigator.clipboard.writeText(oneLinerCommand);
    setCopiedOneLiner(true);
    setTimeout(() => setCopiedOneLiner(false), 2500);
  };

  const handleCopyAll = () => {
    const fullScript = `# === SKRIP SYNC GMCC ERP KE GITHUB ===\n` +
      `git status\n` +
      `git add -A\n` +
      `git commit -m "update: sinkronisasi GMCC Procurement ERP & Kas Kecil"\n` +
      `git remote add origin ${remoteHttpsUrl} 2>/dev/null || git remote set-url origin ${remoteHttpsUrl}\n` +
      `git branch -M ${branchName}\n` +
      `git push -u origin ${branchName}\n`;

    navigator.clipboard.writeText(fullScript);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...formData,
      status: 'CONNECTED',
      remoteUrl: remoteHttpsUrl
    });
    setTestResult({
      success: true,
      message: 'Pengaturan repository tersimpan!'
    });
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json'
      };
      if (formData.token) {
        headers['Authorization'] = `Bearer ${formData.token.trim()}`;
      }

      const res = await fetch(`https://api.github.com/repos/${username}/${repoName}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTestResult({
          success: true,
          message: `Koneksi berhasil! Repositori "${data.full_name}" ditemukan (${data.private ? 'Private' : 'Public'}).`
        });
      } else if (res.status === 404) {
        setTestResult({
          success: false,
          message: `Repositori "${username}/${repoName}" belum dibuat di GitHub. Buat repositori baru di github.com/new.`
        });
      } else {
        setTestResult({
          success: false,
          message: `Gagal memverifikasi: HTTP ${res.status}. Pastikan username dan izin token sesuai.`
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Koneksi terhambat: ${err.message || 'Cek koneksi internet.'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Semi-transparent backdrop to close drawer on backdrop click */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Right Panel */}
      <aside className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col overflow-hidden text-slate-100">
          
          {/* Drawer Header */}
          <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white shadow-inner">
                <Github className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Sambungan GitHub
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Panel Kanan
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Sinkronisasi Repositori &amp; Push Kode Sumber
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Tutup Panel GitHub"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs px-5 pt-2 gap-2">
            <button
              onClick={() => setActiveSubTab('terminal')}
              className={`pb-2.5 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
                activeSubTab === 'terminal'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Skrip Push</span>
            </button>
            <button
              onClick={() => setActiveSubTab('config')}
              className={`pb-2.5 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
                activeSubTab === 'config'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Target Repo</span>
            </button>
            <button
              onClick={() => setActiveSubTab('api')}
              className={`pb-2.5 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
                activeSubTab === 'api'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Token PAT</span>
            </button>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Test or Feedback Result */}
            {testResult && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                testResult.success 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <div className="flex-1 leading-relaxed">
                  {testResult.message}
                </div>
              </div>
            )}

            {/* Live Website Connection & URL Status */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-cyan-950/30 border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-300">
                    Website Development Aktif: Port 3000
                  </span>
                </div>
                <a
                  href="https://ais-dev-fwkwo5vykzwnaw564byill-971488898504.asia-southeast1.run.app"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 transition-all"
                >
                  <span>Buka Web Dev</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="text-[11px] text-slate-300 space-y-1.5 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <p>
                  🌐 <span className="text-cyan-300 font-semibold">Tautan Development Aktif:</span> Gunakan URL <code className="text-emerald-400 font-mono text-[10px]">ais-dev-...</code> pada jendela browser biasa (bukan incognito) yang sudah login ke akun Google Anda.
                </p>
                <p className="text-amber-300/90">
                  ⚠️ <span className="font-semibold text-amber-200">Tentang "Error: Page not found" pada ais-pre:</span> Tautan <code className="font-mono text-[10px]">ais-pre-...</code> adalah slot rilis publik yang baru aktif setelah Anda menekan tombol <strong className="text-white">"Publish"</strong> atau <strong className="text-white">"Share"</strong> di pojok kanan atas Google AI Studio.
                </p>
              </div>
            </div>

            {/* Info Card: Current Repo target */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Target GitHub Repository
                </div>
                <div className="text-xs font-mono font-semibold text-cyan-300 flex items-center gap-1.5">
                  <GitBranch className="w-3 h-3 text-cyan-400" />
                  <span>{username}/{repoName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    {branchName}
                  </span>
                </div>
              </div>
              <a 
                href={`https://github.com/${username}/${repoName}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Buka Repositori di GitHub"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* TAB 1: TERMINAL & PUSH SCRIPT */}
            {activeSubTab === 'terminal' && (
              <div className="space-y-4">
                
                {/* 1-Liner Quick Push Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/60 via-slate-900 to-indigo-950/50 border border-cyan-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      Perintah 1-Baris (One-Liner Push)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyOneLiner}
                      className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-all shadow-sm"
                    >
                      {copiedOneLiner ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedOneLiner ? 'Tersalin!' : 'Salin 1-Baris'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-200 overflow-x-auto whitespace-pre-wrap break-all select-all">
                    {oneLinerCommand}
                  </pre>
                </div>

                {/* Step-by-Step Command List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">
                      Langkah Perintah Git Terminal
                    </span>
                    <button
                      onClick={handleCopyAll}
                      className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold flex items-center gap-1"
                    >
                      {copiedAll ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedAll ? 'Semua Tersalin!' : 'Salin Semua Skrip'}</span>
                    </button>
                  </div>

                  {gitSteps.map((step, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">
                          {step.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopySingle(step.command, idx)}
                          className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                          title="Salin perintah ini"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {step.description}
                      </p>
                      <code className="block p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] font-mono text-cyan-300 overflow-x-auto">
                        {step.command}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: CONFIGURATION */}
            {activeSubTab === 'config' && (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Username GitHub
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Contoh: gmccgolomori-sys"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Repositori (Repo Name)
                  </label>
                  <input
                    type="text"
                    value={formData.repoName}
                    onChange={(e) => setFormData({ ...formData, repoName: e.target.value })}
                    placeholder="Contoh: gmcc-procurement-erp"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Branch Utama
                  </label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="main"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Deskripsi Proyek
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Golo Mori Convention Center Procurement &amp; Petty Cash ERP"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrivateCheck"
                    checked={formData.isPrivate}
                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <label htmlFor="isPrivateCheck" className="text-xs text-slate-300 cursor-pointer">
                    Repositori Privat (Private Repository)
                  </label>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Pengaturan</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700 flex items-center justify-center gap-1.5"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>Tes Koneksi</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: PERSONAL ACCESS TOKEN (PAT) */}
            {activeSubTab === 'api' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>GitHub Personal Access Token (PAT)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Token ini digunakan jika Anda ingin melakukan sinkronisasi otomatis atau tes koneksi langsung ke GitHub API dari browser.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Personal Access Token (classic atau fine-grained)
                  </label>
                  <input
                    type="password"
                    value={formData.token || ''}
                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Membutuhkan scope: <code className="text-cyan-400 font-mono">repo</code>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSaveConfig(formData);
                      setTestResult({ success: true, message: 'Token berhasil disimpan di perangkat lokal.' });
                      setTimeout(() => setTestResult(null), 3000);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Token</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Uji Token</span>
                  </button>
                </div>

                <div className="pt-2 text-center">
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=GMCC+ERP+Sync"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline"
                  >
                    <span>Buat Token Baru di GitHub.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

          </div>

          {/* Drawer Footer */}
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Git Status: Ready</span>
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Tutup Panel
            </button>
          </div>

        </div>
      </aside>
    </div>
  );
};
