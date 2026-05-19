import { Role, Permission, ROLE_LABELS, ROLE_PERMISSIONS } from '@/types/roles';
import { PageCard } from '@/components/shared/PeriodSelector';
import { RoleBadge } from '@/components/shared/RoleBadge';

const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.INVENTORY_READ]: 'Xem tồn kho và báo cáo',
  [Permission.RECEIPT_CREATE]: 'Tạo phiếu nhập',
  [Permission.RECEIPT_APPROVE]: 'Duyệt phiếu nhập',
  [Permission.ISSUE_CREATE]: 'Tạo phiếu xuất',
  [Permission.ISSUE_APPROVE]: 'Duyệt phiếu xuất',
  [Permission.ISSUE_CONFIRM]: 'Xác nhận xuất thực tế',
  [Permission.ISSUE_REQUEST_CREATE]: 'Gửi yêu cầu xuất kho',
  [Permission.ISSUE_REQUEST_REVIEW]: 'Duyệt yêu cầu xuất kho',
  [Permission.NOTIFICATION_READ]: 'Đọc thông báo',
  [Permission.REPORT_EXPORT]: 'Xuất báo cáo Excel',
  [Permission.PRODUCT_MANAGE]: 'Quản lý danh mục vật tư',
  [Permission.USER_MANAGE]: 'Quản lý người dùng',
  [Permission.SYSTEM_CONFIG]: 'Cấu hình hệ thống',
};

const ROLES = [Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.ACCOUNTANT, Role.WAREHOUSE_STAFF, Role.VIEWER];

export default function RolesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black">Phân Quyền Hệ Thống</h1>

      <PageCard title="Ma trận phân quyền">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="bg-[#1c2333]">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#6e7681] uppercase tracking-wide w-56">
                  Chức năng
                </th>
                {ROLES.map((role) => (
                  <th key={role} className="px-3 py-3 text-center text-[10px] font-bold text-[#6e7681] uppercase whitespace-nowrap">
                    <RoleBadge role={role} />
                    <p className="mt-1 text-[9px] text-[#6e7681] font-mono hidden md:block">{ROLE_LABELS[role]}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.values(Permission).map((perm) => (
                <tr key={perm} className="border-t border-[#30363d] hover:bg-[#1c2333]/40">
                  <td className="px-4 py-2.5">
                    <p className="text-sm text-[#8b949e]">{PERMISSION_LABELS[perm]}</p>
                    <p className="text-[10px] font-mono text-[#6e7681] mt-0.5">{perm}</p>
                  </td>
                  {ROLES.map((role) => {
                    const has = ROLE_PERMISSIONS[role].includes(perm);
                    return (
                      <td key={role} className="px-3 py-2.5 text-center">
                        {has
                          ? <span className="text-green-400 text-base" title="Có quyền">✓</span>
                          : <span className="text-[#30363d] text-base">—</span>
                        }
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageCard>
    </div>
  );
}
