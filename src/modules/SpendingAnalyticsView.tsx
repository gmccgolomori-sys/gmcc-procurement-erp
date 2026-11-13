import React, { useState, useMemo } from 'react';
import { 
  PurchaseOrder, 
  GoodsReceipt, 
  MasterItem, 
  Vendor, 
  CostCenter, 
  ChartOfAccount, 
  UserAccount,
  Department,
  GoodsReceiptItem,
  POItemLine
} from '../types/procurement';
import { GMCC_LOGO_DARK } from '../data/gmccLogo';
import { 
  TrendingUp, 
  ShoppingBag, 
  Building2, 
  Receipt, 
  Search, 
  Filter, 
  Calendar, 
  Printer, 
  Download, 
  Layers, 
  Package, 
  DollarSign, 
  ArrowUpDown, 
  ChevronRight, 
  X, 
  PieChart, 
  BarChart3, 
  ArrowUpRight, 
  CheckCircle2, 
  Truck,
  Sparkles,
  Info
} from 'lucide-react';

interface SpendingAnalyticsViewProps {
  pos: PurchaseOrder[];
  grns: GoodsReceipt[];
  items: MasterItem[];
  vendors: Vendor[];
  departments: Department[] | string[];
  costCenters: CostCenter[];
  coas: ChartOfAccount[];
  currentUser: UserAccount;
}

// Normalized single purchase line representing an item purchase instance
export interface NormalizedPurchaseLine {
  id: string;
  sourceType: 'GRN' | 'PO';
  documentNumber: string; // GRN number or PO number
  poNumber: string;
  grnNumber?: string;
  date: string; // ISO format: YYYY-MM-DD
  displayDate: string; // DD/MM/YYYY
  vendorName: string;
  department: string;
  costCenterName: string;
  coaName: string;
  coaCode?: string;
  outletDestination?: string;
  itemId: string;
  itemName: string;
  specification?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
}

// Aggregated item analysis record
export interface AggregatedItemInsight {
  itemId: string;
  itemName: string;
  unit: string;
  primaryCoa: string;
  primaryCostCenter: string;
  totalQuantity: number;
  totalSpend: number;
  frequency: number; // how many times purchased
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  departmentBreakdown: { department: string; quantity: number; spend: number; percent: number }[];
  costCenterBreakdown: { costCenterName: string; quantity: number; spend: number; percent: number }[];
  vendorBreakdown: { vendorName: string; quantity: number; spend: number; percent: number }[];
  history: NormalizedPurchaseLine[];
}

