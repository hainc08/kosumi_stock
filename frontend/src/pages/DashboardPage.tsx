import { Link } from 'react-router-dom';
import { PageCard } from '@/components/shared/PeriodSelector';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { StockAlert } from '@/components/shared/StockAlert';
import { useInventory, useInventorySummary } from '@/hooks/useInventory';
import { useIssueRequests } from '@/hooks/useIssueRequests';
import { useAuthStore } from '@/stores/auth.store';
import { Role } from '@/types/roles';

export default function DashboardPage() {
  const { data: summary } = useInventorySummary() as { data: any };
  const now = new Date();
  const { data: inventory } = useInventory({ year: now.getFullYear(), month: now.getMonth() + 1 }) as { data: any };
  const items = inventory?.items ?? [];

  const { user } = useAuthStore();
  const isReviewer = user?.role === Role.ADMIN || user?.role === Role.WAREHOUSE_MANAGER;
  const { data: pendingRequestRaw } = useIssueRequests({ status: 'PENDING_APPROVAL' }) as { data: any };
  const pendingRequestCount = Number(pendingRequestRaw?.meta?.total ?? (pendingRequestRaw?.data?.length ?? 0));
  const myPendingCount = user?.role === Role.WAREHOUSE_STAFF
    ? (pendingRequestRaw?.data ?? []).filter((x: any) => x.requestedBy?.fullName === user.fullName).length
    : pendingRequestCount;

  const stats = [
    { label: 'Tong ma hang', value: summary?.totalProducts ?? '—', color: 'border-orange-500' },
    { label: 'Ton kho thap', value: summary?.lowStockCount ?? '—', color: 'border-red-500' },
    { label: 'Phieu nhap cho duyet', value: summary?.pendingReceipts ?? '—', color: 'border-green-500' },
    { label: 'Phieu xuat cho duyet', value: summary?.pendingIssues ?? '—', color: 'border-blue-500' },
    { label: isReviewer ? 'Cho phe duyet' : 'Yeu cau cua toi', value: isReviewer ? pendingRequestCount : myPendingCount, color: 'border-fuchsia-500' },
  ];

  return (
    <div className="space-y-5">
      <StockAlert />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`bg-[#161b22] border border-[#30363d] rounded-xl p-4 border-t-2 ${s.color}`}>
            <p className="text-[11px] text-[#6e7681] font-semibold uppercase tracking-wide leading-tight">{s.label}</p>
            <p className="text-2xl lg:text-3xl font-black font-mono mt-1 mb-1">{s.value}</p>
          </div>
        ))}
      </div>

      <PageCard
        title={`Ton Kho Hien Tai - T${now.getMonth() + 1}/${now.getFullYear()}`}
        actions={<Link to="/inventory" className="text-xs text-blue-400 hover:underline">Xem tat ca →</Link>}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1c2333]">
                {['Ma hang', 'Ten hang', 'DVT', 'Dau ky', 'Nhap', 'Xuat', 'Cuoi ky', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-[#6e7681] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 10).map((item: any) => (
                <tr key={item.id} className="border-t border-[#30363d] hover:bg-[#1c2333]/40">
                  <td className="px-4 py-2.5"><span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{item.product.code}</span></td>
                  <td className="px-4 py-2.5 text-sm text-[#8b949e] max-w-[220px] truncate">{item.product.name}</td>
                  <td className="px-4 py-2.5 text-xs text-[#6e7681]">{item.product.unit}</td>
                  <td className="px-4 py-2.5 text-sm font-mono">{item.openingQty}</td>
                  <td className="px-4 py-2.5 text-sm font-mono text-green-400">—</td>
                  <td className="px-4 py-2.5 text-sm font-mono text-red-400">—</td>
                  <td className="px-4 py-2.5 text-sm font-mono font-bold">{item.closingQty}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={item.status} /></td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-sm text-[#6e7681]">Chua co du lieu ton kho</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </PageCard>
    </div>
  );
}
