import { Layout } from '@/components/layout/layout';
import { loadConfig } from '@/lib/config';
import { getMarkdownContentBySlug, getAllMarkdownDocumentsForSearch } from '@/lib/markdown';
import type { SiteConfig, MarkdownDocument, SearchDoc } from '@/types';
import { notFound } from 'next/navigation'; // Import notFound

// Ensure the homepage is treated as static if its content doesn't change dynamically
export const dynamic = 'force-static'; 

export default async function HomePage() {
  const config: SiteConfig = loadConfig();
  // Explicitly fetch content using the 'index' slug for the homepage
  const document: MarkdownDocument | null = await getMarkdownContentBySlug('index'); 
  const searchDocs: SearchDoc[] = await getAllMarkdownDocumentsForSearch();

  if (!document) {
    console.error("HomePage: Critical error - could not load content for 'index.md'. Please ensure 'content/docs/index.md' exists and is readable.");
    // Trigger a 404 if the core index file is missing, as the site is non-functional without it.
    notFound(); 
  }
  
  // Render the Layout with the index document content
  return (
    <Layout config={config} document={document} searchDocs={searchDocs} />
  );
}
