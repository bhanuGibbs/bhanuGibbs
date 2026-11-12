import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Package,
  FileText,
  Plus,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import Header from '../../components/Header';
import { useAuth } from '../../context/useAuth';
import { getPOSDashboard, getPOSInventory } from '../../integration/backend/posApi';

const formatMoney = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);

const POSDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await getPOSDashboard();
      setData(result);
    } catch (err) {
      console.error('Failed to load POS dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(() => {
      loadDashboard(true);
    }, 30000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <div className="flex items-center justify-center py-32">
          <p className="text-[#2D3748]/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="text-[#1E3A5F] font-medium">Failed to load dashboard</p>
          <p className="text-sm text-[#2D3748]/60">{error}</p>
          <button
            onClick={() => loadDashboard()}
            className="rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white shadow-cta hover:bg-[#e55a28]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Today's Revenue",
      value: formatMoney(data?.today_sales?.revenue || 0),
    },
    {
      label: 'Transactions',
      value: data?.today_sales?.transactions || 0,
    },
    {
      label: 'Total Products',
      value: data?.inventory?.total_products || 0,
    },
    {
      label: 'Low Stock',
      value: data?.inventory?.low_stock_count || 0,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1E3A5F]">POS Dashboard</h1>
            <p className="text-sm text-[#2D3748]/60 mt-1">
              {user?.company_name || 'Your Company'} — Sales overview
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="rounded-xl border border-[#1E3A5F]/10 bg-white px-3 py-2.5 text-sm font-semibold text-[#1E3A5F] hover:bg-[#1E3A5F]/5 disabled:opacity-50 flex items-center gap-2"
              title="Refresh dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              to="/pos/terminal"
              className="rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white shadow-cta hover:bg-[#e55a28] flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              New Sale
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-[#1E3A5F]/10 bg-white p-5 shadow-card-sm">
              <p className="text-sm text-[#2D3748]/60">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[#1E3A5F]">{stat.value}</p>
              </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="rounded-xl border border-[#1E3A5F]/10 bg-white p-5 shadow-card-sm">
            <h3 className="font-semibold text-[#1E3A5F] mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#FF6B35]" />
              Top Selling Products
            </h3>
            {data?.top_products?.length > 0 ? (
              <div className="space-y-3">
                {data.top_products.map((product, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[#1E3A5F]/5 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#1E3A5F]">{product.product_name}</p>
                      <p className="text-xs text-[#2D3748]/60">{product.quantity_sold} sold</p>
                    </div>
                    <span className="text-sm font-semibold text-[#FF6B35]">
                      {formatMoney(product.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#2D3748]/40 text-center py-8">No sales today</p>
            )}
          </div>

          {/* Payment Breakdown */}
          <div className="rounded-xl border border-[#1E3A5F]/10 bg-white p-5 shadow-card-sm">
            <h3 className="font-semibold text-[#1E3A5F] mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#1E3A5F]" />
              Payment Breakdown
            </h3>
            {data?.payment_breakdown?.length > 0 ? (
              <div className="space-y-3">
                {data.payment_breakdown.map((payment) => (
                  <div key={payment.method} className="flex items-center justify-between py-2 border-b border-[#1E3A5F]/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#FF6B35]" />
                      <span className="text-sm text-[#2D3748] capitalize">{payment.method}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#1E3A5F]">{formatMoney(payment.total)}</p>
                      <p className="text-xs text-[#2D3748]/60">{payment.count} transactions</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#2D3748]/40 text-center py-8">No payments today</p>
            )}
          </div>

          {/* Low Stock */}
          <div className="rounded-xl border border-[#1E3A5F]/10 bg-white p-5 shadow-card-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#1E3A5F] flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Low Stock Alert
              </h3>
              <Link to="/pos/inventory" className="inline-flex items-center gap-1 text-xs font-medium text-[#FF6B35] underline hover:text-[#e55a28]">
                Open inventory
              </Link>
            </div>
            {data?.low_stock_products?.length > 0 ? (
              <div className="space-y-2">
                {data.low_stock_products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between py-2 border-b border-[#1E3A5F]/5 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#1E3A5F]">{product.name}</p>
                      <p className="text-xs text-[#2D3748]/60">{product.sku}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                      {product.stock} / {product.threshold}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-green-600 text-center py-8">All products well stocked</p>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="rounded-xl border border-[#1E3A5F]/10 bg-white p-5 shadow-card-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#1E3A5F] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#1E3A5F]" />
                Recent Transactions
              </h3>
              <Link to="/pos/transactions" className="inline-flex items-center gap-1 text-xs font-medium text-[#FF6B35] underline hover:text-[#e55a28]">
                All transactions
              </Link>
            </div>
            {data?.recent_transactions?.length > 0 ? (
              <div className="space-y-2">
                {data.recent_transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[#1E3A5F]/5 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#1E3A5F]">{tx.transaction_number}</p>
                      <p className="text-xs text-[#2D3748]/60 capitalize">{tx.payment_method} · {new Date(tx.created_at).toLocaleTimeString()}</p>
                    </div>
                    <span className="text-sm font-semibold text-[#FF6B35]">
                      {formatMoney(tx.grand_total)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#2D3748]/40 text-center py-8">No transactions yet</p>
            )}
          </div>
        </div>

        {/* Inventory Summary */}
        <div className="rounded-xl border border-[#1E3A5F]/10 bg-white p-5 mt-6 shadow-card-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1E3A5F] flex items-center gap-2">
              <Package className="h-5 w-5 text-[#1E3A5F]" />
              Inventory Summary
            </h3>
            <Link to="/pos/inventory" className="inline-flex items-center gap-1 text-xs font-medium text-[#FF6B35] underline hover:text-[#e55a28]">
              Manage inventory
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg bg-[#1E3A5F]/5 p-4">
              <p className="text-xs text-[#2D3748]/60">Total Products</p>
              <p className="text-xl font-bold text-[#1E3A5F] mt-1">{data?.inventory?.total_products || 0}</p>
            </div>
            <div className="rounded-lg bg-[#1E3A5F]/5 p-4">
              <p className="text-xs text-[#2D3748]/60">Total Stock Items</p>
              <p className="text-xl font-bold text-[#1E3A5F] mt-1">{data?.inventory?.total_stock || 0}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-xs text-amber-600">Low Stock</p>
              <p className="text-xl font-bold text-amber-700 mt-1">{data?.inventory?.low_stock_count || 0}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-xs text-red-600">Out of Stock</p>
              <p className="text-xl font-bold text-red-700 mt-1">{data?.inventory?.out_of_stock || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSDashboard;
