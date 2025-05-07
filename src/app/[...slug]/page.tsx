import { Layout } from '@/components/layout/layout';
import { loadConfig } from '@/lib/config';
import { getMarkdownContentBySlug, getAllMarkdownSlugs, getAllMarkdownDocumentsForSearch } from '@/lib/markdown';
import type { SiteConfig, MarkdownDocument, SearchDoc } from '@/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import path from 'path'; // Import path for potential normalization if needed

interface DocPageProps {
  params: {
    slug?: string[]; // Slug can be undefined for the root page if not explicitly caught
  };
}

// Helper function to normalize slug array from params into a single slug string
function getSlugFromParams(params: { slug?: string[] }): string {
  const slugArray = params.slug || [];
  // Join slug parts with forward slashes and handle empty array case
  const joinedSlug = slugArray.length > 0 ? slugArray.join('/') : 'index';
  // Normalize ensures consistency (e.g., removes trailing slashes, handles 'index')
  // Although maybe normalization should happen *only* in markdown lib? Revisit if needed.
  // For now, just return the joined path or 'index'
  return joinedSlug;
}

export async function generateStaticParams() {
  const slugs = getAllMarkdownSlugs();
  return slugs.map((slug) => ({
    // For [...slug], the 'slug' param must be an array.
    // Map 'index' slug to an empty array [] for the root path.
    // Other slugs are split into arrays.
    slug: slug === 'index' ? [] : slug.split('/'),
  }));
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const slugPath = getSlugFromParams(params);
  const doc = await getMarkdownContentBySlug(slugPath); // Use the same logic as in page component
  const config = loadConfig();

  if (!doc) {
    // It's important that generateMetadata and the page component have consistent
    // notFound behavior. If getMarkdownContentBySlug returns null, this should too.
    return {
      title: `Page Not Found | ${config.site_name}`,
      description: `The requested page was not found.`
    };
  }

  return {
    title: `${doc.title} | ${config.site_name}`,
    description: doc.frontmatter?.description as string || `Documentation for ${doc.title}`,
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const config: SiteConfig = loadConfig();
  const slugPath = getSlugFromParams(params);
  const document: MarkdownDocument | null = await getMarkdownContentBySlug(slugPath);

  // Fetch search docs regardless of whether the specific document is found,
  // as the layout might still need them (e.g., for the search bar).
  const searchDocs: SearchDoc[] = await getAllMarkdownDocumentsForSearch();

  if (!document) {
    console.warn(`DocPage: Document not found for slug array: ${params.slug?.join('/') ?? '[]'}, which resolved to lookup slug: "${slugPath}"`);
    notFound(); // Triggers the not-found.tsx page
  }

  // Pass the successfully found document and search docs to the Layout
  return (
    <Layout config={config} document={document} searchDocs={searchDocs} />
  );
}
