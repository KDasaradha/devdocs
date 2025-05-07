
"use client"; // Mark this component as a Client Component

import dynamic from 'next/dynamic';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { NavMenu } from '@/components/navigation/nav-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SiteLogo } from './site-logo'; // Keep SiteLogo import if needed here
import type { NavItemConfig } from '@/types';

// Dynamically import SearchBar with SSR disabled
const SearchBar = dynamic(() => import('@/components/search/search-bar').then(mod => mod.SearchBar), {
  ssr: false,
  loading: () => <div className="w-full max-w-xs h-9 bg-muted rounded-md animate-pulse"></div>, // Optional loading state
});

// Dynamically import mobile SearchBar as well
const MobileSearchBar = dynamic(() => import('@/components/search/search-bar').then(mod => mod.SearchBar), {
    ssr: false,
    // Simple placeholder for mobile sheet
    loading: () => <div className="w-full h-9 bg-muted rounded-md animate-pulse"></div>,
});

interface HeaderClientContentProps {
  siteName: string;
  navItems: NavItemConfig[];
}

export function HeaderClientContent({ siteName, navItems }: HeaderClientContentProps) {
  return (
    <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
      {/* Desktop Search Bar (Lazy Loaded) */}
      <div className="hidden md:flex">
        <SearchBar />
      </div>
      <ThemeToggle />
      {/* Mobile Navigation Sheet */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 pt-6 flex flex-col">
             {/* Re-add SheetTitle for accessibility */}
             <SheetHeader className="px-4 pb-4 border-b">
               <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
               <SiteLogo siteName={siteName} />
               {/* Mobile Search Bar (Lazy Loaded) */}
               <div className="mt-4">
                 <MobileSearchBar />
               </div>
             </SheetHeader>
             <div className="flex-1 overflow-y-auto p-4">
               <NavMenu navItems={navItems} />
             </div>
           </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
