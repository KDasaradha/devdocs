import yaml from 'js-yaml';
import type { NavItemConfig } from '@/types';
import fs from 'fs';


import path from 'path';

// Define the shape of the config based on config.yml
interface SiteConfig {
 site: {
 name: string;
 full_name: string;
 description: string;
 author: string;
 url: string;
    };
 repo: { name: string; url: string; edit_uri: string; };
 copyright: { copyright: string };
 assets: { logo: string; favicon: string; };
 nav: NavItemConfig[];
 social: { icon: string; link: string }[];
 error_pages: { '404_page': string };
 theme: { default: string; options: string[] };
 search: { enabled: boolean };
}

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
 site: {
 name: "DevDocs++ (Error)",
 full_name: "Comprehensive Technology Documentation",
 description: "Error loading configuration.",
 author: "",
 url: "",
    },
 repo: { name: "", url: "", edit_uri: "" },
 copyright: { copyright: `© ${new Date().getFullYear()} DevDocs++` },
 assets: { logo: "", favicon: "" },
 nav: [{ title: "Home", path: "index" }],
 social: [], // Default to empty array for social links
 error_pages: { '404_page': '' }, // Default empty for error pages
  // logo_path: "", // Default empty string
 theme: { default: "system", options: ["light", "dark"] }, search: { enabled: true }
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

    const fileContents = fs.readFileSync(configFilePath, 'utf8');
    const rawConfig = yaml.load(fileContents) as any; // Use 'any' for flexibility, validate below

    if (!rawConfig || typeof rawConfig !== 'object') {
      throw new Error("Configuration file is empty or invalid.");
    }

    // Type validation and default assignment
    const config: SiteConfig = {
 site: {
 name: typeof rawConfig.site?.name === 'string' ? rawConfig.site.name : "DevDocs++",
 full_name: typeof rawConfig.site?.full_name === 'string' ? rawConfig.site.full_name : "Comprehensive Technology Documentation",
 description: typeof rawConfig.site?.description === 'string' ? rawConfig.site.description : "A documentation site.",
 author: typeof rawConfig.site?.author === 'string' ? rawConfig.site.author : "",
 url: typeof rawConfig.site?.url === 'string' ? rawConfig.site.url : "",
      },
 repo: {
 name: typeof rawConfig.repo?.name === 'string' ? rawConfig.repo.name : "",
 url: typeof rawConfig.repo?.url === 'string' ? rawConfig.repo.url : "",
 edit_uri: typeof rawConfig.repo?.edit_uri === 'string' ? rawConfig.repo.edit_uri : "",
      },
 copyright: {
 copyright: typeof rawConfig.copyright?.copyright === 'string' ? rawConfig.copyright.copyright : `© ${new Date().getFullYear()} DevDocs++`,
      },
      // Assets (Paths) - ensure they are strings or empty strings
 assets: {
 logo: typeof rawConfig.assets?.logo === 'string' ? rawConfig.assets.logo : "",
 favicon: typeof rawConfig.assets?.favicon === 'string' ? rawConfig.assets.favicon : "",
      },
      // Navigation - ensure it's an array
      nav: Array.isArray(rawConfig.nav) ? rawConfig.nav : [],
      // Social links - ensure it's an array of objects with string icon and link
 social: Array.isArray(rawConfig.social)
 ? rawConfig.social.map((item: any) => ({
 icon: typeof item.icon === 'string' ? item.icon : '',
 link: typeof item.link === 'string' ? item.link : '',
          } as { icon: string; link: string }))
        : [], // Default to empty array
      // Theme - ensure structure and defaults
      theme: {
        default: typeof rawConfig.theme?.default === 'string' ? rawConfig.theme.default : "system",
        options: Array.isArray(rawConfig.theme?.options) ? rawConfig.theme.options : ["light", "dark"],
      },
      // Search - ensure structure and default
      search: {
 enabled: typeof rawConfig.search?.enabled === 'boolean' ? rawConfig.search.enabled : true,
      },
       // Error pages
 error_pages: {
 '404_page': typeof rawConfig.error_pages?.['404_page'] === 'string'
 ? rawConfig.error_pages['404_page']
 : '', // Default to empty string
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
