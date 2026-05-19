// src/components/guards/RoleGuard.tsx
import { useAuthStore } from '@/stores/auth.store';
import { Permission } from '@/types/roles';

interface RoleGuardProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Hiển thị children nếu user có permission, ngược lại hiển thị fallback (mặc định null).
 *
 * @example
 * <RoleGuard permission={Permission.RECEIPT_APPROVE}>
 *   <Button>Duyệt phiếu</Button>
 * </RoleGuard>
 */
export function RoleGuard({ permission, children, fallback = null }: RoleGuardProps) {
  const can = useAuthStore((s) => s.can);
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}

/** Hook version */
export function usePermission(permission: Permission): boolean {
  return useAuthStore((s) => s.can(permission));
}
