import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Spinner } from '@/components/shared/PeriodSelector';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import type { Product } from '@/types/models';

interface UnitOption     { id: string; code: string; name: string }
interface CategoryOption { id: string; code: string; name: string }

interface Props {
  open:       boolean;
  onClose:    () => void;
  product?:   Product | null;
  units:      UnitOption[];
  categories: CategoryOption[];
}

type F = {
  code:     string;
  name:     string;
  unit:     string;
  category: string;
  minStock: string;
  isActive: boolean;
};

const EMPTY: F = { code: '', name: '', unit: '', category: '', minStock: '0', isActive: true };

const INPUT = 'w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const BTN_P = 'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors';
const BTN_S = 'px-4 py-2 rounded-md text-sm font-medium bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] disabled:opacity-50 transition-colors';

function Field({
  label, required, error, children,
}: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-[#6e7681] uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export function ProductFormModal({ open, onClose, product, units, categories }: Props) {
  const [form, setForm]     = useState<F>(EMPTY);
  const [errs, setErrs]     = useState<Partial<Record<keyof F, string>>>({});
  const [apiErr, setApiErr] = useState('');

  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const isEdit    = !!product;
  const loading   = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (!open) return;
    setErrs({});
    setApiErr('');
    setForm(
      product
        ? {
            code:     product.code,
            name:     product.name,
            unit:     product.unit,
            category: product.category ?? '',
            minStock: String(product.minStock ?? 0),
            isActive: product.isActive,
          }
        : EMPTY,
    );
  }, [open, product]);

  function set(key: keyof F, val: string | boolean) {
    setForm((s) => ({ ...s, [key]: val }));
  }

  function validate() {
    const e: typeof errs = {};
    if (!form.code.trim()) e.code = 'Vui lòng nhập mã hàng';
    if (!form.name.trim()) e.name = 'Vui lòng nhập tên hàng';
    if (!form.unit)        e.unit = 'Vui lòng chọn đơn vị tính';
    setErrs(e);
    return !Object.keys(e).length;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setApiErr('');
    try {
      const dto = {
        code:     form.code.trim(),
        name:     form.name.trim(),
        unit:     form.unit,
        category: form.category || null,
        minStock: Number(form.minStock) || 0,
        isActive: form.isActive,
      };
      if (isEdit && product) {
        await updateMut.mutateAsync({ id: product.id, ...dto });
      } else {
        await createMut.mutateAsync(dto);
      }
      onClose();
    } catch (err: any) {
      setApiErr(err?.response?.data?.error?.message ?? 'Lưu thất bại. Vui lòng thử lại.');
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d] flex-shrink-0">
          <h2 className="text-base font-bold">
            {isEdit ? 'Sửa vật tư' : 'Thêm vật tư mới'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded text-[#6e7681] hover:text-[#e6edf3] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            {apiErr && (
              <div className="px-3 py-2.5 rounded-md bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                {apiErr}
              </div>
            )}

            {/* Code */}
            <Field label="Mã hàng" required error={errs.code}>
              <input
                value={form.code}
                onChange={(e) => set('code', e.target.value)}
                disabled={isEdit}
                placeholder="VD: SP001"
                className={INPUT}
              />
              {isEdit && (
                <p className="text-[11px] text-[#6e7681] mt-1">Mã hàng không thể thay đổi sau khi tạo</p>
              )}
            </Field>

            {/* Name */}
            <Field label="Tên hàng" required error={errs.name}>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="VD: Ống thép đen D114"
                className={INPUT}
              />
            </Field>

            {/* Unit + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Đơn vị tính" required error={errs.unit}>
                <select
                  value={form.unit}
                  onChange={(e) => set('unit', e.target.value)}
                  className={INPUT}
                >
                  <option value="">Chọn ĐVT</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Nhóm hàng">
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className={INPUT}
                >
                  <option value="">— Không có nhóm —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* MinStock + isActive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Tồn tối thiểu">
                <input
                  type="number"
                  min={0}
                  value={form.minStock}
                  onChange={(e) => set('minStock', e.target.value)}
                  className={INPUT}
                />
              </Field>
              {isEdit && (
                <Field label="Trạng thái">
                  <label className="flex items-center gap-2 h-[38px] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => set('isActive', e.target.checked)}
                      className="w-4 h-4 accent-orange-500"
                    />
                    <span className={`text-sm font-medium ${form.isActive ? 'text-green-400' : 'text-[#6e7681]'}`}>
                      {form.isActive ? 'Đang hoạt động' : 'Vô hiệu hóa'}
                    </span>
                  </label>
                </Field>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-[#30363d] flex justify-end gap-2 flex-shrink-0">
            <button type="button" onClick={onClose} disabled={loading} className={BTN_S}>
              Hủy
            </button>
            <button type="submit" disabled={loading} className={BTN_P}>
              {loading && <Spinner className="text-white w-3.5 h-3.5" />}
              {isEdit ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
