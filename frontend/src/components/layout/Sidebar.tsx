import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { Permission, ROLE_LABELS } from '@/types/roles';
import { useIssueRequests } from '@/hooks/useIssueRequests';
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
  BarChart3,
  Users,
  ShieldCheck,
  LogOut,
  Boxes,
  ClipboardList,
  CheckSquare,
  X,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  permission?: Permission;
  badge?: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const BASE = 'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors';
const IDLE = 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]';
const ACTV = 'bg-orange-500/15 text-orange-400';

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuthStore();
  const logout = useLogout();
  const can = useAuthStore((s) => s.can);

  const { data: pendingRaw } = useIssueRequests({ status: 'PENDING_APPROVAL' }) as { data: any };
  const pendingCount = Number(pendingRaw?.meta?.total ?? (pendingRaw?.data?.length ?? 0));

  const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
    {
      label: 'Tổng quan',
      items: [{ to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> }],
    },
    {
      label: 'Nghiệp vụ',
      items: [
        { to: '/receipts', label: 'Phiếu Nhập Kho', icon: <ArrowDownToLine size={15} />, permission: Permission.RECEIPT_CREATE },
        { to: '/issues', label: 'Phiếu Xuất Kho', icon: <ArrowUpFromLine size={15} />, permission: Permission.ISSUE_CREATE },
        { to: '/my-requests', label: 'Yêu cầu xuất kho', icon: <ClipboardList size={15} />, permission: Permission.ISSUE_REQUEST_CREATE },
        {
          to: '/approvals',
          label: 'Duyệt yêu cầu',
          icon: <CheckSquare size={15} />,
          permission: Permission.ISSUE_REQUEST_REVIEW,
          badge: pendingCount,
        },
        { to: '/inventory', label: 'Tồn Kho', icon: <Boxes size={15} />, permission: Permission.INVENTORY_READ },
      ],
    },
    {
      label: 'Danh mục',
      items: [{ to: '/products', label: 'Vật Tư / Hàng Hóa', icon: <Package size={15} />, permission: Permission.PRODUCT_MANAGE }],
    },
    {
      label: 'Báo cáo',
      items: [{ to: '/reports', label: 'Báo Cáo Tồn Kho', icon: <BarChart3 size={15} />, permission: Permission.INVENTORY_READ }],
    },
    {
      label: 'Hệ thống',
      items: [
        { to: '/users', label: 'Người Dùng', icon: <Users size={15} />, permission: Permission.USER_MANAGE },
        { to: '/roles', label: 'Phân Quyền', icon: <ShieldCheck size={15} />, permission: Permission.USER_MANAGE },
      ],
    },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-60 bg-[#161b22] border-r border-[#30363d] flex flex-col z-40 transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[#30363d]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
          WM
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">WarehousePro</p>
          <p className="text-[10px] text-[#6e7681]">Quản lý kho nội bộ</p>
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-1 rounded-md text-[#6e7681] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors"
          aria-label="Đóng menu"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {NAV_GROUPS.map((group) => {
          const visible = group.items.filter((i) => !i.permission || can(i.permission));
          if (!visible.length) return null;
          return (
            <div key={group.label} className="mb-3">
              <p className="px-2 py-1 text-[10px] font-bold text-[#6e7681] uppercase tracking-widest">{group.label}</p>
              {visible.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) => `${BASE} ${isActive ? ACTV : IDLE} mb-0.5`}
                >
                  {item.icon}
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="text-[10px] min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-center leading-4 flex-shrink-0">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-2 border-t border-[#30363d]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.fullName?.charAt(0) ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{user?.fullName}</p>
            <p className="text-[10px] text-[#6e7681]">{user ? ROLE_LABELS[user.role] : ''}</p>
          </div>
          <button
            onClick={logout}
            className="text-[#6e7681] hover:text-[#f85149] transition-colors p-1"
            title="Đăng xuất"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
