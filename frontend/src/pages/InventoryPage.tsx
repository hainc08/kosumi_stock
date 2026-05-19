// src/pages/InventoryPage.tsx
import { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PeriodSelector, PageCard } from '@/components/shared/PeriodSelector';
import { Search } from 'lucide-react';

export default function InventoryPage() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading } = useInventory({ year, month, search, category }) as { data: any; isLoading: boolean };
  const items: any[] = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-black">Tồn Kho</h1>
        <PeriodSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
      </div>

      <PageCard>
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[#30363d] bg-[#1c2333]">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#21262d] border border-[#30363d] rounded-md px-2.5 py-1.5 text-xs text-[#e6edf3] outline-none focus:border-orange-500 transition-colors"
          >
            <option value="">Tất cả loại</option>
            <option value="Ống">Ống</option>
            <option value="Tấm">Tấm</option>
            <option value="Đen">Đen</option>
          </select>
          <div className="relative ml-auto">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6e7681]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã hàng, tên..."
              className="bg-[#21262d] border border-[#30363d] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#e6edf3] outline-none focus:border-orange-500 transition-colors w-44 sm:w-52"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1c2333]">
                {['#','Mã hàng','Tên hàng','ĐVT','Tồn đầu kỳ','Nhập kỳ','Xuất kỳ','Tồn cuối kỳ','Trạng thái'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-[#6e7681] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={9} className="text-center py-10 text-sm text-[#6e7681]">Đang tải...</td></tr>
              )}
              {!isLoading && items.map((item: any, i: number) => (
                <tr key={item.id} className="border-t border-[#30363d] hover:bg-[#1c2333]/40">
                  <td className="px-4 py-2.5 text-xs text-[#6e7681]">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{item.product.code}</span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-[#8b949e]">{item.product.name}</td>
                  <td className="px-4 py-2.5 text-xs text-[#6e7681]">{item.product.unit}</td>
                  <td className="px-4 py-2.5 text-sm font-mono">{item.openingQty}</td>
                  <td className="px-4 py-2.5 text-sm font-mono text-green-400">—</td>
                  <td className="px-4 py-2.5 text-sm font-mono text-red-400">—</td>
                  <td className="px-4 py-2.5 text-sm font-mono font-bold">{item.closingQty}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={item.status} /></td>
                </tr>
              ))}
              {!isLoading && !items.length && (
                <tr><td colSpan={9} className="text-center py-10 text-sm text-[#6e7681]">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </PageCard>
    </div>
  );
}
