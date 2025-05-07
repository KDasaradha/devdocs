import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { SiteConfig, NavItemConfig } from '@/types';

const configPath = path.join(process.cwd(), 'public', 'config.yml');

let configCache: SiteConfig | null = null;

// Helper function to normalize nav paths to be slug-like
const normalizeNavPaths = (navItems: NavItemConfig[]): NavItemConfig[] => {
  return navItems.map(item => {
    const newItem = { ...item };
    if (newItem.path && typeof newItem.path === 'string' && !newItem.path.startsWith('http')) {
      let slug = newItem.path.replace(/\.md$/, ''); // Remove .md extension
      slug = slug.replace(/^\/+|\/+$/g, '');     // Remove leading/trailing slashes
      slug = slug.replace(/\\/g, '/');           // Normalize to forward slashes

      // If it's an index file (e.g., "foo/index" or "index"), convert to directory slug or root "index"
      if (path.basename(slug).toLowerCase() === 'index') {
        slug = path.dirname(slug);
        if (slug === '.' || slug === '') { // handles "index" or "/index" becoming "." or ""
          slug = 'index';
        }
      } else if (slug === '') { // handles "/" or an empty path becoming ""
        slug = 'index';
      }
      
      newItem.path = slug;
    }
    if (newItem.children) {
      newItem.children = normalizeNavPaths(newItem.children); // Recurse
    }
    return newItem;
  });
};


export function loadConfig(): SiteConfig {
  if (process.env.NODE_ENV === 'production' && configCache) {
    return configCache;
  }
  try {
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const rawConfig = yaml.load(fileContents) as any; 

    const config: SiteConfig = {
      site_name: rawConfig.site_name || "DevDocs++",
      nav: Array.isArray(rawConfig.nav) ? rawConfig.nav : [],
      theme: {
        default: rawConfig.theme?.default || "system",
        options: Array.isArray(rawConfig.theme?.options) ? rawConfig.theme.options : ["light", "dark", "system"],
      },
      search: {
        enabled: typeof rawConfig.search?.enabled === 'boolean' ? rawConfig.search.enabled : true,
      },
    };
    
    config.nav = normalizeNavPaths(config.nav);

    if (process.env.NODE_ENV === 'production') {
      configCache = config;
    }
    return config;
  } catch (error) {
    console.error("Error loading or parsing config.yml:", error);
    // Provide a default fallback configuration
    return {
      site_name: "DevDocs++ (Error)",
      nav: [{ title: "Home", path: "index" }],
      theme: { default: "system", options: ["light", "dark"] },
      search: { enabled: false },
    };
  }
}
