// src/pages/ReceiptsPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReceipts, useApproveReceipt, useRejectReceipt } from '@/hooks/useReceipts';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageCard } from '@/components/shared/PeriodSelector';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { Permission } from '@/types/roles';
import { Plus } from 'lucide-react';

export default function ReceiptsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmId, setConfirmId] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);

  const { data, isLoading } = useReceipts({ status: statusFilter || undefined }) as { data: any; isLoading: boolean };
  const receipts: any[] = data?.data ?? [];

  const approveMut = useApproveReceipt();
  const rejectMut  = useRejectReceipt();

  async function handleConfirm() {
    if (!confirmId) return;
    if (confirmId.action === 'approve') await approveMut.mutateAsync(confirmId.id);
    else await rejectMut.mutateAsync(confirmId.id);
    setConfirmId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-black">Phiếu Nhập Kho</h1>
        <RoleGuard permission={Permission.RECEIPT_CREATE}>
          <Link to="/receipts/new" className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600">
            <Plus size={13} /> Tạo phiếu nhập
          </Link>
        </RoleGuard>
      </div>

      <PageCard>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#30363d] bg-[#1c2333]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#21262d] border border-[#30363d] rounded-md px-2.5 py-1.5 text-xs text-[#e6edf3] outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Nháp</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-[#1c2333]">
                {['Số phiếu','Ngày nhập','Nhà cung cấp','Dòng hàng','Người lập','Trạng thái','Thao tác'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-[#6e7681] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="text-center py-10 text-sm text-[#6e7681]">Đang tải...</td></tr>}
              {receipts.map((r: any) => (
                <tr key={r.id} className="border-t border-[#30363d] hover:bg-[#1c2333]/40">
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs text-blue-400 whitespace-nowrap">{r.receiptNo}</span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-[#8b949e] whitespace-nowrap">{r.receiptDate?.split('T')[0]}</td>
                  <td className="px-4 py-2.5 text-sm text-[#8b949e] max-w-[160px] truncate">{r.supplier ?? '—'}</td>
                  <td className="px-4 py-2.5 text-sm whitespace-nowrap">{r.items?.length ?? 0} dòng</td>
                  <td className="px-4 py-2.5 text-xs text-[#8b949e] max-w-[120px] truncate">{r.createdBy?.fullName}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 items-center">
                      <Link to={`/receipts/${r.id}`} className="px-2 py-1 text-[11px] rounded bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] whitespace-nowrap">
                        Xem
                      </Link>
                      <RoleGuard permission={Permission.RECEIPT_APPROVE}>
                        {r.status === 'PENDING' && (
                          <>
                            <button onClick={() => setConfirmId({ id: r.id, action: 'approve' })}
                              className="px-2 py-1 text-[11px] rounded bg-green-500/15 text-green-400 hover:bg-green-500/25 whitespace-nowrap">
                              Duyệt
                            </button>
                            <button onClick={() => setConfirmId({ id: r.id, action: 'reject' })}
                              className="px-2 py-1 text-[11px] rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 whitespace-nowrap">
                              Từ chối
                            </button>
                          </>
                        )}
                      </RoleGuard>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !receipts.length && (
                <tr><td colSpan={7} className="text-center py-10 text-sm text-[#6e7681]">Chưa có phiếu nhập nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </PageCard>

      <ConfirmDialog
        open={!!confirmId}
        title={confirmId?.action === 'approve' ? 'Duyệt phiếu nhập?' : 'Từ chối phiếu nhập?'}
        message={confirmId?.action === 'approve'
          ? 'Sau khi duyệt, tồn kho sẽ được cập nhật. Hành động này không thể hoàn tác.'
          : 'Phiếu sẽ bị từ chối và không thể duyệt lại.'}
        variant={confirmId?.action === 'approve' ? 'primary' : 'danger'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmId(null)}
        loading={approveMut.isPending || rejectMut.isPending}
      />
    </div>
  );
}
