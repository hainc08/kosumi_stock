import { useEffect, useState } from 'react';
import { Lock, X } from 'lucide-react';
import { Spinner } from '@/components/shared/PeriodSelector';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useProducts';
import { generateCode } from '@/lib/generateCode';

interface CategoryData { id: string; code: string; name: string }

interface Props {
  open:      boolean;
  onClose:   () => void;
  category?: CategoryData | null;
}

const INPUT = 'w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-orange-500 transition-colors';

export function CategoryFormModal({ open, onClose, category }: Props) {
  const [code, setCode]     = useState('');
  const [name, setName]     = useState('');
  const [errs, setErrs]     = useState<{ code?: string; name?: string }>({});
  const [apiErr, setApiErr] = useState('');

  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const isEdit    = !!category;
  const loading   = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (!open) return;
    setErrs({});
    setApiErr('');
    setCode(category?.code ?? '');
    setName(category?.name ?? '');
  }, [open, category]);

  function validate() {
    const e: typeof errs = {};
    if (!name.trim()) e.name = 'Vui lòng nhập tên nhóm hàng';
    if (!isEdit && code.trim() && code.trim().length > 20) {
      e.code = 'Mã tối đa 20 ký tự';
    }
    setErrs(e);
    return !Object.keys(e).length;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setApiErr('');

    const finalCode = isEdit
      ? category!.code
      : (code.trim() || generateCode(name.trim()));

    try {
      if (isEdit && category) {
        // Only update name; code is immutable
        await updateMut.mutateAsync({ id: category.id, name: name.trim() });
      } else {
        await createMut.mutateAsync({ code: finalCode, name: name.trim() });
      }
      onClose();
    } catch (err: any) {
      const msg: string = err?.response?.data?.error?.message ?? '';
      if (msg.toLowerCase().includes('duplicate') || msg.includes('409') || msg.includes('ton tai')) {
        setApiErr('Mã hoặc tên đã tồn tại. Vui lòng nhập mã khác hoặc đổi tên.');
      } else {
        setApiErr(msg || 'Lưu thất bại. Vui lòng thử lại.');
      }
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d]">
          <h2 className="text-base font-bold">
            {isEdit ? 'Sửa nhóm hàng' : 'Thêm nhóm hàng'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded text-[#6e7681] hover:text-[#e6edf3] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {apiErr && (
            <div className="px-3 py-2.5 rounded-md bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {apiErr}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-[11px] font-semibold text-[#6e7681] uppercase tracking-wide mb-1.5">
              Tên nhóm hàng <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Ống, Tấm, Đen"
              className={INPUT}
              autoFocus
            />
            {errs.name && <p className="text-xs text-red-400 mt-1">{errs.name}</p>}
          </div>

          {/* Code */}
          {isEdit ? (
            <div>
              <label className="block text-[11px] font-semibold text-[#6e7681] uppercase tracking-wide mb-1.5">
                Mã nhóm
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d]">
                <Lock size={12} className="text-[#6e7681] flex-shrink-0" />
                <span className="font-mono text-sm text-[#8b949e]">{category?.code}</span>
              </div>
              <p className="text-[11px] text-[#6e7681] mt-1">Mã không thể thay đổi sau khi tạo</p>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-[#6e7681] uppercase tracking-wide mb-1.5">
                Mã nhóm
                <span className="ml-1.5 text-[10px] font-normal text-[#6e7681] normal-case tracking-normal">
                  (không bắt buộc)
                </span>
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                placeholder="Để trống — hệ thống tự tạo"
                maxLength={20}
                className={INPUT}
              />
              {errs.code && <p className="text-xs text-red-400 mt-1">{errs.code}</p>}
              <p className="text-[11px] text-[#6e7681] mt-1">
                Nếu để trống, mã sẽ được tạo tự động từ tên
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-md text-sm font-medium bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] disabled:opacity-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {loading && <Spinner className="text-white w-3.5 h-3.5" />}
              {isEdit ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
