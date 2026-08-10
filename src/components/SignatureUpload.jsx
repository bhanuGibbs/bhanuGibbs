import { Signature } from 'lucide-react';

const SignatureUpload = ({ register, watch, setValue }) => {
  const signaturePreview = watch('signature.preview');

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setValue('signature.image', reader.result, { shouldDirty: true, shouldValidate: true });
      setValue('signature.preview', reader.result, { shouldDirty: true, shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-soft sm:p-7">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
          <Signature size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Authorized Signature</h2>
          <p className="text-sm text-slate-500">Upload a signature image to include in the PDF.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-brand-500 hover:text-brand-600">
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          Upload Signature
        </label>
        {signaturePreview ? (
          <div className="flex h-24 w-56 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
            <img src={signaturePreview} alt="Signature preview" className="max-h-full max-w-full object-contain" />
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default SignatureUpload;
