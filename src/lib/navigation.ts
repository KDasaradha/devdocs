import type { NavItemConfig } from '@/types';

export interface NavPage {
  title: string;
  path: string; // Stores the "slug" form: 'index', 'about', 'guides/getting-started'
}

// Flattens the navigation structure into a list of pages with paths suitable for prev/next
export function flattenNavigation(navItems: NavItemConfig[]): NavPage[] {
  const pages: NavPage[] = [];
  function recurse(items: NavItemConfig[], currentPathPrefix: string = '') {
    for (const item of items) {
      // Only consider items with a valid internal path for prev/next navigation
      if (item.path && typeof item.path === 'string' && !item.path.startsWith('http') && !item.path.includes('#')) {
        pages.push({ title: item.title, path: item.path });
      }
      // Recurse into children
      if (item.children) {
        // Determine the path prefix for children if the parent has a path
        // Note: This assumes children paths are relative or absolute slugs, not section links
        const childPathPrefix = item.path && !item.path.includes('#') ? item.path : currentPathPrefix;
        recurse(item.children, childPathPrefix);
      }
    }
  }
  recurse(navItems);
  return pages;
}

// Finds the previous and next page in the flattened navigation list based on SLUG only (ignores anchors)
export function getPrevNextPages(
  currentSlug: string,
  navItems: NavItemConfig[]
): { prev: NavPage | null; next: NavPage | null } {
  // Flatten the navigation structure to get a linear list of navigable pages
  const flattenedNav = flattenNavigation(navItems);
  
  // Find the index of the current page based purely on its slug (ignore any #anchor part)
  const baseSlug = currentSlug.split('#')[0]; 
  const currentIndex = flattenedNav.findIndex(page => page.path === baseSlug);

  if (currentIndex === -1) {
     console.warn(`Current base slug "${baseSlug}" not found in flattened navigation for prev/next.`);
     return { prev: null, next: null }; // Page not found in nav structure
  }

  // Determine previous and next pages based on the found index
  const prev = currentIndex > 0 ? flattenedNav[currentIndex - 1] : null;
  const next = currentIndex < flattenedNav.length - 1 ? flattenedNav[currentIndex + 1] : null;
  
  return { prev, next };
}

// Generates the href for a navigation link based on the path defined in config.yml
export function getNavLinkHref(pagePath: string | undefined): string {
  if (!pagePath || typeof pagePath !== 'string') {
    console.warn("getNavLinkHref called with invalid pagePath:", pagePath);
    return '#'; // Return a non-functional link for undefined paths
  }
  
  // Handle external links directly
  if (pagePath.startsWith('http://') || pagePath.startsWith('https://')) {
    return pagePath;
  }

  // Handle internal paths (slugs with optional anchors)
  const [slugPart, anchorPart] = pagePath.split('#');
  
  // Construct base href from slug: '/' for 'index', '/slug' otherwise
  const baseHref = slugPart === 'index' ? '/' : `/${slugPart}`;
  
  // Append anchor if present
  return anchorPart ? `${baseHref}#${anchorPart}` : baseHref;
}
