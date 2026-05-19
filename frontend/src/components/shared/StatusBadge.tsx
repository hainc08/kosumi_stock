// src/components/shared/StatusBadge.tsx
import { ReceiptStatus, IssueStatus } from '@/types/models';

type Status = ReceiptStatus | IssueStatus | 'OK' | 'MID' | 'LOW';

const MAP: Record<string, { label: string; cls: string }> = {
  DRAFT:     { label: 'Nháp',       cls: 'bg-[#21262d] text-[#8b949e]' },
  PENDING:   { label: 'Chờ duyệt', cls: 'bg-amber-500/15 text-amber-400' },
  APPROVED:  { label: 'Đã duyệt',  cls: 'bg-green-500/15 text-green-400' },
  CONFIRMED: { label: 'Đã xuất',   cls: 'bg-blue-500/15 text-blue-400' },
  REJECTED:  { label: 'Từ chối',   cls: 'bg-red-500/15 text-red-400' },
  OK:        { label: 'Ổn định',   cls: 'bg-green-500/15 text-green-400' },
  MID:       { label: 'Trung bình',cls: 'bg-amber-500/15 text-amber-400' },
  LOW:       { label: 'Tồn thấp',  cls: 'bg-red-500/15 text-red-400' },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = MAP[status] ?? { label: status, cls: 'bg-[#21262d] text-[#8b949e]' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${config.cls}`}>
      {config.label}
    </span>
  );
}
