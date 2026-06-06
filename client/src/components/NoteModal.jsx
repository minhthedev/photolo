import { useEffect, useState } from 'react';

function NoteModal({ image, onSave, onClose }) {
  const [note, setNote] = useState(image?.clientNote || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNote(image?.clientNote || '');
  }, [image]);

  if (!image) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(note.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div
        className="w-full max-w-md animate-scale-in rounded-2xl border border-white/10 bg-surface-card p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-accent">Ảnh đã chọn</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Ghi chú chỉnh sửa</h3>
            {image.fileName && (
              <p className="mt-1 truncate text-sm text-white/50">{image.fileName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <p className="mb-3 text-sm text-white/60">
          Bạn muốn chỉnh gì ở tấm này? (VD: làm sáng mặt, bỏ người phía sau, crop gọn hơn...)
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            className="input-field min-h-[120px] resize-none"
            placeholder="Nhập yêu cầu chỉnh sửa..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
          />

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Bỏ qua
            </button>
            <button type="submit" className="btn-accent flex-1" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu ghi chú'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NoteModal;
