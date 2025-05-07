import { Header } from './header';
import { Sidebar } from './sidebar';
import { PageTitle } from '@/components/content/page-title';
import { MarkdownRenderer } from '@/components/content/markdown-renderer';
import { SearchProvider } from '@/components/search/search-provider';
import type { SiteConfig, MarkdownDocument } from '@/types'; // Removed SearchDoc import
import { getPrevNextPages, getNavLinkHref } from '@/lib/navigation';
import { PageNavigation } from '@/components/navigation/page-navigation';
import path from 'path'; 
import fs from 'fs';
import { cn } from '@/lib/utils'; // Import cn utility

interface LayoutProps {
  config: SiteConfig;
  document: MarkdownDocument | null; 
  children?: React.ReactNode; 
}

export function Layout({ config, document, children }: LayoutProps) {
  const { site_name, nav, copyright, repo_url, edit_uri } = config;
  const currentSlug = document?.slug || ''; 

  const { prev, next } = getPrevNextPages(currentSlug, nav);

  const getEditUrl = () => {
    if (!repo_url || !edit_uri || !document || !document.slug) return null;

    const baseEditUri = edit_uri.endsWith('/') ? edit_uri : `${edit_uri}/`;
    
    // Prioritize using the actual file path if available from document data
    // Otherwise, construct based on slug (less reliable for index files)
    let relativeFilePath = `${document.slug}.md`; 
    if (document.frontmatter?.sourceFilePath) {
        // Assuming sourceFilePath is relative to the 'content/docs' root
        relativeFilePath = document.frontmatter.sourceFilePath; 
    } else if (fs.existsSync(path.join(process.cwd(), 'content/docs', document.slug, 'index.md'))) {
         relativeFilePath = `${document.slug}/index.md`;
    } else if (document.slug === 'index' && fs.existsSync(path.join(process.cwd(), 'content/docs', 'index.md'))) {
         relativeFilePath = 'index.md';
    } 
    // Add checks for .mdx if needed

    const cleanRepoUrl = repo_url.replace(/\/$/, '');
    const cleanBaseEditUri = baseEditUri.replace(/^\//, '').replace(/\/$/, ''); 
    const cleanRelativeFilePath = relativeFilePath.replace(/^\//, '');

    return `${cleanRepoUrl}/${cleanBaseEditUri}/${cleanRelativeFilePath}`;
  };

  const editUrl = getEditUrl();

  return (
    // SearchProvider now fetches its own data
    <SearchProvider> 
      <div className="min-h-screen flex flex-col bg-background">
        <Header siteName={site_name} navItems={nav} />
        <div className="flex-1 container mx-auto px-4 md:px-8 max-w-screen-2xl">
          <div className="flex flex-col md:flex-row">
            <Sidebar navItems={nav} />
            {/* Adjusted padding/width for main content area, added animation class */}
            <main className={cn(
              "flex-1 md:pl-52 py-8 w-full overflow-x-hidden max-w-none", // Adjusted padding left
              "animate-fade-in" // Added animation class
             )}>
              <article className="prose dark:prose-invert max-w-4xl mx-auto w-full group"> {/* Increased max-width slightly */}
                {document ? (
                  <>
                    <PageTitle title={document.title} />
                    {document.contentHtml ? (
                      <MarkdownRenderer markdownContent={document.contentHtml} />
                    ) : (
                      <p className="text-muted-foreground italic">(No content found for this page)</p>
                    )}
                    {editUrl && (
                      <div className="mt-8 pt-4 border-t border-border">
                        <a
                          href={editUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150" // Added duration
                        >
                          Edit this page on GitHub
                        </a>
                      </div>
                    )}
                    <PageNavigation prevPage={prev} nextPage={next} />
                  </>
                ) : (
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
            {config.repo_url && (
              <a
                href={config.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150" // Added duration
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
