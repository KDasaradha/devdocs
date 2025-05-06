import { Layout } from '@/components/layout/layout';
import { loadConfig } from '@/lib/config';
import { getMarkdownContentBySlug, getAllMarkdownDocumentsForSearch } from '@/lib/markdown';
import type { SiteConfig, MarkdownDocument, SearchDoc } from '@/types';

export const dynamic = 'force-static'; // Ensure SSG for the homepage

export default async function HomePage() {
  const config: SiteConfig = loadConfig();
  const document: MarkdownDocument | null = await getMarkdownContentBySlug('index'); // Default to index.md
  const searchDocs: SearchDoc[] = await getAllMarkdownDocumentsForSearch();

  if (!document) {
    // This case should ideally be handled by a 404 or error page mechanism
    // For now, render Layout with a message.
    return (
      <Layout config={config} document={null} searchDocs={searchDocs}>
        <div className="text-center py-10">
          <h1 className="text-2xl font-semibold">Home page content not found.</h1>
          <p className="text-muted-foreground">Please create an `index.md` file in your `content/docs` directory.</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout config={config} document={document} searchDocs={searchDocs} />
  );
}
