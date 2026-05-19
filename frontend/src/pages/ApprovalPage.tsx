import { useState } from 'react';
import { PageCard } from '@/components/shared/PeriodSelector';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useApproveRequest, useIssueRequests, useRejectRequest } from '@/hooks/useIssueRequests';

type TabKey = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'REJECTED', label: 'Từ chối' },
];

export default function ApprovalPage() {
  const [status, setStatus] = useState<TabKey>('PENDING_APPROVAL');
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectState, setRejectState] = useState<{ id: string; reason: string } | null>(null);

  const { data, isLoading } = useIssueRequests({ status }) as { data: any; isLoading: boolean };
  const approveMut = useApproveRequest();
  const rejectMut = useRejectRequest();
  const items: any[] = data?.data ?? [];

  async function handleApproveConfirm() {
    if (!approveId) return;
    try {
      const res: any = await approveMut.mutateAsync(approveId);
      const issueNo = res?.issue?.issueNo ?? res?.data?.issue?.issueNo;
      setApproveId(null);
      alert(`Đã duyệt — Phiếu xuất ${issueNo ?? ''} đã được tạo tự động`);
    } catch (e: any) {
      alert(e?.response?.data?.error?.message ?? 'Duyệt thất bại');
    }
  }

  async function handleRejectConfirm() {
    if (!rejectState || !rejectState.reason.trim()) return;
    try {
      await rejectMut.mutateAsync({ id: rejectState.id, rejectReason: rejectState.reason });
      setRejectState(null);
    } catch (e: any) {
      alert(e?.response?.data?.error?.message ?? 'Từ chối thất bại');
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black">Duyệt Yêu Cầu Xuất Kho</h1>

      {/* Tab filter */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatus(tab.key)}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              status === tab.key
                ? 'bg-orange-500 text-white'
                : 'bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <PageCard>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px]">
            <thead>
              <tr className="bg-[#1c2333]">
                {['Số yêu cầu', 'Ngày', 'Người yêu cầu', 'Lý do', 'Số dòng hàng', 'Thao tác'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-[#6e7681] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="text-center py-8 text-sm text-[#6e7681]">Đang tải...</td></tr>
              )}
              {!isLoading && items.map((r) => (
                <tr key={r.id} className="border-t border-[#30363d] hover:bg-[#1c2333]/40">
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs text-blue-400 whitespace-nowrap">{r.requestNo}</span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-[#8b949e] whitespace-nowrap">{r.requestDate?.split('T')[0]}</td>
                  <td className="px-4 py-2.5 text-sm max-w-[140px] truncate">{r.requestedBy?.fullName}</td>
                  <td className="px-4 py-2.5 text-sm max-w-[200px] truncate text-[#8b949e]">{r.reason}</td>
                  <td className="px-4 py-2.5 text-sm text-center">{r.items?.length ?? 0}</td>
                  <td className="px-4 py-2.5">
                    {status === 'PENDING_APPROVAL' ? (
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => setApproveId(r.id)}
                          className="px-2 py-1 text-[11px] rounded bg-green-500/15 text-green-400 hover:bg-green-500/25 whitespace-nowrap"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => setRejectState({ id: r.id, reason: '' })}
                          className="px-2 py-1 text-[11px] rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 whitespace-nowrap"
                        >
                          Từ chối
                        </button>
                      </div>
                    ) : status === 'APPROVED' ? (
                      <span className="font-mono text-xs text-blue-400">{r.issue?.issueNo ?? '—'}</span>
                    ) : (
                      <span className="text-xs text-[#8b949e]">{r.rejectReason ?? '—'}</span>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && !items.length && (
                <tr><td colSpan={6} className="text-center py-10 text-sm text-[#6e7681]">Không có yêu cầu nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </PageCard>

      {/* Approve confirm dialog */}
      <ConfirmDialog
        open={!!approveId}
        title="Duyệt yêu cầu xuất kho?"
        message="Sau khi duyệt, phiếu xuất kho sẽ được tạo tự động từ yêu cầu này."
        variant="primary"
        onConfirm={handleApproveConfirm}
        onCancel={() => setApproveId(null)}
        loading={approveMut.isPending}
      />

      {/* Reject dialog with reason input */}
      {rejectState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-sm p-5">
            <h3 className="text-base font-bold mb-2">Từ chối yêu cầu?</h3>
            <p className="text-sm text-[#8b949e] mb-3">Vui lòng nhập lý do từ chối.</p>
            <textarea
              value={rejectState.reason}
              onChange={(e) => setRejectState((s) => s ? { ...s, reason: e.target.value } : null)}
              placeholder="Lý do từ chối..."
              rows={3}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-orange-500 transition-colors resize-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectState(null)}
                disabled={rejectMut.isPending}
                className="px-4 py-1.5 rounded-md text-sm font-medium bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={rejectMut.isPending || !rejectState.reason.trim()}
                className="px-4 py-1.5 rounded-md text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMut.isPending ? 'Đang xử lý...' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
