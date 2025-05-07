export interface NavItemConfig {
  title: string;
  path?: string;
  children?: NavItemConfig[];
}

export interface SiteConfig {
  // Site Info
  site_name: string;
  site_description: string;
  site_author: string; // Added
  site_url: string; // Added
  // Repo Info
  repo_name: string; // Added
  repo_url: string; // Added
  edit_uri: string; // Base URI for "Edit this page" links
  // Copyright
  copyright: string;
  // Assets (Paths) - ensure paths start with '/' if they are relative to the public dir
  logo_path?: string; // Added
  favicon_path?: string; // Added
  // Navigation
  nav: NavItemConfig[];
  // Theme
  theme: {
    default: string;
    options: string[];
  };
  // Search
  search: {
    enabled: boolean;
  };
}

export interface MarkdownDocument {
  slug: string;
  title: string;
  contentHtml: string; // Keep contentHtml for rendering
  rawContent: string; // Store the raw markdown content for search/edit links
  frontmatter: { 
    [key: string]: any;
    sourceFilePath?: string; // Optional: Store the original file path relative to content/docs
  }; 
}

export interface SearchDoc {
  slug: string;
  title: string;
  content: string; // Raw content used for search index
}
