import { Layout } from '@/components/layout/layout';
import { loadConfig } from '@/lib/config';
import { getMarkdownContentBySlug, getAllMarkdownDocumentsForSearch } from '@/lib/markdown';
import type { SiteConfig, MarkdownDocument, SearchDoc } from '@/types';
import { notFound } from 'next/navigation'; // Import notFound

export const dynamic = 'force-static'; // Ensure SSG for the homepage

export default async function HomePage() {
  const config: SiteConfig = loadConfig();
  // Always fetch content using the 'index' slug for the homepage
  const document: MarkdownDocument | null = await getMarkdownContentBySlug('index'); 
  const searchDocs: SearchDoc[] = await getAllMarkdownDocumentsForSearch();

  if (!document) {
    console.error("HomePage: Could not load content for 'index.md'. Please ensure 'content/docs/index.md' exists.");
    // Trigger a 404 if the core index file is missing
    notFound(); 
    // Or provide a fallback rendering within the Layout if preferred:
    // return (
    //   <Layout config={config} document={null} searchDocs={searchDocs}>
    //     <div className="text-center py-10">
    //       <h1 className="text-2xl font-semibold">Homepage content not found.</h1>
    //       <p className="text-muted-foreground">Please create an `index.md` file in your `content/docs` directory.</p>
    //     </div>
    //   </Layout>
    // );
  }
  
  return (
    <Layout config={config} document={document} searchDocs={searchDocs} />
  );
}