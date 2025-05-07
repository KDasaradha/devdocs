import { Header } from './header';
import { Sidebar } from './sidebar';
import { PageTitle } from '@/components/content/page-title';
import { MarkdownRenderer } from '@/components/content/markdown-renderer';
import { SearchProvider } from '@/components/search/search-provider';
import type { SiteConfig, MarkdownDocument, SearchDoc } from '@/types';
import { getPrevNextPages, getNavLinkHref } from '@/lib/navigation';
import { PageNavigation } from '@/components/navigation/page-navigation';
import path from 'path'; // Import path for edit URL construction

interface LayoutProps {
  config: SiteConfig;
  document: MarkdownDocument | null; // Allow document to be null for 404/error pages
  searchDocs: SearchDoc[]; 
  children?: React.ReactNode; // Accept children for custom content like 404
}

export function Layout({ config, document, searchDocs, children }: LayoutProps) {
  const { site_name, nav, copyright, repo_url, edit_uri } = config;
  // Use empty string if document is null, handle in getPrevNextPages
  const currentSlug = document?.slug || ''; 

  const { prev, next } = getPrevNextPages(currentSlug, nav);

  // Function to generate the "Edit this page" URL
  const getEditUrl = () => {
    // Ensure all necessary parts are present and document exists
    if (!repo_url || !edit_uri || !document || !document.slug) return null;

    // Construct the base edit URI, ensuring it ends with a slash if it's a directory path
    const baseEditUri = edit_uri.endsWith('/') ? edit_uri : `${edit_uri}/`;
    
    // Construct the likely file path relative to the `content/docs` dir in the repo
    // This assumes slugs directly map to file paths or directory paths containing index.md
    let relativeFilePath = '';
    if (document.slug === 'index') {
      relativeFilePath = 'index.md'; // Root index file
    } else {
        // Need to reconstruct the potential original path which might include '/index'
        // This is heuristic - might need adjustment based on actual file structure
        // A simple approach: assume slug maps directly to .md or /index.md
        // A better approach might involve storing the original file path during markdown processing
        relativeFilePath = `${document.slug}.md`; 
        // Check if slug represents a directory? (This is hard without filesystem access here)
        // If a reliable mapping from slug to file path isn't possible here, 
        // this URL might sometimes be incorrect for nested index files.
    }

    // Combine parts, ensuring clean path joining
    // Example: repo_url = https://github.com/user/repo
    //          baseEditUri = blob/main/docs/
    //          filePath = content/docs/guides/getting-started.md
    // Result: https://github.com/user/repo/blob/main/docs/content/docs/guides/getting-started.md 
    // NOTE: The `edit_uri` often *includes* the base path like `blob/main/docs/`, so we need to be careful not to duplicate `docs/`.
    // Let's assume edit_uri points *up to* the `content` directory or similar. Revisit if needed.
    const combinedPath = path.join('content/docs', relativeFilePath).replace(/\\/g, '/'); // Path within repo
    
    // Ensure repo_url doesn't have trailing slash and baseEditUri doesn't have leading slash if repo_url has one
    const cleanRepoUrl = repo_url.replace(/\/$/, '');
    const cleanBaseEditUri = baseEditUri.replace(/^\//, '');

    return `${cleanRepoUrl}/${cleanBaseEditUri}${combinedPath}`;
  };

  const editUrl = getEditUrl();

  return (
    <SearchProvider searchDocs={searchDocs}>
      <div className="min-h-screen flex flex-col bg-background">
        <Header siteName={site_name} navItems={nav} />
        <div className="flex-1 container mx-auto px-4 md:px-8 max-w-screen-2xl">
          <div className="flex flex-col md:flex-row">
            <Sidebar navItems={nav} />
            {/* Adjusted padding-left for sidebar width */}
            <main className="flex-1 md:pl-52 lg:pl-56 py-8 w-full overflow-x-hidden"> 
              {/* Add group class here for prose anchor hover effects */}
              <article className="prose dark:prose-invert max-w-4xl mx-auto w-full group"> 
                {document ? (
                  // Render document content if available
                  <>
                    <PageTitle title={document.title} />
                    <MarkdownRenderer contentHtml={document.contentHtml} />
                    {editUrl && (
                      <div className="mt-8 pt-4 border-t border-border">
                        <a 
                          href={editUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          Edit this page on GitHub
                        </a>
                      </div>
                    )}
                    <PageNavigation prevPage={prev} nextPage={next} />
                  </>
                ) : (
                  // Render explicitly passed children (e.g., the 404 content) if document is null
                  children 
                )}
              </article>
            </main>
          </div>
        </div>
        <footer className="py-6 md:px-8 md:py-0 border-t bg-muted/30">
          <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row max-w-screen-2xl">
            <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
              {copyright || `Built by You. Powered by DevDocs++`}
            </p>
            {/* Optional: Add link to repo if configured */}
            {config.repo_url && (
              <a 
                href={config.repo_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View on GitHub
              </a>
            )}
          </div>
        </footer>
      </div>
    </SearchProvider>
  );
}
