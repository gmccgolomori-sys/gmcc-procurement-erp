import React, { useState, useMemo } from 'react';
import { 
  RecipeCostRecord, 
  RecipeIngredient, 
  MasterItem, 
  CostCenter, 
  UserAccount 
} from '../types/procurement';
import { 
  ChefHat, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  Percent, 
  DollarSign, 
  UtensilsCrossed, 
  Layers, 
  TrendingUp, 
  Calculator,
  X,
  FileSpreadsheet,
  Building2,
  Flame,
  ArrowDownRight,
  Info
} from 'lucide-react';

interface RecipeCostCenterViewProps {
  recipes: RecipeCostRecord[];
  items: MasterItem[];
  costCenters: CostCenter[];
  currentUser: UserAccount;
  onAddRecipe: (newRecipe: RecipeCostRecord) => void;
  onEditRecipe: (updatedRecipe: RecipeCostRecord) => void;
  onDeleteRecipe: (recipeId: string) => void;
}

export const RecipeCostCenterView: React.FC<RecipeCostCenterViewProps> = ({
  recipes,
  items,
  costCenters,
  currentUser,
  onAddRecipe,
  onEditRecipe,
  onDeleteRecipe
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState<'ALL' | 'NUKA' | 'MICE'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [printableRecipe, setPrintableRecipe] = useState<RecipeCostRecord | null>(null);

  // Form states
  const [recipeName, setRecipeName] = useState('');
  const [category, setCategory] = useState('Main Course');
  const [outlet, setOutlet] = useState<'ALL' | 'NUKA' | 'MICE'>('NUKA');
  const [portions, setPortions] = useState(1);
  const [costCenterName, setCostCenterName] = useState(costCenters[0]?.name || 'F&B Culinary Central Kitchen');
  
  // Pricing states (Tax & Service 21% reduction)
  const [grossSellingPrice, setGrossSellingPrice] = useState(181500); // Default gross selling price
  const [targetCostPercentage, setTargetCostPercentage] = useState(30); // Target food cost %
  const [yieldLossPercent, setYieldLossPercent] = useState(8); // Yield / cooking / trimming loss % filled by chef
  const [notes, setNotes] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);

  // Temp ingredient line
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [ingredientQty, setIngredientQty] = useState(0.2);

  const formatRupiah = (val?: number) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchSearch = r.recipeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.costCenterName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchOutlet = selectedOutlet === 'ALL' || r.outlet === selectedOutlet;
      const matchCat = selectedCategory === 'ALL' || r.category === selectedCategory;
      return matchSearch && matchOutlet && matchCat;
    });
  }, [recipes, searchTerm, selectedOutlet, selectedCategory]);

  // Aggregate KPI metrics
  const kpiData = useMemo(() => {
    const total = recipes.length;
    if (total === 0) return { total: 0, avgCostPct: 0, alertCount: 0, totalRevenuePotential: 0 };
    const sumCostPct = recipes.reduce((acc, r) => acc + (r.foodCostPercentage ?? r.actualFoodCostPercent ?? 0), 0);
    const avgCostPct = Number((sumCostPct / total).toFixed(1));
    const alertCount = recipes.filter(r => (r.foodCostPercentage ?? r.actualFoodCostPercent ?? 0) > 35).length;
    const totalRevenuePotential = recipes.reduce((acc, r) => acc + (r.grossSellingPrice ?? r.sellingPrice ?? 0), 0);
    return { total, avgCostPct, alertCount, totalRevenuePotential };
  }, [recipes]);

  // Computed calculations for form
  // 1. Raw Ingredients Cost
  const computedRawIngredientsCost = useMemo(() => {
    return recipeIngredients.reduce((acc, ing) => acc + ing.totalCost, 0);
  }, [recipeIngredients]);

  // 2. Yield Loss / Cooking & Trimming Loss Amount (diisi manual oleh Chef)
  const computedYieldLossAmount = useMemo(() => {
    const rate = Math.max(0, Number(yieldLossPercent) || 0);
    return Math.round(computedRawIngredientsCost * (rate / 100));
  }, [computedRawIngredientsCost, yieldLossPercent]);

  // 3. Effective Total Recipe Cost
  const computedEffectiveRecipeCost = useMemo(() => {
    return computedRawIngredientsCost + computedYieldLossAmount;
  }, [computedRawIngredientsCost, computedYieldLossAmount]);

  // 4. Portion Cost
  const computedPortionCost = useMemo(() => {
    const validPortions = Math.max(1, Number(portions) || 1);
    return Math.round(computedEffectiveRecipeCost / validPortions);
  }, [computedEffectiveRecipeCost, portions]);

  // 5. Tax & Service 21% and Base Selling Price
  // Hospitality Standard Indonesia: Gross Price = Base Price * 1.21
  // Base Selling Price = Gross / 1.21
  // Tax & Service (21%) = Gross - Base Selling Price
  const computedTaxAndServiceAmount = useMemo(() => {
    const gross = Math.max(0, Number(grossSellingPrice) || 0);
    const base = Math.round(gross / 1.21);
    return gross - base;
  }, [grossSellingPrice]);

  const computedBaseSellingPrice = useMemo(() => {
    const gross = Math.max(0, Number(grossSellingPrice) || 0);
    return Math.round(gross / 1.21);
  }, [grossSellingPrice]);

  // 6. Target Food Cost Max (IDR)
  const computedTargetFoodCostAmount = useMemo(() => {
    const targetPct = Math.max(0, Number(targetCostPercentage) || 0);
    return Math.round(computedBaseSellingPrice * (targetPct / 100));
  }, [computedBaseSellingPrice, targetCostPercentage]);

  // 7. Actual Food Cost % (computed against Base Selling Price net of 21% Tax & Service)
  const computedFoodCostPct = useMemo(() => {
    if (computedBaseSellingPrice <= 0) return 0;
    return Number(((computedPortionCost / computedBaseSellingPrice) * 100).toFixed(1));
  }, [computedPortionCost, computedBaseSellingPrice]);

  // 8. Gross Profit Margin
  const computedGrossProfit = useMemo(() => {
    return Math.max(0, computedBaseSellingPrice - computedPortionCost);
  }, [computedBaseSellingPrice, computedPortionCost]);

  const computedGrossProfitPct = useMemo(() => {
    return Number((100 - computedFoodCostPct).toFixed(1));
  }, [computedFoodCostPct]);

  // 9. Status
  const computedStatus = useMemo((): 'HEALTHY' | 'WARNING' | 'ALERT' | 'EXCELLENT' => {
    if (computedFoodCostPct <= 28) return 'EXCELLENT';
    if (computedFoodCostPct <= 32) return 'HEALTHY';
    if (computedFoodCostPct <= 35) return 'WARNING';
    return 'ALERT';
  }, [computedFoodCostPct]);

  // Handle open modal for new recipe
  const handleOpenAddModal = () => {
    setEditingRecipeId(null);
    setRecipeName('');
    setCategory('Main Course');
    setOutlet('NUKA');
    setPortions(1);
    setCostCenterName(costCenters[0]?.name || 'F&B Culinary Central Kitchen');
    setGrossSellingPrice(181500); // Rp 181.500 gross = Rp 150.000 harga dasar net 21%
    setTargetCostPercentage(30);
    setYieldLossPercent(8);
    setNotes('');
    
    // Default with first item from price list
    if (items.length > 0) {
      const first = items[0];
      const firstPrice = first.lastPurchasePrice || first.lastPrice || 0;
      setRecipeIngredients([
        {
          id: `ing-${Date.now()}-1`,
          itemId: first.id,
          itemName: first.name,
          unit: first.unit,
          quantity: 0.2,
          unitCost: firstPrice,
          totalCost: Math.round(0.2 * firstPrice)
        }
      ]);
    } else {
      setRecipeIngredients([]);
    }
    setIsModalOpen(true);
  };

  // Handle open modal for edit
  const handleOpenEditModal = (r: RecipeCostRecord) => {
    setEditingRecipeId(r.id);
    setRecipeName(r.recipeName);
    setCategory(r.category);
    setOutlet(r.outlet);
    setPortions(r.portions || r.portionYield || 1);
    setCostCenterName(r.costCenterName);
    setGrossSellingPrice(r.grossSellingPrice || Math.round((r.sellingPrice || 150000) * 1.21));
    setTargetCostPercentage(r.targetCostPercentage || r.targetFoodCostPercent || 30);
    setYieldLossPercent(r.yieldLossPercent ?? 8);
    setNotes(r.notes || '');
    setRecipeIngredients([...r.ingredients]);
    setIsModalOpen(true);
  };

  // Add ingredient line
  const handleAddIngredient = () => {
    const item = items.find(i => i.id === selectedItemId);
    if (!item) return;

    const price = item.lastPurchasePrice || item.lastPrice || 0;
    const qty = Number(ingredientQty) || 0.1;
    const lineTotal = Math.round(qty * price);

    setRecipeIngredients(prev => [
      ...prev,
      {
        id: `ing-${Date.now()}-${Math.random()}`,
        itemId: item.id,
        itemName: item.name,
        unit: item.unit,
        quantity: qty,
        unitCost: price,
        totalCost: lineTotal
      }
    ]);
  };

  // Remove ingredient line
  const handleRemoveIngredient = (id: string) => {
    setRecipeIngredients(prev => prev.filter(ing => ing.id !== id));
  };

  // Update ingredient qty inline
  const handleUpdateIngredientQty = (id: string, newQty: number) => {
    setRecipeIngredients(prev => prev.map(ing => {
      if (ing.id === id) {
        const qty = Math.max(0, newQty);
        return {
          ...ing,
          quantity: qty,
          totalCost: Math.round(qty * ing.unitCost)
        };
      }
      return ing;
    }));
  };

  // Save recipe
  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeName.trim()) {
      alert('Nama resep tidak boleh kosong!');
      return;
    }
    if (recipeIngredients.length === 0) {
      alert('Tambahkan setidaknya 1 bahan baku pengadaan dari daftar harga!');
      return;
    }

    const matchedCC = costCenters.find(cc => cc.name === costCenterName);
    const nowStr = new Date().toISOString().split('T')[0];

    const record: RecipeCostRecord = {
      id: editingRecipeId || `rcp-${Date.now()}`,
      recipeCode: `RCP-${Math.floor(100 + Math.random() * 900)}`,
      recipeName: recipeName.trim(),
      category,
      outlet,
      portions: Math.max(1, Number(portions) || 1),
      portionYield: Math.max(1, Number(portions) || 1),
      costCenterId: matchedCC?.id || 'cc-fb-01',
      costCenterName,
      ingredients: recipeIngredients,
      rawIngredientsCost: computedRawIngredientsCost,
      yieldLossPercent: Number(yieldLossPercent) || 0,
      yieldLossAmount: computedYieldLossAmount,
      effectiveRecipeCost: computedEffectiveRecipeCost,
      totalRecipeCost: computedEffectiveRecipeCost,
      portionCost: computedPortionCost,
      costPerPortion: computedPortionCost,
      grossSellingPrice: Number(grossSellingPrice) || 0,
      taxAndServiceRate: 21,
      taxAndServiceAmount: computedTaxAndServiceAmount,
      baseSellingPrice: computedBaseSellingPrice,
      sellingPrice: computedBaseSellingPrice, // Basis perhitungan food cost
      actualFoodCostPercent: computedFoodCostPct,
      foodCostPercentage: computedFoodCostPct,
      targetCostPercentage: Number(targetCostPercentage) || 30,
      targetFoodCostPercent: Number(targetCostPercentage) || 30,
      targetFoodCostAmount: computedTargetFoodCostAmount,
      grossProfitPerPortion: computedGrossProfit,
      recommendedSellingPrice: Math.round(computedPortionCost / ((Number(targetCostPercentage) || 30) / 100)),
      status: computedStatus,
      lastUpdated: nowStr,
      notes: notes.trim()
    };

    if (editingRecipeId) {
      onEditRecipe(record);
      alert(`Resep "${record.recipeName}" berhasil diperbarui!`);
    } else {
      onAddRecipe(record);
      alert(`Resep standar "${record.recipeName}" berhasil disimpan ke Recipe Cost Center!`);
    }

    setIsModalOpen(false);
  };

  // Print Standard Recipe Cost Sheet
  const handlePrintRecipeCard = (recipe: RecipeCostRecord) => {
    setPrintableRecipe(recipe);
    setTimeout(() => {
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const rawCost = recipe.rawIngredientsCost ?? recipe.totalRecipeCost;
      const yieldPct = recipe.yieldLossPercent ?? 0;
      const yieldRp = recipe.yieldLossAmount ?? Math.round(rawCost * (yieldPct / 100));
      const effectiveCost = recipe.effectiveRecipeCost ?? (rawCost + yieldRp);
      const portCost = recipe.portionCost ?? recipe.costPerPortion ?? 0;
      const grossPrice = recipe.grossSellingPrice ?? Math.round(recipe.sellingPrice * 1.21);
      const basePrice = recipe.baseSellingPrice ?? recipe.sellingPrice;
      const taxServiceRp = recipe.taxAndServiceAmount ?? (grossPrice - basePrice);
      const costPct = recipe.foodCostPercentage ?? recipe.actualFoodCostPercent ?? 0;
      const targetPct = recipe.targetFoodCostPercent ?? recipe.targetCostPercentage ?? 30;

      const doc = printIframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Standard_Recipe_Cost_${recipe.recipeName.replace(/[^a-zA-Z0-9]/g, '_')}</title>
              <meta charset="utf-8">
              <style>
                @page { size: A4 portrait; margin: 8mm 10mm; }
                * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                body { margin: 0; padding: 10px; color: #0f172a; font-size: 10.5px; line-height: 1.3; }
                .header { border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
                .box { border: 1px solid #cbd5e1; border-radius: 5px; padding: 8px 10px; background: #f8fafc; font-size: 10px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 4.5px 7px; font-size: 9.5px; }
                th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .font-mono { font-family: monospace; }
                .sig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 16px; text-align: center; }
                .sig-box { border: 1px solid #cbd5e1; padding: 6px; border-radius: 4px; min-height: 80px; display: flex; flex-direction: column; justify-content: space-between; }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <h2 style="margin: 0; font-size: 14px; text-transform: uppercase;">GOLO MORI CONVENTION CENTER</h2>
                  <div style="font-size: 10px; color: #475569; font-weight: bold;">STANDARD RECIPE COSTING & MENU ENGINEERING SHEET</div>
                  <div style="font-size: 9px; color: #64748b;">Cost Center: ${recipe.costCenterName} • Outlet: ${recipe.outlet}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-weight: 900; font-size: 12px;">${recipe.recipeName}</div>
                  <div style="font-size: 9px; color: #64748b;">Kategori: ${recipe.category} • Porsi Yield: ${recipe.portions || recipe.portionYield || 1} pax</div>
                </div>
              </div>

              <!-- Price & Tax/Service Breakdown Box -->
              <div class="grid-2">
                <div class="box">
                  <div style="font-weight: bold; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; color: #0f172a;">Perhitungan Harga Jual (Net of 21% Tax & Service):</div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span>Harga Jual POS / Menu (Gross):</span>
                    <strong class="font-mono">${formatRupiah(grossPrice)}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; color: #e11d48; margin-bottom: 2px;">
                    <span>Kurang Tax & Service (21%):</span>
                    <strong class="font-mono">-${formatRupiah(taxServiceRp)}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 3px; font-weight: bold; color: #0284c7;">
                    <span>HARGA DASAR (Net Sales GMCC):</span>
                    <span class="font-mono">${formatRupiah(basePrice)}</span>
                  </div>
                </div>

                <div class="box">
                  <div style="font-weight: bold; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; color: #0f172a;">Target & Actual Food Cost Performance:</div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span>Target Food Cost %:</span>
                    <strong class="font-mono">${targetPct}% (${formatRupiah(Math.round(basePrice * (targetPct / 100)))})</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span>Food Cost per Porsi (Efektif):</span>
                    <strong class="font-mono">${formatRupiah(portCost)}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 3px; font-weight: bold;">
                    <span>ACTUAL FOOD COST %:</span>
                    <span class="font-mono" style="color: ${costPct > 35 ? '#b91c1c' : '#047857'}; font-size: 11px;">${costPct}% (${costPct <= targetPct ? 'SESUAI TARGET' : 'OVER TARGET'})</span>
                  </div>
                </div>
              </div>

              <!-- Ingredients Table -->
              <table>
                <thead>
                  <tr>
                    <th style="width: 25px;" class="text-center">No</th>
                    <th>Bahan Baku Pengadaan (Daftar Harga Kontrak GMCC)</th>
                    <th class="text-center" style="width: 60px;">Satuan</th>
                    <th class="text-center" style="width: 60px;">Qty</th>
                    <th class="text-right" style="width: 90px;">Harga Kontrak</th>
                    <th class="text-right" style="width: 95px;">Total Biaya</th>
                  </tr>
                </thead>
                <tbody>
                  ${recipe.ingredients.map((ing, i) => `
                    <tr>
                      <td class="text-center">${i + 1}</td>
                      <td><strong>${ing.itemName}</strong></td>
                      <td class="text-center">${ing.unit}</td>
                      <td class="text-center font-mono">${ing.quantity}</td>
                      <td class="text-right font-mono">${formatRupiah(ing.unitCost)}</td>
                      <td class="text-right font-mono"><strong>${formatRupiah(ing.totalCost)}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr style="background-color: #f8fafc; font-weight: bold;">
                    <td colspan="5" class="text-right">Subtotal Bahan Baku Mentah:</td>
                    <td class="text-right font-mono">${formatRupiah(rawCost)}</td>
                  </tr>
                  <tr style="background-color: #fef2f2; font-weight: bold; color: #b91c1c;">
                    <td colspan="5" class="text-right">Yield Loss / Cooking & Trimming Loss (${yieldPct}% diisi manual Chef):</td>
                    <td class="text-right font-mono">+${formatRupiah(yieldRp)}</td>
                  </tr>
                  <tr style="background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a;">
                    <td colspan="5" class="text-right">TOTAL BIAYA RESEP EFEKTIF (${recipe.portions || recipe.portionYield || 1} PORSI):</td>
                    <td class="text-right font-mono" style="font-size: 11px;">${formatRupiah(effectiveCost)}</td>
                  </tr>
                  <tr style="background-color: #e0f2fe; font-weight: bold;">
                    <td colspan="5" class="text-right">FOOD COST EFEKTIF PER PORSI:</td>
                    <td class="text-right font-mono" style="color: #0369a1; font-size: 11px;">${formatRupiah(portCost)}</td>
                  </tr>
                </tfoot>
              </table>

              ${recipe.notes ? `<div style="font-size: 9.5px; color: #475569; margin-bottom: 10px;"><strong>Catatan Chef & Preparasi:</strong> ${recipe.notes}</div>` : ''}

              <div class="sig-grid">
                <div class="sig-box">
                  <div style="font-size: 8.5px; font-weight: bold; text-transform: uppercase;">Disusun (Executive Chef)</div>
                  <div style="height: 38px;"></div>
                  <div style="font-size: 9px; font-weight: bold; border-top: 1px solid #cbd5e1; padding-top: 2px;">Executive Chef GMCC</div>
                </div>
                <div class="sig-box">
                  <div style="font-size: 8.5px; font-weight: bold; text-transform: uppercase;">Diverifikasi (Cost Controller)</div>
                  <div style="height: 38px;"></div>
                  <div style="font-size: 9px; font-weight: bold; border-top: 1px solid #cbd5e1; padding-top: 2px;">F&B Cost Controller</div>
                </div>
                <div class="sig-box">
                  <div style="font-size: 8.5px; font-weight: bold; text-transform: uppercase;">Disetujui (Dept Head Finance)</div>
                  <div style="height: 38px;"></div>
                  <div style="font-size: 9px; font-weight: bold; border-top: 1px solid #cbd5e1; padding-top: 2px;">Dept Head Finance GMCC</div>
                </div>
              </div>
            </body>
          </html>
        `);
        doc.close();
        setTimeout(() => {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(printIframe);
          }, 1000);
        }, 300);
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-cyan-400" />
            Recipe Cost Center (Menu Engineering & Food Costing)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Perhitungan Harga Dasar (dikurangi Tax & Service 21%), Yield Loss Chef, dan sinkronisasi Master Kontrak Harga GMCC
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Resep Standar Baru</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5 text-cyan-400" />
            <span>Total Resep Terdaftar</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">{kpiData.total}</div>
          <div className="text-[10px] text-slate-500">NUKA BEACH CLUB & MICE Banquet</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rata-Rata Food Cost %</span>
          </div>
          <div className={`text-2xl font-black font-mono ${kpiData.avgCostPct > 35 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {kpiData.avgCostPct}%
          </div>
          <div className="text-[10px] text-slate-500">Basis Harga Dasar (Net 21%)</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Alert High Cost (&gt;35%)</span>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">{kpiData.alertCount}</div>
          <div className="text-[10px] text-slate-500">Melebihi target food cost</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span>Master Item Terhubung</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{items.length}</div>
          <div className="text-[10px] text-slate-500">Bahan Baku Kontrak Pengadaan</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama resep, bahan baku, kategori..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Outlet Filter */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setSelectedOutlet('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                selectedOutlet === 'ALL' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Outlet
            </button>
            <button
              onClick={() => setSelectedOutlet('NUKA')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                selectedOutlet === 'NUKA' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              NUKA BEACH CLUB
            </button>
            <button
              onClick={() => setSelectedOutlet('MICE')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                selectedOutlet === 'MICE' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              MICE Banquet
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Main Course">Main Course</option>
            <option value="Appetizer">Appetizer</option>
            <option value="Dessert">Dessert</option>
            <option value="Beverage">Beverage</option>
            <option value="Banquet Package">Banquet Package</option>
          </select>
        </div>
      </div>

      {/* Recipe Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipes.map((recipe) => {
          const costPortion = recipe.portionCost ?? recipe.costPerPortion ?? 0;
          const costPct = recipe.foodCostPercentage ?? recipe.actualFoodCostPercent ?? 0;
          const grossPrice = recipe.grossSellingPrice ?? Math.round(recipe.sellingPrice * 1.21);
          const basePrice = recipe.baseSellingPrice ?? recipe.sellingPrice;
          const targetPct = recipe.targetFoodCostPercent ?? recipe.targetCostPercentage ?? 30;
          const yieldPct = recipe.yieldLossPercent ?? 0;
          const grossMarginRp = Math.max(0, basePrice - costPortion);
          const grossMarginPct = 100 - costPct;

          return (
            <div 
              key={recipe.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {recipe.category}
                    </span>
                    <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                      {recipe.outlet}
                    </span>
                    <h3 className="text-sm font-extrabold text-white mt-1.5 leading-snug">
                      {recipe.recipeName}
                    </h3>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Cost Center: <b className="text-cyan-300">{recipe.costCenterName}</b>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    recipe.status === 'HEALTHY' || recipe.status === 'EXCELLENT'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : recipe.status === 'WARNING'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                  }`}>
                    {costPct <= targetPct ? 'Sesuai Target' : 'Over Target'}
                  </span>
                </div>

                {/* Price & Tax/Service Breakdown */}
                <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-slate-800/60 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Harga POS (Gross):</span>
                    <span className="font-mono font-bold text-white text-xs">{formatRupiah(grossPrice)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-300 block">Kurang Tax/Svc (21%):</span>
                    <span className="font-mono text-rose-400 text-xs">-{formatRupiah(grossPrice - basePrice)}</span>
                  </div>
                  <div className="border-t border-slate-700/60 pt-1.5">
                    <span className="text-[10px] text-cyan-300 block font-semibold">Harga Dasar Bersih:</span>
                    <span className="font-mono font-black text-cyan-400 text-sm">{formatRupiah(basePrice)}</span>
                  </div>
                  <div className="border-t border-slate-700/60 pt-1.5">
                    <span className="text-[10px] text-slate-400 block">Target Food Cost:</span>
                    <span className="font-mono font-bold text-slate-300 text-xs">{targetPct}% ({formatRupiah(Math.round(basePrice * (targetPct / 100)))})</span>
                  </div>
                </div>

                {/* Food Cost & Yield Loss Metric */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Food Cost / Porsi:</span>
                    <span className="font-mono font-black text-amber-400 text-sm">{formatRupiah(costPortion)}</span>
                    <span className="text-[9px] text-slate-500 block">Yield Loss: {yieldPct}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Actual Cost %:</span>
                    <span className={`font-mono font-black text-base ${
                      costPct > targetPct ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {costPct}%
                    </span>
                    <span className="text-[9px] text-slate-500 block">Margin: {grossMarginPct.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Ingredients summary */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                    <span>Komposisi Bahan Pengadaan:</span>
                    <span className="text-slate-500 font-mono">{recipe.ingredients.length} Item</span>
                  </div>
                  <div className="max-h-20 overflow-y-auto space-y-1 text-[11px] text-slate-300 pr-1">
                    {recipe.ingredients.map(ing => (
                      <div key={ing.id} className="flex items-center justify-between py-0.5 border-b border-slate-800/60">
                        <span className="truncate max-w-[150px] text-slate-300">{ing.itemName}</span>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">
                          {ing.quantity} {ing.unit} • {formatRupiah(ing.totalCost)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  onClick={() => handlePrintRecipeCard(recipe)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                  title="Cetak Standard Recipe Card"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Resep</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(recipe)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit Resep & Komposisi"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus resep "${recipe.recipeName}"?`)) {
                        onDeleteRecipe(recipe.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Hapus Resep"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Recipe Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-5 md:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 my-6 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingRecipeId ? 'Edit Resep Standar & Menu Engineering' : 'Tambah Resep Standar Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Perhitungan Harga Dasar (dikurangi 21% Tax & Service), Yield Loss Chef, dan Sinkronisasi Master Harga
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="space-y-4 text-xs">
              {/* Bagian 1: Data Resep Umum */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Nama Resep / Menu Standar *</label>
                  <input
                    type="text"
                    required
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="Contoh: Wagyu Tenderloin Steak with Ruteng Vegetables"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategori Menu</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Appetizer">Appetizer</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Banquet Package">Banquet Package</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Outlet Penjualan</label>
                  <select
                    value={outlet}
                    onChange={(e) => setOutlet(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="NUKA">NUKA BEACH CLUB</option>
                    <option value="MICE">MICE Banquet & Convention</option>
                    <option value="ALL">Semua Outlet GMCC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cost Center Pembebanan</label>
                  <select
                    value={costCenterName}
                    onChange={(e) => setCostCenterName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {costCenters.map(cc => (
                      <option key={cc.id} value={cc.name}>
                        {cc.name} ({cc.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Porsi Yield Resep (Pax)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={portions}
                    onChange={(e) => setPortions(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Bagian 2: Perhitungan Harga Jual, Tax & Service 21%, dan Harga Dasar Target Food Cost */}
              <div className="p-4 rounded-xl bg-slate-800/70 border border-cyan-800/60 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white uppercase text-[11px]">
                      Perhitungan Harga Jual: Tax & Service 21% &rarr; Harga Dasar GMCC
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    Standar Hospitality PB1 10% + Service 11%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Input 1: Harga Jual POS / Menu */}
                  <div>
                    <label className="block text-amber-300 font-bold mb-1">
                      Harga Jual Menu di POS (Gross IDR) *
                    </label>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      required
                      value={grossSellingPrice}
                      onChange={(e) => setGrossSellingPrice(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/50 text-amber-300 font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Harga di menu tamu (termasuk tax & service)</span>
                  </div>

                  {/* Input 2: Target Food Cost % */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Target Food Cost %</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="10"
                        max="60"
                        value={targetCostPercentage}
                        onChange={(e) => setTargetCostPercentage(parseInt(e.target.value) || 30)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Standar target ideal: 28% - 32%</span>
                  </div>

                  {/* Result 1: Tax & Service 21% Breakdown */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-rose-500/30 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-rose-300">Potongan Tax & Service (21%):</span>
                    <div className="font-mono text-base font-black text-rose-400">
                      -{formatRupiah(computedTaxAndServiceAmount)}
                    </div>
                    <span className="text-[9px] text-slate-400">10% PB1 Daerah + 11% Service</span>
                  </div>
                </div>

                {/* Harga Dasar Hasil Pengurangan & Target Plafon Biaya Makanan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-cyan-500/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-cyan-400 block">
                        HARGA DASAR BERSIH GMCC (Net of Tax & Service):
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Inilah basis perhitungan target food cost
                      </span>
                    </div>
                    <span className="font-mono text-base font-black text-cyan-300">
                      {formatRupiah(computedBaseSellingPrice)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                        TARGET PLAFON BIAYA MAKANAN (Max IDR):
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {targetCostPercentage}% &times; {formatRupiah(computedBaseSellingPrice)}
                      </span>
                    </div>
                    <span className="font-mono text-base font-black text-emerald-300">
                      {formatRupiah(computedTargetFoodCostAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bagian 3: Komposisi Bahan Baku (Ambil dari Daftar Harga) */}
              <div className="space-y-3 border border-slate-800 rounded-xl p-4 bg-slate-900/70">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Komposisi Bahan Baku (Ambil dari Daftar Harga)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Harga otomatis tersinkron dengan Master Item
                  </span>
                </div>

                {/* Ingredient Selector Row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/80">
                  <div className="sm:col-span-7">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Pilih Bahan Baku Pengadaan</label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                    >
                      {items.map(it => (
                        <option key={it.id} value={it.id}>
                          {it.name} ({it.unit}) • {formatRupiah(it.lastPurchasePrice || it.lastPrice || 0)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Kuantitas Resep (Qty)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={ingredientQty}
                      onChange={(e) => setIngredientQty(parseFloat(e.target.value) || 0.1)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddIngredient}
                      className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  </div>
                </div>

                {/* Table of selected ingredients */}
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-3 py-2">Bahan Baku</th>
                        <th className="px-3 py-2 text-center w-20">Satuan</th>
                        <th className="px-3 py-2 text-center w-24">Qty Resep</th>
                        <th className="px-3 py-2 text-right w-28">Harga Kontrak</th>
                        <th className="px-3 py-2 text-right w-32">Total Biaya</th>
                        <th className="px-2 py-2 text-center w-10">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {recipeIngredients.map((ing) => (
                        <tr key={ing.id} className="hover:bg-slate-800/40">
                          <td className="px-3 py-2 font-bold text-white">{ing.itemName}</td>
                          <td className="px-3 py-2 text-center font-mono text-slate-400">{ing.unit}</td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={ing.quantity}
                              onChange={(e) => handleUpdateIngredientQty(ing.id, parseFloat(e.target.value) || 0)}
                              className="w-16 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-mono text-center text-xs"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-slate-400">{formatRupiah(ing.unitCost)}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-cyan-300">{formatRupiah(ing.totalCost)}</td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(ing.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bagian 4: DIBAWAH BAHAN BAKU: Yield Loss / Penyusutan & Trimming (% Diisi Manual oleh Chef) */}
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-400" />
                      <div>
                        <span className="font-bold text-white text-xs">
                          Yield Loss / Cooking & Trimming Loss (% Diisi Manual oleh Chef)
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Penyusutan saat trimming lemak/tulang daging, kupas sayur, atau evaporasi masak
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-rose-300">Loss (%):</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={yieldLossPercent}
                        onChange={(e) => setYieldLossPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-20 px-2 py-1 rounded-lg bg-slate-900 border border-rose-500/50 text-white font-mono font-bold text-center text-xs focus:outline-none focus:border-rose-400"
                      />
                      <span className="text-xs text-rose-300 font-bold">%</span>
                    </div>
                  </div>

                  {/* Yield Loss Calculation Strip */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-rose-500/20 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Subtotal Bahan Mentah:</span>
                      <span className="font-mono font-bold text-slate-200">{formatRupiah(computedRawIngredientsCost)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-400 block">Nilai Susut / Loss (+{yieldLossPercent}%):</span>
                      <span className="font-mono font-bold text-rose-400">+{formatRupiah(computedYieldLossAmount)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Biaya Resep Efektif:</span>
                      <span className="font-mono font-black text-white">{formatRupiah(computedEffectiveRecipeCost)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-300 block font-semibold">Food Cost per Porsi:</span>
                      <span className="font-mono font-black text-amber-300 text-sm">{formatRupiah(computedPortionCost)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bagian 5: Real-time Live Financial Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950 border border-cyan-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Harga Dasar (Net 21%):</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">{formatRupiah(computedBaseSellingPrice)}</span>
                  <span className="text-[9px] text-slate-500 block">Gross: {formatRupiah(grossSellingPrice)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Food Cost Efektif:</span>
                  <span className="font-mono font-black text-amber-400 text-sm">{formatRupiah(computedPortionCost)}</span>
                  <span className="text-[9px] text-slate-500 block">Loss Chef: {yieldLossPercent}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Actual Food Cost %:</span>
                  <span className={`font-mono font-black text-base ${
                    computedFoodCostPct > targetCostPercentage ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {computedFoodCostPct}%
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    Target: {targetCostPercentage}% ({computedFoodCostPct <= targetCostPercentage ? 'Aman' : 'Over'})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Gross Profit / Porsi:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {formatRupiah(computedGrossProfit)}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Margin: {computedGrossProfitPct}%</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Catatan Resep / Standard Portioning</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instruksi preparasi, trimming loss, atau panduan penyajian..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Resep Standar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
