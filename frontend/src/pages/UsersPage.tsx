// src/pages/UsersPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { PageCard } from '@/components/shared/PeriodSelector';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { Role } from '@/types/roles';
import { Plus } from 'lucide-react';

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['users', roleFilter],
    queryFn: () => unwrap(api.get('/users', { params: { role: roleFilter || undefined } })),
  }) as { data: any; isLoading: boolean };

  const users: any[] = Array.isArray(data) ? data : (data?.data ?? []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-black">Người Dùng</h1>
        <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600">
          <Plus size={13} /> Thêm người dùng
        </button>
      </div>

      <PageCard>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#30363d] bg-[#1c2333]">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#21262d] border border-[#30363d] rounded-md px-2.5 py-1.5 text-xs text-[#e6edf3] outline-none"
          >
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="WAREHOUSE_MANAGER">Quản lý kho</option>
            <option value="ACCOUNTANT">Kế toán kho</option>
            <option value="WAREHOUSE_STAFF">Nhân viên kho</option>
            <option value="VIEWER">Người xem</option>
          </select>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-[#1c2333]">
              {['Tên đăng nhập','Họ tên','Email','Vai trò','Trạng thái','Ngày tạo','Thao tác'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-[#6e7681] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="text-center py-10 text-sm text-[#6e7681]">Đang tải...</td></tr>}
            {users.map((u: any) => (
              <tr key={u.id} className="border-t border-[#30363d] hover:bg-[#1c2333]/40">
                <td className="px-4 py-2.5 font-mono text-xs text-blue-400">{u.username}</td>
                <td className="px-4 py-2.5 text-sm">{u.fullName}</td>
                <td className="px-4 py-2.5 text-xs text-[#8b949e]">{u.email}</td>
                <td className="px-4 py-2.5"><RoleBadge role={u.role as Role} /></td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${u.isActive ? 'bg-green-500/15 text-green-400' : 'bg-[#21262d] text-[#6e7681]'}`}>
                    {u.isActive ? 'Hoạt động' : 'Vô hiệu'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-[#6e7681]">{u.createdAt?.split('T')[0]}</td>
                <td className="px-4 py-2.5">
                  <button className="px-2 py-1 text-[11px] rounded bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]">
                    Sửa
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && !users.length && (
              <tr><td colSpan={7} className="text-center py-10 text-sm text-[#6e7681]">Chưa có người dùng</td></tr>
            )}
          </tbody>
        </table>
      </PageCard>
    </div>
  );
}
