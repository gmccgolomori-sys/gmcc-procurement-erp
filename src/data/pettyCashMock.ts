import { ExpenseReceiptProof, PettyCashSettlementPeriod } from '../types/procurement';
import { SAMPLE_SIGNATURES } from './procurementMock';

// Realistic SVG generator for physical receipts/nota/struk/transfer proofs
export const generateReceiptSvg = (vendor: string, notaNo: string, date: string, total: number, itemsStr: string, stampColor = '#dc2626') => {
  const formattedTotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(total);
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='440' height='320' viewBox='0 0 440 320'>
    <rect width='440' height='320' rx='10' fill='%23fffbeb' stroke='%23d97706' stroke-width='2'/>
    <!-- Header -->
    <text x='20' y='32' font-family='monospace' font-size='16' font-weight='bold' fill='%231e293b'>${vendor}</text>
    <text x='20' y='50' font-family='monospace' font-size='10' fill='%2364748b'>Kawasan Labuan Bajo - Kab. Manggarai Barat, NTT</text>
    <line x1='20' y1='58' x2='420' y2='58' stroke='%23cbd5e1' stroke-width='1.5' stroke-dasharray='4,4'/>
    <!-- Meta -->
    <text x='20' y='76' font-family='monospace' font-size='11' fill='%23334155'>No. Nota : <tspan font-weight='bold'>${notaNo}</tspan></text>
    <text x='280' y='76' font-family='monospace' font-size='11' fill='%23334155'>Tgl: ${date}</text>
    <text x='20' y='94' font-family='monospace' font-size='11' fill='%23334155'>Kepada   : GOLO MORI CONVENTION CENTER</text>
    <line x1='20' y1='102' x2='420' y2='102' stroke='%23cbd5e1' stroke-width='1.5'/>
    <!-- Description -->
    <text x='20' y='125' font-family='monospace' font-size='12' font-weight='bold' fill='%230f172a'>Deskripsi Pembelian / Rincian:</text>
    <text x='20' y='148' font-family='monospace' font-size='11' fill='%23334155'>- ${itemsStr}</text>
    <text x='20' y='168' font-family='monospace' font-size='10' fill='%2364748b'>Kondisi fisik barang telah diperiksa &amp; diterima di Receiving GMCC</text>
    <!-- Total -->
    <line x1='20' y1='195' x2='420' y2='195' stroke='%2394a3b8' stroke-width='1.5'/>
    <text x='20' y='225' font-family='monospace' font-size='14' font-weight='bold' fill='%230f172a'>TOTAL PEMBAYARAN:</text>
    <text x='420' y='225' text-anchor='end' font-family='monospace' font-size='16' font-weight='bold' fill='%230369a1'>${formattedTotal}</text>
    <!-- Stamp -->
    <g transform='translate(270, 235) rotate(-8)'>
      <rect width='130' height='46' rx='4' fill='none' stroke='${stampColor}' stroke-width='2.5' stroke-dasharray='2,2'/>
      <text x='65' y='22' text-anchor='middle' font-family='sans-serif' font-size='13' font-weight='bold' fill='${stampColor}'>LUNAS</text>
      <text x='65' y='38' text-anchor='middle' font-family='sans-serif' font-size='8' font-weight='bold' fill='${stampColor}'>${vendor}</text>
    </g>
    <!-- Receiving signature badge -->
    <text x='20' y='280' font-family='monospace' font-size='9' fill='%23475569'>Penerima: Fransiscus Doni (Receiving &amp; Warehouse GMCC)</text>
    <text x='20' y='295' font-family='monospace' font-size='8' fill='%2394a3b8'>Dokumen Asli Diarsip di Finance Dept - Disahkan Lalu Agus Setiabudi</text>
  </svg>`;
};

// Transaksi kas kecil operasional resmi GMCC.
// Data contoh dummy BPP yang tidak relevan telah dihapus sesuai permintaan.
// Transaksi baru dapat dicatat langsung oleh Finance atau ditarik otomatis dari Penerimaan Barang (GRN/PO).
export const INITIAL_PETTY_CASH_ITEMS: ExpenseReceiptProof[] = [];

// Calculate exact sum
export const TOTAL_PETTY_CASH_DEBIT = INITIAL_PETTY_CASH_ITEMS.reduce((sum, item) => sum + item.debit, 0);
export const TOTAL_PETTY_CASH_KREDIT = INITIAL_PETTY_CASH_ITEMS.reduce((sum, item) => sum + item.kredit, 0);

export const INITIAL_PETTY_CASH_PERIOD: PettyCashSettlementPeriod = {
  id: 'period-current',
  periodName: 'PERIODE OPERASIONAL GMCC',
  startDate: '',
  endDate: '',
  title: 'GOLO MORI CONVENTION CENTER - PETTY CASH SETTLEMENT',
  currency: 'IDR',
  items: INITIAL_PETTY_CASH_ITEMS,
  totalDebit: 0,
  totalKredit: 0,
  status: 'DRAFT',
  maxLimit: 50000000,
  preparedBy: {
    name: 'Agus Setiabudi',
    title: 'Chief Accounting',
    date: '31/10/2026',
    signatureUrl: SAMPLE_SIGNATURES.AGUS_ACCOUNTING
  },
  approvedBy: {
    name: 'Ari Soplanit',
    title: 'General Manager',
    date: '01/11/2026',
    signatureUrl: SAMPLE_SIGNATURES.ARI_GM
  },
  notes: 'Rekapitulasi pengeluaran kas kecil operasional resmi GOLO MORI CONVENTION CENTER (GMCC). Pengesahan otorisasi resmi Chief Accounting & General Manager dengan tanda tangan digital resmi & disesuaikan COA / Cost Center.'
};
