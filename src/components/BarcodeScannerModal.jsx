import { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';

const BarcodeScannerModal = ({ onClose, onScan }) => {
  const scannerContainerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Small delay to ensure the DOM element is fully rendered before initializing
    const timer = setTimeout(() => {
      if (!scannerContainerRef.current) return;

      setIsLoading(true);
      setHasError(false);

      const scanner = new Html5QrcodeScanner(
        'barcode-scanner-region',
        {
          fps: 10,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.77,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
          formatsToSupport: [
            1,  // QR_CODE
            2,  // AZTEC
            4,  // DATA_MATRIX
            5,  // MAXICODE
            6,  // ITF
            7,  // EAN_13
            8,  // EAN_8
            9,  // RSS_14
            10, // PDF_417
            11, // RSS_EXPANDED
            13, // UPC_A
            14, // UPC_E
            15, // CODE_39
            16, // CODE_93
            17, // CODE_128
            20, // CODABAR
          ],
        },
        /* verbose= */ true
      );

      html5QrcodeScannerRef.current = scanner;

      let lastScanTime = 0;
      const onScanSuccess = (decodedText) => {
        // Debounce: ignore duplicate scans within 2 seconds
        const now = Date.now();
        if (now - lastScanTime < 2000) {
          return;
        }
        lastScanTime = now;
        toast.success('Barcode scanned!');
        onScan(decodedText);
        // Keep scanning — do NOT clear the scanner
      };

      const onScanFailure = () => {
        // Silently ignore — fires every frame until a code is found
      };

      scanner.render(onScanSuccess, onScanFailure);
      setIsLoading(false);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear().catch(() => {});
      }
    };
  }, [onScan]);

  const handleClose = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(() => {});
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3A5F]/10 bg-[#1E3A5F]/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1E3A5F]/10 rounded-lg">
              <Camera className="h-5 w-5 text-[#1E3A5F]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1E3A5F]">Scan Barcode</h3>
              <p className="text-xs text-[#2D3748]/60">Point your camera at a barcode</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[#1E3A5F]/10 transition-colors"
          >
            <X className="h-5 w-5 text-[#2D3748]/60" />
          </button>
        </div>

        {/* Scanner Body */}
        <div className="p-6" ref={scannerContainerRef}>
          {isLoading && !hasError && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-[#1E3A5F]/20 border-t-[#1E3A5F] rounded-full animate-spin mb-4" />
              <p className="text-[#2D3748] font-medium">Starting camera...</p>
              <p className="text-sm text-[#2D3748]/40 mt-1">Please allow camera access when prompted</p>
            </div>
          )}

          <div
            id="barcode-scanner-region"
            style={{ width: '100%', minWidth: '300px' }}
          />

          {hasError && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              Camera access denied or not available. Please allow camera permissions and try again.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1E3A5F]/10 bg-[#1E3A5F]/5 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl border border-[#1E3A5F]/10 text-sm font-medium text-[#1E3A5F] hover:bg-[#1E3A5F]/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
