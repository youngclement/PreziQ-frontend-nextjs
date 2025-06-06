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

// Function to generate sidebar data based on user from API
export const generateSidebarData = (user: User | null): SidebarData => {
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

        name: t('companyABC'),
        logo: GalleryVerticalEnd,
        plan: t('enterprise'),
      },
      {
        name: t('startupXYZ'),
        logo: AudioWaveform,
        plan: t('startup'),

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

// Export static data for backward compatibility (deprecated)
export const sidebarData: SidebarData = generateSidebarData(null);
