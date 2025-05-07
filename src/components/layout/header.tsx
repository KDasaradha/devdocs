
import { SiteLogo } from './site-logo';
import type { NavItemConfig } from '@/types';
import { HeaderClientContent } from './header-client-content'; // Import the new client component

interface HeaderProps {
  siteName: string;
  navItems: NavItemConfig[];
}

// Header remains a Server Component
export function Header({ siteName, navItems }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-screen-2xl px-4 md:px-8">
        <div className="flex items-center">
          <SiteLogo siteName={siteName} />
        </div>
        {/* Render the client-side parts via the new component */}
        <HeaderClientContent siteName={siteName} navItems={navItems} />
      </div>
    </header>
  );
}
