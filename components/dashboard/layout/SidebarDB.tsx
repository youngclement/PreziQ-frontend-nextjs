'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavGroup } from '@/components/dashboard/layout/NavGroup';
import { NavUser } from '@/components/dashboard/layout/NavUser';
import Logo from './logo';
import { useAuth } from '@/contexts/auth-context';
import { useGenerateSidebarData } from '../data/sidebarData';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  // Generate sidebar data based on current user using hook with language context
  const sidebarData = useGenerateSidebarData(user);

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader className='flex items-left justify-center py-4'>
        <Logo variant='minimal' size='md' />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...(props as any)} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
