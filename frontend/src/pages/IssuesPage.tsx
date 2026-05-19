// src/pages/IssuesPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIssues, useApproveIssue, useRejectIssue } from '@/hooks/useIssues';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageCard } from '@/components/shared/PeriodSelector';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { Permission } from '@/types/roles';
import { Plus } from 'lucide-react';

export default function IssuesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmId, setConfirmId] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);

  const { data, isLoading } = useIssues({ status: statusFilter || undefined }) as { data: any; isLoading: boolean };
  const issues: any[] = data?.data ?? [];

  const approveMut = useApproveIssue();
  const rejectMut  = useRejectIssue();

  async function handleConfirm() {
    if (!confirmId) return;
    if (confirmId.action === 'approve') await approveMut.mutateAsync(confirmId.id);
    else await rejectMut.mutateAsync(confirmId.id);
    setConfirmId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-black">Phiếu Xuất Kho</h1>
        <RoleGuard permission={Permission.ISSUE_CREATE}>
          <Link to="/issues/new" className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600">
            <Plus size={13} /> Tạo phiếu xuất
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
            <option value="CONFIRMED">Đã xuất</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-[#1c2333]">
                {['Số phiếu','Ngày xuất','Người nhận','Bộ phận','Người lập','Trạng thái','Thao tác'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-[#6e7681] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="text-center py-10 text-sm text-[#6e7681]">Đang tải...</td></tr>}
              {issues.map((issue: any) => (
                <tr key={issue.id} className="border-t border-[#30363d] hover:bg-[#1c2333]/40">
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs text-blue-400 whitespace-nowrap">{issue.issueNo}</span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-[#8b949e] whitespace-nowrap">{issue.issueDate?.split('T')[0]}</td>
                  <td className="px-4 py-2.5 text-sm text-[#8b949e] max-w-[140px] truncate">{issue.recipient ?? '—'}</td>
                  <td className="px-4 py-2.5 text-sm text-[#8b949e] max-w-[120px] truncate">{issue.department ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-[#8b949e] max-w-[120px] truncate">{issue.createdBy?.fullName}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={issue.status} /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 items-center">
                      <Link to={`/issues/${issue.id}`} className="px-2 py-1 text-[11px] rounded bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] whitespace-nowrap">
                        Xem
                      </Link>
                      <RoleGuard permission={Permission.ISSUE_APPROVE}>
                        {issue.status === 'PENDING' && (
                          <>
                            <button onClick={() => setConfirmId({ id: issue.id, action: 'approve' })}
                              className="px-2 py-1 text-[11px] rounded bg-green-500/15 text-green-400 hover:bg-green-500/25 whitespace-nowrap">
                              Duyệt
                            </button>
                            <button onClick={() => setConfirmId({ id: issue.id, action: 'reject' })}
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
              {!isLoading && !issues.length && (
                <tr><td colSpan={7} className="text-center py-10 text-sm text-[#6e7681]">Chưa có phiếu xuất nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </PageCard>

      <ConfirmDialog
        open={!!confirmId}
        title={confirmId?.action === 'approve' ? 'Duyệt phiếu xuất?' : 'Từ chối phiếu xuất?'}
        message={confirmId?.action === 'approve'
          ? 'Sau khi duyệt, nhân viên kho có thể xác nhận xuất thực tế.'
          : 'Phiếu sẽ bị từ chối.'}
        variant={confirmId?.action === 'approve' ? 'primary' : 'danger'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmId(null)}
        loading={approveMut.isPending || rejectMut.isPending}
      />
    </div>
  );
}
