import { Layout } from '@/components/layout/layout';
import { loadConfig } from '@/lib/config';
import { getMarkdownContentBySlug, getAllMarkdownSlugs } from '@/lib/markdown';
import type { SiteConfig, MarkdownDocument } from '@/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-static';

function getSlugFromParams(slug?: string[]): string {
  const slugArray = slug || [];
  const joinedSlug = slugArray.length > 0 ? slugArray.join('/') : 'index';
  return joinedSlug === '' ? 'index' : joinedSlug;
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  const allPossibleSlugs = getAllMarkdownSlugs();
  const validParams: { slug: string[] }[] = [];

  for (const slug of allPossibleSlugs) {
    const slugArray = slug === 'index' ? [] : slug.split('/');
    try {
      const doc = await getMarkdownContentBySlug(slugArray);
      if (doc?.contentHtml) {
        validParams.push({ slug: slugArray });
      }
    } catch (err) {
      console.error(`generateStaticParams error for slug "${slug}":`, err);
    }
  }

  return validParams;
}

export async function generateMetadata({ params }: { params: { slug?: string[] } }): Promise<Metadata> {
  const slugSegments = params.slug;
  const doc = await getMarkdownContentBySlug(slugSegments);
  const config = loadConfig();
  const requestedPath = getSlugFromParams(slugSegments);

  if (!doc) {
    console.error(`generateMetadata: No document for "${requestedPath}"`);
    return {
      title: `Page Not Found | ${config.site_name || 'Docs'}`,
      robots: { index: false, follow: false },
    };
  }

  const normalizedSlug = doc.slug;
  const pageUrl = `${config.site_url || ''}/${normalizedSlug === 'index' ? '' : normalizedSlug}`;

  return {
    title: `${doc.title} | ${config.site_name || 'Docs'}`,
    description: doc.frontmatter?.description || config.site_description || `Documentation for ${doc.title}`,
    openGraph: {
      title: `${doc.title} | ${config.site_name || 'Docs'}`,
      description: doc.frontmatter?.description || config.site_description,
      url: pageUrl,
      siteName: config.site_name,
      images: config.logo_path
        ? [{
            url: config.logo_path.startsWith('http')
              ? config.logo_path
              : new URL(config.logo_path, config.site_url || 'http://localhost:3000').toString(),
          }]
        : [],
      locale: 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${doc.title} | ${config.site_name || 'Docs'}`,
      description: doc.frontmatter?.description || config.site_description,
      images: config.logo_path
        ? [config.logo_path.startsWith('http')
            ? config.logo_path
            : new URL(config.logo_path, config.site_url || 'http://localhost:3000').toString()]
        : [],
    },
  };
}

export default async function DocPage({ params }: { params: { slug?: string[] } }) {
  const config: SiteConfig = loadConfig();
  const slugSegments = params.slug;

  const document: MarkdownDocument | null = await getMarkdownContentBySlug(slugSegments);
  const requestedPath = getSlugFromParams(slugSegments);

  if (!document || !document.contentHtml?.trim()) {
    console.error(`DocPage: Missing document or empty content for "${requestedPath}"`);
    notFound();
  }

  return <Layout config={config} document={document} />;
}
