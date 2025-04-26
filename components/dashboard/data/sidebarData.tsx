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
} from 'lucide-react';
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react';
import { NavItem, NavGroup } from '@/components/dashboard/layout/NavGroup';
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

export const sidebarData: SidebarData = {
  user: {
    name: 'người dùng',
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
      name: 'Công ty ABC',
      logo: GalleryVerticalEnd,
      plan: 'Doanh nghiệp',
    },
    {
      name: 'Startup XYZ',
      logo: AudioWaveform,
      plan: 'Khởi nghiệp',
    },
  ],
  navGroups: [
    {
      title: 'Chung',
      items: [
        {
          title: 'Bảng điều khiển',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Trò chuyện',
          url: '/dashboard/chats',
          icon: MessageSquare,
        },
      ],
    },
    {
      title: 'Quản trị',
      items: [
        {
          title: 'Vai trò',
          url: '/dashboard/roles',
          icon: Package,
        },
        {
          title: 'Quyền hạn',
          url: '/dashboard/permissions',
          icon: ShieldAlert,
        },
        {
          title: 'Người dùng',
          url: '/dashboard/users',
          icon: Users,
        },
      ],
    },
  ],
};
