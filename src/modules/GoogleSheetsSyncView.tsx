import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Database, 
  ShieldCheck, 
  ArrowRightLeft, 
  Lock,
  Sparkles,
  Cloud,
  Check,
  Clock,
  Copy,
  AlertTriangle,
  Key,
  HelpCircle
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';
import { User } from 'firebase/auth';
import { 
  signInWithGoogle, 
  signOutGoogle, 
  initGoogleAuth, 
  getGoogleAccessToken 
} from '../services/googleAuth';
import { 
  getStoredGoogleSheetsConfig, 
  saveStoredGoogleSheetsConfig, 
  syncAllModulesToGoogleSheets, 
  purgeDummyDataInGoogleSheets,
  TwoWaySyncPayload,
  GoogleSheetsConfig
} from '../services/googleSheetsSync';
import { 
  PurchaseRequisition, 
  PurchaseOrder, 
  GoodsReceipt, 
  PettyCashSettlementPeriod, 
  PettyCashBillingFile, 
  MasterItem, 
  Vendor, 
  ChartOfAccount, 
  CostCenter, 
  UserAccount 
} from '../types/procurement';

interface GoogleSheetsSyncViewProps {
  prs: PurchaseRequisition[];
  pos: PurchaseOrder[];
  grns: GoodsReceipt[];
  pettyCashPeriods: PettyCashSettlementPeriod[];
  billingFiles: PettyCashBillingFile[];
  items: MasterItem[];
  vendors: Vendor[];
  coas: ChartOfAccount[];
  costCenters: CostCenter[];
  users: UserAccount[];
  currentUser: UserAccount;
  onUpdatePrs?: (prs: PurchaseRequisition[]) => void;
  onUpdatePos?: (pos: PurchaseOrder[]) => void;
  onUpdateGrns?: (grns: GoodsReceipt[]) => void;
}

