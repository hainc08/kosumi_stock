// src/components/issue/IssueForm.tsx
// Form tạo phiếu xuất kho — hiển thị tồn kho real-time khi chọn mã hàng

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useInventory } from '@/hooks/useInventory';
import { useCreateIssue } from '@/hooks/useIssues';
import { useNavigate } from 'react-router-dom';
import type { Product } from '@/types/models';

const itemSchema = z.object({
  productId:    z.string().min(1, 'Chọn mã hàng'),
  requestedQty: z.coerce.number().positive('Số lượng phải > 0'),
});

const schema = z.object({
  issueDate:  z.string().min(1, 'Chọn ngày xuất'),
  recipient:  z.string().optional(),
  department: z.string().optional(),
  note:       z.string().optional(),
  items:      z.array(itemSchema).min(1),
});

type FormValues = z.infer<typeof schema>;

export function IssueForm() {
  const navigate = useNavigate();
  const now = new Date();
  const { data: productsData } = useProducts();
  const products: Product[] = (productsData as any)?.data ?? productsData ?? [];
  const { data: inventoryData } = useInventory({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const balances: any[] = (inventoryData as any)?.items ?? [];
  const createMutation = useCreateIssue();

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
      items: [{ productId: '', requestedQty: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');

  function getStock(productId: string): number {
    const bal = balances.find((b: any) => b.productId === productId);
    return bal ? Number(bal.closingQty) : 0;
  }

  async function onSubmit(values: FormValues) {
    try {
      await createMutation.mutateAsync(values);
      navigate('/issues');
    } catch (e: any) {
      alert(e?.response?.data?.error?.message ?? 'Có lỗi xảy ra');
    }
  }

  const inputCls = 'w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-orange-500 transition-colors';
  const labelCls = 'block text-[11px] font-semibold text-[#6e7681] uppercase tracking-wide mb-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Ngày xuất *</label>
          <input type="date" {...register('issueDate')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Người nhận</label>
          <input {...register('recipient')} placeholder="Tên người nhận..." className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Bộ phận</label>
          <input {...register('department')} placeholder="Bộ phận / Công trình..." className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Ghi chú</label>
          <input {...register('note')} placeholder="Ghi chú phiếu xuất..." className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Chi tiết hàng xuất *</label>
        <div className="border border-[#30363d] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1c2333]">
                <th className="text-left px-3 py-2 text-[10px] font-bold text-[#6e7681] uppercase w-8">#</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-[#6e7681] uppercase">Mã / Tên hàng</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-[#6e7681] uppercase w-20">ĐVT</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-[#6e7681] uppercase w-24">Tồn kho</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-[#6e7681] uppercase w-28">Số lượng xuất</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, idx) => {
                const selectedProduct = products.find((p) => p.id === watchItems[idx]?.productId);
                const stock = getStock(watchItems[idx]?.productId ?? '');
                const qty   = watchItems[idx]?.requestedQty ?? 0;
                const overStock = qty > stock && stock > 0;

                return (
                  <tr key={field.id} className="border-t border-[#30363d]">
                    <td className="px-3 py-1.5 text-xs text-[#6e7681] text-center">{idx + 1}</td>
                    <td className="px-2 py-1">
                      <select
                        {...register(`items.${idx}.productId`)}
                        className="w-full bg-[#161b22] border border-[#30363d] rounded px-2 py-1.5 text-xs text-[#e6edf3] outline-none focus:border-orange-500 transition-colors"
                      >
                        <option value="">-- Chọn mã hàng --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-1.5 text-xs text-[#6e7681]">{selectedProduct?.unit ?? '—'}</td>
                    <td className="px-3 py-1.5">
                      <span className={`text-xs font-mono font-semibold ${stock === 0 ? 'text-red-400' : stock <= 5 ? 'text-amber-400' : 'text-green-400'}`}>
                        {watchItems[idx]?.productId ? stock : '—'}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        min="1"
                        {...register(`items.${idx}.requestedQty`)}
                        className={`w-full bg-transparent border rounded px-2 py-1.5 text-xs text-right outline-none transition-colors ${
                          overStock ? 'border-red-500 focus:border-red-500' : 'border-[#30363d] focus:border-orange-500'
                        }`}
                      />
                      {overStock && (
                        <p className="text-[10px] text-red-400 mt-0.5 text-right">Vượt tồn kho!</p>
                      )}
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
            onClick={() => append({ productId: '', requestedQty: 1 })}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-[#6e7681] hover:text-orange-400 hover:bg-orange-500/5 border-t border-dashed border-[#30363d] transition-colors"
          >
            <Plus size={13} /> Thêm dòng hàng
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => navigate('/issues')}
          className="px-4 py-2 rounded-md text-sm font-medium bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-5 py-2 rounded-md text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Đang lưu...' : 'Lưu phiếu xuất'}
        </button>
      </div>
    </form>
  );
}
