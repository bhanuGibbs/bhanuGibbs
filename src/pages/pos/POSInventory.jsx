import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle, Package, Plus, X } from 'lucide-react';
import Header from '../../components/Header';
import toast from 'react-hot-toast';
import { adjustPOSStock, getPOSInventory, getPOSInventoryLowStock, getPOSStockMovements, getPOSProducts } from '../../integration/backend/posApi';

const formatMoney = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(Number(value) || 0);

const POSInventory = () => {
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastAdjustment, setLastAdjustment] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ product_id: '', quantity: 1, notes: '' });

  const loadData = useCallback(async () => {
    try {
      const [sum, low, moves, prods] = await Promise.all([
        getPOSInventory(),
        getPOSInventoryLowStock(),
        getPOSStockMovements(null, 50),
        getPOSProducts(null, null),
      ]);
      setSummary(sum);
      setLowStock(low);
      setMovements(moves);
      setProducts(prods);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      const result = await adjustPOSStock({
        product_id: adjustForm.product_id,
        quantity: Number(adjustForm.quantity),
        notes: adjustForm.notes || undefined,
      });
      const product = products.find(p => p.id === adjustForm.product_id);
      setLastAdjustment({
        productName: product?.name || 'Product',
        quantity: Number(adjustForm.quantity),
        newStock: result?.stock_quantity,
      });
      setShowAdjust(false);
      setShowSuccess(true);
      setAdjustForm({ product_id: '', quantity: 1, notes: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to adjust stock');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">
        <Header />
        <div className="flex items-center justify-center py-32"><p className="text-slate-500">Loading inventory...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <button onClick={() => setShowAdjust(true)} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Adjust Stock
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total Products</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{summary?.total_products || 0}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total Stock</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{summary?.total_stock || 0}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Low Stock</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{summary?.low_stock_count || 0}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Out of Stock</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">{summary?.out_of_stock || 0}</p>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 mb-6">
            <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Low Stock Alert
            </h3>
            <div className="space-y-2">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-amber-200 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-amber-900">{p.name}</p>
                    <p className="text-xs text-amber-700">{p.sku}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-200 text-amber-900">
                    {p.stock_quantity} / {p.low_stock_threshold}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock Movements */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <h3 className="font-semibold text-slate-900 p-5 pb-3">Stock Movement History</h3>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Quantity</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Reference</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Notes</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 w-fit ${m.movement_type === 'in' ? 'bg-emerald-100 text-emerald-700' : m.movement_type === 'out' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                      {m.movement_type === 'in' ? <ArrowDown className="h-3 w-3" /> : m.movement_type === 'out' ? <ArrowUp className="h-3 w-3" /> : null}
                      {m.movement_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{m.quantity > 0 ? '+' : ''}{m.quantity}</td>
                  <td className="px-4 py-3 text-slate-600">{m.reference_type || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{m.notes || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{new Date(m.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400">No movements yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Adjust Stock Modal */}
        {showAdjust && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">Adjust Stock</h2>
                <button onClick={() => setShowAdjust(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleAdjust} className="p-4 space-y-3">
                <select required value={adjustForm.product_id} onChange={(e) => setAdjustForm({...adjustForm, product_id: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500">
                  <option value="">Select product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
                <input required type="number" value={adjustForm.quantity} onChange={(e) => setAdjustForm({...adjustForm, quantity: e.target.value})} placeholder="Quantity (+ to add, - to remove)" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
                <textarea value={adjustForm.notes} onChange={(e) => setAdjustForm({...adjustForm, notes: e.target.value})} placeholder="Notes (optional)" rows={2} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
                <button type="submit" className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700">Adjust Stock</button>
              </form>
            </div>
          </div>
        )}

        {/* Success Popup Modal */}
        {showSuccess && lastAdjustment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Stock Adjusted Successfully!</h3>
                <p className="text-sm text-slate-500 mb-4">The stock has been updated in your inventory.</p>
                
                <div className="bg-slate-50 rounded-xl p-4 mb-4 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Product</span>
                    <span className="font-medium text-slate-900">{lastAdjustment.productName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Quantity {lastAdjustment.quantity > 0 ? 'Added' : 'Removed'}</span>
                    <span className={`font-medium ${lastAdjustment.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {lastAdjustment.quantity > 0 ? '+' : ''}{lastAdjustment.quantity}
                    </span>
                  </div>
                  {lastAdjustment.newStock !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">New Stock Level</span>
                      <span className="font-bold text-slate-900">{lastAdjustment.newStock}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowSuccess(false)}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSInventory;
