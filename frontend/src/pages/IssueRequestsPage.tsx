import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageCard } from '@/components/shared/PeriodSelector';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useIssueRequests } from '@/hooks/useIssueRequests';

export default function IssueRequestsPage() {
  const [status, setStatus] = useState('');
  const { data, isLoading } = useIssueRequests({ status: status || undefined }) as { data: any; isLoading: boolean };
  const items: any[] = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-black">Yêu Cầu Xuất Kho</h1>
        <Link
          to="/my-requests/new"
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
        >
          <Plus size={13} />
          <span className="hidden sm:inline">Gửi yêu cầu mới</span>
          <span className="sm:hidden">Gửi</span>
        </Link>
      </div>

      <PageCard>
        <div className="px-4 py-3 border-b border-[#30363d] bg-[#1c2333]">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-[#21262d] border border-[#30363d] rounded-md px-2.5 py-1.5 text-xs text-[#e6edf3] outline-none"
          >
            <option value="">Tất cả</option>
            <option value="PENDING_APPROVAL">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="bg-[#1c2333]">
                {['Số yêu cầu', 'Ngày', 'Lý do', 'Số mặt hàng', 'Trạng thái', 'Phiếu liên kết'].map((h) => (
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
                  <td className="px-4 py-2.5 text-sm text-[#8b949e] max-w-[200px] truncate">{r.reason}</td>
                  <td className="px-4 py-2.5 text-sm text-center">{r.items?.length ?? 0}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[#8b949e]">
                    {r.issue?.issueNo
                      ? <span className="font-mono text-blue-400">{r.issue.issueNo}</span>
                      : r.rejectReason
                        ? <span className="text-red-400 truncate block max-w-[160px]">Từ chối: {r.rejectReason}</span>
                        : '—'
                    }
                  </td>
                </tr>
              ))}
              {!isLoading && !items.length && (
                <tr><td colSpan={6} className="text-center py-10 text-sm text-[#6e7681]">Chưa có yêu cầu nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </PageCard>
    </div>
  );
}
