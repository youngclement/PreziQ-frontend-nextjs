import {
  ShieldAlert,
  LayoutDashboard,
  Bug,
  ListChecks,
  Lock,
  LockOpen,
  MessageSquare,
  Bell,
  Package,
  Palette,
  ServerOff,
  Settings,
  Wrench,
  UserCog,
  UserX,
  Users,
  XCircle,
  HelpCircle,
  BookCheck,
  ListTodo,
  TicketPercent,
  DollarSign,
  Award,
} from 'lucide-react';
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react';
import { NavItem, NavGroup } from '@/components/dashboard/layout/NavGroup';

import { useLanguage } from '@/contexts/language-context';

import { User } from '@/models/auth';

// TypeScript interface definitions
interface SidebarUser {
  name: string;
  email: string;
  avatar: string;
}

interface Team {
  name: string;
  logo: React.ComponentType;
  plan: string;
}

interface SidebarData {
  user: SidebarUser;
  teams: Team[];
  navGroups: NavGroup[];
}

export const useSidebarData = () => {
  const { t } = useLanguage();

  return {
    user: {
      name: t('user'),
      email: 'user@example.com',
      avatar: '/avatars/shadcn.jpg',
    },
  };
};

// Hook để tạo sidebar data sử dụng context
export const useGenerateSidebarData = (user: User | null): SidebarData => {
  const { t } = useLanguage();

  // Default user data if no user is provided
  const defaultUser: SidebarUser = {
    name: t('user'),
    email: 'user@example.com',
    avatar: '/avatars/shadcn.jpg',
  };

  // Generate user data from API user
  const sidebarUser: SidebarUser = user
    ? {
      name: `${user.firstName} ${user.lastName}`.trim() || t('user'),
      email: user.email || 'user@example.com',
      avatar: '/avatars/shadcn.jpg', // Có thể thêm avatar URL từ API sau
    }
    : defaultUser;

  return {
    user: sidebarUser,
    teams: [
      {
        name: 'PreziQ Admin',
        logo: Command,
        plan: 'Next + ShadcnUI',
      },
      {
        name: 'Company ABC',
        logo: GalleryVerticalEnd,
        plan: t('enterprise') || 'Enterprise',
      },
      {
        name: 'Startup XYZ',
        logo: AudioWaveform,
        plan: 'Startup',
      },
    ],
    navGroups: [
      {
        title: t('general'),
        items: [
          {
            title: t('dashboard'),
            url: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            title: t('chat'),
            url: '/dashboard/chats',
            icon: MessageSquare,
          },
        ],
      },
      {
        title: t('administration'),
        items: [
          {
            title: t('roles'),
            url: '/dashboard/roles',
            icon: Package,
          },
          {
            title: t('permissions'),
            url: '/dashboard/permissions',
            icon: ShieldAlert,
          },
          {
            title: t('users'),
            url: '/dashboard/users',
            icon: Users,
          },
          {
            title: t('achievements'),
            url: '/dashboard/achievements',
            icon: Award,
          },
        ],
      },
    ],
  };
};

// Function to generate sidebar data based on user from API (deprecated - sử dụng hook thay thế)
export const generateSidebarData = (
  user: User | null,
  t?: (key: string) => string
): SidebarData => {
  // Default user data if no user is provided
  const defaultUser: SidebarUser = {
    name: 'Người dùng',
    email: 'user@example.com',
    avatar: '/avatars/shadcn.jpg',
  };

  // Generate user data from API user
  const sidebarUser: SidebarUser = user
    ? {
      name: `${user.firstName} ${user.lastName}`.trim() || 'Người dùng',
      email: user.email || 'user@example.com',
      avatar: '/avatars/shadcn.jpg', // Có thể thêm avatar URL từ API sau
    }
    : defaultUser;

  return {
    user: sidebarUser,
    teams: [
      {
        name: 'PreziQ Admin',
        logo: Command,
        plan: 'Next + ShadcnUI',
      },
      {
        name: t ? t('companyABC') : 'Company ABC',
        logo: GalleryVerticalEnd,
        plan: t ? t('enterprise') : 'Enterprise',
      },
      {
        name: t ? t('startupXYZ') : 'Startup XYZ',
        logo: AudioWaveform,
        plan: t ? t('startup') : 'Startup',
      },
    ],
    navGroups: [
      {
        title: t ? t('general') : 'Tổng quan',
        items: [
          {
            title: t ? t('dashboard') : 'Dashboard',

            url: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            title: t ? t('chat') : 'Chat',

            url: '/dashboard/chats',
            icon: MessageSquare,
          },
        ],
      },
      {
        title: t ? t('administration') : 'Quản trị',
        items: [
          {
            title: t ? t('roles') : 'Vai trò',

            url: '/dashboard/roles',
            icon: Package,
          },
          {
            title: t ? t('permissions') : 'Quyền',

            url: '/dashboard/permissions',
            icon: ShieldAlert,
          },
          {
            title: t ? t('users') : 'Người dùng',

            url: '/dashboard/users',
            icon: Users,
          },
          {
            title: t ? t('achievements') : 'Thành tích',

            url: '/dashboard/achievements',
            icon: Award,
          },
        ],
      },
    ],
  };
};

// Export static data for backward compatibility (deprecated)
export const sidebarData: SidebarData = generateSidebarData(null);
