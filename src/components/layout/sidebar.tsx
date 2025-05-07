import { NavMenu } from '@/components/navigation/nav-menu';
import type { NavItemConfig } from '@/types';

interface SidebarProps {
  navItems: NavItemConfig[];
}

export function Sidebar({ navItems }: SidebarProps) {
  return (
    // Reduced width: w-52 -> w-44 (~11rem), lg:w-56 -> lg:w-48 (~12rem)
    <aside className="hidden md:block fixed top-16 z-30 h-[calc(100vh-4rem)] w-44 lg:w-48 shrink-0 overflow-y-auto border-r py-6"> 
      <NavMenu navItems={navItems} />
    </aside>
  );
}
