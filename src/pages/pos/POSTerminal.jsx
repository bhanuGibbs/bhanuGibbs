import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Barcode,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  IndianRupee,
  Minus,
  Plus,
  QrCode,
  ScanLine,
  Search,
  ShoppingCart,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import Header from '../../components/Header';
import { useAuth } from '../../context/useAuth';
import toast from 'react-hot-toast';
import {
  checkoutPOS,
  getPOSCategories,
  getPOSProducts,
  lookupPOSProductByBarcode,
} from '../../integration/backend/posApi';

const formatMoney = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);

const DEFAULT_TAX_RATE = 18;

const POSTerminal = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState('0');
  const [showCheckout, setShowCheckout] = useState(false);
  const [taxRate, setTaxRate] = useState(DEFAULT_TAX_RATE);
  const barcodeRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Debounce search input to avoid excessive API calls
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [search]);

  // Load categories and products
  const loadData = useCallback(async () => {
    try {
      const [cats, prods] = await Promise.all([
        getPOSCategories(),
        getPOSProducts(selectedCategory, debouncedSearch),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      console.error('Failed to load POS data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep barcode input focused
  useEffect(() => {
    if (barcodeRef.current && !showCheckout) {
      barcodeRef.current.focus();
    }
  }, [cart, showCheckout]);

  // Add product to cart
  const addToCart = (product, variant = null) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product_id === product.id &&
          item.variant_id === (variant?.id || null)
      );
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id && item.variant_id === (variant?.id || null)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      const price = variant?.selling_price || product.selling_price;
      const itemTax = variant?.tax_rate ?? product.tax_rate ?? taxRate;
      return [
        ...prev,
        {
          product_id: product.id,
          variant_id: variant?.id || null,
          product_name: variant ? `${product.name} (${variant.name})` : product.name,
          sku: variant?.sku || product.sku,
          barcode: variant?.barcode || product.barcode,
          quantity: 1,
          unit_price: Number(price),
          unit: product.unit,
          discount: 0,
          tax: itemTax,
        },
      ];
    });
  };

  // Barcode scanner handler
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    try {
      const product = await lookupPOSProductByBarcode(code);
      if (product.stock_quantity <= 0) {
        toast.error(`${product.name} is out of stock`);
      } else {
        addToCart(product);
        toast.success(`${product.name} added to cart`);
      }
    } catch (err) {
      toast.error(`Product not found: ${code}`);
    }
    setBarcodeInput('');
  };

  // Update cart item quantity
  const updateQuantity = (index, delta) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = { ...item, quantity: newQty };
      return updated;
    });
  };

  // Remove item from cart
  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate totals with per-item tax rates
  const subtotal = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
  const discountAmount = Number(discount) || 0;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = cart.reduce((sum, item) => {
    const itemSubtotal = item.unit_price * item.quantity;
    // Proportionally apply discount to each item
    const itemAfterDiscount = subtotal > 0 ? (itemSubtotal / subtotal) * afterDiscount : itemSubtotal;
    return sum + (itemAfterDiscount * (item.tax || DEFAULT_TAX_RATE) / 100);
  }, 0);
  const grandTotal = afterDiscount + taxAmount;
  const averageTaxRate = afterDiscount > 0 ? (taxAmount / afterDiscount) * 100 : 0;

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setCheckoutLoading(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id || undefined,
          product_name: item.product_name,
          sku: item.sku,
          barcode: item.barcode,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          tax: item.tax,
        })),
        payment_method: paymentMethod,
        payment_amount: grandTotal,
        discount: discountAmount,
      };
      const result = await checkoutPOS(payload);
      toast.success(`Transaction ${result.transaction_number} completed!`);
      setCart([]);
      setDiscount('0');
      setShowCheckout(false);
      // Print receipt
      printReceipt(result);
    } catch (err) {
      toast.error(err.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Print receipt using hidden iframe to avoid popup blockers
  const printReceipt = (transaction) => {
    const itemsHtml = transaction.items
      .map(
        (item) => `
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span>${item.product_name} x${item.quantity}</span>
        <span>${formatMoney(item.line_total)}</span>
      </div>`
      )
      .join('');

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${transaction.transaction_number}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; width: 280px; }
          .center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; }
          @media print { body { width: auto; } }
        </style>
      </head>
      <body>
        <div class="center">
          <h3>${user?.company_name || 'Company'}</h3>
          <p>${user?.company_address || ''}</p>
          <p>GSTIN: ${user?.company_gstin || 'N/A'}</p>
        </div>
        <div class="divider"></div>
        <div class="row"><span>Receipt #</span><span>${transaction.transaction_number}</span></div>
        <div class="row"><span>Date</span><span>${new Date(transaction.created_at).toLocaleString()}</span></div>
        <div class="divider"></div>
        ${itemsHtml}
        <div class="divider"></div>
        <div class="row"><span>Subtotal</span><span>${formatMoney(transaction.subtotal)}</span></div>
        <div class="row"><span>Discount</span><span>-${formatMoney(transaction.discount)}</span></div>
        <div class="row"><span>Tax</span><span>${formatMoney(transaction.tax_amount)}</span></div>
        <div class="divider"></div>
        <div class="row" style="font-weight:bold;font-size:14px;"><span>TOTAL</span><span>${formatMoney(transaction.grand_total)}</span></div>
        <div class="row"><span>Payment</span><span>${transaction.payment_method.toUpperCase()}</span></div>
        <div class="divider"></div>
        <div class="center"><p>Thank you for your purchase!</p></div>
      </body>
      </html>
    `;

    // Try hidden iframe first to avoid popup blockers
    let iframe = document.getElementById('receipt-print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'receipt-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(receiptHtml);
    iframeDoc.close();

    // Wait for content to load, then print
    setTimeout(() => {
      try {
        iframe.contentWindow.print();
      } catch (e) {
        // Fallback to window.open if iframe print fails
        const fallbackWindow = window.open('', '_blank', 'width=300,height=500');
        if (fallbackWindow) {
          fallbackWindow.document.write(receiptHtml);
          fallbackWindow.document.write('<script>window.print();</script>');
          fallbackWindow.document.close();
        } else {
          toast.error('Popup blocked. Please allow popups for receipt printing.');
        }
      }
    }, 250);
  };

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: IndianRupee },
    { id: 'upi', label: 'UPI', icon: QrCode },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'other', label: 'Other', icon: Wallet },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">
        <Header />
        <div className="flex items-center justify-center py-32">
          <p className="text-slate-500">Loading POS terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header />
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left: Product Selection */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Barcode Scanner */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  ref={barcodeRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode or type to search..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Add
              </button>
            </form>
          </div>

          {/* Categories */}
          <div className="px-4 py-2 border-b border-slate-200 bg-white overflow-x-auto">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
                  !selectedCategory
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock_quantity <= 0}
                  className={`rounded-xl border p-4 text-left transition ${
                    product.stock_quantity <= 0
                      ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                  }`}
                >
                  <div className="font-semibold text-sm text-slate-900 truncate">
                    {product.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{product.sku}</div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-bold text-emerald-700">
                      {formatMoney(product.selling_price)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        product.stock_quantity <= 0
                          ? 'bg-rose-100 text-rose-700'
                          : product.stock_quantity <= product.low_stock_threshold
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {product.stock_quantity} {product.unit}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {products.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Barcode className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No products found</p>
                <Link
                  to="/pos/products"
                  className="text-sm text-emerald-600 hover:underline mt-2 inline-block"
                >
                  Add products
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-slate-600" />
              <h2 className="font-semibold text-slate-900">Cart</h2>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {cart.length}
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-rose-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 p-3 bg-slate-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">
                      {item.product_name}
                    </div>
                    <div className="text-xs text-slate-500">{item.sku}</div>
                    <div className="text-sm font-semibold text-emerald-700 mt-1">
                      {formatMoney(item.unit_price * item.quantity)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(index)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(index, -1)}
                      className="rounded-lg border border-slate-200 p-1 hover:bg-slate-100"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(index, 1)}
                      className="rounded-lg border border-slate-200 p-1 hover:bg-slate-100"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatMoney(item.unit_price)} / {item.unit}
                  </span>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Scan a barcode or select a product</p>
              </div>
            )}
          </div>

          {/* Totals & Checkout */}
          {cart.length > 0 && (
            <div className="border-t border-slate-200 p-4 space-y-3">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 items-center">
                  <span>Discount</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm"
                    min="0"
                  />
                </div>
                <div className="flex justify-between text-slate-600 items-center">
                  <span>Tax</span>
                  <div className="flex items-center gap-2">
                    <span>{formatMoney(taxAmount)}</span>
                    <span className="text-xs text-slate-400">({averageTaxRate.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="flex justify-between text-slate-600 items-center">
                  <span className="text-xs">Default Rate</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                      className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right text-xs"
                      min="0"
                      max="100"
                      step="0.5"
                      title="Default tax rate (%) for new cart items"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-lg text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span className="text-emerald-700">{formatMoney(grandTotal)}</span>
                </div>
              </div>

              {!showCheckout ? (
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Proceed to Checkout
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`rounded-lg p-2 text-center transition ${
                            paymentMethod === method.id
                              ? 'bg-emerald-100 border-2 border-emerald-500'
                              : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                          }`}
                        >
                          <Icon className={`h-5 w-5 mx-auto ${paymentMethod === method.id ? 'text-emerald-700' : 'text-slate-500'}`} />
                          <span className={`text-xs mt-1 block ${paymentMethod === method.id ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                            {method.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCheckout(false)}
                      className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCheckout}
                      disabled={checkoutLoading}
                      className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
                    >
                      {checkoutLoading ? 'Processing...' : 'Complete Sale'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POSTerminal;
