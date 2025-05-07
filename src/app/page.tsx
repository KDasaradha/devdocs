
import { Layout } from '@/components/layout/layout';
import { loadConfig } from '@/lib/config';
import { getMarkdownContentBySlug } from '@/lib/markdown';
import type { SiteConfig, MarkdownDocument } from '@/types';
import { notFound } from 'next/navigation';
import path from 'path'; // Import path

// Ensure the homepage is treated as static if its content doesn't change dynamically
export const dynamic = 'force-static';

export default async function HomePage() {
  const config: SiteConfig = loadConfig();
  // Fetch the root 'index' page content
  const document: MarkdownDocument | null = await getMarkdownContentBySlug([]); // Empty array signifies root/index

  if (!document) {
    console.error("HomePage: Critical error - could not load content for 'index.md'. Please ensure 'content/docs/index.md' exists and is readable.");
    notFound(); // Trigger 404 if index content cannot be loaded
  }

  // Check if contentHtml exists and is not empty, otherwise trigger notFound
   if (!document.contentHtml || document.contentHtml.trim() === '') {
      console.error(`[ Server ] HomePage: Document found for slug "${document.slug}", but contentHtml is missing or empty. Triggering notFound().`);
      notFound();
  }

  // Render the Layout with the fetched index document
  return (
    <Layout config={config} document={document} />
  );
}
