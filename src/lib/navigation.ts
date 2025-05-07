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
      // Only add items with a valid internal path to the flattened list for prev/next
      if (item.path && typeof item.path === 'string' && !item.path.startsWith('http')) {
        // Exclude paths containing '#' as they are likely section links within a page
        if (!item.path.includes('#')) {
            pages.push({ title: item.title, path: item.path });
        }
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
    // Current slug might be a section link, try finding the base page
    const baseSlug = currentSlug.split('#')[0];
     const baseIndex = flattenedNav.findIndex(page => page.path === baseSlug);
     if(baseIndex === -1) {
        return { prev: null, next: null }; // Base page not found either
     }
     const prev = baseIndex > 0 ? flattenedNav[baseIndex - 1] : null;
     const next = baseIndex < flattenedNav.length - 1 ? flattenedNav[baseIndex + 1] : null;
     return { prev, next };
  }

  const prev = currentIndex > 0 ? flattenedNav[currentIndex - 1] : null;
  const next = currentIndex < flattenedNav.length - 1 ? flattenedNav[currentIndex + 1] : null;
  
  return { prev, next };
}

// Generates the href for a navigation item's path
export function getNavLinkHref(pagePath: string | undefined): string {
  if (!pagePath) {
    return '#'; // No path defined
  }
  if (pagePath.startsWith('http')) {
    return pagePath; // External link
  }
  // Handle internal paths including potential anchors
  const [slugPart, anchorPart] = pagePath.split('#');
  const baseHref = slugPart === 'index' || slugPart === '' ? '/' : `/${slugPart}`;
  
  return anchorPart ? `${baseHref}#${anchorPart}` : baseHref;
}