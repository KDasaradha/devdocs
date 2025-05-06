import { NavMenu } from '@/components/navigation/nav-menu';
import type { NavItemConfig } from '@/types';

interface SidebarProps {
  navItems: NavItemConfig[];
}

export function Sidebar({ navItems }: SidebarProps) {
  return (
    <aside className="hidden md:block fixed top-16 z-30 h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r py-6 lg:w-72">
        <NavMenu navItems={navItems} />
    </aside>
  );
}
