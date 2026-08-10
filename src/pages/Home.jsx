import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { BlobProvider } from '@react-pdf/renderer';
import toast, { Toaster } from 'react-hot-toast';
import dayjs from 'dayjs';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import CompanyDetailsForm from '../components/CompanyDetailsForm';
import CustomerDetailsForm from '../components/CustomerDetailsForm';
import QuotationDetailsForm from '../components/QuotationDetailsForm';
import ItemTable from '../components/ItemTable';
import Summary from '../components/Summary';
import TermsConditions from '../components/TermsConditions';
import SignatureUpload from '../components/SignatureUpload';
import Footer from '../components/Footer';
import QuotationPDF from '../pdf/QuotationPDF';
import { defaultValues } from '../constants/defaultValues';
import { calculateSummary } from '../utils/calculations';
import { submitQuotationDraftToBackend, finalizeQuotation } from '../integration/backend/api';

const Home = () => {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [savedQuotation, setSavedQuotation] = useState(null);
  const [documentMode, setDocumentMode] = useState('quotation');
  const { logout, user } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      company: defaultValues.company,
      customer: defaultValues.customer,
      quotation: defaultValues.quotation,
      items: defaultValues.items,
      shipping: defaultValues.shipping,
      signature: { image: '', preview: '' },
    },
  });

  const items = watch('items') || [];
  const shipping = watch('shipping') || 0;
  const summary = useMemo(() => calculateSummary(items, shipping), [items, shipping]);

  const addItem = () => {
    const newItem = {
      id: crypto.randomUUID(),
      itemName: '',
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

  const buildDocumentData = (data) => {
    const authorizedPerson = user?.name || user?.username || '';
    return {
      ...data,
      generatedAt: dayjs().format('MMMM D, YYYY'),
      summary,
      documentType: documentMode,
      quotation: {
        ...(data.quotation || {}),
        authorizedPerson,
      },
    };
  };

  const handlePreview = async (data) => {
    const documentData = buildDocumentData(data);

    try {
      const quotation = await submitQuotationDraftToBackend(documentData);
      const updatedDocumentData = {
        ...documentData,
        quotation: {
          ...documentData.quotation,
          quotationNumber: quotation.reference_number,
        },
      };

      setSavedQuotation(quotation);
      setPdfData(updatedDocumentData);
      setShowPdfPreview(true);
      toast.success('Draft saved and preview ready.');
    } catch (error) {
      console.error(error);
      setPdfData(documentData);
      setShowPdfPreview(true);
      toast.error(error.message || 'Unable to save draft for preview.');
    }
  };

  const handleGenerate = async (data) => {
    const documentData = buildDocumentData(data);

    try {
      const draft = await submitQuotationDraftToBackend(documentData);
      const finalQuotation = await finalizeQuotation(draft.id);
      const updatedDocumentData = {
        ...documentData,
        quotation: {
          ...documentData.quotation,
          quotationNumber: finalQuotation.quotation_number || finalQuotation.reference_number,
        },
      };

      setSavedQuotation(finalQuotation);
      setPdfData(updatedDocumentData);
      setShowPdfPreview(true);
      window.open(`/api/quotations/${finalQuotation.id}/pdf`, '_blank');
      toast.success('Quotation finalized and PDF generated.');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Unable to generate quotation PDF.');
    }
  };

  const onSubmit = handleGenerate;

  const handleReset = () => {
    reset({
      company: defaultValues.company,
      customer: defaultValues.customer,
      quotation: defaultValues.quotation,
      items: defaultValues.items,
      shipping: defaultValues.shipping,
      signature: { image: '', preview: '' },
    });
    setSavedQuotation(null);
    setPdfData(null);
    setShowPdfPreview(false);
    setDocumentMode('quotation');
    toast.success('Form reset');
  };

  const previewPdf = () => {
    handleSubmit(handlePreview)();
  };

  const generatePdf = () => {
    handleSubmit(handleGenerate)();
  };

  useEffect(() => {
    if (!pdfData) return;
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, [pdfData]);

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <Toaster position="top-right" />
      <Header
        onGeneratePdf={generatePdf}
        onPreviewPdf={previewPdf}
        onReset={handleReset}
        onLogout={logout}
        isSubmitting={isSubmitting}
        documentMode={documentMode}
        onSetDocumentMode={setDocumentMode}
        user={user}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <CompanyDetailsForm register={register} errors={errors} watch={watch} setValue={setValue} />
          <CustomerDetailsForm register={register} errors={errors} />
          <QuotationDetailsForm register={register} errors={errors} />
          <ItemTable items={items} register={register} errors={errors} onAddItem={addItem} onRemoveItem={removeItem} />
          <Summary items={items} shipping={shipping} register={register} setValue={setValue} watch={watch} />
          <TermsConditions register={register} />
          <SignatureUpload register={register} watch={watch} setValue={setValue} />
          <Footer />
        </form>

        {showPdfPreview && pdfData ? (
          <section className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-soft sm:p-6">
            <BlobProvider document={<QuotationPDF data={pdfData} />} fileName={`${pdfData.quotation?.quotationNumber || 'quotation'}.pdf`}>
              {({ blob, url, loading, error }) => (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">PDF Preview</h2>
                      <p className="text-sm text-slate-500">A professional A4 layout generated with react-pdf.</p>
                    </div>
                    {blob ? (
                      <a
                        href={url}
                        download={`${pdfData.quotation?.quotationNumber || 'quotation'}-${pdfData.documentType === 'billing' ? 'billing' : 'quotation'}.pdf`}
                        className="rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
                      >
                        Download PDF
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-slate-500">Preparing PDF...</span>
                    )}
                  </div>

                  {loading ? (
                    <div className="flex h-[640px] items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                      Preparing your PDF preview...
                    </div>
                  ) : error ? (
                    <div className="flex h-[640px] items-center justify-center rounded-3xl border border-rose-200 bg-rose-50 text-sm text-rose-600">
                      The PDF could not be generated. Please try again.
                    </div>
                  ) : (
                    <iframe src={url} title="Quotation PDF Preview" className="h-[900px] w-full rounded-3xl border border-slate-200" />
                  )}
                </>
              )}
            </BlobProvider>
          </section>
        ) : null}
      </main>
    </div>
  );
};

export default Home;
