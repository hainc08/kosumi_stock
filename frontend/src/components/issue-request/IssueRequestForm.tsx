import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useInventory } from '@/hooks/useInventory';
import { useCreateIssueRequest } from '@/hooks/useIssueRequests';

const itemSchema = z.object({
  productId:    z.string().min(1, 'Chọn mã hàng'),
  requestedQty: z.coerce.number().positive('Số lượng phải > 0'),
  note:         z.string().max(200).optional(),
});

const schema = z.object({
  requestDate: z.string().min(1),
  reason:      z.string().min(1, 'Vui lòng nhập lý do').max(500),
  note:        z.string().optional(),
  items:       z.array(itemSchema).min(1),
});

type FormValues = z.infer<typeof schema>;

const inputCls  = 'w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-orange-500 transition-colors';
const labelCls  = 'block text-[11px] font-semibold text-[#6e7681] uppercase tracking-wide mb-1';
const selectCls = 'w-full bg-[#161b22] border border-[#30363d] rounded px-2 py-1.5 text-xs text-[#e6edf3] outline-none focus:border-orange-500 transition-colors';

export function IssueRequestForm() {
  const navigate = useNavigate();
  const now = new Date();

  const { data: productsData } = useProducts();
  const products: any[] = (productsData as any)?.data ?? productsData ?? [];

  const { data: inventoryData } = useInventory({
    year:  now.getFullYear(),
    month: now.getMonth() + 1,
  }) as { data: any };
  const balances: any[] = inventoryData?.items ?? [];

  const createMutation = useCreateIssueRequest();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      requestDate: new Date().toISOString().split('T')[0],
      reason:      '',
      note:        '',
      items:       [{ productId: '', requestedQty: 1, note: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');

  function getStock(productId: string) {
    const b = balances.find((x: any) => x.productId === productId);
    return Number(b?.closingQty ?? 0);
  }

  async function onSubmit(values: FormValues) {
    try {
      await createMutation.mutateAsync(values);
      alert('Đã gửi yêu cầu, chờ phê duyệt');
      navigate('/my-requests');
    } catch (e: any) {
      alert(e?.response?.data?.error?.message ?? 'Gửi yêu cầu thất bại');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Header fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Ngày xin xuất *</label>
          <input type="date" {...register('requestDate')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Lý do xin xuất *</label>
          <textarea
            {...register('reason')}
            rows={2}
            placeholder="Nhập lý do xuất hàng..."
            className={`${inputCls} resize-none`}
          />
          {errors.reason && (
            <p className="text-[11px] text-red-400 mt-0.5">{errors.reason.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className={labelCls}>Ghi chú thêm</label>
        <input
          {...register('note')}
          placeholder="Ghi chú (không bắt buộc)..."
          className={inputCls}
        />
      </div>

      {/* Items table */}
      <div>
        <label className={labelCls}>Chi tiết hàng xin xuất *</label>
        <div className="border border-[#30363d] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px]">
              <thead>
                <tr className="bg-[#1c2333]">
                  {['#', 'Mã / Tên hàng', 'ĐVT', 'Tồn hiện tại', 'SL xin xuất', 'Ghi chú', ''].map((h) => (
                    <th key={h} className="px-2 py-2.5 text-left text-[10px] font-bold text-[#6e7681] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map((f, idx) => {
                  const product = products.find((p) => p.id === watchItems[idx]?.productId);
                  const stock   = getStock(watchItems[idx]?.productId ?? '');
                  const qty     = watchItems[idx]?.requestedQty ?? 0;
                  const over    = qty > stock && !!watchItems[idx]?.productId;

                  return (
                    <tr key={f.id} className="border-t border-[#30363d] hover:bg-[#0d1117]/20">
                      <td className="px-2 py-1.5 text-xs text-[#6e7681] text-center w-8">{idx + 1}</td>

                      {/* Product select */}
                      <td className="px-2 py-1 min-w-[200px]">
                        <select
                          {...register(`items.${idx}.productId`)}
                          className={selectCls}
                        >
                          <option value="">-- Chọn mã hàng --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} — {p.name}
                            </option>
                          ))}
                        </select>
                        {errors.items?.[idx]?.productId && (
                          <p className="text-[10px] text-red-400 mt-0.5">
                            {errors.items[idx]?.productId?.message}
                          </p>
                        )}
                      </td>

                      {/* Unit */}
                      <td className="px-2 py-1.5 text-xs text-[#6e7681] whitespace-nowrap">
                        {product?.unit ?? '—'}
                      </td>

                      {/* Stock */}
                      <td className="px-2 py-1.5 text-xs font-mono font-semibold whitespace-nowrap">
                        <span className={
                          !watchItems[idx]?.productId ? 'text-[#6e7681]'
                          : stock === 0 ? 'text-red-400'
                          : stock <= 5  ? 'text-amber-400'
                          : 'text-green-400'
                        }>
                          {watchItems[idx]?.productId ? stock : '—'}
                        </span>
                      </td>

                      {/* Qty */}
                      <td className="px-2 py-1 w-28">
                        <input
                          type="number"
                          min={1}
                          {...register(`items.${idx}.requestedQty`)}
                          className={`w-full bg-[#0d1117] border rounded px-2 py-1.5 text-xs text-right outline-none transition-colors ${
                            over
                              ? 'border-amber-500 focus:border-amber-400'
                              : 'border-[#30363d] focus:border-orange-500'
                          }`}
                        />
                        {over && (
                          <p className="text-[10px] text-amber-400 mt-0.5 text-right">Vượt tồn kho!</p>
                        )}
                      </td>

                      {/* Note */}
                      <td className="px-2 py-1 min-w-[120px]">
                        <input
                          {...register(`items.${idx}.note`)}
                          placeholder="Ghi chú..."
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1.5 text-xs text-[#e6edf3] outline-none focus:border-orange-500 transition-colors"
                        />
                      </td>

                      {/* Remove */}
                      <td className="px-2 py-1.5 text-center w-8">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="text-[#6e7681] hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => append({ productId: '', requestedQty: 1, note: '' })}
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
          onClick={() => navigate('/my-requests')}
          className="px-4 py-2 rounded-md text-sm font-medium bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-5 py-2 rounded-md text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {createMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu xuất kho'}
        </button>
      </div>
    </form>
  );
}
