// src/components/shared/ConfirmDialog.tsx
interface ConfirmDialogProps {
  open:       boolean;
  title:      string;
  message:    string;
  onConfirm:  () => void;
  onCancel:   () => void;
  loading?:   boolean;
  variant?:   'danger' | 'primary';
}

export function ConfirmDialog({
  open, title, message, onConfirm, onCancel, loading, variant = 'primary',
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5">
        <h3 className="text-base font-bold mb-2">{title}</h3>
        <p className="text-sm text-[#8b949e] mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-1.5 rounded-md text-sm font-medium bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold text-white disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}
