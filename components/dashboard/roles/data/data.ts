import {
  IconShield,
  IconUserShield,
  IconUsersGroup,
} from '@tabler/icons-react';
import { ComponentType } from 'react';

interface Option {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
}

export const roleStatuses: Option[] = [
  { label: 'Hoạt động', value: 'active' },
  { label: 'Không hoạt động', value: 'inactive' },
];

export const roleLevels = [
  {
    value: 'high',
    label: 'Cao',
  },
  {
    value: 'medium',
    label: 'Trung bình',
  },
  {
    value: 'low',
    label: 'Thấp',
  },
] as const;

export const roleTypes: Option[] = [
  {
    label: 'Superadmin',
    value: 'superadmin',
    icon: IconShield,
  },
  {
    label: 'Admin',
    value: 'admin',
    icon: IconUserShield,
  },
  {
    label: 'Manager',
    value: 'manager',
    icon: IconUsersGroup,
  },
];

export const modulePermissions: Record<
  string,
  {
    label: string;
    permissions: readonly ('create' | 'read' | 'update' | 'delete')[];
  }
> = {
  users: {
    label: 'Người dùng',
    permissions: ['create', 'read', 'update', 'delete'],
  },
  roles: {
    label: 'Vai trò',
    permissions: ['create', 'read', 'update', 'delete'],
  },
  products: {
    label: 'Sản phẩm',
    permissions: ['create', 'read', 'update', 'delete'],
  },
  categories: {
    label: 'Danh mục',
    permissions: ['create', 'read', 'update', 'delete'],
  },
  orders: {
    label: 'Đơn hàng',
    permissions: ['create', 'read', 'update', 'delete'],
  },
  customers: {
    label: 'Khách hàng',
    permissions: ['create', 'read', 'update', 'delete'],
  },
} as const;

export type ModuleType = keyof typeof modulePermissions; 