import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { SiteConfig, NavItemConfig } from '@/types';

const configPath = path.join(process.cwd(), 'public', 'config.yml');

let-config-cache: SiteConfig | null = null;

// Helper function to normalize nav paths
const normalizeNavPaths = (navItems: NavItemConfig[], basePath: string = ''): NavItemConfig[] => {
  return navItems.map(item => {
    const newItem = { ...item };
    if (newItem.path) {
      // Ensure path doesn't end with .md and doesn't start with / if it's not an external link
      newItem.path = newItem.path.replace(/\.md$/, '');
      if (!newItem.path.startsWith('/') && !newItem.path.startsWith('http')) {
        newItem.path = path.join(basePath, newItem.path).replace(/\\/g, '/');
      }
       // Special case for index page
      if (newItem.path === 'index' || newItem.path === '/index') {
        newItem.path = '/';
      }
    }
    if (newItem.children) {
      newItem.children = normalizeNavPaths(newItem.children, basePath);
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
    const config = yaml.load(fileContents) as SiteConfig;
    
    // Normalize navigation paths
    config.nav = normalizeNavPaths(config.nav);

    if (process.env.NODE_ENV === 'production') {
      configCache = config;
    }
    return config;
  } catch (error) {
    console.error("Error loading or parsing config.yml:", error);
    // Provide a default fallback config to prevent build failures
    return {
      site_name: "DevDocs++ (Error)",
      nav: [{ title: "Home", path: "/" }],
      theme: { default: "system", options: ["light", "dark"] },
      search: { enabled: false },
    };
  }
}
