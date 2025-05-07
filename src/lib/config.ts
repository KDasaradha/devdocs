import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { SiteConfig, NavItemConfig } from '@/types';

const configFilePath = path.join(process.cwd(), 'public', 'config.yml');

// Singleton pattern for config cache
let configCache: SiteConfig | null = null;
let loadError: Error | null = null;

// Helper function to normalize nav paths to be slug-like
const normalizeNavPaths = (navItems: NavItemConfig[]): NavItemConfig[] => {
  return navItems.map(item => {
    const newItem = { ...item };
    if (newItem.path && typeof newItem.path === 'string' && !newItem.path.startsWith('http')) {
      // Handle anchor links - keep them as they are attached to a slug
      const parts = newItem.path.split('#');
      let slug = parts[0];
      const anchor = parts.length > 1 ? `#${parts[1]}` : '';

      // Normalize slug part
      slug = slug.replace(/\.md$/, ''); // Remove .md extension
      slug = slug.replace(/\\/g, '/'); // Normalize to forward slashes
      
      // Convert directory index files ('folder/index') to directory slugs ('folder')
      // Convert root index file ('index') to 'index' slug
      if (slug.endsWith('/index')) {
        slug = slug.substring(0, slug.length - '/index'.length);
      } else if (path.basename(slug).toLowerCase() === 'index') {
        // Handles 'index' or '/index' case after removing .md
        slug = path.dirname(slug);
        if (slug === '.' || slug === '') slug = 'index'; // If it was just 'index', keep it 'index'
      }

      // Remove leading/trailing slashes AFTER handling index logic
      slug = slug.replace(/^\/+|\/+$/g, '');

      // Handle root case explicitly - empty string after processing should be 'index'
      if (slug === '') {
          slug = 'index';
      }
      
      // Re-attach anchor if it exists
      newItem.path = slug + anchor; 
    }
    if (newItem.children) {
      newItem.children = normalizeNavPaths(newItem.children); // Recurse
    }
    return newItem;
  });
};

// Default configuration in case of loading errors
const getDefaultConfig = (): SiteConfig => ({
  site_name: "DevDocs++ (Error)",
  site_description: "Error loading configuration.",
  site_author: "",
  site_url: "",
  repo_name: "",
  repo_url: "",
  edit_uri: "",
  copyright: `© ${new Date().getFullYear()} DevDocs++`,
  logo_path: "", // Default empty string
  favicon_path: "", // Default empty string
  nav: [{ title: "Home", path: "index" }],
  theme: { default: "system", options: ["light", "dark"] },
  search: { enabled: false },
});

export function loadConfig(): SiteConfig {
  // Return cached version in production if already loaded successfully
  if (process.env.NODE_ENV === 'production' && configCache) {
    return configCache;
  }
  // Return default if a previous load attempt failed permanently
  if (loadError) {
      console.error("Returning default config due to previous load error.");
      return getDefaultConfig();
  }

  try {
    if (!fs.existsSync(configFilePath)) {
      throw new Error(`Configuration file not found at: ${configFilePath}`);
    }
    const fileContents = fs.readFileSync(configFilePath, 'utf8');
    const rawConfig = yaml.load(fileContents) as any; // Use 'any' for flexibility, validate below

    if (!rawConfig || typeof rawConfig !== 'object') {
      throw new Error("Configuration file is empty or invalid.");
    }

    const config: SiteConfig = {
      // Site Info
      site_name: typeof rawConfig.site_name === 'string' ? rawConfig.site_name : "DevDocs++",
      site_description: typeof rawConfig.site_description === 'string' ? rawConfig.site_description : "A documentation site.",
      site_author: typeof rawConfig.site_author === 'string' ? rawConfig.site_author : "",
      site_url: typeof rawConfig.site_url === 'string' ? rawConfig.site_url : "",
      // Repo Info
      repo_name: typeof rawConfig.repo_name === 'string' ? rawConfig.repo_name : "",
      repo_url: typeof rawConfig.repo_url === 'string' ? rawConfig.repo_url : "",
      edit_uri: typeof rawConfig.edit_uri === 'string' ? rawConfig.edit_uri : "",
      // Copyright
      copyright: typeof rawConfig.copyright === 'string' ? rawConfig.copyright : `© ${new Date().getFullYear()} DevDocs++`,
      // Assets (Paths) - ensure they are strings or empty strings
      logo_path: typeof rawConfig.logo_path === 'string' ? rawConfig.logo_path : "",
      favicon_path: typeof rawConfig.favicon_path === 'string' ? rawConfig.favicon_path : "",
      // Navigation - ensure it's an array
      nav: Array.isArray(rawConfig.nav) ? rawConfig.nav : [],
      // Theme - ensure structure and defaults
      theme: {
        default: typeof rawConfig.theme?.default === 'string' ? rawConfig.theme.default : "system",
        options: Array.isArray(rawConfig.theme?.options) ? rawConfig.theme.options : ["light", "dark"],
      },
      // Search - ensure structure and default
      search: {
        enabled: typeof rawConfig.search?.enabled === 'boolean' ? rawConfig.search.enabled : true,
      },
    };
    
    // Normalize navigation paths after validation
    config.nav = normalizeNavPaths(config.nav);

    // Cache the successfully loaded and parsed config in production
    if (process.env.NODE_ENV === 'production') {
      configCache = config;
    }
    loadError = null; // Reset error on successful load
    return config;
  } catch (error: unknown) {
    // Log the error and store it to prevent repeated load attempts
    loadError = error instanceof Error ? error : new Error(String(error));
    console.error("Error loading or parsing config.yml:", loadError.message);
    // Provide a default fallback configuration
    return getDefaultConfig();
  }
}
