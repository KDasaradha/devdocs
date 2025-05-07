import { Layout } from '@/components/layout/layout';
import { loadConfig } from '@/lib/config';
import { getMarkdownContentBySlug, getAllMarkdownSlugs, getAllMarkdownDocumentsForSearch } from '@/lib/markdown';
import type { SiteConfig, MarkdownDocument, SearchDoc } from '@/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface DocPageProps {
  params: {
    slug: string[];
  };
}

// Helper function to normalize slug array from params
function getSlugFromParams(params: { slug?: string[] }): string {
  const slugArray = params.slug || [];
  if (slugArray.length === 0) {
    return 'index'; // Represents the root path
  }
  // Join slug parts, potentially handling nested index files if necessary based on file structure
  const joinedSlug = slugArray.join('/');
  // If your structure uses 'folder/index.md' use joinedSlug directly (or normalize if needed)
  // If your structure uses 'folder.md', adjust logic here.
  return joinedSlug; 
}

export async function generateStaticParams() {
  const slugs = getAllMarkdownSlugs();
  return slugs.map((slug) => ({
    slug: slug === 'index' ? undefined : slug.split('/'), // Root slug is undefined or [], others are arrays
  }));
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const slugPath = getSlugFromParams(params);
  const doc = await getMarkdownContentBySlug(slugPath); // Use the same function used in page component
  const config = loadConfig();

  if (!doc) {
    return {
      title: `Page Not Found | ${config.site_name}`,
    };
  }

  return {
    title: `${doc.title} | ${config.site_name}`,
    description: doc.frontmatter.description || `Documentation for ${doc.title}`,
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const config: SiteConfig = loadConfig();
  const slugPath = getSlugFromParams(params); // Get slug from params
  const document: MarkdownDocument | null = await getMarkdownContentBySlug(slugPath); // Fetch content using slug
  const searchDocs: SearchDoc[] = await getAllMarkdownDocumentsForSearch();

  if (!document) {
    console.log(`DocPage: Document not found for slug array: ${params.slug?.join('/') ?? '[]'}, which resolved to slugPath: "${slugPath}"`);
    notFound(); // Triggers the not-found.tsx page
  }
  
  return (
    <Layout config={config} document={document} searchDocs={searchDocs} />
  );
}