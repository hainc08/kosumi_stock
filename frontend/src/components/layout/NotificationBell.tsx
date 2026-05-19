import { Bell } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from '@/hooks/useNotifications';

function formatAgo(input: string) {
  const diff = Date.now() - new Date(input).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'vừa xong';
  if (min < 60) return `${min} phút trước`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} giờ trước`;
  return `${Math.floor(hour / 24)} ngày trước`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: notificationsRaw } = useNotifications() as { data: any };
  const { data: unreadRaw } = useUnreadCount() as { data: any };
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications: any[] = useMemo(() => notificationsRaw?.data ?? notificationsRaw ?? [], [notificationsRaw]);
  const unread = Number(unreadRaw?.count ?? unreadRaw?.data?.count ?? 0);

  async function onOpenItem(item: any) {
    if (!item.isRead) await markRead.mutateAsync(item.id);
    setOpen(false);
    if (item.entityType === 'issue_request' && item.entityId) {
      navigate('/approvals');
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="relative flex items-center justify-center w-8 h-8 rounded-md bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
        aria-label="Thông báo"
      >
        <Bell size={14} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile backdrop */}
          <div className="fixed inset-0 z-30 sm:hidden" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1rem)] max-h-[460px] overflow-y-auto bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl z-40">
            <div className="px-3 py-2 border-b border-[#30363d] flex items-center justify-between sticky top-0 bg-[#161b22]">
              <p className="text-xs font-semibold">Thông báo</p>
              <button
                onClick={() => markAllRead.mutate()}
                className="text-[11px] text-blue-400 hover:underline"
              >
                Đánh dấu tất cả đã đọc
              </button>
            </div>

            <div>
              {!notifications.length && (
                <p className="px-3 py-4 text-xs text-[#6e7681]">Chưa có thông báo</p>
              )}
              {notifications.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onOpenItem(item)}
                  className={`w-full text-left px-3 py-2.5 border-b border-[#21262d] hover:bg-[#1c2333] transition-colors ${!item.isRead ? 'bg-[#1c2333]/50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${item.isRead ? 'bg-transparent' : 'bg-blue-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{item.title}</p>
                      <p className="text-[11px] text-[#8b949e] mt-0.5 line-clamp-2">{item.message}</p>
                      <p className="text-[10px] text-[#6e7681] mt-1">{formatAgo(item.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
