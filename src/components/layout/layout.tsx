import { Header } from './header';
import { Sidebar } from './sidebar';
import { PageTitle } from '@/components/content/page-title';
import { MarkdownRenderer } from '@/components/content/markdown-renderer';
import { SearchProvider } from '@/components/search/search-provider';
import type { SiteConfig, MarkdownDocument, SearchDoc } from '@/types';
import { getPrevNextPages, getNavLinkHref } from '@/lib/navigation';
import { PageNavigation } from '@/components/navigation/page-navigation';
import { notFound } from 'next/navigation'; // Import notFound

interface LayoutProps {
  config: SiteConfig;
  document: MarkdownDocument | null;
  searchDocs: SearchDoc[]; 
  children?: React.ReactNode; // Allow passing children explicitly (for 404)
}

export function Layout({ config, document, searchDocs, children }: LayoutProps) {
  const { site_name, nav, copyright, repo_url, edit_uri } = config;
  const currentSlug = document?.slug || ''; 

  // If there's no document and no children passed (e.g., error case from page.tsx), trigger notFound
  if (!document && !children) {
     console.warn("Layout received null document and no children, rendering not found.");
     notFound(); 
  }

  const { prev, next } = getPrevNextPages(currentSlug, nav);

  const getEditUrl = () => {
    if (!repo_url || !edit_uri || !document) return null;
    
    // Construct the edit URL based on repo structure and slug
    // This needs adjustment based on how 'edit_uri' and slugs relate to actual file paths
    // Example assumes edit_uri points to the directory containing the 'content/docs' folder in the repo
    const baseEditUri = edit_uri.endsWith('/') ? edit_uri : `${edit_uri}/`;
    const filePath = document.slug === 'index' ? 'index.md' : `${document.slug}.md`; // Reconstruct potential file path
    // This might need refinement if slugs don't map directly to file paths in the repo
    return `${repo_url}/${baseEditUri}content/docs/${filePath}`;
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
            <main className="flex-1 md:pl-[13rem] lg:pl-[14rem] py-8 w-full overflow-x-hidden"> 
              {/* Increased max-width and centering */}
              <article className="prose dark:prose-invert max-w-4xl mx-auto w-full"> 
                {document ? (
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
                  // Render explicitly passed children (like the 404 content)
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