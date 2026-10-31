import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              !
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Terjadi Kendala Memuat Sistem</h1>
            <p className="text-sm text-slate-400 mb-6">
              Sistem mendeteksi error pada memori lokal browser. Klik tombol di bawah untuk menyetel ulang data dan memuat ulang halaman.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl text-sm transition"
              >
                Muat Ulang Halaman
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm border border-slate-700 transition"
              >
                Reset Penyimpanan & Mulai Baru
              </button>
            </div>
            {this.state.error && (
              <p className="mt-4 text-[11px] text-slate-500 font-mono text-left bg-slate-950 p-3 rounded-lg overflow-x-auto border border-slate-800">
                {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
