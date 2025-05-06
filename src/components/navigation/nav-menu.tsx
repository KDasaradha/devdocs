import type { NavItemConfig } from '@/types';
import { NavItem } from './nav-item';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavMenuProps {
  navItems: NavItemConfig[];
}

export function NavMenu({ navItems }: NavMenuProps) {
  return (
    <ScrollArea className="h-full pr-2">
      <nav aria-label="Main navigation">
        <ul className="space-y-1 py-2">
          {navItems.map((item, index) => (
            <li key={index}>
              <NavItem item={item} />
            </li>
          ))}
        </ul>
      </nav>
    </ScrollArea>
  );
}
