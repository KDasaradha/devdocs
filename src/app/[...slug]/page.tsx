import { Layout } from '@/components/layout/layout';
import { loadConfig } from '@/lib/config';
import { getMarkdownContentBySlug, getAllMarkdownSlugs, getAllMarkdownDocumentsForSearch } from '@/lib/markdown';
import type { SiteConfig, MarkdownDocument, SearchDoc } from '@/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster'; // Ensure Toaster is available

interface DocPageProps {
  params: {
    slug: string[];
  };
}

export async function generateStaticParams() {
  const slugs = getAllMarkdownSlugs();
  return slugs.map((slug) => ({
    slug: slug === 'index' ? [] : slug.split('/'), // Handle homepage slug as empty array for root
  }));
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const slugPath = params.slug ? params.slug.join('/') : 'index';
  const doc = await getMarkdownContentBySlug(slugPath);
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
  const slugPath = params.slug ? params.slug.join('/') : 'index';
  const document: MarkdownDocument | null = await getMarkdownContentBySlug(slugPath);
  const searchDocs: SearchDoc[] = await getAllMarkdownDocumentsForSearch();

  if (!document) {
    notFound(); // Triggers the not-found.tsx page
  }
  
  return (
    <>
      <Layout config={config} document={document} searchDocs={searchDocs} />
      <Toaster />
    </>
  );
}
