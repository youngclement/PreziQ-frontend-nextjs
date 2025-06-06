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
          {
            title: 'Thành tựu',
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
