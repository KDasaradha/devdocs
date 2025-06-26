
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
    if (!repo_url || !edit_uri || !document?.frontmatter?.sourceFilePath) {
       // Log a warning if any necessary part is missing
       // console.warn("Cannot generate edit URL: Missing repo_url, edit_uri, or sourceFilePath.", { repo_url, edit_uri, frontmatter: document?.frontmatter });
       return null;
    }

    const baseEditUri = edit_uri.endsWith('/') ? edit_uri : `${edit_uri}/`;
    const relativeFilePath = document.frontmatter.sourceFilePath.replace(/^\//, ''); // Ensure no leading slash

    // More robust URL joining
    try {
        const repoBase = new URL(repo_url);
        // Construct the path part, ensuring no double slashes if baseEditUri is empty or '/'
        const editPath = `${cleanPathSegment(baseEditUri)}${relativeFilePath}`;
        // Use URL constructor for reliable joining, handling potential base path in repo_url
        const editUrl = new URL(editPath, repoBase);
        return editUrl.toString();
    } catch (e) {
        console.error("Error constructing edit URL:", e);
        // Fallback to simple string concatenation if URL parsing fails
        const cleanRepoUrl = repo_url.replace(/\/$/, '');
        return `${cleanRepoUrl}/${baseEditUri}${relativeFilePath}`;
    }
  };

  // Helper to clean path segments for URL joining
  const cleanPathSegment = (segment: string): string => {
      return segment.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
  };


  const editUrl = getEditUrl();

  return (
    // SearchProvider now fetches its own data internally
    <SearchProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header siteName={site_name} navItems={nav} />
        <div className="flex-1 container mx-auto px-4 md:px-8 max-w-screen-2xl">
          <div className="flex flex-col md:flex-row">
            <Sidebar navItems={nav} />
            {/* Main content area: Adjusted left padding and added animation */}
            <main className={cn(
              "flex-1 md:pl-52 lg:pl-56 py-8 w-full overflow-x-hidden max-w-none", // Adjusted left padding for current sidebar width
              "animate-fade-in" // Added fade-in animation class
             )}>
              {/* Increased prose max-width for better readability on wider screens */}
              <article className="prose dark:prose-invert max-w-4xl mx-auto w-full group">
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
                  children ? children : <p className="text-center text-muted-foreground italic">(No document content available)</p>
                )}
              </article>
            </main>
          </div>
        </div>
        {/* Footer */}
        <footer className="py-6 md:px-8 md:py-0 border-t bg-muted/30">
          <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row max-w-screen-2xl">
            <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
              {config.copyright.copyright || `Built by You. Powered by DevDocs++`}
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
