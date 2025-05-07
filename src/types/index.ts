export interface NavItemConfig {
  title: string;
  path?: string;
  children?: NavItemConfig[];
}

export interface SiteConfig {
  // Site Info
  site_name: string;
  site_description: string;
  site_author: string;
  site_url: string;
  // Repo Info
  repo_name: string;
  repo_url: string;
  edit_uri: string; // Base URI for "Edit this page" links
  // Copyright
  copyright: string;
  // Assets (Paths)
  logo_path?: string;
  favicon_path?: string;
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
  contentHtml: string;
  rawContent: string; // For search indexing
  frontmatter: { [key: string]: any };
}

export interface SearchDoc {
  slug: string;
  title: string;
  content: string;
}
```