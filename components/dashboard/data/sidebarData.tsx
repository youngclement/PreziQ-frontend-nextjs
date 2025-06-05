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

// TypeScript interface definitions
interface User {
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
  user: User;
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
