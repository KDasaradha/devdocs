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
      // Remove .md extension
      let cleanPath = newItem.path.replace(/\.md$/, '');
      // Remove leading/trailing slashes to ensure it's a "slug"
      cleanPath = cleanPath.replace(/^\/+|\/+$/g, '');
      
      // If after stripping slashes, it's empty, and original was a form of index (e.g., "/", "index", "/index"), set to 'index'
      if (cleanPath === '' && (newItem.path === '/' || newItem.path.toLowerCase() === 'index' || newItem.path.toLowerCase() === '/index')) {
        cleanPath = 'index';
      }
      // If path is still empty and it wasn't an index-like path, it might be an error or intentional empty path. For safety, treat as unlinked.
      // However, config.yml paths should be meaningful slugs.
      newItem.path = cleanPath === '' && !newItem.path.match(/^(\/|index|\/index)$/i) ? undefined : cleanPath;


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
    return {
      site_name: "DevDocs++ (Error)",
      nav: [{ title: "Home", path: "index" }],
      theme: { default: "system", options: ["light", "dark"] },
      search: { enabled: false },
    };
  }
}