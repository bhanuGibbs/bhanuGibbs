import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { searchMasterProducts, createTenantProduct } from '../integration/backend/posApi.js';

const MasterProductSearch = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockQty, setStockQty] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [importing, setImporting] = useState(false);

  const debouncedSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await searchMasterProducts(searchQuery, 0, 20);
      setResults(data.products || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, debouncedSearch]);

  const handleSelect = (product) => {
    setSelected(product);
    setSellingPrice('');
    setStockQty('0');
    setLowStockThreshold('5');
  };

  const handleImport = async () => {
    if (!selected || !sellingPrice) {
      toast.error('Please enter a selling price.');
      return;
    }
    setImporting(true);
    try {
      await createTenantProduct({
        master_product_id: selected.id,
        selling_price: parseFloat(sellingPrice),
        stock_qty: parseInt(stockQty, 10) || 0,
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
      });
      toast.success('Product imported successfully');
      if (onSelect) {
        onSelect(selected);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to import product');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Import from Product Catalog</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
            placeholder="Search by product name, SKU, or barcode..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
            autoFocus
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              Searching...
            </div>
          )}
        </div>

        {/* Results dropdown */}
        {!selected && results.length > 0 && (
          <div className="mb-4 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white">
            {results.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSelect(product)}
                className="w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-emerald-50 last:border-b-0"
              >
                <div className="text-sm font-medium text-slate-900">{product.product_name}</div>
                <div className="text-xs text-slate-500">
                  {product.sku && <span>SKU: {product.sku}</span>}
                  {product.sku && product.category && <span> · </span>}
                  {product.category && <span>{product.category}</span>}
                  {product.unit && <span> · {product.unit}</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        {!selected && !loading && query.length >= 2 && results.length === 0 && (
          <p className="mb-4 text-center text-sm text-slate-400">No products found.</p>
        )}

        {/* Selected product details */}
        {selected && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-base font-semibold text-slate-900">{selected.product_name}</h3>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {selected.sku && (
                  <div>
                    <span className="text-slate-500">SKU:</span>{' '}
                    <span className="text-slate-700">{selected.sku}</span>
                  </div>
                )}
                {selected.barcode && (
                  <div>
                    <span className="text-slate-500">Barcode:</span>{' '}
                    <span className="text-slate-700">{selected.barcode}</span>
                  </div>
                )}
                {selected.category && (
                  <div>
                    <span className="text-slate-500">Category:</span>{' '}
                    <span className="text-slate-700">{selected.category}</span>
                  </div>
                )}
                {selected.unit && (
                  <div>
                    <span className="text-slate-500">Unit:</span>{' '}
                    <span className="text-slate-700">{selected.unit}</span>
                  </div>
                )}
              </div>
              {selected.description && (
                <p className="mt-2 text-sm text-slate-500">{selected.description}</p>
              )}
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-3 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Selling Price *
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Stock Qty
                <input
                  type="number"
                  min="0"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Low Stock Alert
                <input
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  placeholder="5"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !sellingPrice}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {importing ? 'Importing...' : 'Import Product'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterProductSearch;
