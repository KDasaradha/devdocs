export interface NavItemConfig {
  title: string;
  path?: string;
  children?: NavItemConfig[];
}

export interface SiteConfig {
  site_name: string;
  nav: NavItemConfig[];
  theme: {
    default: string;
    options: string[];
  };
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
