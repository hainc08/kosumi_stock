import { useLocation, Link } from 'react-router-dom';
import { Menu, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

interface TopbarProps {
  onMenuToggle: () => void;
}

const PAGE_MAP: Record<string, { title: string; crumb: string }> = {
  '/dashboard': { title: 'Dashboard', crumb: 'Tổng quan' },
  '/receipts': { title: 'Phiếu Nhập Kho', crumb: 'Nghiệp vụ › Nhập kho' },
  '/issues': { title: 'Phiếu Xuất Kho', crumb: 'Nghiệp vụ › Xuất kho' },
  '/inventory': { title: 'Tồn Kho', crumb: 'Tồn kho hiện tại' },
  '/products': { title: 'Vật Tư / Hàng Hóa', crumb: 'Danh mục › Vật tư' },
  '/my-requests': { title: 'Yêu Cầu Xuất Kho', crumb: 'Nghiệp vụ › Yêu cầu xuất kho' },
  '/approvals': { title: 'Duyệt Yêu Cầu', crumb: 'Nghiệp vụ › Duyệt yêu cầu' },
  '/reports': { title: 'Báo Cáo Tồn Kho', crumb: 'Báo cáo › Tổng hợp' },
  '/users': { title: 'Người Dùng', crumb: 'Hệ thống › Người dùng' },
  '/roles': { title: 'Phân Quyền', crumb: 'Hệ thống › Phân quyền' },
};

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { pathname } = useLocation();
  const base = '/' + pathname.split('/')[1];
  const page = PAGE_MAP[base] ?? { title: 'WMS', crumb: '' };

  return (
    <header className="flex-shrink-0 h-14 bg-[#161b22] border-b border-[#30363d] flex items-center px-4 gap-3">
      {/* Hamburger - mobile only */}
      <button
        onClick={onMenuToggle}
        className="md:hidden flex items-center justify-center w-8 h-8 rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors flex-shrink-0"
        aria-label="Mở menu"
      >
        <Menu size={18} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-bold leading-tight truncate">{page.title}</h1>
        <p className="text-[11px] text-[#6e7681] font-mono hidden sm:block truncate">{page.crumb}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <NotificationBell />
        <Link
          to="/receipts/new"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#21262d] border border-[#30363d] text-xs font-semibold text-[#8b949e] hover:text-[#e6edf3] transition-colors"
        >
          <ArrowDownToLine size={13} />
          <span className="hidden sm:inline">Nhập kho</span>
        </Link>
        <Link
          to="/issues/new"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
        >
          <ArrowUpFromLine size={13} />
          <span className="hidden sm:inline">Xuất kho</span>
        </Link>
      </div>
    </header>
  );
}
