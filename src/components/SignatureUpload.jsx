import { Signature } from 'lucide-react';

const SignatureUpload = ({ register, watch, setValue }) => {
  const signaturePreview = watch('signature.preview');

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PNG, JPEG, or WebP image.');
      event.target.value = '';
      return;
    }

    // Validate file size (max 1MB)
    const maxSize = 1 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be under 1MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setValue('signature.image', reader.result, { shouldDirty: true, shouldValidate: true });
      setValue('signature.preview', reader.result, { shouldDirty: true, shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white p-5 sm:p-7">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
          <Signature size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Authorized Signature</h2>
          <p className="mt-1 text-sm text-slate-500">Upload a signature image to appear on your documents.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-emerald-500 hover:text-emerald-700">
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
