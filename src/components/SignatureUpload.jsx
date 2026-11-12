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
    <section className="rounded-xl border border-[#1E3A5F]/10 bg-white p-5 sm:p-7 shadow-card-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-[#1E3A5F]/10 p-3 text-[#1E3A5F]">
          <Signature size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#1E3A5F]">Authorized Signature</h2>
          <p className="mt-1 text-sm text-[#2D3748]/60">Upload a signature image to appear on your documents.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#1E3A5F]/20 bg-[#1E3A5F]/5 px-4 py-3 text-sm font-medium text-[#1E3A5F] transition hover:border-[#FF6B35] hover:text-[#FF6B35]">
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          Upload Signature
        </label>
        {signaturePreview ? (
          <div className="flex h-24 w-56 items-center justify-center overflow-hidden rounded-lg border border-[#1E3A5F]/10 bg-white p-3">
            <img src={signaturePreview} alt="Signature preview" className="max-h-full max-w-full object-contain" />
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default SignatureUpload;
