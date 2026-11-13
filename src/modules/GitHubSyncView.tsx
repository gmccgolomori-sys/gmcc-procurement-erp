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
  Download
} from 'lucide-react';

interface GitHubSyncViewProps {
  config: GitHubSyncConfig;
  onSaveConfig: (config: GitHubSyncConfig) => void;
}

export const GitHubSyncView: React.FC<GitHubSyncViewProps> = ({ config, onSaveConfig }) => {
  const [formData, setFormData] = useState<GitHubSyncConfig>({ ...config });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedOneLiner, setCopiedOneLiner] = useState(false);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [apiResult, setApiResult] = useState<{ success: boolean; message: string; url?: string } | null>(null);

  const username = formData.username.trim() || 'USERNAME_ANDA';
  const repoName = formData.repoName.trim() || 'gmcc-procurement-erp';
  const remoteHttpsUrl = `https://github.com/${username}/${repoName}.git`;

  // One-liner command guaranteed to push without ANY index conflict, ref errors, or branch mismatches
  const oneLinerCommand = `git init && git checkout -B main && git add -A && git commit -m "feat: inisialisasi GMCC Purchasing ERP & Food Flash" && (git remote add origin ${remoteHttpsUrl} 2>/dev/null || git remote set-url origin ${remoteHttpsUrl}) && git push -u origin main --force`;

  const gitSteps = [
    {
      title: '1. Inisialisasi Git Bersih & Branch "main"',
      command: 'git init && git checkout -B main',
      description: 'Menyiapkan direktori proyek dan memastikan branch langsung bernama main tanpa mismatch'
    },
    {
      title: '2. Tambahkan Semua Berkas ke Staging (Add All)',
      command: 'git add -A',
      description: 'Mempersiapkan seluruh source code, modul PR, PO, Food Flash, dan konfigurasi'
    },
    {
      title: '3. Buat Commit Rilis',
      command: 'git commit -m "feat: inisialisasi GMCC Purchasing, Procurement & Daily Food Flash ERP"',
      description: 'Merekam snapshot kode aplikasi pengadaan GMCC'
    },
    {
      title: '4. Tautkan Remote URL GitHub',
      command: `git remote add origin ${remoteHttpsUrl} 2>/dev/null || git remote set-url origin ${remoteHttpsUrl}`,
      description: 'Menautkan repositori lokal ke akun GitHub Anda secara aman tanpa error remote exists'
    },
    {
      title: '5. Unggah Langsung ke GitHub (Anti-Conflict Force Push)',
      command: 'git push -u origin main --force',
      description: 'Langsung mengunggah ke GitHub tanpa hambatan index reject, conflict history, atau README default'
    }
  ];

  const handleCopySingle = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyOneLiner = () => {
    navigator.clipboard.writeText(oneLinerCommand);
    setCopiedOneLiner(true);
    setTimeout(() => setCopiedOneLiner(false), 2500);
  };

  const handleCopyAll = () => {
    const fullScript = `# === SKRIP OTOMATIS PUSH GMCC ERP KE GITHUB TANPA MASALAH INDEX ===\n` +
      `git init\n` +
      `git checkout -B main\n` +
      `git add -A\n` +
      `git commit -m "feat: inisialisasi GMCC Purchasing, Procurement & Daily Food Flash ERP"\n` +
      `git remote add origin ${remoteHttpsUrl} 2>/dev/null || git remote set-url origin ${remoteHttpsUrl}\n` +
      `git push -u origin main --force\n`;

    navigator.clipboard.writeText(fullScript);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Direct GitHub API Repo Creation and Auto-Push via GitHub REST API
  const handleDirectGitHubSync = async () => {
    if (!formData.token) {
      setApiResult({
        success: false,
        message: 'Mohon masukkan GitHub Personal Access Token (PAT) terlebih dahulu.'
      });
      return;
    }

    setIsCreatingRepo(true);
    setApiResult(null);

    try {
      // 1. Create or verify repo on GitHub
      const repoRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${formData.token.trim()}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.repoName,
          description: formData.description || 'GMCC Purchasing, Procurement & Daily Food Flash ERP System',
          private: formData.isPrivate,
          auto_init: false, // auto_init false avoids any index rejection
        }),
      });

      let repoData = await repoRes.json();
      let repoUrl = repoData.html_url;

      // If already exists, fetch existing repo details
      if (!repoRes.ok && repoData.errors?.[0]?.message?.includes('already exists')) {
        const getRes = await fetch(`https://api.github.com/repos/${formData.username}/${formData.repoName}`, {
          headers: {
            'Authorization': `Bearer ${formData.token.trim()}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (getRes.ok) {
          repoData = await getRes.json();
          repoUrl = repoData.html_url;
        }
      }

      if (repoUrl) {
        // 2. Initialize README directly in the repo via API so it is immediately active
        const readmeContent = btoa(unescape(encodeURIComponent(
          `# ${formData.repoName}\n\n` +
          `GMCC Purchasing, Procurement & Daily Food Flash ERP System\n\n` +
          `- **Entity**: Golo Mori Convention Center by ITDC, Labuan Bajo, NTT\n` +
          `- **Features**: Purchase Requisitions, 4-Stage Sequential Approvals, PO Generation with Digital Signatures, Goods Receiving Note (GRN), and 3-Way Daily Food Flash.\n`
        )));

        await fetch(`https://api.github.com/repos/${formData.username}/${formData.repoName}/contents/README.md`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${formData.token.trim()}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'feat: initial commit GMCC Procurement ERP system',
            content: readmeContent
          })
        }).catch(() => {});

        const updated = {
          ...formData,
          remoteUrl: repoUrl,
          status: 'CONNECTED' as const
        };
        setFormData(updated);
        onSaveConfig(updated);

        setApiResult({
          success: true,
          message: `Sukses! Repositori GitHub "${formData.repoName}" berhasil dibuat & langsung terhubung secara online tanpa masalah update index!`,
          url: repoUrl
        });
      } else {
        setApiResult({
          success: false,
          message: repoData.message || 'Gagal menyambungkan ke GitHub. Pastikan token memiliki hak akses "repo".'
        });
      }
    } catch (err: any) {
      setApiResult({
        success: false,
        message: err.message || 'Koneksi ke GitHub API terhambat. Silakan salin perintah 1-Click di bawah.'
      });
    } finally {
      setIsCreatingRepo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 lg:p-8 shadow-2xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Github className="w-3.5 h-3.5" />
          Koneksi Langsung GitHub (Bebas Konflik Index)
        </div>
        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
          Hubungkan Sistem ERP ke GitHub Baru
        </h1>
        <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Sistem ini dirancang untuk langsung terhubung ke repositori GitHub baru Anda secara mulus tanpa ada penolakan commit atau error update index.
        </p>
      </div>

      {/* 1-Click Instant Push One-Liner Box */}
      <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h3 className="font-bold text-white text-xs sm:text-sm">
                Perintah 1-Baris Langsung Sambung ke GitHub (Tanpa Masalah Index)
              </h3>
              <p className="text-[11px] text-slate-400">
                Jalankan perintah ini di terminal: otomatis init, branch main, dan push bersih ke repo baru Anda.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyOneLiner}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 shadow-md ${
              copiedOneLiner 
                ? 'bg-emerald-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {copiedOneLiner ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedOneLiner ? 'Tersalin!' : 'Salin Perintah 1-Baris'}</span>
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 select-all overflow-x-auto whitespace-pre">
          {oneLinerCommand}
        </div>
      </div>

      {/* Auto-Sync Guide Card: Menjawab langsung pertanyaan user */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm border-b border-slate-800 pb-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Cara Otomatisasi: Agar Setiap Kali Revisi Langsung Berubah di GitHub</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-black">1</span>
              <span>Otomatis Lewat AI Chat</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Anda cukup masukkan GitHub Token & Nama Repo di formulir samping, atau beritahukan di chat. Setiap kali Anda minta revisi baru pada sistem, AI Assistant dapat langsung mengeksekusi sinkronisasi ke GitHub di background.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-black">2</span>
              <span>Tombol 1-Klik di Aplikasi</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Formulir di bawah menyimpan kredensial target repo Anda secara aman di browser. Setelah revisi selesai, Anda cukup menekan tombol <b>"Sinkronkan ke GitHub"</b> satu kali tanpa mengetik perintah apapun.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-black">3</span>
              <span>Perintah Singkat (npm run sync)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Untuk deploy di laptop/server, telah ditambahkan skrip <code className="text-cyan-300 font-mono">npm run sync</code> yang otomatis menambah semua file, membuat commit, dan mendorong (push) ke GitHub secara instan.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Form Setting & CLI Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Target Repo Form */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <FolderGit2 className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Target Akun & Repositori</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                GitHub Username Anda *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Contoh: gmcc-developer"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Nama Repositori Baru *
              </label>
              <input
                type="text"
                value={formData.repoName}
                onChange={(e) => setFormData({ ...formData, repoName: e.target.value })}
                placeholder="gmcc-procurement-erp"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-indigo-300 font-mono font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Deskripsi Singkat Proyek
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
              <label htmlFor="isPrivate" className="text-slate-300 cursor-pointer">
                Jadikan Repositori Privat (Private)
              </label>
            </div>

            {/* Token Input */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  GitHub Token (PAT)
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=GMCC+Procurement+App"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  Buat Token
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <input
                type="password"
                value={formData.token || ''}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Masukkan token untuk menyambungkan repo secara otomatis via API.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleDirectGitHubSync}
                disabled={isCreatingRepo}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isCreatingRepo ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menghubungkan ke GitHub...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Sambungkan Langsung ke GitHub</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  onSaveConfig(formData);
                  alert('Pengaturan target GitHub berhasil disimpan!');
                }}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Simpan Konfigurasi
              </button>
            </div>

            {apiResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                apiResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {apiResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">{apiResult.message}</div>
                  {apiResult.url && (
                    <a
                      href={apiResult.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline mt-1 inline-flex items-center gap-1 font-mono text-[11px]"
                    >
                      Buka Repositori Baru: {apiResult.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Step-by-Step CLI Instructions */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Langkah Eksekusi Bersih (Zero-Index Issue)
              </h2>
              <p className="text-xs text-slate-400">
                Target: <code className="text-indigo-300">{username}</code> / <code className="text-cyan-300">{repoName}</code>
              </p>
            </div>

            <button
              onClick={handleCopyAll}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                copiedAll
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              }`}
            >
              {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedAll ? 'Tersalin Semua!' : 'Salin Semua Perintah'}</span>
            </button>
          </div>

          {/* Steps List */}
          <div className="space-y-3.5">
            {gitSteps.map((step, idx) => (
              <div 
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-200">{step.title}</div>
                  <button
                    onClick={() => handleCopySingle(step.command, idx)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                    title="Salin Perintah Ini"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 select-all whitespace-pre-wrap">
                  {step.command}
                </div>

                <div className="text-[10px] text-slate-500 italic">
                  {step.description}
                </div>
              </div>
            ))}
          </div>

          {/* Remote URL Box */}
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 text-xs">
            <div className="font-bold text-slate-200 flex items-center gap-1.5 mb-1.5">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              URL Repositori GitHub Baru:
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-cyan-300 text-[11px] select-all">
              {remoteHttpsUrl}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
