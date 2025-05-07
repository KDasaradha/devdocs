import { Layout } from '@/components/layout/layout';
import { loadConfig } from '@/lib/config';
import { getMarkdownContentBySlug, getAllMarkdownSlugs } from '@/lib/markdown';
import type { SiteConfig, MarkdownDocument } from '@/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import path from 'path';
import fs from 'fs';

interface DocPageProps {
  params: {
    slug?: string[];
  };
}

// Mark pages for static generation by default
export const dynamic = 'force-static';
// export const revalidate = 3600; // Optional: Revalidate every hour if content might change without redeploy

// Generate static params, ensuring correct format and filtering invalid slugs.
export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  const allPossibleSlugs = getAllMarkdownSlugs();
  // console.log(`---> generateStaticParams: Found ${allPossibleSlugs.length} raw slugs: [${allPossibleSlugs.join(', ')}]`);
  const validParams: { slug: string[] }[] = [];

  for (const slug of allPossibleSlugs) {
    // Check content existence more reliably before adding to params
    const doc = await getMarkdownContentBySlug(slug === 'index' ? undefined : slug.split('/'));
    if (doc) {
        // Convert normalized slug back to string array format required by Next.js params
        const slugArray = doc.slug === 'index' ? [] : doc.slug.split('/');
        validParams.push({ slug: slugArray });
        // console.log(`   - Added valid param for slug "${doc.slug}": { slug: [${slugArray.join(', ')}] }`);
    } else {
       console.warn(`---> generateStaticParams: Skipping param generation (content check failed) for raw slug: "${slug}"`);
    }
  }

   if (validParams.length === 0 && allPossibleSlugs.length > 0) {
      console.error("----> generateStaticParams: CRITICAL - No valid slugs found with content. Check file paths, read permissions, and markdown processing logic in lib/markdown.ts.");
   }

  // Ensure the root path param ({ slug: [] }) is included IF 'index' content exists and wasn't added above
  const hasRootParam = validParams.some(p => p.slug.length === 0);
  if (!hasRootParam && allPossibleSlugs.includes('index')) {
      const indexDoc = await getMarkdownContentBySlug(undefined); // Pass undefined for root
      if (indexDoc) {
          // console.log("--> generateStaticParams: Explicitly adding root param { slug: [] } as 'index' content exists.");
          validParams.push({ slug: [] });
      } else {
          console.warn("--> generateStaticParams: Root slug 'index' found by getAllMarkdownSlugs, but getMarkdownContentBySlug(undefined) failed to load it.");
      }
  } else if (!hasRootParam) {
       console.warn("--> generateStaticParams: Root 'index' slug not found by getAllMarkdownSlugs.");
  }

  // console.log(`---> generateStaticParams: Returning ${validParams.length} valid param objects: ${JSON.stringify(validParams)}`);
  return validParams;
}

// Generate metadata for the page.
export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const slugSegments = params.slug; // Use the raw segments array
  const doc = await getMarkdownContentBySlug(slugSegments); // Pass segments directly
  const config = loadConfig();

  if (!doc) {
     // Log the specific slug that wasn't found
     const requestedPath = slugSegments?.join('/') || 'index';
     console.error(`---> generateMetadata: Document not found for requested path "${requestedPath}". Returning default metadata.`);
     return {
        title: `Page Not Found | ${config.site_name || 'Docs'}`,
     }
  }

  // Use the normalized slug from the returned document for URL construction
  const normalizedSlug = doc.slug;
  const pageUrl = `${config.site_url || ''}/${normalizedSlug === 'index' ? '' : normalizedSlug}`;

  return {
    title: `${doc.title} | ${config.site_name || 'Docs'}`,
    description: doc.frontmatter?.description as string || config.site_description || `Documentation for ${doc.title}`,
     openGraph: {
        title: `${doc.title} | ${config.site_name || 'Docs'}`,
        description: doc.frontmatter?.description as string || config.site_description,
        url: pageUrl,
     },
     twitter: {
        card: 'summary_large_image',
        title: `${doc.title} | ${config.site_name || 'Docs'}`,
        description: doc.frontmatter?.description as string || config.site_description,
        // Consider adding images if available
     }
  };
}

// The main page component.
export default async function DocPage({ params }: DocPageProps) {
  const config: SiteConfig = loadConfig();
  const slugSegments = params.slug; // Use the raw segments array

  // Fetch the document using the slug segments
  const document: MarkdownDocument | null = await getMarkdownContentBySlug(slugSegments);

  if (!document) {
    const requestedPath = slugSegments?.join('/') || 'index';
    console.error(`[ Server ] DocPage: Document not found for requested path "${requestedPath}". Triggering notFound().`);
    notFound(); // Trigger the standard 404 page
  }

  // console.log(`[ Server ] DocPage: Rendering document for slug "${document.slug}" with title "${document.title}"`);

  return (
    <Layout config={config} document={document} />
  );
}