// src/types/roles.ts
// ĐỒNG BỘ với backend/src/types/roles.ts

export enum Role {
  ADMIN             = 'ADMIN',
  WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER',
  ACCOUNTANT        = 'ACCOUNTANT',
  WAREHOUSE_STAFF   = 'WAREHOUSE_STAFF',
  VIEWER            = 'VIEWER',
}

export enum Permission {
  INVENTORY_READ  = 'inventory:read',
  RECEIPT_CREATE  = 'receipt:create',
  RECEIPT_APPROVE = 'receipt:approve',
  ISSUE_CREATE    = 'issue:create',
  ISSUE_APPROVE   = 'issue:approve',
  ISSUE_CONFIRM   = 'issue:confirm_actual',
  ISSUE_REQUEST_CREATE = 'issue_request:create',
  ISSUE_REQUEST_REVIEW = 'issue_request:review',
  NOTIFICATION_READ    = 'notification:read',
  REPORT_EXPORT   = 'report:export',
  PRODUCT_MANAGE  = 'product:manage',
  USER_MANAGE     = 'user:manage',
  SYSTEM_CONFIG   = 'system:config',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission),
  [Role.WAREHOUSE_MANAGER]: [
    Permission.INVENTORY_READ, Permission.RECEIPT_CREATE, Permission.RECEIPT_APPROVE,
    Permission.ISSUE_CREATE, Permission.ISSUE_APPROVE, Permission.ISSUE_CONFIRM,
    Permission.ISSUE_REQUEST_REVIEW, Permission.NOTIFICATION_READ,
    Permission.REPORT_EXPORT, Permission.PRODUCT_MANAGE,
  ],
  [Role.ACCOUNTANT]: [
    Permission.INVENTORY_READ, Permission.RECEIPT_CREATE, Permission.ISSUE_CREATE, Permission.NOTIFICATION_READ, Permission.REPORT_EXPORT,
  ],
  [Role.WAREHOUSE_STAFF]: [Permission.INVENTORY_READ, Permission.ISSUE_CONFIRM, Permission.ISSUE_REQUEST_CREATE, Permission.NOTIFICATION_READ],
  [Role.VIEWER]: [Permission.INVENTORY_READ, Permission.NOTIFICATION_READ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]:             'Quản trị viên',
  [Role.WAREHOUSE_MANAGER]: 'Quản lý kho',
  [Role.ACCOUNTANT]:        'Kế toán kho',
  [Role.WAREHOUSE_STAFF]:   'Nhân viên kho',
  [Role.VIEWER]:            'Người xem',
};
