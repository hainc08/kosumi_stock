// src/components/shared/RoleBadge.tsx
import { Role, ROLE_LABELS } from '@/types/roles';

const COLORS: Record<Role, string> = {
  [Role.ADMIN]:             'bg-red-500/15 text-red-400',
  [Role.WAREHOUSE_MANAGER]: 'bg-blue-500/15 text-blue-400',
  [Role.ACCOUNTANT]:        'bg-orange-500/15 text-orange-400',
  [Role.WAREHOUSE_STAFF]:   'bg-green-500/15 text-green-400',
  [Role.VIEWER]:            'bg-purple-500/15 text-purple-400',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${COLORS[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
