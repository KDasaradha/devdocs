import { Header } from './header';
import { Sidebar } from './sidebar';
import { PageTitle } from '@/components/content/page-title';
import { MarkdownRenderer } from '@/components/content/markdown-renderer';
import { SearchProvider } from '@/components/search/search-provider';
import type { SiteConfig, MarkdownDocument, SearchDoc } from '@/types';

interface LayoutProps {
  config: SiteConfig;
  document: MarkdownDocument | null;
  searchDocs: SearchDoc[]; // Pass all docs for search indexing
  children?: React.ReactNode; // For potential future use if layout wraps other pages
}

export function Layout({ config, document, searchDocs, children }: LayoutProps) {
  const { site_name, nav } = config;

  return (
    <SearchProvider searchDocs={searchDocs}>
      <div className="min-h-screen flex flex-col bg-background">
        <Header siteName={site_name} navItems={nav} />
        <div className="flex-1 container mx-auto px-4 md:px-8 max-w-screen-2xl">
          <div className="flex flex-row">
            <Sidebar navItems={nav} />
            <main className="flex-1 md:pl-72 lg:pl-80 py-8 w-full overflow-x-hidden"> {/* Adjust pl based on sidebar width */}
              <div className="max-w-none w-full"> {/* Removed prose classes */}
                {document ? (
                  <>
                    <PageTitle title={document.title} />
                    <MarkdownRenderer contentHtml={document.contentHtml} />
                  </>
                ) : children ? (
                  children /* For pages not rendering markdown, e.g. a 404 */
                ) : (
                  <PageTitle title="Page not found" />
                )}
              </div>
            </main>
          </div>
        </div>
        <footer className="py-6 md:px-8 md:py-0 border-t">
          <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
            <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built by You. Powered by DevDocs++.
            </p>
          </div>
        </footer>
      </div>
    </SearchProvider>
  );
}

