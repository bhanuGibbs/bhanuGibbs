import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import Header from './Header';
import { useAuth } from '../context/useAuth';
import { buildBackendQuotationPayload, createChallanProduct, getChallanProducts, submitQuotationToBackend } from '../integration/backend/api';
import { calculateSummary } from '../utils/calculations';
import { decimalOnly, digitsOnly, nameOnly, NAME_REGEX, PHONE_NUMBER_REGEX, GSTIN_REGEX, preventPaste } from '../utils/numericInput';
import { Plus, Trash2 } from 'lucide-react';

const inputClass =
  'block min-w-0 w-full max-w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const labelClass = 'mb-2 block text-sm font-medium text-slate-700';

const defaultChallanValues = {
  company: {
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    gstin: '',
    logoData: '',
    sealData: '',
  },
  consignor: {
    name: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    mNo: '',
    co: '',
  },
  consignee: {
    name: '',
    code: '',
    place: '',
    contactNo: '',
    gst: '',
    deliveredTo: '',
  },
  challan: {
    dcNumber: '',
    date: dayjs().format('YYYY-MM-DD'),
    seedLicenseNo: '',
    truckNo: '',
    lrNo: '',
    wayBillNo: '',
    carrier: '',
    freightAmount: 0,
    dateOfDespatch: dayjs().format('YYYY-MM-DD'),
    notes: '',
  },
  items: [],
  shipping: 0,
  signature: { image: '', preview: '' },
};

