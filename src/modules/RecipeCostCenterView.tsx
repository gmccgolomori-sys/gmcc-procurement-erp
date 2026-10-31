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
  Building2
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
  const [sellingPrice, setSellingPrice] = useState(150000);
  const [targetCostPercentage, setTargetCostPercentage] = useState(30);
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
    const sumCostPct = recipes.reduce((acc, r) => acc + (r.foodCostPercentage || 0), 0);
    const avgCostPct = Number((sumCostPct / total).toFixed(1));
    const alertCount = recipes.filter(r => (r.foodCostPercentage || 0) > 35).length;
    const totalRevenuePotential = recipes.reduce((acc, r) => acc + (r.sellingPrice || 0), 0);
    return { total, avgCostPct, alertCount, totalRevenuePotential };
  }, [recipes]);

  // Handle open modal for new recipe
  const handleOpenAddModal = () => {
    setEditingRecipeId(null);
    setRecipeName('');
    setCategory('Main Course');
    setOutlet('NUKA');
    setPortions(1);
    setCostCenterName(costCenters[0]?.name || 'F&B Culinary Central Kitchen');
    setSellingPrice(150000);
    setTargetCostPercentage(30);
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
    setSellingPrice(r.sellingPrice);
    setTargetCostPercentage(r.targetCostPercentage || r.targetFoodCostPercent || 30);
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

  // Computed live numbers in form
  const computedRecipeTotalCost = useMemo(() => {
    return recipeIngredients.reduce((acc, ing) => acc + ing.totalCost, 0);
  }, [recipeIngredients]);

  const computedPortionCost = useMemo(() => {
    const validPortions = Math.max(1, Number(portions) || 1);
    return Math.round(computedRecipeTotalCost / validPortions);
  }, [computedRecipeTotalCost, portions]);

  const computedFoodCostPct = useMemo(() => {
    const price = Number(sellingPrice) || 0;
    if (price <= 0) return 0;
    return Number(((computedPortionCost / price) * 100).toFixed(1));
  }, [computedPortionCost, sellingPrice]);

  const computedStatus = useMemo((): 'HEALTHY' | 'WARNING' | 'ALERT' => {
    if (computedFoodCostPct <= 30) return 'HEALTHY';
    if (computedFoodCostPct <= 35) return 'WARNING';
    return 'ALERT';
  }, [computedFoodCostPct]);

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
      totalRecipeCost: computedRecipeTotalCost,
      portionCost: computedPortionCost,
      costPerPortion: computedPortionCost,
      sellingPrice: Number(sellingPrice) || 0,
      foodCostPercentage: computedFoodCostPct,
      actualFoodCostPercent: computedFoodCostPct,
      targetCostPercentage: Number(targetCostPercentage) || 30,
      targetFoodCostPercent: Number(targetCostPercentage) || 30,
      grossProfitPerPortion: Math.max(0, (Number(sellingPrice) || 0) - computedPortionCost),
      status: computedStatus,
      lastUpdated: nowStr,
      notes: notes.trim()
    };

    if (editingRecipeId) {
      onEditRecipe(record);
      alert(`Resep "${record.recipeName}" berhasil diperbarui!`);
    } else {
      onAddRecipe(record);
      alert(`Resep baru "${record.recipeName}" berhasil disimpan ke Recipe Cost Center!`);
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
                @page { size: A4 portrait; margin: 10mm 12mm; }
                * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                body { margin: 0; padding: 12px; color: #0f172a; font-size: 11px; }
                .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; }
                .box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; background: #f8fafc; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
                th, td { border: 1px solid #cbd5e1; padding: 5px 8px; font-size: 10px; }
                th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .sig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px; text-align: center; }
                .sig-box { border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px; min-height: 80px; display: flex; flex-direction: column; justify-content: space-between; }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <h2 style="margin: 0; font-size: 14px; text-transform: uppercase;">GOLO MORI CONVENTION CENTER</h2>
                  <div style="font-size: 10px; color: #475569;">Standard Recipe Costing & Menu Engineering Sheet</div>
                  <div style="font-size: 9px; color: #64748b;">Cost Center: ${recipe.costCenterName} • Outlet: ${recipe.outlet}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-weight: bold; font-size: 12px;">${recipe.recipeName}</div>
                  <div style="font-size: 9.5px; color: #64748b;">Kategori: ${recipe.category} • Porsi: ${recipe.portions} pax</div>
                </div>
              </div>

              <div class="box" style="display: flex; justify-content: space-between; font-size: 11px;">
                <div><strong>Harga Jual Menu:</strong> ${formatRupiah(recipe.sellingPrice)}</div>
                <div><strong>Food Cost / Porsi:</strong> ${formatRupiah(recipe.portionCost || recipe.costPerPortion || 0)}</div>
                <div><strong>Actual Food Cost %:</strong> <span style="font-weight: bold; color: ${(recipe.foodCostPercentage ?? recipe.actualFoodCostPercent ?? 0) > 35 ? '#b91c1c' : '#047857'};">${recipe.foodCostPercentage ?? recipe.actualFoodCostPercent ?? 0}%</span></div>
                <div><strong>Gross Margin:</strong> ${(100 - (recipe.foodCostPercentage ?? recipe.actualFoodCostPercent ?? 0)).toFixed(1)}%</div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th style="width: 25px;" class="text-center">No</th>
                    <th>Bahan Baku Pengadaan (Master Price List)</th>
                    <th class="text-center" style="width: 60px;">Satuan</th>
                    <th class="text-center" style="width: 60px;">Qty</th>
                    <th class="text-right" style="width: 100px;">Harga Kontrak</th>
                    <th class="text-right" style="width: 100px;">Total Biaya</th>
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
                    <td colspan="5" class="text-right">TOTAL FOOD COST PER RESEP (${recipe.portions} PORSI):</td>
                    <td class="text-right font-mono">${formatRupiah(recipe.totalRecipeCost)}</td>
                  </tr>
                  <tr style="background-color: #f1f5f9; font-weight: bold;">
                    <td colspan="5" class="text-right">FOOD COST PER PORSI:</td>
                    <td class="text-right font-mono" style="color: #0369a1;">${formatRupiah(recipe.portionCost)}</td>
                  </tr>
                </tfoot>
              </table>

              ${recipe.notes ? `<div style="font-size: 10px; color: #475569; margin-bottom: 12px;"><strong>Catatan Chef:</strong> ${recipe.notes}</div>` : ''}

              <div class="sig-grid">
                <div class="sig-box">
                  <div style="font-size: 8.5px; font-weight: bold; text-transform: uppercase;">Disusun (Executive Chef)</div>
                  <div style="height: 40px;"></div>
                  <div style="font-size: 9px; font-weight: bold; border-top: 1px solid #cbd5e1; padding-top: 2px;">Chef de Cuisine</div>
                </div>
                <div class="sig-box">
                  <div style="font-size: 8.5px; font-weight: bold; text-transform: uppercase;">Diverifikasi (Cost Controller)</div>
                  <div style="height: 40px;"></div>
                  <div style="font-size: 9px; font-weight: bold; border-top: 1px solid #cbd5e1; padding-top: 2px;">F&B Cost Controller</div>
                </div>
                <div class="sig-box">
                  <div style="font-size: 8.5px; font-weight: bold; text-transform: uppercase;">Disetujui (Dept Head Finance)</div>
                  <div style="height: 40px;"></div>
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
            Integrasi langsung dengan Master Item & Kontrak Harga Pengadaan GOLO MORI CONVENTION CENTER
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Resep Baru</span>
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
          <div className="text-[10px] text-slate-500">Nuka Resto & MICE Banquet</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rata-Rata Food Cost</span>
          </div>
          <div className={`text-2xl font-black font-mono ${kpiData.avgCostPct > 35 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {kpiData.avgCostPct}%
          </div>
          <div className="text-[10px] text-slate-500">Target Ideal: &le; 30.0%</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Alert High Cost (&gt;35%)</span>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">{kpiData.alertCount}</div>
          <div className="text-[10px] text-slate-500">Memerlukan penyesuaian harga / porsi</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span>Master Item Terhubung</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{items.length}</div>
          <div className="text-[10px] text-slate-500">Item Bahan Baku Terdaftar</div>
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
            placeholder="Cari nama resep, bahan, kategori..."
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
              Nuka Resto
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
                    {recipe.status === 'HEALTHY' || recipe.status === 'EXCELLENT' ? 'Ideal Cost' : recipe.status === 'WARNING' ? 'Warning' : 'High Alert'}
                  </span>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Harga Jual Menu:</span>
                    <span className="font-mono font-bold text-white text-sm">{formatRupiah(recipe.sellingPrice)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Food Cost / Porsi:</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">{formatRupiah(costPortion)}</span>
                  </div>
                  <div className="border-t border-slate-700/60 pt-1.5">
                    <span className="text-[10px] text-slate-400 block">Actual Cost %:</span>
                    <span className={`font-mono font-black text-sm ${
                      costPct > 35 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {costPct}%
                    </span>
                  </div>
                  <div className="border-t border-slate-700/60 pt-1.5">
                    <span className="text-[10px] text-slate-400 block">Gross Profit Margin:</span>
                    <span className="font-mono font-bold text-cyan-300 text-sm">{grossMarginPct.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Ingredients summary */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                    <span>Komposisi Bahan Pengadaan:</span>
                    <span className="text-slate-500 font-mono">{recipe.ingredients.length} Item</span>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-slate-300 pr-1">
                    {recipe.ingredients.map(ing => (
                      <div key={ing.id} className="flex items-center justify-between py-0.5 border-b border-slate-800/60">
                        <span className="truncate max-w-[160px] text-slate-300">{ing.itemName}</span>
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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-5 md:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 my-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingRecipeId ? 'Edit Resep & Menu Engineering' : 'Tambah Resep Standar Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Kalkulasi otomatis Food Cost & Margin dari Master Kontrak Harga Pengadaan
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
              {/* General Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Nama Resep / Menu *</label>
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
                    <option value="NUKA">Nuka Resto & Bar</option>
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
                  <label className="block text-slate-300 font-semibold mb-1">Yield / Porsi Resep</label>
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

              {/* Price & Target Cost */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700">
                <div>
                  <label className="block text-cyan-300 font-bold mb-1">Harga Jual Menu (IDR) *</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-cyan-600/50 text-cyan-300 font-mono font-bold text-sm focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] text-slate-400">Harga menu sebelum tax & service charge</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Food Cost %</label>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    value={targetCostPercentage}
                    onChange={(e) => setTargetCostPercentage(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400">Standar industri GMCC: 28% - 32%</span>
                </div>
              </div>

              {/* Ingredients Builder */}
              <div className="space-y-2 border border-slate-800 rounded-xl p-3.5 bg-slate-900/60">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Komposisi Bahan Baku (Ambil dari Daftar Harga)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Harga otomatis tersinkron dengan Master Item
                  </span>
                </div>

                {/* Ingredient Selector Row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 items-end bg-slate-800/60 p-2.5 rounded-xl">
                  <div className="sm:col-span-7">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Pilih Bahan Baku Pengadaan</label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                    >
                      {items.map(it => (
                        <option key={it.id} value={it.id}>
                          {it.name} ({it.unit}) • {formatRupiah(it.lastPurchasePrice || it.lastPrice || 0)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Kuantitas (Qty)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={ingredientQty}
                      onChange={(e) => setIngredientQty(parseFloat(e.target.value) || 0.1)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs"
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
                <div className="border border-slate-800 rounded-xl overflow-hidden mt-2">
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
              </div>

              {/* Real-time Summary Box */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950 border border-cyan-800/50 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Biaya Resep:</span>
                  <span className="font-mono font-bold text-white text-sm">{formatRupiah(computedRecipeTotalCost)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Food Cost / Porsi:</span>
                  <span className="font-mono font-black text-amber-400 text-sm">{formatRupiah(computedPortionCost)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Food Cost %:</span>
                  <span className={`font-mono font-black text-sm ${
                    computedFoodCostPct > 35 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {computedFoodCostPct}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Gross Profit / Porsi:</span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">
                    {formatRupiah(Math.max(0, sellingPrice - computedPortionCost))}
                  </span>
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
                  <span>Simpan Resep</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
