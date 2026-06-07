import { useEffect, useState } from 'react';

function TheDepTraiModal({ open, onConfirm }) {
  const [yesScale, setYesScale] = useState(1);

  useEffect(() => {
    if (open) {
      setYesScale(1);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-scale-in rounded-3xl border border-accent/30 bg-surface-card p-8 text-center shadow-2xl shadow-accent/20">
        <p className="mb-8 text-2xl font-bold leading-snug text-white sm:text-3xl">
          Anh Thế đẹp trai không?
        </p>

        <div className="flex min-h-[140px] flex-col items-center justify-center gap-4">
          <button
            type="button"
            onClick={onConfirm}
            style={{ transform: `scale(${yesScale})` }}
            className="rounded-2xl bg-accent px-10 py-5 text-2xl font-bold text-white shadow-lg shadow-accent/40 transition-transform duration-300 hover:bg-accent/90 sm:px-14 sm:py-6 sm:text-3xl"
          >
            Có
          </button>

          <button
            type="button"
            onClick={() => setYesScale((prev) => Math.min(prev + 0.4, 5))}
            className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-white/30 transition hover:text-white/50"
          >
            Không
          </button>
        </div>
      </div>
    </div>
  );
}

export default TheDepTraiModal;
