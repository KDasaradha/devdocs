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
  document: MarkdownDocument | null; // Document can be null (e.g., for 404 page)
  searchDocs: SearchDoc[];
  children?: React.ReactNode; // Accept children for custom content (like 404 page)
}

export function Layout({ config, document, searchDocs, children }: LayoutProps) {
  const { site_name, nav, copyright, repo_url, edit_uri } = config;
  // Use empty string if document is null, handle in getPrevNextPages
  const currentSlug = document?.slug || ''; 

  const { prev, next } = getPrevNextPages(currentSlug, nav);

  // Function to generate the "Edit this page" URL
  const getEditUrl = () => {
    // Ensure all necessary parts are present and document exists
    if (!repo_url || !edit_uri || !document || !document.slug || document.slug === 'index') return null;

    // Construct the base edit URI, ensuring it ends with a slash if it's a directory path
    const baseEditUri = edit_uri.endsWith('/') ? edit_uri : `${edit_uri}/`;

    // Construct the likely file path relative to the `content/docs` dir in the repo
    // This relies on the slug matching the file structure.
    // Need to consider if the slug represents an index file within a folder
    let relativeFilePath = `${document.slug}.md`;
    if (document.slug !== 'index' && fs.existsSync(path.join(process.cwd(), 'content/docs', document.slug, 'index.md'))) {
      // If it's a directory slug with an index file
      relativeFilePath = `${document.slug}/index.md`;
    } else if (document.slug === 'index' && fs.existsSync(path.join(process.cwd(), 'content/docs', 'index.md'))) {
       // Explicitly check root index.md
       relativeFilePath = 'index.md';
    } 
    // Add checks for .mdx if needed
    
    // A more robust solution might involve storing the original file path during markdown processing

    // Combine parts, ensuring clean path joining
    const cleanRepoUrl = repo_url.replace(/\/$/, '');
    const cleanBaseEditUri = baseEditUri.replace(/^\//, '').replace(/\/$/, ''); // Remove leading/trailing slashes
    const cleanRelativeFilePath = relativeFilePath.replace(/^\//, '');

    return `${cleanRepoUrl}/${cleanBaseEditUri}/${cleanRelativeFilePath}`;
  };

  const editUrl = getEditUrl();

  return (
    <SearchProvider searchDocs={searchDocs}>
      <div className="min-h-screen flex flex-col bg-background">
        <Header siteName={site_name} navItems={nav} />
        <div className="flex-1 container mx-auto px-4 md:px-8 max-w-screen-2xl">
          <div className="flex flex-col md:flex-row">
            <Sidebar navItems={nav} />
            <main className="flex-1 md:pl-52 lg:pl-56 py-8 w-full overflow-x-hidden">
              <article className="prose dark:prose-invert max-w-4xl mx-auto w-full group">
                {document ? (
                  // Render document content if available
                  <>
                    <PageTitle title={document.title} />
                    {/* Ensure markdownContent prop receives contentHtml and it exists */}
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

// Need to import fs for existsSync check in getEditUrl
import fs from 'fs';
