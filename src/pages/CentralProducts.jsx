import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Upload,
  Edit,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Package,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import {
  listMasterProducts,
  createMasterProduct,
  updateMasterProduct,
  deactivateMasterProduct,
  importMasterProductsCsv,
  getMasterProductBusinessTypes,
} from '../integration/backend/posApi.js';

const VALID_BUSINESS_TYPES = [
  'Paint Store',
  'Grocery Store',
  'Hardware Store',
  'Electrical Store',
  'Medical Store',
  'Garments Store',
  'Mobile Store',
];

const emptyForm = {
  business_type: '',
  product_name: '',
  sku: '',
  barcode: '',
  category: '',
  unit: '',
  description: '',
};

const CentralProducts = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'Super Admin';
  const isAdminOrSuperAdmin = isSuperAdmin || user?.role === 'Admin';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterBusinessType, setFilterBusinessType] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMasterProducts(
        filterBusinessType || null,
        search || null,
        skip,
        limit,
        !showInactive
      );
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, filterBusinessType, skip, showInactive]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSkip(0);
    loadData();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditingId(product.id);
    setForm({
      business_type: product.business_type || '',
      product_name: product.product_name || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      category: product.category || '',
      unit: product.unit || '',
      description: product.description || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (!form.business_type || !form.product_name || !form.sku) {
        toast.error('Business Type, Product Name, and SKU are required.');
        return;
      }
      if (editingId) {
        await updateMasterProduct(editingId, form);
        toast.success('Product updated.');
      } else {
        await createMasterProduct(form);
        toast.success('Product created.');
      }
      closeForm();
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to save product.');
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!confirm(`Deactivate "${name}"? This product will be hidden from search results.`)) return;
    try {
      await deactivateMasterProduct(id);
      toast.success('Product deactivated.');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate product.');
    }
  };

  const handleCsvImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file.');
      return;
    }
    setImporting(true);
    try {
      const result = await importMasterProductsCsv(file);
      toast.success(
        `Import complete: ${result.created || 0} created, ${result.updated || 0} updated, ${result.errors || 0} errors.`
      );
      setShowImportModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Import failed.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const header = 'business_type,product_name,sku,barcode,category,unit,description';
    const example = 'Paint Store,Asian Paints Royale 1L,PAINT-001,8901234567890,Paints,Liter,Interior emulsion paint';
    const csv = [header, example].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'master_products_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / limit);

  if (!isAdminOrSuperAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold text-[#1E3A5F]">Access Denied</h2>
          <p className="text-sm text-[#2D3748]/60 mt-2">Only Admin and Super Admin can manage the Central Product Repository.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Central Product Repository</h1>
          <p className="text-sm text-[#2D3748]/60 mt-1">Manage master products available for POS users to import.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 rounded-xl border border-[#1E3A5F]/10 px-4 py-2.5 text-sm font-medium text-[#1E3A5F] hover:bg-[#1E3A5F]/5 transition"
          >
            <Upload size={16} />
            Import CSV
          </button>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 rounded-xl bg-[#1E3A5F] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#1E3A5F]/90 transition"
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-[#1E3A5F]/10 bg-white p-4 shadow-card-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2D3748]/40" />
            <input
              type="text"
              placeholder="Search by name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#1E3A5F]/10 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2D3748]/40" />
            <select
              value={filterBusinessType}
              onChange={(e) => { setFilterBusinessType(e.target.value); setSkip(0); }}
              className="rounded-xl border border-[#1E3A5F]/10 pl-10 pr-8 py-2.5 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 appearance-none bg-white"
            >
              <option value="">All Business Types</option>
              {VALID_BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#2D3748]/60 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => { setShowInactive(e.target.checked); setSkip(0); }}
              className="rounded border-[#1E3A5F]/20 text-[#FF6B35] focus:ring-[#FF6B35]"
            />
            Show inactive
          </label>
          <button
            type="submit"
            className="rounded-xl bg-[#1E3A5F] text-white px-6 py-2.5 text-sm font-medium hover:bg-[#1E3A5F]/90 transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-[#1E3A5F]/10 bg-white shadow-card-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#2D3748]/60">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="mx-auto text-[#2D3748]/20 mb-3" />
            <p className="text-sm text-[#2D3748]/60">No products found. Add your first product to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E3A5F]/10 bg-[#1E3A5F]/5">
                  <th className="text-left px-4 py-3 font-semibold text-[#1E3A5F]">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1E3A5F]">SKU</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1E3A5F]">Business Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1E3A5F]">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1E3A5F]">Unit</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1E3A5F]">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#1E3A5F]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-[#1E3A5F]/5 hover:bg-[#1E3A5F]/3 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[#1E3A5F]">{product.product_name}</p>
                        {product.description && (
                          <p className="text-xs text-[#2D3748]/50 truncate max-w-[200px]">{product.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#2D3748]">{product.sku}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-[#1E3A5F]/10 px-2.5 py-0.5 text-xs font-medium text-[#1E3A5F]">
                        {product.business_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#2D3748]">{product.category || '-'}</td>
                    <td className="px-4 py-3 text-[#2D3748]">{product.unit || '-'}</td>
                    <td className="px-4 py-3">
                      {product.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          <Check size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                          <X size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditForm(product)}
                          className="rounded-lg p-2 text-[#2D3748]/40 hover:text-[#1E3A5F] hover:bg-[#1E3A5F]/5 transition"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        {product.is_active && (
                          <button
                            onClick={() => handleDeactivate(product.id, product.product_name)}
                            className="rounded-lg p-2 text-[#2D3748]/40 hover:text-red-600 hover:bg-red-50 transition"
                            title="Deactivate"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1E3A5F]/10">
            <p className="text-xs text-[#2D3748]/60">
              Showing {skip + 1}–{Math.min(skip + limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSkip((s) => Math.max(0, s - limit))}
                disabled={skip === 0}
                className="rounded-lg p-2 text-[#2D3748]/40 hover:text-[#1E3A5F] disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setSkip((s) => s + limit)}
                disabled={skip + limit >= total}
                className="rounded-lg p-2 text-[#2D3748]/40 hover:text-[#1E3A5F] disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={closeForm} className="rounded-lg p-2 hover:bg-gray-100 transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E3A5F] mb-1">Business Type *</label>
                <select
                  name="business_type"
                  value={form.business_type}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-lg border border-[#1E3A5F]/10 px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">Select business type</option>
                  {VALID_BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E3A5F] mb-1">Product Name *</label>
                <input
                  name="product_name"
                  value={form.product_name}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Asian Paints Royale Shine 1L"
                  className="w-full rounded-lg border border-[#1E3A5F]/10 px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1E3A5F] mb-1">SKU *</label>
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. PAINT-001"
                    className="w-full rounded-lg border border-[#1E3A5F]/10 px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E3A5F] mb-1">Barcode</label>
                  <input
                    name="barcode"
                    value={form.barcode}
                    onChange={handleFormChange}
                    placeholder="e.g. 8901234567890"
                    className="w-full rounded-lg border border-[#1E3A5F]/10 px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1E3A5F] mb-1">Category</label>
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    placeholder="e.g. Paints"
                    className="w-full rounded-lg border border-[#1E3A5F]/10 px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E3A5F] mb-1">Unit</label>
                  <input
                    name="unit"
                    value={form.unit}
                    onChange={handleFormChange}
                    placeholder="e.g. Liter, Kg, Piece"
                    className="w-full rounded-lg border border-[#1E3A5F]/10 px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E3A5F] mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Brief product description..."
                  className="w-full rounded-lg border border-[#1E3A5F]/10 px-3 py-2.5 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-[#1E3A5F]/10 px-5 py-2.5 text-sm font-medium text-[#1E3A5F] hover:bg-[#1E3A5F]/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#1E3A5F] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#1E3A5F]/90 transition"
                >
                  {editingId ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Import Products from CSV</h2>
              <button onClick={() => setShowImportModal(false)} className="rounded-lg p-2 hover:bg-gray-100 transition">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-medium mb-2">CSV Format:</p>
                <code className="text-xs block bg-white rounded p-2 mb-2">
                  business_type,product_name,sku,barcode,category,unit,description
                </code>
                <p className="text-xs text-blue-600">
                  If SKU exists → Update product<br />
                  If SKU doesn't exist → Create new product
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full rounded-xl border border-[#1E3A5F]/10 px-4 py-3 text-sm font-medium text-[#1E3A5F] hover:bg-[#1E3A5F]/5 transition flex items-center justify-center gap-2"
              >
                <DownloadIcon size={16} />
                Download CSV Template
              </button>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvImport}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="w-full rounded-xl bg-[#1E3A5F] text-white px-4 py-3 text-sm font-medium hover:bg-[#1E3A5F]/90 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {importing ? (
                    <>Importing...</>
                  ) : (
                    <>
                      <Upload size={16} />
                      Select CSV File
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function DownloadIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export default CentralProducts;
