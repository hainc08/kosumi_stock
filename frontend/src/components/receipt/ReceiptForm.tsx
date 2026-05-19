// src/components/receipt/ReceiptForm.tsx
// Form tạo / chỉnh sửa phiếu nhập kho
// Sử dụng react-hook-form + zod

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCreateReceipt } from '@/hooks/useReceipts';
import { useNavigate } from 'react-router-dom';
import type { Product } from '@/types/models';

const itemSchema = z.object({
  productId: z.string().min(1, 'Chọn mã hàng'),
  quantity:  z.coerce.number().positive('Số lượng phải > 0'),
  unitPrice: z.coerce.number().min(0).default(0),
});

const schema = z.object({
  receiptDate: z.string().min(1, 'Chọn ngày nhập'),
  supplier:    z.string().optional(),
  note:        z.string().optional(),
  items:       z.array(itemSchema).min(1, 'Cần ít nhất 1 dòng hàng'),
});

type FormValues = z.infer<typeof schema>;

export function ReceiptForm() {
  const navigate = useNavigate();
  const { data: productsData } = useProducts();
  const products: Product[] = (productsData as any)?.data ?? productsData ?? [];
  const createMutation = useCreateReceipt();

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      receiptDate: new Date().toISOString().split('T')[0],
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');

  async function onSubmit(values: FormValues) {
    try {
      await createMutation.mutateAsync(values);
      navigate('/receipts');
    } catch (e: any) {
      alert(e?.response?.data?.error?.message ?? 'Có lỗi xảy ra');
    }
  }

  const inputCls = 'w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-orange-500 transition-colors';
  const labelCls = 'block text-[11px] font-semibold text-[#6e7681] uppercase tracking-wide mb-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* Header fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Ngày nhập *</label>
          <input type="date" {...register('receiptDate')} className={inputCls} />
          {errors.receiptDate && <p className="text-xs text-red-400 mt-1">{errors.receiptDate.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Nhà cung cấp</label>
          <input {...register('supplier')} placeholder="Tên nhà cung cấp..." className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Ghi chú</label>
          <input {...register('note')} placeholder="Ghi chú phiếu nhập..." className={inputCls} />
        </div>
      </div>

      {/* Items table */}
      <div>
        <label className={labelCls}>Chi tiết hàng nhập *</label>
        {errors.items?.root && (
          <p className="text-xs text-red-400 mb-2">{errors.items.root.message}</p>
        )}
        <div className="border border-[#30363d] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1c2333]">
                <th className="text-left px-3 py-2 text-[10px] font-bold text-[#6e7681] uppercase w-8">#</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-[#6e7681] uppercase">Mã / Tên hàng</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-[#6e7681] uppercase w-24">ĐVT</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-[#6e7681] uppercase w-24">Số lượng</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-[#6e7681] uppercase w-28">Đơn giá</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, idx) => {
                const selectedProduct = products.find((p) => p.id === watchItems[idx]?.productId);
                return (
                  <tr key={field.id} className="border-t border-[#30363d] hover:bg-[#0d1117]/30">
                    <td className="px-3 py-1.5 text-xs text-[#6e7681] text-center">{idx + 1}</td>
                    <td className="px-2 py-1">
                      <select
                        {...register(`items.${idx}.productId`)}
                        className="w-full bg-[#161b22] border border-[#30363d] rounded px-2 py-1.5 text-xs text-[#e6edf3] outline-none focus:border-orange-500 transition-colors"
                      >
                        <option value="">-- Chọn mã hàng --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} — {p.name}
                          </option>
                        ))}
                      </select>
                      {errors.items?.[idx]?.productId && (
                        <p className="text-[10px] text-red-400 mt-0.5">{errors.items[idx]?.productId?.message}</p>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-xs text-[#6e7681]">
                      {selectedProduct?.unit ?? '—'}
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        min="1"
                        {...register(`items.${idx}.quantity`)}
                        className="w-full bg-transparent border border-[#30363d] rounded px-2 py-1.5 text-xs text-right outline-none focus:border-orange-500"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        min="0"
                        {...register(`items.${idx}.unitPrice`)}
                        className="w-full bg-transparent border border-[#30363d] rounded px-2 py-1.5 text-xs text-right outline-none focus:border-orange-500"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(idx)} className="text-[#6e7681] hover:text-red-400">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button
            type="button"
            onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-[#6e7681] hover:text-orange-400 hover:bg-orange-500/5 border-t border-dashed border-[#30363d] transition-colors"
          >
            <Plus size={13} /> Thêm dòng hàng
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => navigate('/receipts')}
          className="px-4 py-2 rounded-md text-sm font-medium bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-5 py-2 rounded-md text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Đang lưu...' : 'Lưu phiếu nhập'}
        </button>
      </div>
    </form>
  );
}
