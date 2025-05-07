import { NavMenu } from '@/components/navigation/nav-menu';
import type { NavItemConfig } from '@/types';

interface SidebarProps {
  navItems: NavItemConfig[];
}

export function Sidebar({ navItems }: SidebarProps) {
  return (
    // Reduced width further: w-44 -> w-40 (~10rem), lg:w-48 -> lg:w-44 (~11rem)
    // Adjusted top-16 and h-[calc(100vh-4rem)] to match header height (h-16 / 4rem)
    <aside className="hidden md:block fixed top-16 z-30 h-[calc(100vh-4rem)] w-40 lg:w-44 shrink-0 overflow-y-auto border-r py-6 pr-4"> 
      <NavMenu navItems={navItems} />
    </aside>
  );
}