export const SpendingAnalyticsView: React.FC<SpendingAnalyticsViewProps> = ({
  pos,
  grns,
  items,
  vendors,
  departments,
  costCenters,
  coas,
  currentUser
}) => {
  // Navigation tabs within Analytics
  const [activeSubTab, setActiveSubTab] = useState<'ITEMS' | 'DEPARTMENTS' | 'COST_CENTERS' | 'COA' | 'VENDORS' | 'LEDGER'>('ITEMS');

  // Filter Presets & Date Filters
  const [periodPreset, setPeriodPreset] = useState<'MTD' | 'MONTH' | 'CYCLE_1_15' | 'CYCLE_16_31' | 'CUSTOM' | 'ALL'>('MTD');
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth() + 1); // 1 - 12
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Dimension Filters
  const [selectedCoa, setSelectedCoa] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('ALL');
  const [selectedVendor, setSelectedVendor] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dataSource, setDataSource] = useState<'ALL_PO' | 'REALIZED_GRN'>('REALIZED_GRN');

  // Item sorting option
  const [itemSortBy, setItemSortBy] = useState<'SPEND_DESC' | 'QTY_DESC' | 'FREQ_DESC' | 'NAME_ASC'>('SPEND_DESC');

  // Selected item for Drill-down modal
  const [selectedDrillDownItem, setSelectedDrillDownItem] = useState<AggregatedItemInsight | null>(null);

  // Print Report Modal
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Helper date conversions
  const toStandardIso = (dateStr?: string): string => {
    if (!dateStr) return '';
    const clean = dateStr.trim().split(' ')[0];
    if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts[0].length === 4) return clean; // YYYY-MM-DD
      if (parts[2]?.length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    if (clean.includes('/')) {
      const parts = clean.split('/');
      if (parts[2]?.length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      if (parts[0]?.length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    return '';
  };

  const toDisplayDate = (isoStr?: string): string => {
    if (!isoStr) return '-';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  const formatRupiah = (val?: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatNumber = (val?: number): string => {
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 1
    }).format(val || 0);
  };

  // Determine effective date range based on periodPreset
  const effectiveDateRange = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    const curDay = now.getDate();

    if (periodPreset === 'MTD') {
      const mStr = String(curMonth).padStart(2, '0');
      const dStr = String(curDay).padStart(2, '0');
      return {
        start: `${curYear}-${mStr}-01`,
        end: `${curYear}-${mStr}-${dStr}`,
        label: `MTD (${toDisplayDate(`${curYear}-${mStr}-01`)} s/d ${toDisplayDate(`${curYear}-${mStr}-${dStr}`)})`
      };
    }

    if (periodPreset === 'MONTH') {
      const mStr = String(selectedMonth).padStart(2, '0');
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      return {
        start: `${selectedYear}-${mStr}-01`,
        end: `${selectedYear}-${mStr}-${String(lastDay).padStart(2, '0')}`,
        label: `Bulan ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
      };
    }

    if (periodPreset === 'CYCLE_1_15') {
      const mStr = String(selectedMonth).padStart(2, '0');
      return {
        start: `${selectedYear}-${mStr}-01`,
        end: `${selectedYear}-${mStr}-15`,
        label: `Siklus 1 - 15 ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
      };
    }

    if (periodPreset === 'CYCLE_16_31') {
      const mStr = String(selectedMonth).padStart(2, '0');
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      return {
        start: `${selectedYear}-${mStr}-16`,
        end: `${selectedYear}-${mStr}-${String(lastDay).padStart(2, '0')}`,
        label: `Siklus 16 - ${lastDay} ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
      };
    }

    if (periodPreset === 'CUSTOM') {
      return {
        start: startDate || '2000-01-01',
        end: endDate || '2099-12-31',
        label: startDate && endDate 
          ? `Periode ${toDisplayDate(startDate)} s/d ${toDisplayDate(endDate)}`
          : 'Periode Kustom'
      };
    }

    // ALL
    return {
      start: '2000-01-01',
      end: '2099-12-31',
      label: 'Seluruh Riwayat Pembelian'
    };
  }, [periodPreset, selectedMonth, selectedYear, startDate, endDate]);

  // 1. EXTRACT AND NORMALIZE ALL PURCHASE LINES
  const allPurchaseLines: NormalizedPurchaseLine[] = useMemo(() => {
    const list: NormalizedPurchaseLine[] = [];

    if (dataSource === 'REALIZED_GRN') {
      // Extract from Goods Receipts (Actual physical received and invoice-audited lines)
      grns.forEach((grn) => {
        const rawDate = grn.receiptProofDate || grn.receiptDate;
        const iso = toStandardIso(rawDate) || '2026-10-15';
        const poRef = pos.find(p => p.id === grn.poId || p.poNumber === grn.poNumber);

        (grn.items || []).forEach((item, itemIdx) => {
          const qty = Number(item.qtyReceived) || 0;
          if (qty <= 0) return;
          const uPrice = Number(item.unitPriceNota) || Number(item.unitPricePO) || 0;
          const tPrice = Number(item.totalPriceNota) || (qty * uPrice);
          const coa = item.coaName || grn.coaName || poRef?.coaName || 'BPP';
          const cc = item.costCenterName || grn.costCenterName || poRef?.costCenterName || 'F&B Culinary';
          const dept = poRef?.department || cc;

          list.push({
            id: `grn-line-${grn.id}-${item.itemId || itemIdx}-${itemIdx}`,
            sourceType: 'GRN',
            documentNumber: grn.grnNumber,
            poNumber: grn.poNumber,
            grnNumber: grn.grnNumber,
            date: iso,
            displayDate: toDisplayDate(iso),
            vendorName: grn.vendorName,
            department: dept,
            costCenterName: cc,
            coaName: coa,
            coaCode: item.coaCode || poRef?.coaCode,
            outletDestination: item.outletDestination || poRef?.outletDestination,
            itemId: item.itemId || `item-${item.itemName.toLowerCase().replace(/\s+/g, '-')}`,
            itemName: item.itemName,
            specification: item.specification,
            unit: item.unit || 'PCS',
            quantity: qty,
            unitPrice: uPrice,
            totalPrice: tPrice,
            status: 'Barang Diterima & Terverifikasi'
          });
        });
      });
    } else {
      // Extract from All Issued POs
      pos.forEach((po) => {
        const iso = toStandardIso(po.orderDate) || '2026-10-15';

        (po.items || []).forEach((item, itemIdx) => {
          const qty = Number(item.quantityOrdered) || 0;
          if (qty <= 0) return;
          const uPrice = Number(item.unitPrice) || 0;
          const tPrice = Number(item.totalPrice) || (qty * uPrice);
          const coa = item.coaName || po.coaName || 'BPP';
          const cc = item.costCenterName || po.costCenterName || 'F&B Culinary';
          const dept = po.department || cc;

          list.push({
            id: `po-line-${po.id}-${item.itemId || itemIdx}-${itemIdx}`,
            sourceType: 'PO',
            documentNumber: po.poNumber,
            poNumber: po.poNumber,
            date: iso,
            displayDate: toDisplayDate(iso),
            vendorName: po.vendorName,
            department: dept,
            costCenterName: cc,
            coaName: coa,
            coaCode: item.coaCode || po.coaCode,
            outletDestination: item.outletDestination || po.outletDestination,
            itemId: item.itemId || `item-${item.itemName.toLowerCase().replace(/\s+/g, '-')}`,
            itemName: item.itemName,
            specification: item.specification,
            unit: item.unit || 'PCS',
            quantity: qty,
            unitPrice: uPrice,
            totalPrice: tPrice,
            status: po.status
          });
        });
      });
    }

    return list;
  }, [grns, pos, dataSource]);

  // 2. APPLY FILTERS (DATE, COA, DEPT, VENDOR, SEARCH)
  const filteredPurchaseLines = useMemo(() => {
    return allPurchaseLines.filter((line) => {
      // Date filter
      if (line.date < effectiveDateRange.start || line.date > effectiveDateRange.end) {
        return false;
      }

      // COA filter
      if (selectedCoa !== 'ALL') {
        const lineCoa = (line.coaName || '').toLowerCase();
        const selCoa = selectedCoa.toLowerCase();
        if (!lineCoa.includes(selCoa) && !selCoa.includes(lineCoa)) {
          return false;
        }
      }

      // Department filter
      if (selectedDept !== 'ALL') {
        const lineDept = (line.department || '').toLowerCase();
        const selDept = selectedDept.toLowerCase();
        if (!lineDept.includes(selDept)) {
          return false;
        }
      }

      // Cost Center filter
      if (selectedCostCenter !== 'ALL') {
        const lineCc = (line.costCenterName || '').toLowerCase();
        const selCc = selectedCostCenter.toLowerCase();
        if (!lineCc.includes(selCc) && !selCc.includes(lineCc)) {
          return false;
        }
      }

      // Vendor filter
      if (selectedVendor !== 'ALL') {
        if (line.vendorName.toLowerCase() !== selectedVendor.toLowerCase()) {
          return false;
        }
      }

      // Search query (Item name, spec, vendor, dept, cost center, po/grn number)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = line.itemName.toLowerCase().includes(q);
        const matchSpec = (line.specification || '').toLowerCase().includes(q);
        const matchVendor = line.vendorName.toLowerCase().includes(q);
        const matchDept = line.department.toLowerCase().includes(q);
        const matchCc = (line.costCenterName || '').toLowerCase().includes(q);
        const matchDoc = line.documentNumber.toLowerCase().includes(q);
        const matchPo = line.poNumber.toLowerCase().includes(q);
        const matchCoa = line.coaName.toLowerCase().includes(q);
        if (!matchName && !matchSpec && !matchVendor && !matchDept && !matchCc && !matchDoc && !matchPo && !matchCoa) {
          return false;
        }
      }

      return true;
    });
  }, [allPurchaseLines, effectiveDateRange, selectedCoa, selectedDept, selectedCostCenter, selectedVendor, searchQuery]);

  // 3. OVERALL KPI METRICS
  const kpiMetrics = useMemo(() => {
    const totalSpend = filteredPurchaseLines.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const totalTransactions = filteredPurchaseLines.length;

    // Unique Items
    const uniqueItemSet = new Set(filteredPurchaseLines.map(l => l.itemName.toLowerCase().trim()));
    const totalUniqueItems = uniqueItemSet.size;

    // Item with highest frequency and highest spend
    const itemSpendMap: Record<string, { name: string; spend: number; qty: number; unit: string; count: number }> = {};
    filteredPurchaseLines.forEach(l => {
      const key = l.itemName.toLowerCase().trim();
      if (!itemSpendMap[key]) {
        itemSpendMap[key] = { name: l.itemName, spend: 0, qty: 0, unit: l.unit, count: 0 };
      }
      itemSpendMap[key].spend += l.totalPrice;
      itemSpendMap[key].qty += l.quantity;
      itemSpendMap[key].count += 1;
    });

    const itemEntries = Object.values(itemSpendMap);
    const topFreqItem = itemEntries.sort((a, b) => b.count - a.count)[0];
    const topSpendItem = [...itemEntries].sort((a, b) => b.spend - a.spend)[0];

    // Top Department
    const deptSpendMap: Record<string, number> = {};
    filteredPurchaseLines.forEach(l => {
      const d = l.department || l.costCenterName || 'Lainnya';
      deptSpendMap[d] = (deptSpendMap[d] || 0) + l.totalPrice;
    });
    const topDeptEntry = Object.entries(deptSpendMap).sort((a, b) => b[1] - a[1])[0];

    // Top Cost Center
    const ccSpendMap: Record<string, number> = {};
    filteredPurchaseLines.forEach(l => {
      const cc = l.costCenterName || 'F&B Culinary Central Kitchen';
      ccSpendMap[cc] = (ccSpendMap[cc] || 0) + l.totalPrice;
    });
    const topCcEntry = Object.entries(ccSpendMap).sort((a, b) => b[1] - a[1])[0];

    // Top COA
    const coaSpendMap: Record<string, number> = {};
    filteredPurchaseLines.forEach(l => {
      const c = l.coaName || 'BPP';
      coaSpendMap[c] = (coaSpendMap[c] || 0) + l.totalPrice;
    });
    const topCoaEntry = Object.entries(coaSpendMap).sort((a, b) => b[1] - a[1])[0];

    return {
      totalSpend,
      totalTransactions,
      totalUniqueItems,
      topFreqItem,
      topSpendItem,
      topDept: topDeptEntry ? { name: topDeptEntry[0], spend: topDeptEntry[1], percent: (topDeptEntry[1] / (totalSpend || 1)) * 100 } : null,
      topCostCenter: topCcEntry ? { name: topCcEntry[0], spend: topCcEntry[1], percent: (topCcEntry[1] / (totalSpend || 1)) * 100 } : null,
      topCoa: topCoaEntry ? { name: topCoaEntry[0], spend: topCoaEntry[1], percent: (topCoaEntry[1] / (totalSpend || 1)) * 100 } : null
    };
  }, [filteredPurchaseLines]);

  // 4. AGGREGATED ITEM-LEVEL INSIGHTS (Answers: "pembelanjaan telur berapa banyak dan siapa saja dept & cost center yang pesan")
  const aggregatedItems: AggregatedItemInsight[] = useMemo(() => {
    const itemMap: Record<string, AggregatedItemInsight> = {};

    filteredPurchaseLines.forEach((line) => {
      // Group key based on trimmed normalized item name
      const key = line.itemName.toLowerCase().trim();

      if (!itemMap[key]) {
        itemMap[key] = {
          itemId: line.itemId,
          itemName: line.itemName,
          unit: line.unit,
          primaryCoa: line.coaName,
          primaryCostCenter: line.costCenterName,
          totalQuantity: 0,
          totalSpend: 0,
          frequency: 0,
          avgPrice: 0,
          minPrice: line.unitPrice,
          maxPrice: line.unitPrice,
          departmentBreakdown: [],
          costCenterBreakdown: [],
          vendorBreakdown: [],
          history: []
        };
      }

      const it = itemMap[key];
      it.totalQuantity += line.quantity;
      it.totalSpend += line.totalPrice;
      it.frequency += 1;
      it.minPrice = Math.min(it.minPrice, line.unitPrice);
      it.maxPrice = Math.max(it.maxPrice, line.unitPrice);
      it.history.push(line);
    });

    // Compute department breakdown, vendor breakdown, and average price for each item
    const results = Object.values(itemMap).map((item) => {
      item.avgPrice = item.totalQuantity > 0 ? (item.totalSpend / item.totalQuantity) : 0;

      // Dept Breakdown
      const deptMap: Record<string, { quantity: number; spend: number }> = {};
      item.history.forEach((h) => {
        const d = h.department || h.costCenterName || 'Lainnya';
        if (!deptMap[d]) deptMap[d] = { quantity: 0, spend: 0 };
        deptMap[d].quantity += h.quantity;
        deptMap[d].spend += h.totalPrice;
      });

      item.departmentBreakdown = Object.entries(deptMap).map(([dept, val]) => ({
        department: dept,
        quantity: val.quantity,
        spend: val.spend,
        percent: item.totalSpend > 0 ? (val.spend / item.totalSpend) * 100 : 0
      })).sort((a, b) => b.quantity - a.quantity);

      // Cost Center Breakdown
      const ccMap: Record<string, { quantity: number; spend: number }> = {};
      item.history.forEach((h) => {
        const cc = h.costCenterName || h.department || 'Lainnya';
        if (!ccMap[cc]) ccMap[cc] = { quantity: 0, spend: 0 };
        ccMap[cc].quantity += h.quantity;
        ccMap[cc].spend += h.totalPrice;
      });

      item.costCenterBreakdown = Object.entries(ccMap).map(([ccName, val]) => ({
        costCenterName: ccName,
        quantity: val.quantity,
        spend: val.spend,
        percent: item.totalSpend > 0 ? (val.spend / item.totalSpend) * 100 : 0
      })).sort((a, b) => b.spend - a.spend);

      // Vendor Breakdown
      const venMap: Record<string, { quantity: number; spend: number }> = {};
      item.history.forEach((h) => {
        const v = h.vendorName || 'Lainnya';
        if (!venMap[v]) venMap[v] = { quantity: 0, spend: 0 };
        venMap[v].quantity += h.quantity;
        venMap[v].spend += h.totalPrice;
      });

      item.vendorBreakdown = Object.entries(venMap).map(([vendor, val]) => ({
        vendorName: vendor,
        quantity: val.quantity,
        spend: val.spend,
        percent: item.totalSpend > 0 ? (val.spend / item.totalSpend) * 100 : 0
      })).sort((a, b) => b.spend - a.spend);

      return item;
    });

    // Sort items based on user choice
    return results.sort((a, b) => {
      if (itemSortBy === 'SPEND_DESC') return b.totalSpend - a.totalSpend;
      if (itemSortBy === 'QTY_DESC') return b.totalQuantity - a.totalQuantity;
      if (itemSortBy === 'FREQ_DESC') return b.frequency - a.frequency;
      if (itemSortBy === 'NAME_ASC') return a.itemName.localeCompare(b.itemName);
      return b.totalSpend - a.totalSpend;
    });
  }, [filteredPurchaseLines, itemSortBy]);

  // 5. AGGREGATED DEPARTMENT SPENDING
  const departmentAnalytics = useMemo(() => {
    const deptMap: Record<string, {
      name: string;
      totalSpend: number;
      totalTransactions: number;
      itemsMap: Record<string, { name: string; qty: number; unit: string; spend: number }>;
    }> = {};

    filteredPurchaseLines.forEach((l) => {
      const d = l.department || l.costCenterName || 'Lainnya';
      if (!deptMap[d]) {
        deptMap[d] = {
          name: d,
          totalSpend: 0,
          totalTransactions: 0,
          itemsMap: {}
        };
      }
      deptMap[d].totalSpend += l.totalPrice;
      deptMap[d].totalTransactions += 1;

      const itemKey = l.itemName.toLowerCase().trim();
      if (!deptMap[d].itemsMap[itemKey]) {
        deptMap[d].itemsMap[itemKey] = { name: l.itemName, qty: 0, unit: l.unit, spend: 0 };
      }
      deptMap[d].itemsMap[itemKey].qty += l.quantity;
      deptMap[d].itemsMap[itemKey].spend += l.totalPrice;
    });

    const totalAllSpend = kpiMetrics.totalSpend || 1;

    return Object.values(deptMap).map((d) => {
      const topItems = Object.values(d.itemsMap).sort((a, b) => b.spend - a.spend).slice(0, 5);
      return {
        department: d.name,
        totalSpend: d.totalSpend,
        percent: (d.totalSpend / totalAllSpend) * 100,
        transactionsCount: d.totalTransactions,
        uniqueItemCount: Object.keys(d.itemsMap).length,
        topItems
      };
    }).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [filteredPurchaseLines, kpiMetrics.totalSpend]);

  // 5b. AGGREGATED COST CENTER SPENDING & BUDGET
  const costCenterAnalytics = useMemo(() => {
    const ccMap: Record<string, {
      name: string;
      code?: string;
      budget?: number;
      totalSpend: number;
      totalTransactions: number;
      itemsMap: Record<string, { name: string; qty: number; unit: string; spend: number }>;
      deptMap: Record<string, number>;
    }> = {};

    filteredPurchaseLines.forEach((l) => {
      const ccName = l.costCenterName || 'F&B Culinary Central Kitchen';
      if (!ccMap[ccName]) {
        const foundCc = costCenters.find(c => c.name.toLowerCase() === ccName.toLowerCase() || c.code.toLowerCase() === ccName.toLowerCase());
        ccMap[ccName] = {
          name: ccName,
          code: foundCc?.code || 'CC-GEN',
          budget: foundCc?.budgetAllocation,
          totalSpend: 0,
          totalTransactions: 0,
          itemsMap: {},
          deptMap: {}
        };
      }
      ccMap[ccName].totalSpend += l.totalPrice;
      ccMap[ccName].totalTransactions += 1;

      const itemKey = l.itemName.toLowerCase().trim();
      if (!ccMap[ccName].itemsMap[itemKey]) {
        ccMap[ccName].itemsMap[itemKey] = { name: l.itemName, qty: 0, unit: l.unit, spend: 0 };
      }
      ccMap[ccName].itemsMap[itemKey].qty += l.quantity;
      ccMap[ccName].itemsMap[itemKey].spend += l.totalPrice;

      const d = l.department || ccName;
      ccMap[ccName].deptMap[d] = (ccMap[ccName].deptMap[d] || 0) + l.totalPrice;
    });

    const totalAllSpend = kpiMetrics.totalSpend || 1;

    return Object.values(ccMap).map((cc) => {
      const topItems = Object.values(cc.itemsMap).sort((a, b) => b.spend - a.spend).slice(0, 5);
      return {
        costCenterName: cc.name,
        code: cc.code,
        budget: cc.budget,
        totalSpend: cc.totalSpend,
        percent: (cc.totalSpend / totalAllSpend) * 100,
        transactionsCount: cc.totalTransactions,
        uniqueItemCount: Object.keys(cc.itemsMap).length,
        topItems
      };
    }).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [filteredPurchaseLines, costCenters, kpiMetrics.totalSpend]);

  // 6. AGGREGATED COA BUDGET & DISTRIBUTION
  const coaAnalytics = useMemo(() => {
    const coaMap: Record<string, {
      name: string;
      totalSpend: number;
      totalTransactions: number;
      itemsMap: Record<string, { name: string; qty: number; unit: string; spend: number }>;
      deptMap: Record<string, number>;
    }> = {};

    filteredPurchaseLines.forEach((l) => {
      const c = l.coaName || 'BPP';
      if (!coaMap[c]) {
        coaMap[c] = {
          name: c,
          totalSpend: 0,
          totalTransactions: 0,
          itemsMap: {},
          deptMap: {}
        };
      }
      coaMap[c].totalSpend += l.totalPrice;
      coaMap[c].totalTransactions += 1;

      const itemKey = l.itemName.toLowerCase().trim();
      if (!coaMap[c].itemsMap[itemKey]) {
        coaMap[c].itemsMap[itemKey] = { name: l.itemName, qty: 0, unit: l.unit, spend: 0 };
      }
      coaMap[c].itemsMap[itemKey].qty += l.quantity;
      coaMap[c].itemsMap[itemKey].spend += l.totalPrice;

      const d = l.department || l.costCenterName || 'Lainnya';
      coaMap[c].deptMap[d] = (coaMap[c].deptMap[d] || 0) + l.totalPrice;
    });

    const totalAllSpend = kpiMetrics.totalSpend || 1;

    return Object.values(coaMap).map((c) => {
      const topItems = Object.values(c.itemsMap).sort((a, b) => b.spend - a.spend).slice(0, 5);
      const topDepts = Object.entries(c.deptMap).map(([dept, spend]) => ({
        department: dept,
        spend,
        percent: (spend / (c.totalSpend || 1)) * 100
      })).sort((a, b) => b.spend - a.spend);

      return {
        coaName: c.name,
        totalSpend: c.totalSpend,
        percent: (c.totalSpend / totalAllSpend) * 100,
        transactionsCount: c.totalTransactions,
        uniqueItemCount: Object.keys(c.itemsMap).length,
        topItems,
        topDepts
      };
    }).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [filteredPurchaseLines, kpiMetrics.totalSpend]);

  // 7. AGGREGATED VENDOR SOURCING
  const vendorAnalytics = useMemo(() => {
    const venMap: Record<string, {
      name: string;
      totalSpend: number;
      totalTransactions: number;
      itemsMap: Record<string, { name: string; qty: number; unit: string; spend: number }>;
    }> = {};

    filteredPurchaseLines.forEach((l) => {
      const v = l.vendorName || 'Lainnya';
      if (!venMap[v]) {
        venMap[v] = {
          name: v,
          totalSpend: 0,
          totalTransactions: 0,
          itemsMap: {}
        };
      }
      venMap[v].totalSpend += l.totalPrice;
      venMap[v].totalTransactions += 1;

      const itemKey = l.itemName.toLowerCase().trim();
      if (!venMap[v].itemsMap[itemKey]) {
        venMap[v].itemsMap[itemKey] = { name: l.itemName, qty: 0, unit: l.unit, spend: 0 };
      }
      venMap[v].itemsMap[itemKey].qty += l.quantity;
      venMap[v].itemsMap[itemKey].spend += l.totalPrice;
    });

    const totalAllSpend = kpiMetrics.totalSpend || 1;

    return Object.values(venMap).map((v) => {
      const topItems = Object.values(v.itemsMap).sort((a, b) => b.spend - a.spend).slice(0, 4);
      return {
        vendorName: v.name,
        totalSpend: v.totalSpend,
        percent: (v.totalSpend / totalAllSpend) * 100,
        transactionsCount: v.totalTransactions,
        uniqueItemCount: Object.keys(v.itemsMap).length,
        topItems
      };
    }).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [filteredPurchaseLines, kpiMetrics.totalSpend]);

  // Export CSV Helper
  const handleExportCsv = () => {
    const headers = [
      'No',
      'Tanggal',
      'No. Dokumen (GRN/PO)',
      'Nama Barang',
      'Spesifikasi',
      'COA',
      'Departemen',
      'Cost Center',
      'Vendor / Pemasok',
      'Kuantitas',
      'Satuan',
      'Harga Satuan (IDR)',
      'Total Belanja (IDR)',
      'Status'
    ];

    const rows = filteredPurchaseLines.map((l, idx) => [
      idx + 1,
      l.displayDate,
      `"${l.documentNumber}"`,
      `"${l.itemName.replace(/"/g, '""')}"`,
      `"${(l.specification || '').replace(/"/g, '""')}"`,
      `"${l.coaName}"`,
      `"${l.department}"`,
      `"${(l.costCenterName || '').replace(/"/g, '""')}"`,
      `"${l.vendorName.replace(/"/g, '""')}"`,
      l.quantity,
      `"${l.unit}"`,
      l.unitPrice,
      l.totalPrice,
      `"${l.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Belanja_GMCC_${effectiveDateRange.start}_sd_${effectiveDateRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & HERO BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Daftar Belanja &amp; Insight Pengadaan
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Procurement &amp; Spending Analytics
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Pusat visualisasi data belanja barang, frekuensi pemesanan item, alokasi biaya per COA &amp; Departemen, serta drill-down mendalam pemesanan per komoditas.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cetak Laporan / PDF</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV Data</span>
          </button>
        </div>
      </div>

      {/* 2. SMART FILTER & PERIODE SELECTOR */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl text-xs">
        {/* Preset Periode Buttons & Dropdowns */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Periode:
            </span>
            <button
              onClick={() => setPeriodPreset('MTD')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                periodPreset === 'MTD'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              MTD (Bulan Ini)
            </button>
            <button
              onClick={() => setPeriodPreset('MONTH')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                periodPreset === 'MONTH'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              1 Bulan Penuh
            </button>
            <button
              onClick={() => setPeriodPreset('CYCLE_1_15')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                periodPreset === 'CYCLE_1_15'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Siklus 1 - 15
            </button>
            <button
              onClick={() => setPeriodPreset('CYCLE_16_31')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                periodPreset === 'CYCLE_16_31'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Siklus 16 - 31
            </button>
            <button
              onClick={() => setPeriodPreset('CUSTOM')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                periodPreset === 'CUSTOM'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Pilih Tanggal
            </button>
            <button
              onClick={() => setPeriodPreset('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                periodPreset === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Semua Waktu
            </button>
          </div>

          {/* Month / Year picker if Month or Cycle is active */}
          {(periodPreset === 'MONTH' || periodPreset === 'CYCLE_1_15' || periodPreset === 'CYCLE_16_31') && (
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold focus:outline-none focus:border-cyan-400"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold focus:outline-none focus:border-cyan-400"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            </div>
          )}

          {/* Custom Date Range picker */}
          {periodPreset === 'CUSTOM' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
              />
              <span className="text-slate-500">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}
        </div>

        {/* Multi-Dimensional Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari barang (contoh: telur, beras, tissue, kabel)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter COA */}
          <div>
            <select
              value={selectedCoa}
              onChange={(e) => setSelectedCoa(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-semibold focus:outline-none focus:border-cyan-400 text-xs"
            >
              <option value="ALL">Semua Akun COA</option>
              <option value="BPP">COA: BPP (Kitchen &amp; FB)</option>
              <option value="NON BPP">COA: NON BPP (Operasional Langsung)</option>
              <option value="Transport">COA: Transportasi &amp; BBM</option>
              <option value="Event Cost">COA: Biaya Langsung Event</option>
              <option value="Rental Equipment Event">COA: Rental Equipment Event</option>
              <option value="Meal Employee">COA: Konsumsi Karyawan</option>
              {coas.map(c => (
                <option key={c.id} value={c.name}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          {/* Filter Dept */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-semibold focus:outline-none focus:border-cyan-400 text-xs"
            >
              <option value="ALL">Semua Departemen</option>
              {Array.isArray(departments) && departments.map((d: any) => {
                const dName = typeof d === 'string' ? d : d.name;
                return <option key={dName} value={dName}>{dName}</option>;
              })}
            </select>
          </div>

          {/* Filter Cost Center (Pusat Biaya) */}
          <div>
            <select
              value={selectedCostCenter}
              onChange={(e) => setSelectedCostCenter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-cyan-800/80 text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400 text-xs"
            >
              <option value="ALL">Semua Cost Center</option>
              {costCenters.map(cc => (
                <option key={cc.id} value={cc.name}>{cc.code} - {cc.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Vendor */}
          <div>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-semibold focus:outline-none focus:border-cyan-400 text-xs"
            >
              <option value="ALL">Semua Vendor Rekanan</option>
              {vendors.map(v => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Source toggle & active filter chips */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Basis Data:</span>
            <button
              onClick={() => setDataSource('REALIZED_GRN')}
              className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                dataSource === 'REALIZED_GRN'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              ✓ Barang Terealisasi (GRN/Nota Fisik)
            </button>
            <button
              onClick={() => setDataSource('ALL_PO')}
              className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                dataSource === 'ALL_PO'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              Surat Pesanan Diterbitkan (PO)
            </button>
          </div>

          <div className="font-mono text-cyan-300 font-bold">
            Rentang: {effectiveDateRange.label} • {filteredPurchaseLines.length} Transaksi Ditemukan
          </div>
        </div>
      </div>

      {/* 3. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Total Spend */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Nilai Belanja</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-white font-mono">
            {formatRupiah(kpiMetrics.totalSpend)}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">
            {filteredPurchaseLines.length} item pembelian terverifikasi
          </div>
        </div>

        {/* Unique Items Count */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Variasi Komoditas</span>
            <Package className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-black text-cyan-300 font-mono">
            {kpiMetrics.totalUniqueItems} <span className="text-xs font-normal text-slate-400">Jenis Barang</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Rata-rata {formatRupiah(kpiMetrics.totalUniqueItems > 0 ? kpiMetrics.totalSpend / kpiMetrics.totalUniqueItems : 0)} / jenis
          </div>
        </div>

        {/* Top Frequency Item */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paling Sering Dipesan</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-amber-300 truncate" title={kpiMetrics.topFreqItem?.name}>
            {kpiMetrics.topFreqItem?.name || 'Belum ada data'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Frekuensi: <b className="text-white">{kpiMetrics.topFreqItem?.count || 0}x pesanan</b> ({formatNumber(kpiMetrics.topFreqItem?.qty)} {kpiMetrics.topFreqItem?.unit})
          </div>
        </div>

        {/* Top Department Spender */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dept Terbesar</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-indigo-200 truncate" title={kpiMetrics.topDept?.name}>
            {kpiMetrics.topDept?.name || 'Belum ada data'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            {formatRupiah(kpiMetrics.topDept?.spend)} ({kpiMetrics.topDept?.percent.toFixed(1)}%)
          </div>
        </div>

        {/* Top Cost Center Spender */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Cost Center Terbesar</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-cyan-200 truncate" title={kpiMetrics.topCostCenter?.name}>
            {kpiMetrics.topCostCenter?.name || 'Belum ada data'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            {formatRupiah(kpiMetrics.topCostCenter?.spend)} ({kpiMetrics.topCostCenter?.percent.toFixed(1)}%)
          </div>
        </div>

        {/* Top COA Allocation */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alokasi COA Terbanyak</span>
            <Receipt className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-sm font-bold text-rose-300 truncate" title={kpiMetrics.topCoa?.name}>
            {kpiMetrics.topCoa?.name || 'Belum ada data'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            {formatRupiah(kpiMetrics.topCoa?.spend)} ({kpiMetrics.topCoa?.percent.toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* 4. SUB-TAB NAVIGATION */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('ITEMS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'ITEMS'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Analisis Per Item ({aggregatedItems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('DEPARTMENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'DEPARTMENTS'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Beban Per Departemen ({departmentAnalytics.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('COST_CENTERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'COST_CENTERS'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pusat Biaya / Cost Center ({costCenterAnalytics.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('COA')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'COA'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Alokasi Master COA ({coaAnalytics.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('VENDORS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'VENDORS'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Pangsa Rekanan / Vendor ({vendorAnalytics.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('LEDGER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'LEDGER'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Buku Riwayat Belanja ({filteredPurchaseLines.length})</span>
          </button>
        </div>

        {/* Sort selector for Items tab */}
        {activeSubTab === 'ITEMS' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold hidden sm:inline">Urutkan:</span>
            <select
              value={itemSortBy}
              onChange={(e) => setItemSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold focus:outline-none focus:border-cyan-400"
            >
              <option value="SPEND_DESC">Nominal Belanja Tertinggi (Rp)</option>
              <option value="QTY_DESC">Total Kuantitas Terbanyak</option>
              <option value="FREQ_DESC">Paling Sering Dipesan (Frekuensi)</option>
              <option value="NAME_ASC">Nama Barang (A - Z)</option>
            </select>
          </div>
        )}
      </div>

      {/* 5. TAB 1: ANALISIS PER ITEM (THE CORE USER SCENARIO) */}
      {activeSubTab === 'ITEMS' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-800/60 border-b border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  Daftar Barang &amp; Insight Frekuensi Pembelian
                </h3>
                <p className="text-[11px] text-slate-400">
                  Klik tombol <b>"Lihat Detail &amp; Dept Pemesan"</b> pada baris barang untuk melihat rincian departemen mana saja yang memesan komoditas tersebut.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {aggregatedItems.length} Komoditas Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3.5 py-3 text-center w-12">#</th>
                    <th className="px-4 py-3">Nama Barang &amp; Spesifikasi</th>
                    <th className="px-3 py-3">Kategori COA</th>
                    <th className="px-3 py-3 text-right">Total Kuantitas</th>
                    <th className="px-3 py-3 text-center">Frekuensi</th>
                    <th className="px-3 py-3 text-right">Rata-rata Harga</th>
                    <th className="px-4 py-3 text-right">Total Belanja</th>
                    <th className="px-4 py-3">Dept &amp; Cost Center Pemesan</th>
                    <th className="px-3 py-3 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {aggregatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-500 italic">
                        Tidak ada transaksi barang yang sesuai dengan filter periode atau kriteria yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    aggregatedItems.map((item, idx) => {
                      const isBpp = (item.primaryCoa || '').toUpperCase().includes('BPP');
                      return (
                        <tr 
                          key={item.itemId || idx}
                          className="hover:bg-slate-800/50 transition-colors group"
                        >
                          <td className="px-3.5 py-3 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {item.itemName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.unit} • Rentang: {formatRupiah(item.minPrice)} s/d {formatRupiah(item.maxPrice)}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isBpp 
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}>
                              {item.primaryCoa || 'BPP'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-white">
                            {formatNumber(item.totalQuantity)} <span className="text-[10px] text-slate-400 font-normal">{item.unit}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px] font-bold border border-slate-700">
                              {item.frequency}x
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-slate-400">
                            {formatRupiah(item.avgPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-extrabold text-cyan-300 text-sm">
                            {formatRupiah(item.totalSpend)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 flex-wrap">
                                {item.costCenterBreakdown.slice(0, 2).map((cc, ccIdx) => (
                                  <span 
                                    key={ccIdx} 
                                    className="px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 text-[10px] border border-cyan-700/60 font-semibold"
                                    title={`Cost Center ${cc.costCenterName}: ${formatNumber(cc.quantity)} ${item.unit} (${formatRupiah(cc.spend)})`}
                                  >
                                    CC: {cc.costCenterName} ({cc.percent.toFixed(0)}%)
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                {item.departmentBreakdown.slice(0, 2).map((dept, dIdx) => (
                                  <span 
                                    key={dIdx} 
                                    className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9.5px] border border-slate-700 font-medium"
                                    title={`Dept ${dept.department}: ${formatNumber(dept.quantity)} ${item.unit} (${formatRupiah(dept.spend)})`}
                                  >
                                    {dept.department.split(' ')[0]} ({dept.percent.toFixed(0)}%)
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => setSelectedDrillDownItem(item)}
                              className="px-2.5 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-500 text-cyan-200 hover:text-slate-950 font-bold text-[10.5px] border border-cyan-500/40 transition-all flex items-center justify-center gap-1 w-full shadow-sm"
                            >
                              <span>Detail</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
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

      {/* 6. TAB 2: ANALISIS PER DEPARTEMEN */}
      {activeSubTab === 'DEPARTMENTS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentAnalytics.map((dept, idx) => (
              <div
                key={dept.department}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                      Rank #{idx + 1}
                    </span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {dept.percent.toFixed(1)}% Belanja
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mt-2">
                    {dept.department}
                  </h4>
                  <div className="text-xs font-mono font-black text-cyan-300 mt-1">
                    {formatRupiah(dept.totalSpend)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {dept.transactionsCount} transaksi • {dept.uniqueItemCount} variasi barang
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(3, dept.percent))}%` }}
                    />
                  </div>
                </div>

                {/* Top Items bought by this department */}
                <div className="pt-3 border-t border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Top Komoditas Terbanyak Dipesan:
                  </div>
                  <div className="space-y-1">
                    {dept.topItems.map((it, iIdx) => (
                      <div key={iIdx} className="flex items-center justify-between text-[11px] text-slate-300">
                        <span className="truncate max-w-[180px] font-medium">{it.name}</span>
                        <span className="font-mono text-slate-400 font-semibold">{formatRupiah(it.spend)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6b. TAB 2B: ANALISIS PER COST CENTER (PUSAT BIAYA) */}
      {activeSubTab === 'COST_CENTERS' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <h3 className="font-extrabold text-white text-sm">
                  Distribusi Realisasi Belanja Per Cost Center (Pusat Biaya)
                </h3>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Menampilkan serapan anggaran dan realisasi belanja per unit operasional GOLO MORI CONVENTION CENTER.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold text-xs">
                {costCenterAnalytics.length} Cost Center Terdata
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {costCenterAnalytics.map((cc, idx) => (
              <div
                key={cc.costCenterName}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                        Rank #{idx + 1}
                      </span>
                      {cc.code && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-800">
                          {cc.code}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {cc.percent.toFixed(1)}% Total
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mt-2 leading-snug">
                    {cc.costCenterName}
                  </h4>
                  <div className="text-sm font-mono font-black text-cyan-300 mt-1">
                    {formatRupiah(cc.totalSpend)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {cc.transactionsCount} transaksi • {cc.uniqueItemCount} variasi barang
                  </div>

                  {/* Progress bar (Share of total company spend) */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(3, cc.percent))}%` }}
                    />
                  </div>

                  {/* Budget Allocation comparison if defined */}
                  {cc.budget && cc.budget > 0 && (
                    <div className="mt-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Plafon Budget:</span>
                      <span className="font-mono text-slate-200 font-bold">{formatRupiah(cc.budget)}</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        ({((cc.totalSpend / cc.budget) * 100).toFixed(1)}% terpakai)
                      </span>
                    </div>
                  )}
                </div>

                {/* Top Items bought by this cost center */}
                <div className="pt-3 border-t border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Komoditas Terbanyak Dipesan:</span>
                  </div>
                  <div className="space-y-1">
                    {cc.topItems.map((it, iIdx) => (
                      <div key={iIdx} className="flex items-center justify-between text-[11px] text-slate-300">
                        <span className="truncate max-w-[170px] font-medium">{it.name}</span>
                        <span className="font-mono text-cyan-400 font-semibold">{formatRupiah(it.spend)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {costCenterAnalytics.length === 0 && (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
              Tidak ada data transaksi pembelian untuk filter Cost Center dan periode yang dipilih.
            </div>
          )}
        </div>
      )}

      {/* 7. TAB 3: ALOKASI MASTER COA */}
      {activeSubTab === 'COA' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coaAnalytics.map((coa, idx) => (
              <div
                key={coa.coaName}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Akun COA
                    </span>
                    <span className="font-mono font-black text-cyan-400 text-sm">
                      {coa.percent.toFixed(1)}% Pagu
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mt-2">
                    {coa.coaName}
                  </h4>
                  <div className="text-sm font-mono font-black text-emerald-400 mt-1">
                    {formatRupiah(coa.totalSpend)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {coa.transactionsCount} catatan pengeluaran • {coa.uniqueItemCount} variasi komoditas
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(3, coa.percent))}%` }}
                    />
                  </div>
                </div>

                {/* Department distribution for this COA */}
                <div className="pt-3 border-t border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Alokasi Pembebanan Departemen:
                  </div>
                  <div className="space-y-1">
                    {coa.topDepts.map((d, dIdx) => (
                      <div key={dIdx} className="flex items-center justify-between text-[11px] text-slate-300">
                        <span className="truncate max-w-[170px] font-medium">{d.department}</span>
                        <span className="font-mono text-cyan-300 font-semibold">{formatRupiah(d.spend)} ({d.percent.toFixed(0)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. TAB 4: PANGSA VENDOR */}
      {activeSubTab === 'VENDORS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendorAnalytics.map((ven, idx) => (
              <div
                key={ven.vendorName}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-teal-300 border border-slate-700">
                      Rekanan #{idx + 1}
                    </span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {ven.percent.toFixed(1)}% Suplai
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mt-2">
                    {ven.vendorName}
                  </h4>
                  <div className="text-sm font-mono font-black text-teal-300 mt-1">
                    {formatRupiah(ven.totalSpend)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {ven.transactionsCount} faktur/surat jalan • {ven.uniqueItemCount} jenis komoditas disuplai
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(3, ven.percent))}%` }}
                    />
                  </div>
                </div>

                {/* Top Items from this vendor */}
                <div className="pt-3 border-t border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Komoditas Utama yang Dipasok:
                  </div>
                  <div className="space-y-1">
                    {ven.topItems.map((it, iIdx) => (
                      <div key={iIdx} className="flex items-center justify-between text-[11px] text-slate-300">
                        <span className="truncate max-w-[180px] font-medium">{it.name}</span>
                        <span className="font-mono text-slate-400 font-semibold">{formatRupiah(it.spend)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. TAB 5: BUKU RIWAYAT BELANJA LENGKAP (LEDGER) */}
      {activeSubTab === 'LEDGER' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-800/60 border-b border-slate-700/80 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Buku Kasus &amp; Riwayat Transaksi Belanja Lengkap
            </h3>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              Total {filteredPurchaseLines.length} baris barang
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-2.5 text-center w-10">#</th>
                  <th className="px-3 py-2.5">Tanggal</th>
                  <th className="px-3 py-2.5">No. Dokumen</th>
                  <th className="px-4 py-2.5">Nama Barang &amp; Spesifikasi</th>
                  <th className="px-3 py-2.5">COA, Dept &amp; Cost Center</th>
                  <th className="px-3 py-2.5">Vendor</th>
                  <th className="px-3 py-2.5 text-right">Kuantitas</th>
                  <th className="px-3 py-2.5 text-right">Harga Satuan</th>
                  <th className="px-4 py-2.5 text-right">Total (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredPurchaseLines.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500 italic">
                      Tidak ada riwayat transaksi belanja yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredPurchaseLines.map((line, idx) => (
                    <tr key={line.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-300">{line.displayDate}</td>
                      <td className="px-3 py-2.5 font-mono">
                        <span className="font-bold text-white">{line.documentNumber}</span>
                        {line.poNumber && line.poNumber !== line.documentNumber && (
                          <span className="block text-[10px] text-slate-500">PO: {line.poNumber}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-bold text-white">{line.itemName}</div>
                        {line.specification && (
                          <div className="text-[10px] text-cyan-300">{line.specification}</div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-800 text-slate-300 border border-slate-700 block max-w-fit">
                          {line.coaName}
                        </span>
                        <span className="text-[10px] text-cyan-300 font-semibold block mt-0.5">
                          CC: {line.costCenterName}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{line.department}</span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-300">{line.vendorName}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-white">
                        {formatNumber(line.quantity)} {line.unit}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-400">
                        {formatRupiah(line.unitPrice)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-cyan-300">
                        {formatRupiah(line.totalPrice)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 10. MODAL ITEM DEEP-DIVE (DRILL-DOWN TELUR SCENARIO) */}
      {selectedDrillDownItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-slate-900 border border-cyan-500/40 text-slate-100 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-base">
                      Analisis Pengadaan: {selectedDrillDownItem.itemName}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {selectedDrillDownItem.primaryCoa}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Riwayat pemesanan dalam rentang: <b className="text-white">{effectiveDateRange.label}</b>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDrillDownItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Kuantitas</span>
                  <span className="text-lg font-black text-cyan-400 font-mono mt-0.5 block">
                    {formatNumber(selectedDrillDownItem.totalQuantity)} <span className="text-xs font-normal text-slate-300">{selectedDrillDownItem.unit}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Berdasarkan {selectedDrillDownItem.frequency}x transaksi</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Biaya Belanja</span>
                  <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
                    {formatRupiah(selectedDrillDownItem.totalSpend)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Total pengeluaran riil</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rata-rata Harga Satuan</span>
                  <span className="text-lg font-black text-amber-300 font-mono mt-0.5 block">
                    {formatRupiah(selectedDrillDownItem.avgPrice)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Per {selectedDrillDownItem.unit}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rentang Fluktuasi Harga</span>
                  <span className="text-xs font-bold text-slate-200 font-mono mt-1.5 block">
                    {formatRupiah(selectedDrillDownItem.minPrice)} - {formatRupiah(selectedDrillDownItem.maxPrice)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Variasi harga pasar</span>
                </div>
              </div>

              {/* COST CENTER PEMESAN */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-2 text-xs">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Cost Center Pemesan ({selectedDrillDownItem.costCenterBreakdown.length} Cost Center)
                  </h4>
                  <span className="text-[10px] text-cyan-300">
                    Pembebanan pusat biaya resmi GMCC
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedDrillDownItem.costCenterBreakdown.map((cc, ccIdx) => (
                    <div 
                      key={ccIdx} 
                      className="p-3 rounded-xl bg-slate-900 border border-cyan-800/50 flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="font-bold text-white truncate">{cc.costCenterName}</span>
                          <span className="font-mono font-bold text-cyan-400 text-[11px] shrink-0">{cc.percent.toFixed(0)}%</span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-400 font-bold mt-1">
                          {formatRupiah(cc.spend)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Kuantitas: <b className="text-slate-200">{formatNumber(cc.quantity)} {selectedDrillDownItem.unit}</b>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-cyan-400 h-full rounded-full" 
                          style={{ width: `${Math.max(5, cc.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* USER CORE SCENARIO: SIAPA SAJA DEPT YANG PESAN ITEM INI */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-2 text-xs">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    Departemen Pemesan ({selectedDrillDownItem.departmentBreakdown.length} Departemen)
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Proporsi konsumsi &amp; pembebanan anggaran
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedDrillDownItem.departmentBreakdown.map((dept, dIdx) => (
                    <div 
                      key={dIdx} 
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-2 hover:border-cyan-500/40 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white truncate max-w-[150px]">{dept.department}</span>
                          <span className="font-mono font-bold text-cyan-400 text-[11px]">{dept.percent.toFixed(0)}%</span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-400 font-bold mt-1">
                          {formatRupiah(dept.spend)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Kuantitas: <b className="text-slate-200">{formatNumber(dept.quantity)} {selectedDrillDownItem.unit}</b>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-cyan-400 h-full rounded-full" 
                          style={{ width: `${Math.max(5, dept.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vendor Sourcing Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-2 text-xs">
                    <Truck className="w-4 h-4 text-teal-400" />
                    Penyedia / Vendor Pemasok
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedDrillDownItem.vendorBreakdown.length} Rekanan
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedDrillDownItem.vendorBreakdown.map((v, vIdx) => (
                    <div key={vIdx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-xs">{v.vendorName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Total Dipasok: <b className="text-slate-200">{formatNumber(v.quantity)} {selectedDrillDownItem.unit}</b>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-teal-300 text-xs">{formatRupiah(v.spend)}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{v.percent.toFixed(0)}% pangsa</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Purchase History for this item */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    Riwayat Transaksi Pembelian ({selectedDrillDownItem.history.length} Catatan)
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Setiap PO / Penerimaan Barang GRN
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] font-bold uppercase border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2">Tgl</th>
                        <th className="px-3 py-2">No. Dokumen</th>
                        <th className="px-3 py-2">Cost Center &amp; Dept</th>
                        <th className="px-3 py-2">Vendor</th>
                        <th className="px-3 py-2 text-right">Kuantitas</th>
                        <th className="px-3 py-2 text-right">Harga Satuan</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {selectedDrillDownItem.history.map((h, hIdx) => (
                        <tr key={hIdx} className="hover:bg-slate-900/60 transition-colors">
                          <td className="px-3 py-2 font-mono text-slate-400">{h.displayDate}</td>
                          <td className="px-3 py-2 font-mono font-bold text-white">{h.documentNumber}</td>
                          <td className="px-3 py-2">
                            <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 text-[10px] font-semibold border border-cyan-800/60 block max-w-fit">
                              {h.costCenterName}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{h.department}</span>
                          </td>
                          <td className="px-3 py-2 text-slate-300">{h.vendorName}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-cyan-300">
                            {formatNumber(h.quantity)} {h.unit}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-slate-400">{formatRupiah(h.unitPrice)}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-white">{formatRupiah(h.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Data terhubung langsung dengan modul PO, GRN &amp; Petty Cash GMCC.
              </span>
              <button
                type="button"
                onClick={() => setSelectedDrillDownItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. MODAL CETAK LAPORAN / PRINT PREVIEW */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
          <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Cetak Lembar Laporan Belanja &amp; Insight Pengadaan GMCC
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-800 print:p-0">
              {/* Header Letterhead */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div className="flex items-center gap-3">
                  <img src={GMCC_LOGO_DARK} alt="GMCC Logo" className="h-9 w-auto object-contain" />
                  <div>
                    <h2 className="text-sm font-black tracking-tight text-slate-900 uppercase">
                      GOLO MORI CONVENTION CENTER
                    </h2>
                    <div className="text-[10px] text-slate-600">
                      LAPORAN ANALISIS PENGADAAN &amp; DAFTAR BELANJA KOMODITAS
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[10px] text-slate-600">
                    Dicetak: {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID')}
                  </div>
                  <div className="font-bold text-slate-900 text-xs">
                    Periode: {effectiveDateRange.label}
                  </div>
                </div>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-5 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Nilai Belanja</div>
                  <div className="font-black text-slate-900 text-sm font-mono">{formatRupiah(kpiMetrics.totalSpend)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Jumlah Komoditas</div>
                  <div className="font-black text-slate-900 text-sm font-mono">{kpiMetrics.totalUniqueItems} Jenis</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Transaksi</div>
                  <div className="font-black text-slate-900 text-sm font-mono">{filteredPurchaseLines.length} Baris</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Dept Terbesar</div>
                  <div className="font-bold text-slate-900 text-xs truncate">{kpiMetrics.topDept?.name || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Cost Center Terbesar</div>
                  <div className="font-bold text-slate-900 text-xs truncate">{kpiMetrics.topCostCenter?.name || '-'}</div>
                </div>
              </div>

              {/* Ringkasan Beban Per Cost Center */}
              {costCenterAnalytics.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold uppercase text-[11px] text-slate-900 border-b border-slate-300 pb-1">
                    Ringkasan Realisasi Belanja Per Cost Center (Pusat Biaya)
                  </div>
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-y border-slate-300 font-bold">
                        <th className="p-1.5 text-center w-8">No</th>
                        <th className="p-1.5">Kode</th>
                        <th className="p-1.5">Nama Cost Center</th>
                        <th className="p-1.5 text-center">Transaksi</th>
                        <th className="p-1.5 text-right">Porsi</th>
                        <th className="p-1.5 text-right">Total Belanja (IDR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {costCenterAnalytics.map((cc, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5 text-center font-mono">{idx + 1}</td>
                          <td className="p-1.5 font-mono text-slate-700">{cc.code || '-'}</td>
                          <td className="p-1.5 font-bold text-slate-900">{cc.costCenterName}</td>
                          <td className="p-1.5 text-center font-mono">{cc.transactionsCount}x</td>
                          <td className="p-1.5 text-right font-mono">{cc.percent.toFixed(1)}%</td>
                          <td className="p-1.5 text-right font-mono font-bold text-slate-900">{formatRupiah(cc.totalSpend)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Top 15 Items Table */}
              <div className="space-y-2">
                <div className="font-bold uppercase text-[11px] text-slate-900 border-b border-slate-300 pb-1">
                  Daftar 15 Komoditas Terbanyak Dibelanjakan
                </div>
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-y border-slate-300 font-bold">
                      <th className="p-1.5 text-center w-8">No</th>
                      <th className="p-1.5">Nama Komoditas</th>
                      <th className="p-1.5">COA</th>
                      <th className="p-1.5">Cost Center Utama</th>
                      <th className="p-1.5 text-right">Total Qty</th>
                      <th className="p-1.5 text-center">Freq</th>
                      <th className="p-1.5 text-right">Rata-rata Harga</th>
                      <th className="p-1.5 text-right">Total Belanja (IDR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {aggregatedItems.slice(0, 15).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-1.5 text-center font-mono">{idx + 1}</td>
                        <td className="p-1.5 font-bold text-slate-900">{it.itemName}</td>
                        <td className="p-1.5">{it.primaryCoa}</td>
                        <td className="p-1.5 text-slate-700">{it.primaryCostCenter}</td>
                        <td className="p-1.5 text-right font-mono font-bold">{formatNumber(it.totalQuantity)} {it.unit}</td>
                        <td className="p-1.5 text-center font-mono">{it.frequency}x</td>
                        <td className="p-1.5 text-right font-mono">{formatRupiah(it.avgPrice)}</td>
                        <td className="p-1.5 text-right font-mono font-bold text-slate-900">{formatRupiah(it.totalSpend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-[10px]">
                <div>
                  <div className="text-slate-500 mb-8">Dibuat Oleh:</div>
                  <div className="font-bold underline text-slate-900">{currentUser.name}</div>
                  <div className="text-slate-500">{currentUser.role}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-8">Diverifikasi Finance:</div>
                  <div className="font-bold underline text-slate-900">Agus Setiabudi</div>
                  <div className="text-slate-500">Chief Accounting</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-8">Disetujui Manajemen:</div>
                  <div className="font-bold underline text-slate-900">Ari Soplanit</div>
                  <div className="text-slate-500">General Manager</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