const DeliveryChallanForm = () => {
  const { user, logout } = useAuth();
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const downloadInProgress = useRef(false);

  // Challan product catalog state
  const [challanProducts, setChallanProducts] = useState([]);
  const [challanProductsLoading, setChallanProductsLoading] = useState(false);
  const [challanProductsError, setChallanProductsError] = useState('');
  const [savingChallanProductId, setSavingChallanProductId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);

  // Fetch challan products on mount
  useEffect(() => {
    let cancelled = false;
    const loadChallanProducts = async () => {
      setChallanProductsLoading(true);
      setChallanProductsError('');
      try {
        const data = await getChallanProducts();
        if (!cancelled) {
          setChallanProducts(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setChallanProductsError(err.message || 'Unable to load challan products');
        }
      } finally {
        if (!cancelled) {
          setChallanProductsLoading(false);
        }
      }
    };
    loadChallanProducts();
    return () => { cancelled = true; };
  }, []);

  // Filter challan products by search query
  const filteredChallanProducts = useMemo(() => {
    if (!searchQuery.trim()) return challanProducts;
    const q = searchQuery.trim().toLowerCase();
    return challanProducts.filter((p) =>
      p.crop?.toLowerCase().includes(q) ||
      p.variety?.toLowerCase().includes(q) ||
      p.lot_no?.toLowerCase().includes(q)
    );
  }, [challanProducts, searchQuery]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: defaultChallanValues,
  });

  const items = watch('items') || [];
  const shipping = watch('shipping') || 0;

  // Auto-fill company details from user profile
  useEffect(() => {
    if (!user?.company_id) return;
    setValue('company.name', user.company_name || '');
    setValue('company.address', user.company_address || '');
    setValue('company.phone', user.company_phone_number || user.mobile_number || '');
    setValue('company.email', user.company_email || user.email || '');
    setValue('company.website', user.company_website || '');
    setValue('company.gstin', user.company_gstin || '');
    setValue('company.logoData', user.company_logo_data || '');
    setValue('company.sealData', user.company_seal_data || '');
    // Also fill consignor with company details by default
    setValue('consignor.name', user.company_name || '');
    setValue('consignor.address', user.company_address || '');
    setValue('consignor.phone', user.company_phone_number || user.mobile_number || '');
    setValue('consignor.email', user.company_email || user.email || '');
    setValue('consignor.gstin', user.company_gstin || '');
  }, [user, setValue]);

  const addItem = () => {
    const newItem = {
      id: uuidv4(),
      catalogProductId: null,
      crop: '',
      variety: '',
      seedClass: '',
      lotNo: '',
      unitSize: '',
      unitPerSackBox: '',
      sackBox: '',
      qtyKgs: 0,
      value: 0,
    };
    setValue('items', [...(items || []), newItem]);
  };

  // Select a challan product and auto-fill the item fields
  const selectChallanProduct = (index, product) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      catalogProductId: product.id,
      crop: product.crop || '',
      variety: product.variety || '',
      seedClass: product.seed_class || '',
      lotNo: product.lot_no || '',
      unitSize: product.unit_size || '',
      unitPerSackBox: product.unit_per_sack_box || '',
      sackBox: product.sack_box || '',
      value: Number(product.value) || 0,
    };
    setValue('items', updatedItems);
    setSearchQuery('');
    setActiveSearchIndex(null);
  };

  // Save a manually entered item to the challan product catalog
  const saveChallanProduct = async (index, item) => {
    setSavingChallanProductId(item.id);
    try {
      const payload = {
        crop: item.crop || '',
        variety: item.variety || null,
        seed_class: item.seedClass || null,
        lot_no: item.lotNo || null,
        unit_size: item.unitSize || null,
        unit_per_sack_box: item.unitPerSackBox ? Number(item.unitPerSackBox) : null,
        sack_box: item.sackBox ? Number(item.sackBox) : null,
        value: Number(item.value) || 0,
      };
      const created = await createChallanProduct(payload);
      const updatedItems = [...items];
      updatedItems[index] = { ...updatedItems[index], catalogProductId: created.id };
      setValue('items', updatedItems);
      setChallanProducts((current) => [created, ...current]);
      toast.success('Item saved to challan product catalog');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Unable to save to product catalog');
    } finally {
      setSavingChallanProductId('');
    }
  };

  const openProductSearch = (index) => {
    setActiveSearchIndex(index);
    setSearchQuery('');
  };

  const removeItem = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setValue('items', updatedItems);
  };

  const calculateItemValue = (item) => {
    return Number(item.qtyKgs || 0) * Number(item.value || 0);
  };

  const validateChallan = (data) => {
    if (!data.consignee?.name?.trim()) {
      toast.error('Enter the consignee name before saving this challan.');
      return false;
    }
    if (!data.items?.length) {
      toast.error('Add at least one line item before saving this challan.');
      return false;
    }
    const invalidItem = data.items.some((item) =>
      !item.crop?.trim() ||
      Number(item.qtyKgs) < 1 ||
      Number(item.value) <= 0,
    );
    if (invalidItem) {
      toast.error('Complete each item with a crop name, positive quantity, and price.');
      return false;
    }
    return true;
  };

  const buildChallanData = (data) => {
    const summary = calculateSummary(
      data.items.map((item) => ({
        itemName: `${item.crop} ${item.variety}`.trim() || item.crop,
        quantity: Number(item.qtyKgs || 0),
        rate: Number(item.value || 0),
        discount: 0,
        gst: 0,
      })),
      data.shipping,
    );
    return {
      ...data,
      generatedAt: dayjs().format('MMMM D, YYYY'),
      summary,
      documentType: 'delivery_challan',
      quotation: {
        quotationNumber: data.challan?.dcNumber || '',
        quotationDate: data.challan?.date || dayjs().format('YYYY-MM-DD'),
        currency: 'INR',
        terms: data.challan?.notes || '',
        authorizedPerson: user?.username || user?.name || '',
      },
      customer: {
        name: data.consignee?.name || '',
        address: data.consignee?.place || '',
        phone: data.consignee?.contactNo || '',
        gstNumber: data.consignee?.gst || '',
      },
      items: data.items.map((item) => ({
        // Preserve original fields for PDF rendering
        crop: item.crop || '',
        variety: item.variety || '',
        seedClass: item.seedClass || '',
        lotNo: item.lotNo || '',
        unitSize: item.unitSize || '',
        unitPerSackBox: item.unitPerSackBox || '',
        sackBox: item.sackBox || '',
        qtyKgs: Number(item.qtyKgs || 0),
        value: Number(item.value || 0),
        // Transformed fields for backend compatibility
        itemName: `${item.crop} ${item.variety}`.trim() || item.crop,
        description: `Class: ${item.seedClass || '-'}, Lot: ${item.lotNo || '-'}`,
        quantity: Number(item.qtyKgs || 0),
        rate: Number(item.value || 0),
        discount: 0,
        gst: 0,
      })),
    };
  };

  const handleDownload = async (data) => {
    if (!validateChallan(data)) return;
    if (downloadInProgress.current) return;
    downloadInProgress.current = true;
    const documentData = buildChallanData(data);
    let phase = 'saving the delivery challan';

    try {
      // Build backend payload using existing API
      const payload = buildBackendQuotationPayload({
        ...documentData,
        documentType: 'delivery_challan',
        quotation: {
          ...documentData.quotation,
          quotationNumber: documentData.quotation.quotationNumber,
          quotationDate: documentData.quotation.quotationDate,
          terms: documentData.quotation.terms,
        },
        items: documentData.items,
        customer: documentData.customer,
        shipping: documentData.shipping,
      });
      payload.title = 'Delivery Challan';
      payload.description = documentData.challan?.notes || null;

      // Submit to backend
      const { authenticatedFetch, getAuthorizedHeaders } = await import('../integration/backend/auth.js');
      const API_BASE = import.meta.env?.VITE_API_BASE || '/api';
      const response = await authenticatedFetch(`${API_BASE}/quotations/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthorizedHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Unable to submit delivery challan');
      }

      const finalDocument = await response.json();
      const updatedDocumentData = {
        ...documentData,
        challan: {
          ...documentData.challan,
          dcNumber: finalDocument.quotation_number || finalDocument.reference_number || documentData.challan?.dcNumber || '',
        },
      };

      phase = 'generating the delivery challan PDF';
      const blob = await createDeliveryChallanPdfBlob(updatedDocumentData);
      const url = URL.createObjectURL(blob);
      downloadPdfUrl(url, `${updatedDocumentData.challan.dcNumber || 'Delivery_Challan'}.pdf`);
      setPdfUrl(url);
      setPdfData(updatedDocumentData);
      setShowPdfPreview(true);
      toast.success('Delivery challan saved and downloaded.');
    } catch (error) {
      console.error(error);
      toast.error(`Could not complete ${phase}: ${error.message || 'Please try again.'}`);
    } finally {
      downloadInProgress.current = false;
    }
  };

  const handleReset = () => {
    reset({
      ...defaultChallanValues,
      company: {
        ...defaultChallanValues.company,
        name: user?.company_name || '',
        address: user?.company_address || '',
        phone: user?.company_phone_number || user?.mobile_number || '',
        email: user?.company_email || user?.email || '',
        website: user?.company_website || '',
        gstin: user?.company_gstin || '',
        logoData: user?.company_logo_data || '',
        sealData: user?.company_seal_data || '',
      },
      consignor: {
        name: user?.company_name || '',
        address: user?.company_address || '',
        phone: user?.company_phone_number || user?.mobile_number || '',
        email: user?.company_email || user?.email || '',
        gstin: user?.company_gstin || '',
      },
    });
    setPdfData(null);
    setPdfUrl('');
    setShowPdfPreview(false);
    toast.success('Form reset');
  };

  const downloadPdf = () => handleSubmit(handleDownload)();

  useEffect(() => {
    if (!pdfData) return;
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, [pdfData]);

  useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl],
  );

  const summary = calculateSummary(
    items.map((item) => ({
      itemName: `${item.crop} ${item.variety}`.trim() || item.crop,
      quantity: Number(item.qtyKgs || 0),
      rate: Number(item.value || 0),
      discount: 0,
      gst: 0,
    })),
    shipping,
  );

  return (
    <div className="create-doc-page min-h-screen bg-[#f7f8fa] text-slate-900">
      <style>{`
        .create-doc-page ::selection { background: #d1fae5; color: #065f46; }
        .create-doc-page ::-moz-selection { background: #d1fae5; color: #065f46; }
        .create-doc-page ::-webkit-scrollbar { width: 8px; height: 8px; }
        .create-doc-page ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .create-doc-page ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .create-doc-page ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      <Header
        onDownloadPdf={downloadPdf}
        onReset={handleReset}
        onLogout={logout}
        isSubmitting={isSubmitting}
        user={user}
      />

      <main className="create-doc-page mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <form onSubmit={handleSubmit(handleDownload)} className="space-y-6">

          {/* Consignor Details */}
          <section className="rounded-lg border border-slate-200/60 bg-white p-5 sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><path d="M2 10h20"/><path d="M2 18h20"/></svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Consignor Details</h2>
                <p className="mt-1 text-sm text-slate-500">Sender information — auto-filled from your company profile.</p>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>Name</label>
                <input className={inputClass} {...register('consignor.name')} />
              </div>
              <div>
                <label className={labelClass}>GSTIN</label>
                <input className={inputClass} {...register('consignor.gstin')} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Address</label>
                <textarea rows="2" className={inputClass} {...register('consignor.address')} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input className={inputClass} {...register('consignor.phone')} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input className={inputClass} {...register('consignor.email')} />
              </div>
              <div>
                <label className={labelClass}>M.No.</label>
                <input className={inputClass} {...register('consignor.mNo')} />
              </div>
              <div>
                <label className={labelClass}>C/o</label>
                <input className={inputClass} {...register('consignor.co')} />
              </div>
            </div>
          </section>

          {/* Consignee Details */}
          <section className="rounded-lg border border-slate-200/60 bg-white p-5 sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Consignee Details</h2>
                <p className="mt-1 text-sm text-slate-500">Recipient information for the delivery.</p>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Name<span className="text-red-500">*</span>
                </label>
                <input className={inputClass} {...register('consignee.name', {
                  pattern: { value: NAME_REGEX, message: 'Please enter only alphabetic characters' },
                  onChange: (event) => { event.target.value = nameOnly(event.target.value); }
                })} />
                {errors.consignee?.name && <p className="mt-1 text-sm text-rose-500">{errors.consignee.name.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Code</label>
                <input className={inputClass} {...register('consignee.code')} />
              </div>
              <div>
                <label className={labelClass}>Place</label>
                <input className={inputClass} {...register('consignee.place')} />
              </div>
              <div>
                <label className={labelClass}>Contact No.</label>
                <input className={inputClass} inputMode="numeric" maxLength={10} onPaste={preventPaste} {...register('consignee.contactNo', {
                  pattern: { value: PHONE_NUMBER_REGEX, message: 'Enter a 10-digit mobile number' },
                  onChange: (event) => { event.target.value = digitsOnly(event.target.value, 10); }
                })} />
                {errors.consignee?.contactNo && <p className="mt-1 text-sm text-rose-500">{errors.consignee.contactNo.message}</p>}
              </div>
              <div>
                <label className={labelClass}>GST</label>
                <input className={inputClass} maxLength={15} {...register('consignee.gst', {
                  pattern: { value: GSTIN_REGEX, message: 'Enter a valid GSTIN' }
                })} />
                {errors.consignee?.gst && <p className="mt-1 text-sm text-rose-500">{errors.consignee.gst.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Delivered To</label>
                <input className={inputClass} {...register('consignee.deliveredTo')} />
              </div>
            </div>
          </section>

          {/* Challan Header Details */}
          <section className="rounded-lg border border-slate-200/60 bg-white p-5 sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Challan Details</h2>
                <p className="mt-1 text-sm text-slate-500">DC number, date, and transport information.</p>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>DC Number</label>
                <input className={inputClass} readOnly value="Auto generated" />
                <p className="mt-2 text-xs text-slate-500">Assigned when finalized, for example DC-09082026-001</p>
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input type="date" className={inputClass} {...register('challan.date')} />
              </div>
              <div>
                <label className={labelClass}>Seed License No</label>
                <input className={inputClass} {...register('challan.seedLicenseNo')} />
              </div>
              <div>
                <label className={labelClass}>Date of Despatch</label>
                <input type="date" className={inputClass} {...register('challan.dateOfDespatch')} />
              </div>
              <div>
                <label className={labelClass}>Truck No</label>
                <input className={inputClass} {...register('challan.truckNo')} />
              </div>
              <div>
                <label className={labelClass}>L.R. No</label>
                <input className={inputClass} {...register('challan.lrNo')} />
              </div>
              <div>
                <label className={labelClass}>Way Bill No</label>
                <input className={inputClass} {...register('challan.wayBillNo')} />
              </div>
              <div>
                <label className={labelClass}>Carrier</label>
                <input className={inputClass} {...register('challan.carrier')} />
              </div>
              <div>
                <label className={labelClass}>Freight Amount (₹)</label>
                <input type="number" min="0" step="0.01" inputMode="decimal" className={inputClass} {...register('challan.freightAmount', { valueAsNumber: true, min: 0 })} />
              </div>
            </div>
          </section>

          {/* Item Table */}
          <section className="rounded-lg border border-slate-200/60 bg-white p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Items</h2>
                <p className="text-sm text-slate-500">Agriculture-specific item details for the delivery challan.</p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            {challanProductsError && (
              <div role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {challanProductsError}
              </div>
            )}
            <div className="relative min-w-0 overflow-visible">
              <table className="item-entry-table min-w-0 w-full border-separate border-spacing-y-3 xl:min-w-[1280px]">
                <thead>
                  <tr className="text-left text-sm font-semibold text-slate-600">
                    <th className="px-2 py-2">Product</th>
                    <th className="px-2 py-2">Crop</th>
                    <th className="px-2 py-2">Variety</th>
                    <th className="px-2 py-2">Seed Class</th>
                    <th className="px-2 py-2">Lot No</th>
                    <th className="px-2 py-2">Unit Size</th>
                    <th className="px-2 py-2">Unit/Sack</th>
                    <th className="px-2 py-2">Sack/Box</th>
                    <th className="px-2 py-2">Qty (Kgs)</th>
                    <th className="px-2 py-2">Value (₹)</th>
                    <th className="px-2 py-2">Amount</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const amount = calculateItemValue(item);
                    const isActive = activeSearchIndex === index;
                    const selectedProduct = challanProducts.find((p) => p.id === item.catalogProductId);
                    return (
                      <tr key={item.id} className="item-entry-row rounded-lg bg-slate-50/70">
                        {/* Product Search Column */}
                        <td data-label="Product" className="rounded-l-2xl px-2 py-3 align-top">
                          <div className="relative">
                            {item.catalogProductId ? (
                              <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm">
                                <span className="truncate font-medium text-emerald-800">{selectedProduct?.crop || item.crop}</span>
                                <button
                                  type="button"
                                  onClick={() => openProductSearch(index)}
                                  className="shrink-0 text-emerald-600 hover:text-emerald-800"
                                  title="Change product"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openProductSearch(index)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-400 transition hover:border-emerald-400"
                              >
                                {challanProductsLoading ? 'Loading...' : 'Select product...'}
                              </button>
                            )}
                            {isActive && (
                              <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                                <input
                                  type="text"
                                  className="mb-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                  placeholder="Search by crop, variety, lot no..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                />
                                <div className="max-h-48 overflow-y-auto">
                                  {filteredChallanProducts.length === 0 ? (
                                    <p className="px-3 py-2 text-xs text-slate-400">No matching products</p>
                                  ) : (
                                    filteredChallanProducts.map((product) => (
                                      <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => selectChallanProduct(index, product)}
                                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-emerald-50"
                                      >
                                        <div>
                                          <span className="font-medium text-slate-800">{product.crop}</span>
                                          {product.variety && <span className="ml-1 text-slate-500">({product.variety})</span>}
                                        </div>
                                        <span className="text-xs text-slate-500">₹{Number(product.value).toFixed(2)}/kg</span>
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td data-label="Crop" className="px-2 py-3 align-top">
                          <input className={inputClass} placeholder="e.g. Rice" {...register(`items.${index}.crop`)} />
                        </td>
                        <td data-label="Variety" className="px-2 py-3 align-top">
                          <input className={inputClass} placeholder="e.g. IR-64" {...register(`items.${index}.variety`)} />
                        </td>
                        <td data-label="Seed Class" className="px-2 py-3 align-top">
                          <input className={inputClass} placeholder="seed class" {...register(`items.${index}.seedClass`)} />
                        </td>
                        <td data-label="Lot No" className="px-2 py-3 align-top">
                          <input className={inputClass} placeholder="Lot No" {...register(`items.${index}.lotNo`)} />
                        </td>
                        <td data-label="Unit Size" className="px-2 py-3 align-top">
                          <input className={inputClass} placeholder="e.g. 1 Kg" {...register(`items.${index}.unitSize`)} />
                        </td>
                        <td data-label="Unit/Sack" className="px-2 py-3 align-top">
                          <input type="number" min="1" inputMode="numeric" className={inputClass} {...register(`items.${index}.unitPerSackBox`, { valueAsNumber: true })} />
                        </td>
                        <td data-label="Sack/Box" className="px-2 py-3 align-top">
                          <input type="number" min="1" inputMode="numeric" className={inputClass} {...register(`items.${index}.sackBox`, { valueAsNumber: true })} />
                        </td>
                        <td data-label="Qty (Kgs)" className="px-2 py-3 align-top">
                          <input type="number" min="1" inputMode="numeric" className={inputClass} {...register(`items.${index}.qtyKgs`, { valueAsNumber: true, min: 1 })} />
                        </td>
                        <td data-label="Value (₹)" className="px-2 py-3 align-top">
                          <input type="number" min="0" step="0.01" inputMode="decimal" className={inputClass} {...register(`items.${index}.value`, { valueAsNumber: true, min: 0 })} />
                        </td>
                        <td data-label="Amount" className="px-2 py-3 align-top">
                          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700">
                            ₹{amount.toFixed(2)}
                          </div>
                        </td>
                        <td data-label="Actions" className="rounded-r-2xl px-2 py-3 align-top">
                          <div className="flex flex-col gap-2">
                            {!item.catalogProductId && (
                              <button
                                type="button"
                                onClick={() => saveChallanProduct(index, item)}
                                disabled={savingChallanProductId === item.id || !item.crop?.trim()}
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Save to product catalog"
                              >
                                {savingChallanProductId === item.id ? 'Saving...' : 'Save to catalog'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              aria-label={`Remove item ${index + 1}`}
                              className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-600 transition hover:bg-rose-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Summary */}
          <section className="rounded-lg border border-slate-200/60 bg-white p-5 sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l16-10z"/></svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Summary</h2>
                <p className="mt-1 text-sm text-slate-500">Subtotals and the final amount.</p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{summary.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Shipping Charges</span>
                  <span className="font-semibold text-slate-900">₹{summary.shipping.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Freight Amount</span>
                  <span className="font-semibold text-slate-900">₹{Number(watch('challan.freightAmount') || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-emerald-700">₹{(summary.grandTotal + Number(watch('challan.freightAmount') || 0)).toFixed(2)}</span>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Shipping Charges</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  {...register('shipping', { min: 0 })}
                  onChange={(event) => {
                    event.target.value = decimalOnly(event.target.value, 12);
                    setValue('shipping', Number(event.target.value || 0), { shouldDirty: true, shouldValidate: true });
                  }}
                />
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className="rounded-lg border border-slate-200/60 bg-white p-5 sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Notes</h2>
                <p className="mt-1 text-sm text-slate-500">Additional notes for the delivery challan.</p>
              </div>
            </div>
            <textarea
              rows="3"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              {...register('challan.notes')}
              placeholder="Any additional notes or instructions..."
            />
          </section>

          {/* Mobile submit button */}
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving & preparing…' : 'Download Delivery Challan'}
            </button>
          </div>
        </form>

        {/* PDF Preview */}
        {showPdfPreview && pdfData ? (
          <section className="rounded-lg border border-slate-200/60 bg-white p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Downloaded document preview</h2>
              <p className="text-sm text-slate-500">This preview is the same PDF file that was downloaded.</p>
            </div>
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="Delivery Challan PDF Preview"
                className="h-[900px] w-full rounded-lg border border-slate-200"
                type="application/pdf"
                sandbox="allow-same-origin"
              />
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
};

// PDF generation helpers — imported lazily to avoid bundling @react-pdf/renderer in the main chunk
const createDeliveryChallanPdfBlob = async (data) => {
  const [{ pdf }, { default: DeliveryChallanPDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../pdf/DeliveryChallanPDF'),
  ]);
  return pdf(DeliveryChallanPDF({ data })).toBlob();
};

const downloadPdfUrl = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export default DeliveryChallanForm;
