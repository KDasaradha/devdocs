import type { NavItemConfig } from '@/types';

export interface NavPage {
  title: string;
  path: string; // Stores the "slug" form: 'index', 'about', 'guides/getting-started'
}

// Flattens the navigation structure into a list of pages with paths
export function flattenNavigation(navItems: NavItemConfig[]): NavPage[] {
  const pages: NavPage[] = [];
  function recurse(items: NavItemConfig[]) {
    for (const item of items) {
      if (item.path && typeof item.path === 'string' && !item.path.startsWith('http')) {
        pages.push({ title: item.title, path: item.path });
      }
      if (item.children) {
        recurse(item.children);
      }
    }
  }
  recurse(navItems);
  return pages;
}

// Finds the previous and next page in the flattened navigation list
export function getPrevNextPages(
  currentSlug: string,
  navItems: NavItemConfig[]
): { prev: NavPage | null; next: NavPage | null } {
  const flattenedNav = flattenNavigation(navItems);
  const currentIndex = flattenedNav.findIndex(page => page.path === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  const prev = currentIndex > 0 ? flattenedNav[currentIndex - 1] : null;
  const next = currentIndex < flattenedNav.length - 1 ? flattenedNav[currentIndex + 1] : null;
  
  return { prev, next };
}

// Generates the href for a navigation item's path
export function getNavLinkHref(pagePath: string | undefined): string {
  if (!pagePath || pagePath.startsWith('http')) {
    return pagePath || '#'; // External link or no path
  }
  // For internal paths like 'index', 'about', 'guides/getting-started'
  // Convert 'index' to '/' and prefix others with '/'
  return pagePath === 'index' ? '/' : `/${pagePath}`;
}