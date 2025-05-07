import { Header } from './header';
import { Sidebar } from './sidebar';
import { PageTitle } from '@/components/content/page-title';
import { MarkdownRenderer } from '@/components/content/markdown-renderer';
import { SearchProvider } from '@/components/search/search-provider';
import type { SiteConfig, MarkdownDocument } from '@/types';
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

  // Simplified Edit URL generation
  const getEditUrl = () => {
    if (!repo_url || !edit_uri || !document || !document.frontmatter?.sourceFilePath) {
      // console.warn("Cannot generate edit URL: Missing repo_url, edit_uri, or sourceFilePath in frontmatter for slug:", document?.slug);
      return null; // Cannot determine edit URL without the source path
    }

    const baseEditUri = edit_uri.endsWith('/') ? edit_uri : `${edit_uri}/`;
    const relativeFilePath = document.frontmatter.sourceFilePath.replace(/^\//, ''); // Ensure no leading slash

    const cleanRepoUrl = repo_url.replace(/\/$/, ''); // Remove trailing slash from repo URL if present
    const cleanBaseEditUri = baseEditUri.replace(/^\//, '').replace(/\/$/, ''); // Ensure no leading/trailing slashes

    return `${cleanRepoUrl}/${cleanBaseEditUri}/${relativeFilePath}`;
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
            {/* Main content area: Adjusted left padding (md:pl-64) and max-width for prose */}
            <main className={cn(
              "flex-1 md:pl-64 py-8 w-full overflow-x-hidden", // Adjusted left padding for wider content area
              "animate-fade-in" // Added animation class
             )}>
              {/* Increased prose max-width: max-w-3xl -> max-w-4xl */}
              <article className="prose dark:prose-invert max-w-4xl mx-auto w-full">
                {document ? (
                  <>
                    {/* Ensure title exists before rendering PageTitle */}
                    {document.title && <PageTitle title={document.title} />}

                    {/* Render Markdown content */}
                    {document.contentHtml ? (
                      <MarkdownRenderer markdownContent={document.contentHtml} />
                    ) : (
                      <p className="text-muted-foreground italic">(No content found for this page)</p>
                    )}

                    {/* Edit Link */}
                    {editUrl && (
                      <div className="mt-8 pt-4 border-t border-border">
                        <a
                          href={editUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary transition-colors" // Simplified styling
                        >
                          Edit this page on GitHub
                        </a>
                      </div>
                    )}

                    {/* Page Navigation (Prev/Next) */}
                    <PageNavigation prevPage={prev} nextPage={next} />
                  </>
                ) : (
                  // Render children if no document is provided (e.g., for custom pages not using this layout structure)
                  children
                )}
              </article>
            </main>
          </div>
        </div>
        {/* Footer */}
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
                className="text-sm text-muted-foreground hover:text-primary transition-colors" // Simplified styling
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