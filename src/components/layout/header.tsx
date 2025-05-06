import { SiteLogo } from './site-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SearchBar } from '@/components/search/search-bar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { NavMenu } from '@/components/navigation/nav-menu';
import type { NavItemConfig } from '@/types';

interface HeaderProps {
  siteName: string;
  navItems: NavItemConfig[];
}

export function Header({ siteName, navItems }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-screen-2xl px-4 md:px-8">
        <div className="flex items-center">
          <SiteLogo siteName={siteName} />
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
          <div className="hidden md:flex">
            <SearchBar />
          </div>
          <ThemeToggle />
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4">
                <div className="mb-4">
                   <SiteLogo siteName={siteName} />
                </div>
                <SearchBar />
                <div className="mt-4">
                  <NavMenu navItems={navItems} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
