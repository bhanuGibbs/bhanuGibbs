import {useEffect, useRef, useState} from 'react';
import {useForm} from 'react-hook-form';
import {useLocation} from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import toast, {Toaster} from 'react-hot-toast';
import dayjs from 'dayjs';
import Header from '../components/Header';
import {useAuth} from '../context/useAuth';
import CompanyDetailsForm from '../components/CompanyDetailsForm';
import CustomerDetailsForm from '../components/CustomerDetailsForm';
import QuotationDetailsForm from '../components/QuotationDetailsForm';
import ItemTable from '../components/ItemTable';
import Summary from '../components/Summary';
import TermsConditions from '../components/TermsConditions';
import SignatureUpload from '../components/SignatureUpload';
import Footer from '../components/Footer';
import {createDocumentPdfBlob, downloadPdfUrl} from '../pdf/documentPdf';
import {defaultValues} from '../constants/defaultValues';
import {calculateSummary} from '../utils/calculations';
import {createProduct, getProducts, submitQuotationToBackend} from '../integration/backend/api';


const Home = () => {
    const [showPdfPreview, setShowPdfPreview] = useState(false);
    const [pdfData, setPdfData] = useState(null);
    const [pdfUrl, setPdfUrl] = useState('');
    const [documentMode, setDocumentMode] = useState('quotation');
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState('');
    const [savingProductId, setSavingProductId] = useState('');
    const downloadInProgress = useRef(false);
    const location = useLocation();
    const {logout, user} = useAuth();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: {errors, isSubmitting},
    } = useForm({
        defaultValues: {
            company: defaultValues.company,
            customer: defaultValues.customer,
            quotation: defaultValues.quotation,
            items: defaultValues.items,
            shipping: defaultValues.shipping,
            signature: {image: '', preview: ''},
        },
    });

    const items = watch('items') || [];
    const shipping = watch('shipping') || 0;

    useEffect(() => {
        if (!user?.id) return undefined;
        let active = true;
        setProductsLoading(true);
        setProductsError('');
        getProducts()
            .then((loadedProducts) => {
                if (active) setProducts(loadedProducts || []);
            })
            .catch((error) => {
                if (active) setProductsError(error.message || 'Unable to load saved products.');
            })
            .finally(() => {
                if (active) setProductsLoading(false);
            });
        return () => {
            active = false;
        };
    }, [user?.id]);

    const addItem = () => {
        const newItem = {
            id: uuidv4(),
            itemName: '',
            catalogProductId: '',
            sku: '',
            hsnCode: '',
            description: '',
            quantity: 1,
            unit: 'Qty',
            rate: 0,
            discount: 0,
            gst: 18,
        };
        setValue('items', [...(items || []), newItem]);
    };

    const removeItem = (index) => {
        const updatedItems = [...items];
        updatedItems.splice(index, 1);
        setValue('items', updatedItems);
    };

    const selectProduct = (index, product) => {
        const prefix = `items.${index}`;
        if (!product) {
            setValue(`${prefix}.catalogProductId`, '');
            return;
        }
        setValue(`${prefix}.catalogProductId`, product.id, {shouldDirty: true});
        setValue(`${prefix}.itemName`, product.name || '', {shouldDirty: true});
        setValue(`${prefix}.description`, product.description || '', {shouldDirty: true});
        setValue(`${prefix}.sku`, product.sku || '', {shouldDirty: true});
        setValue(`${prefix}.hsnCode`, product.hsn_code || '', {shouldDirty: true});
        setValue(`${prefix}.rate`, Number(product.price) || 0, {shouldDirty: true});
        setValue(`${prefix}.gst`, Number(product.gst_percentage) || 0, {shouldDirty: true});
        setValue(`${prefix}.unit`, product.unit || 'Qty', {shouldDirty: true});
    };

    const saveProduct = async (index, item) => {
        setSavingProductId(item.id);
        try {
            const product = await createProduct({
                name: item.itemName.trim(),
                description: item.description || null,
                price: Number(item.rate),
                sku: item.sku || null,
                gst_percentage: Number(item.gst) || 0,
                unit: item.unit || null,
                hsn_code: item.hsnCode || null,
            });
            setProducts((current) => [product, ...current]);
            selectProduct(index, product);
            toast.success('Product saved to your catalog.');
        } catch (error) {
            toast.error(error.message || 'Unable to save product.');
        } finally {
            setSavingProductId('');
        }
    };

    const buildDocumentData = (data) => {
        const authorizedPerson = user?.name || user?.username || '';
        return {
            ...data,
            generatedAt: dayjs().format('MMMM D, YYYY'),
            summary: calculateSummary(data.items || [], data.shipping),
            documentType: documentMode === 'billing' ? 'invoice' : documentMode,

            quotation: {
                ...(data.quotation || {}),
                authorizedPerson,
            },
        };
    };

    const validateDocument = (data) => {
        if (!data.customer?.name?.trim()) {
            toast.error('Enter the customer name before saving this document.');
            return false;
        }
        if (!data.items?.length) {
            toast.error('Add at least one line item before saving this document.');
            return false;
        }
        const invalidItem = data.items.some((item) =>
            !item.itemName?.trim() ||
            Number(item.quantity) < 1 ||
            Number(item.rate) <= 0 ||
            Number(item.discount || 0) < 0 ||
            Number(item.discount || 0) > 100 ||
            Number(item.gst || 0) < 0 ||
            Number(item.gst || 0) > 100,
        );
        if (invalidItem) {
            toast.error('Complete each item with a name, positive quantity and price, and valid tax/discount percentages.');
            return false;
        }
        return true;
    };

    const handleDownload = async (data) => {
        if (!validateDocument(data)) return;
        if (downloadInProgress.current) return;
        downloadInProgress.current = true;
        const documentData = buildDocumentData(data);
        const documentLabel = documentMode === 'billing' ? 'Invoice' : 'Quotation';
        let phase = `saving the ${documentLabel.toLowerCase()}`;

        try {
            const finalQuotation = await submitQuotationToBackend(documentData);
            const updatedDocumentData = {
                ...documentData,
                quotation: {
                    ...documentData.quotation,
                    quotationNumber: finalQuotation.quotation_number || finalQuotation.reference_number,
                },
            };
            phase = `generating the ${documentLabel.toLowerCase()} PDF`;
            const blob = await createDocumentPdfBlob(updatedDocumentData);
            const url = URL.createObjectURL(blob);
            downloadPdfUrl(url, `${updatedDocumentData.quotation.quotationNumber}.pdf`);
            setPdfUrl(url);
            setPdfData(updatedDocumentData);
            setShowPdfPreview(true);
            toast.success(`${documentLabel} saved and downloaded.`);
        } catch (error) {
            console.error(error);
            toast.error(`Could not complete ${phase}: ${error.message || 'Please try again.'}`);
        } finally {
            downloadInProgress.current = false;
        }
    };

    const onSubmit = handleDownload;

    const handleReset = () => {
        reset({
            company: {
                ...defaultValues.company,
                name: user?.company_name || '',
                address: user?.company_address || '',
                phone: user?.company_phone_number || user?.mobile_number || '',
                email: user?.company_email || user?.email || '',
                website: user?.company_website || '',
                gstin: user?.company_gstin || '',
            },
            customer: defaultValues.customer,
            quotation: defaultValues.quotation,
            items: defaultValues.items,
            shipping: defaultValues.shipping,
            signature: {image: '', preview: ''},
        });
        setPdfData(null);
        setPdfUrl('');
        setShowPdfPreview(false);
        toast.success('Form reset');
    };

    const downloadPdf = () => handleSubmit(handleDownload)();

    useEffect(() => {
        const routeMode = location.state?.documentMode || 'quotation';
        setDocumentMode(routeMode);
    }, [location.state?.documentMode]);

    useEffect(() => {
        if (!user?.company_id) return;
        setValue('company.name', user.company_name || '');
        setValue('company.address', user.company_address || '');
        setValue('company.phone', user.company_phone_number || user.mobile_number || '');
        setValue('company.email', user.company_email || user.email || '');
        setValue('company.website', user.company_website || '');
        setValue('company.gstin', user.company_gstin || '');
    }, [user, setValue]);

    useEffect(() => {
        if (!pdfData) return;
        window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
    }, [pdfData]);

    useEffect(
        () => () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        },
        [pdfUrl],
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
            <Toaster position="top-right"/>
            <Header
                onDownloadPdf={downloadPdf}
                onReset={handleReset}
                onLogout={logout}
                isSubmitting={isSubmitting}
                documentMode={documentMode}
                onSetDocumentMode={setDocumentMode}
                user={user}
            />

            <main className="create-doc-page mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <CompanyDetailsForm register={register} errors={errors} watch={watch} setValue={setValue}/>
                    <CustomerDetailsForm register={register} errors={errors} watch={watch} setValue={setValue}/>
                    <QuotationDetailsForm
                        register={register}
                        errors={errors}
                        documentMode={documentMode}
                    />
                    <ItemTable
                        items={items}
                        products={products}
                        productsLoading={productsLoading}
                        productsError={productsError}
                        savingProductId={savingProductId}
                        register={register}
                        onAddItem={addItem}
                        onRemoveItem={removeItem}
                        onSelectProduct={selectProduct}
                        onSaveProduct={saveProduct}
                    />
                    <Summary items={items} shipping={shipping} register={register} setValue={setValue} watch={watch}/>
                    <TermsConditions register={register}/>
                    <SignatureUpload register={register} watch={watch} setValue={setValue}/>
                    <Footer/>
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
                        <p className="text-sm font-semibold text-slate-900">Choose document type</p>
                        <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                            {['quotation', 'billing'].map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setDocumentMode(mode)}
                                    aria-pressed={documentMode === mode}
                                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                        documentMode === mode ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
                                    }`}
                                >
                                    {mode === 'billing' ? 'Invoice' : 'Quotation'}
                                </button>
                            ))}
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? 'Saving & preparing…' : `Download ${documentMode === 'billing' ? 'Invoice' : 'Quotation'}`}
                        </button>
                    </div>
                </form>

                {showPdfPreview && pdfData ? (
                    <section className="rounded-2xl border border-slate-200/60 bg-white p-4 sm:p-6">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Downloaded document preview</h2>
                            <p className="text-sm text-slate-500">This preview is the same PDF file that was downloaded.</p>
                        </div>
                        {pdfUrl ? (
                            <iframe src={pdfUrl} title="Quotation PDF Preview"
                                    className="h-[900px] w-full rounded-xl border border-slate-200"/>
                        ) : null}
                    </section>
                ) : null}
            </main>
        </div>
    );
};

export default Home;