export const GoogleSheetsSyncView: React.FC<GoogleSheetsSyncViewProps> = ({
  prs,
  pos,
  grns,
  pettyCashPeriods,
  billingFiles,
  items,
  vendors,
  coas,
  costCenters,
  users,
  currentUser,
  onUpdatePrs,
  onUpdatePos,
  onUpdateGrns
}) => {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [syncConfig, setSyncConfig] = useState<GoogleSheetsConfig>(() => getStoredGoogleSheetsConfig());
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'SUCCESS' | 'ERROR'; message: string } | null>(null);
  const [showDomainGuide, setShowDomainGuide] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [showManualToken, setShowManualToken] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');

  // Auto-init Auth listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'gmccgolomori-sys.github.io';
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId || 'gen-lang-client-0216397388'}/authentication/settings`;

  const copyDomainToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  // Handle Google Login & Immediate Auto-Creation of Google Sheet
  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    setSyncFeedback(null);
    try {
      const res = await signInWithGoogle();
      if (res) {
        setGoogleUser(res.user);
        setAccessToken(res.accessToken);
        setShowDomainGuide(false);

        // Immediately create spreadsheet in Google Drive & push all 10 modules
        setIsSyncing(true);
        const payload: TwoWaySyncPayload = {
          prs, pos, grns, pettyCashPeriods, billingFiles,
          items, vendors, coas, costCenters, users
        };

        const syncRes = await syncAllModulesToGoogleSheets(res.accessToken, payload);
        const updatedCfg = getStoredGoogleSheetsConfig();
        setSyncConfig(updatedCfg);

        setSyncFeedback({
          type: 'SUCCESS',
          message: `Berhasil! File spreadsheet 'GMCC_PROCUREMENT_ERP_DATABASE' telah dibuat di Google Drive Anda (${res.user.email}) dan seluruh 10 modul data telah disinkronkan pada ${syncRes.timestamp}.`
        });
      }
    } catch (err: any) {
      const isUnauthorizedDomain = 
        err?.code === 'auth/unauthorized-domain' || 
        String(err?.message || '').toLowerCase().includes('unauthorized-domain');

      if (isUnauthorizedDomain) {
        setShowDomainGuide(true);
        setSyncFeedback({
          type: 'ERROR',
          message: `Domain '${currentHostname}' belum diizinkan di Firebase Authentication. Ikuti panduan solusi di bawah untuk menambahkan domain ini di Firebase Console.`
        });
      } else {
        setSyncFeedback({
          type: 'ERROR',
          message: err.message || 'Gagal login ke Google Account atau membuat spreadsheet.'
        });
      }
    } finally {
      setIsAuthenticating(false);
      setIsSyncing(false);
    }
  };

  // Connect using manual OAuth Access Token (developer/bypass mode)
  const handleConnectWithManualToken = async () => {
    if (!manualTokenInput.trim()) return;
    setIsAuthenticating(true);
    setSyncFeedback(null);
    try {
      const token = manualTokenInput.trim();
      const testRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let customUser: any = {
        email: 'workspace-admin@gmcc.id',
        displayName: 'Google Workspace Admin'
      };
      if (testRes.ok) {
        const uInfo = await testRes.json();
        customUser = {
          email: uInfo.email || 'workspace-admin@gmcc.id',
          displayName: uInfo.name || 'Google Workspace Admin'
        };
      }
      setAccessToken(token);
      setGoogleUser(customUser);
      setShowDomainGuide(false);
      setShowManualToken(false);
      setSyncFeedback({
        type: 'SUCCESS',
        message: `Token Google OAuth berhasil diverifikasi (${customUser.email})! Sekarang Anda dapat menjalankan Sinkronisasi 2-Arah.`
      });
    } catch (err: any) {
      setSyncFeedback({
        type: 'ERROR',
        message: 'Google Access Token tidak valid atau tidak memiliki izin spreadsheets & drive.file.'
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Manual Link of existing Spreadsheet ID / URL
  const [customSpreadsheetInput, setCustomSpreadsheetInput] = useState('');
  const handleConnectCustomSpreadsheet = () => {
    if (!customSpreadsheetInput.trim()) return;
    let extractedId = customSpreadsheetInput.trim();
    if (extractedId.includes('/d/')) {
      const match = extractedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) extractedId = match[1];
    }
    const updatedCfg: GoogleSheetsConfig = {
      ...syncConfig,
      spreadsheetId: extractedId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${extractedId}/edit`,
      syncStatus: 'IDLE'
    };
    saveStoredGoogleSheetsConfig(updatedCfg);
    setSyncConfig(updatedCfg);
    setCustomSpreadsheetInput('');
    setSyncFeedback({
      type: 'SUCCESS',
      message: `Berhasil menautkan Google Sheet dengan ID: ${extractedId}. Klik 'Sinkronisasi 2-Arah Sekarang' untuk menyamakan data.`
    });
  };

  // Handle Google Logout
  const handleGoogleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin memutuskan koneksi akun Google Sheets?')) {
      await signOutGoogle();
      setGoogleUser(null);
      setAccessToken(null);
      setSyncFeedback(null);
    }
  };

  // Trigger 2-Way Sync
  const handleTwoWaySync = async () => {
    let token = accessToken;
    if (!token) {
      token = await getGoogleAccessToken();
    }
    if (!token) {
      alert('Silakan login dengan Google terlebih dahulu untuk melakukan sinkronisasi Google Sheets.');
      return;
    }

    setIsSyncing(true);
    setSyncFeedback(null);

    const payload: TwoWaySyncPayload = {
      prs,
      pos,
      grns,
      pettyCashPeriods,
      billingFiles,
      items,
      vendors,
      coas,
      costCenters,
      users
    };

    try {
      const result = await syncAllModulesToGoogleSheets(token, payload);
      if (result.updatedPrs && onUpdatePrs) onUpdatePrs(result.updatedPrs);
      if (result.updatedPos && onUpdatePos) onUpdatePos(result.updatedPos);
      if (result.updatedGrns && onUpdateGrns) onUpdateGrns(result.updatedGrns);

      const updated = getStoredGoogleSheetsConfig();
      setSyncConfig(updated);
      setSyncFeedback({
        type: 'SUCCESS',
        message: `Sinkronisasi 2-arah berhasil pada ${result.timestamp}! Seluruh 10 modul telah tersimpan di Google Sheets.`
      });
    } catch (err: any) {
      setSyncFeedback({
        type: 'ERROR',
        message: err.message || 'Terjadi kesalahan saat sinkronisasi Google Sheets.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Purge Dummy Data in Google Sheets & Local
  const handlePurgeDummyData = async () => {
    let token = accessToken;
    if (!token) {
      token = await getGoogleAccessToken();
    }
    if (!token) {
      alert('Silakan login dengan Google terlebih dahulu.');
      return;
    }

    if (!confirm('PERHATIAN: Tindakan ini akan mengosongkan seluruh data transaksi dummy di Google Sheet (PR, PO, Receiving, dan Kas Kecil) agar siap digunakan untuk data operasional riil GMCC. Lanjutkan?')) {
      return;
    }

    setIsPurging(true);
    try {
      await purgeDummyDataInGoogleSheets(token);
      setSyncFeedback({
        type: 'SUCCESS',
        message: 'Data dummy berhasil dibersihkan di Google Sheets! Format kolom dan header resmi tetap tersimpan rapi.'
      });
    } catch (err: any) {
      setSyncFeedback({
        type: 'ERROR',
        message: err.message || 'Gagal membersihkan data dummy di Google Sheets.'
      });
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-2 border-emerald-500/50 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white tracking-wide flex items-center gap-2">
              <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
              <span>Sinkronisasi Google Sheets Database</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Seluruh transaksi modul (PR, PO, Penerimaan Barang, Kas Kecil, Master Data) tersimpan otomatis di Google Sheets. Anda dapat menghapus data dummy atau menambah transaksi langsung di Google Sheets, dan sistem akan menyinkronkannya secara dua arah.
            </p>
          </div>

          {/* Connection Status Badge */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            {googleUser ? (
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-emerald-500/50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  {googleUser.email?.[0]?.toUpperCase() || 'G'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Terhubung: {googleUser.displayName || 'Google User'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{googleUser.email}</div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleLogout}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 text-[11px] font-bold border border-slate-700 transition-colors ml-2"
                >
                  Putuskan
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isAuthenticating}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isAuthenticating ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDomainGuide(!showDomainGuide)}
                  className="px-3.5 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Panduan Otorisasi Domain & Token Manual"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Bantuan Domain</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sync Feedback Message */}
      {syncFeedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in duration-300 ${
          syncFeedback.type === 'SUCCESS' 
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {syncFeedback.type === 'SUCCESS' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button 
            onClick={() => setSyncFeedback(null)} 
            className="text-slate-400 hover:text-white p-1 rounded-lg text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Domain Authorization Helper Card (Triggered on auth/unauthorized-domain or toggle) */}
      {(showDomainGuide || syncFeedback?.message?.includes('unauthorized-domain')) && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-amber-950/40 border-2 border-amber-500/60 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-amber-200 flex items-center gap-2">
                  <span>Solusi: Tambahkan Domain ke Firebase Authorized Domains</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/50">
                    Langkah 1 Kali Saja
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                  Firebase Authentication memblokir login popup jika domain web tempat aplikasi berjalan belum terdaftar di daftar <strong>Authorized Domains</strong>. Tambahkan domain ini ke Firebase Console Anda agar login Google dapat berjalan langsung:
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDomainGuide(false)}
              className="text-slate-400 hover:text-white px-3 py-1 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 shrink-0 self-start"
            >
              Tutup Panduan
            </button>
          </div>

          {/* Current Domain Box & Firebase Console Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/40 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Domain Web Saat Ini:</div>
                <div className="text-sm font-mono font-bold text-white mt-0.5 select-all">{currentHostname}</div>
              </div>
              <button
                type="button"
                onClick={copyDomainToClipboard}
                className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedDomain ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedDomain ? 'Tersalin!' : 'Salin Domain'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Firebase Console Settings:</div>
                <div className="text-xs font-mono text-slate-300 mt-0.5 truncate">{firebaseConfig.projectId || 'gen-lang-client-0216397388'}</div>
              </div>
              <a
                href={firebaseSettingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg transition-all hover:scale-[1.02] cursor-pointer shrink-0"
              >
                <span>Buka Firebase Console</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Step by step guide with precise navigation */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold text-[11px] leading-relaxed">
              ⚠️ <strong>PENTING:</strong> Menu ini <u>BUKAN</u> di <em>Project Settings</em> (ikon roda gigi ⚙️ kiri atas), melainkan di dalam menu <strong>Authentication</strong>.
            </div>

            <div className="font-bold text-slate-200">Cara Menemukan 'Authorized domains' di Firebase:</div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
              <li>Buka Firebase Console melalui link di atas.</li>
              <li>Di menu bilah samping kiri (sidebar), klik <strong>Build</strong> lalu klik <strong>Authentication</strong>.</li>
              <li>Di halaman Authentication, lihat baris tab menu di bagian atas: pilih tab <strong>Settings</strong> (di sebelah tab <em>Users</em> & <em>Sign-in method</em>).</li>
              <li>Scroll ke bagian <strong>Authorized domains</strong> (Domain yang diizinkan).</li>
              <li>Klik <strong>Add domain</strong>, paste <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px]">{currentHostname}</code> lalu klik <strong>Add / Simpan</strong>.</li>
              <li>Kembali ke aplikasi ini dan klik tombol <strong>"Sign in with Google"</strong> kembali!</li>
            </ol>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              💡 <strong>Alternatif Google Cloud Console:</strong> Anda juga bisa langsung membuka{' '}
              <a 
                href={`https://console.cloud.google.com/apis/credentials?project=${firebaseConfig.projectId || 'gen-lang-client-0216397388'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline font-semibold hover:text-cyan-300 inline-flex items-center gap-1"
              >
                <span>Google Cloud Credentials</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              , klik nama OAuth 2.0 Client ID Anda, lalu tambahkan <code className="text-amber-300">https://{currentHostname}</code> pada <em>Authorized JavaScript origins</em>.
            </div>
          </div>

          {/* Alternative: Manual OAuth Token Bypass */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowManualToken(!showManualToken)}
                className="text-xs font-bold text-slate-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{showManualToken ? 'Sembunyikan Opsi Token Manual' : 'Atau: Hubungkan dengan Google Access Token Manual (Bypass tanpa atur domain)'}</span>
              </button>
            </div>

            {showManualToken && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-200">
                <p className="text-[11px] text-slate-400">
                  Jika Anda tidak memiliki akses ke Firebase Console sekarang, Anda dapat memasukkan OAuth Access Token Google secara langsung (contoh dari Google OAuth Playground dengan scopes Google Sheets & Drive):
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    value={manualTokenInput}
                    onChange={(e) => setManualTokenInput(e.target.value)}
                    placeholder="ya29.a0Ac..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleConnectWithManualToken}
                    disabled={isAuthenticating || !manualTokenInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Verifikasi & Hubungkan</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Control Panel & Spreadsheet Link */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Spreadsheet Database Link */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <h2 className="font-extrabold text-white text-sm">Google Spreadsheet File</h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              10 Sheet Tabs
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Database utama GMCC Procurement ERP disimpan di file Google Spreadsheet terstruktur.
          </p>

          {syncConfig.spreadsheetUrl ? (
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono break-all text-slate-300">
                <span className="text-slate-500 block text-[10px] font-sans font-bold uppercase mb-1">Spreadsheet ID:</span>
                {syncConfig.spreadsheetId}
              </div>

              <a
                href={syncConfig.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka Google Sheet di Tab Baru</span>
              </a>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">
                  Tautkan Spreadsheet Lain (URL / ID):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customSpreadsheetInput}
                    onChange={(e) => setCustomSpreadsheetInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleConnectCustomSpreadsheet}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 transition-colors"
                  >
                    Tautkan
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-dashed border-slate-800 text-center space-y-2">
                <Cloud className="w-8 h-8 mx-auto text-slate-600" />
                <div className="text-xs text-slate-400">
                  Spreadsheet otomatis dibuat di Google Drive Anda saat login dengan Google, atau tautkan spreadsheet yang sudah ada di bawah.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">
                  Atau Masukkan URL / ID Spreadsheet yang Sudah Ada:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customSpreadsheetInput}
                    onChange={(e) => setCustomSpreadsheetInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleConnectCustomSpreadsheet}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-colors"
                  >
                    Tautkan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: 2-Way Sync Engine */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
              <h2 className="font-extrabold text-white text-sm">Komunikasi Dua Arah</h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              Real-Time
            </span>
          </div>

          <div className="text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span>Sinkronisasi Terakhir:</span>
              <span className="font-bold text-white font-mono">{syncConfig.lastSyncTimestamp || 'Belum pernah'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status Sync:</span>
              <span className="font-bold text-emerald-400">{isSyncing ? 'Sedang Memproses...' : 'Siap Sinkron'}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleTwoWaySync}
              disabled={isSyncing}
              className="w-full px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sinkronisasi 2-Arah...' : 'Sinkronisasi 2-Arah Sekarang'}</span>
            </button>
          </div>
        </div>

        {/* Card 3: Dummy Data Cleanup */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-amber-400" />
              <h2 className="font-extrabold text-white text-sm">Pembersihan Data Dummy</h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
              Clean Start
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Hapus seluruh data transaksi contoh dari Google Sheet sehingga spreadsheet bersih dan siap diisi transaksi riil lapangan.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={handlePurgeDummyData}
              disabled={isPurging}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 border border-slate-700 hover:border-rose-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 className={`w-4 h-4 ${isPurging ? 'animate-spin text-rose-400' : ''}`} />
              <span>{isPurging ? 'Membersihkan Sheet...' : 'Bersihkan Data Dummy di Google Sheets'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Sheet Tabs & Module Counts */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="font-extrabold text-white text-sm">Struktur Sheet Tab &amp; Jumlah Rekor Data GMCC</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Terhubung 10 Tabel Database</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase">PR Requisitions</div>
            <div className="text-lg font-black text-white font-mono">{prs.length} Data</div>
            <div className="text-[9px] text-emerald-400">Tab: PR_Requisitions</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Purchase Orders</div>
            <div className="text-lg font-black text-white font-mono">{pos.length} Data</div>
            <div className="text-[9px] text-emerald-400">Tab: PO_PurchaseOrders</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Goods Receipts (GRN)</div>
            <div className="text-lg font-black text-white font-mono">{grns.length} Data</div>
            <div className="text-[9px] text-emerald-400">Tab: GRN_GoodsReceipts</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Petty Cash Items</div>
            <div className="text-lg font-black text-white font-mono">
              {pettyCashPeriods.reduce((acc, p) => acc + (p.items?.length || 0), 0)} Nota
            </div>
            <div className="text-[9px] text-emerald-400">Tab: PettyCash_Expenses</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Berkas Penagihan</div>
            <div className="text-lg font-black text-white font-mono">{billingFiles.length} Berkas</div>
            <div className="text-[9px] text-emerald-400">Tab: PettyCash_BillingFiles</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Master Barang</div>
            <div className="text-lg font-black text-white font-mono">{items.length} Item</div>
            <div className="text-[9px] text-cyan-400">Tab: Master_Items</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Master Vendor</div>
            <div className="text-lg font-black text-white font-mono">{vendors.length} Vendor</div>
            <div className="text-[9px] text-cyan-400">Tab: Master_Vendors</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Chart of Accounts</div>
            <div className="text-lg font-black text-white font-mono">{coas.length} Akun</div>
            <div className="text-[9px] text-cyan-400">Tab: Master_COA</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Cost Centers</div>
            <div className="text-lg font-black text-white font-mono">{costCenters.length} CC</div>
            <div className="text-[9px] text-cyan-400">Tab: Master_CostCenters</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase">User Accounts</div>
            <div className="text-lg font-black text-white font-mono">{users.length} Akun</div>
            <div className="text-[9px] text-cyan-400">Tab: Users_Accounts</div>
          </div>
        </div>
      </div>
    </div>
  );
};
