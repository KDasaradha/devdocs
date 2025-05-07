import { Header } from './header';
import { Sidebar } from './sidebar';
import { PageTitle } from '@/components/content/page-title';
import { MarkdownRenderer } from '@/components/content/markdown-renderer';
import { SearchProvider } from '@/components/search/search-provider';
import type { SiteConfig, MarkdownDocument, SearchDoc } from '@/types';
import { getPrevNextPages } from '@/lib/navigation';
import { PageNavigation } from '@/components/navigation/page-navigation';

interface LayoutProps {
  config: SiteConfig;
  document: MarkdownDocument | null;
  searchDocs: SearchDoc[]; 
  children?: React.ReactNode; 
}

export function Layout({ config, document, searchDocs, children }: LayoutProps) {
  const { site_name, nav } = config;
  const currentSlug = document?.slug || ''; // Ensure currentSlug is a string

  const { prev, next } = getPrevNextPages(currentSlug, nav);

  return (
    <SearchProvider searchDocs={searchDocs}>
      <div className="min-h-screen flex flex-col bg-background">
        <Header siteName={site_name} navItems={nav} />
        <div className="flex-1 container mx-auto px-4 md:px-8 max-w-screen-2xl">
          <div className="flex flex-col md:flex-row">
            <Sidebar navItems={nav} />
            <main className="flex-1 md:pl-52 lg:pl-56 py-8 w-full overflow-x-hidden">
              <div className="max-w-4xl mx-auto w-full"> {/* Increased max-width from 3xl to 4xl */}
                {document ? (
                  <>
                    <PageTitle title={document.title} />
                    <MarkdownRenderer contentHtml={document.contentHtml} />
                    <PageNavigation prevPage={prev} nextPage={next} />
                  </>
                ) : children ? (
                  children 
                ) : (
                  <PageTitle title="Page not found" />
                )}
              </div>
            </main>
          </div>
        </div>
        <footer className="py-6 md:px-8 md:py-0 border-t bg-muted/30">
          <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row max-w-screen-2xl">
            <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built by You. Powered by DevDocs++.
            </p>
          </div>
        </footer>
      </div>
    </SearchProvider>
  );
}
