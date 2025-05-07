import { Layout } from '@/components/layout/layout';
import { loadConfig } from '@/lib/config';
import { getMarkdownContentBySlug } from '@/lib/markdown';
import type { SiteConfig, MarkdownDocument } from '@/types';
import { notFound } from 'next/navigation';

// Ensure the homepage is treated as static if its content doesn't change dynamically
export const dynamic = 'force-static';

export default async function HomePage() {
  const config: SiteConfig = loadConfig();
  // Pass undefined or empty array to get the root 'index' page
  const document: MarkdownDocument | null = await getMarkdownContentBySlug(undefined);

  if (!document) {
    console.error("HomePage: Critical error - could not load content for 'index.md'. Please ensure 'content/docs/index.md' exists and is readable.");
    notFound();
  }

  // Render the Layout without passing searchDocs
  // SearchProvider will now fetch its own data
  return (
    <Layout config={config} document={document} />
  );
}