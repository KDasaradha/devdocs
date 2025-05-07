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

// Helper function to convert the slug array from params into a single string path
// This helps in logging and debugging which path was actually requested.
function getSlugFromParams(params: { slug?: string[] }): string {
  const slugArray = params.slug || [];
  // Join array segments, handle empty array (root) case by returning 'index'
  const joinedSlug = slugArray.length > 0 ? slugArray.join('/') : 'index';
  // Ensure it doesn't return just an empty string if slug was []
  return joinedSlug === '' ? 'index' : joinedSlug;
}


// Generate static params, but filter to ensure only valid pages are generated
export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  const allPossibleSlugs = getAllMarkdownSlugs();
  const validParams: { slug: string[] }[] = [];

  // console.log(`---> generateStaticParams: Found ${allPossibleSlugs.length} possible slugs: [${allPossibleSlugs.join(', ')}]`);

  for (const slug of allPossibleSlugs) {
    // Check content existence more reliably before adding to params
    const slugArray = slug === 'index' ? [] : slug.split('/');
    try {
        // Use a quick check, perhaps just frontmatter, or assume findMarkdownFile in getMarkdownContentBySlug is reliable
        const doc = await getMarkdownContentBySlug(slugArray);
        if (doc && doc.contentHtml) { // Check if document and its HTML content exist
            validParams.push({ slug: slugArray });
            // console.log(`   - Added valid param for slug "${slug}": { slug: [${slugArray.join(', ')}] }`);
        } else {
           // Don't log excessively here, as it's expected some paths in config might not exist yet
           // console.warn(`---> generateStaticParams: Skipping param generation (doc or contentHtml missing) for slug: "${slug}"`);
        }
    } catch (error) {
        console.error(`---> generateStaticParams: Error checking content for slug "${slug}":`, error);
    }
  }

  if (validParams.length === 0 && allPossibleSlugs.length > 0) {
      console.error("----> generateStaticParams: CRITICAL - No valid slugs found with content. Check file paths, read permissions, and markdown processing logic in lib/markdown.ts.");
   } else if (allPossibleSlugs.length === 0) {
       console.warn("----> generateStaticParams: No slugs found by getAllMarkdownSlugs. Ensure 'content/docs' directory has markdown files.");
   }

  // console.log(`---> generateStaticParams: Returning ${validParams.length} valid param objects: ${JSON.stringify(validParams)}`);
  return validParams;
}

// Generate metadata for the page.
export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const slugSegments = params.slug; // Use the raw segments array
  const doc = await getMarkdownContentBySlug(slugSegments); // Pass segments directly
  const config = loadConfig();

  const requestedPath = getSlugFromParams(params); // Use helper for logging

  if (!doc) {
     // Log the specific slug that wasn't found
     console.error(`---> generateMetadata: Document not found for requested path "${requestedPath}". Returning default metadata.`);
     return {
        title: `Page Not Found | ${config.site_name || 'Docs'}`,
        robots: { index: false, follow: false } // Prevent indexing 404s derived from metadata errors
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
        siteName: config.site_name,
        images: config.logo_path ? [
            {
                url: config.logo_path.startsWith('http') ? config.logo_path : new URL(config.logo_path, config.site_url || 'http://localhost:3000').toString(), // Use a default base URL
                // Add width/height if known
            }
        ] : [],
        locale: 'en_US',
        type: 'article', // More specific than 'website' for doc pages
     },
     twitter: {
        card: 'summary_large_image',
        title: `${doc.title} | ${config.site_name || 'Docs'}`,
        description: doc.frontmatter?.description as string || config.site_description,
        images: config.logo_path ? [config.logo_path.startsWith('http') ? config.logo_path : new URL(config.logo_path, config.site_url || 'http://localhost:3000').toString()] : [],
     }
  };
}

// The main page component.
export default async function DocPage({ params }: DocPageProps) {
  const config: SiteConfig = loadConfig();
  const slugSegments = params.slug; // Use the raw segments array

  // Fetch the document using the slug segments
  const document: MarkdownDocument | null = await getMarkdownContentBySlug(slugSegments);

  const requestedPath = getSlugFromParams(params); // Use helper for logging

  if (!document) {
    console.error(`[ Server ] DocPage: Document not found for requested path "${requestedPath}". Triggering notFound().`);
    notFound(); // Trigger the standard 404 page
  }

  // Check if contentHtml exists and is not empty, otherwise trigger notFound
  if (!document.contentHtml || document.contentHtml.trim() === '') {
      console.error(`[ Server ] DocPage: Document found for slug "${document.slug}" (requested path: "${requestedPath}"), but contentHtml is missing or empty. Triggering notFound().`);
      notFound();
  }

  // console.log(`[ Server ] DocPage: Rendering document for slug "${document.slug}" (requested path: "${requestedPath}") with title "${document.title}"`);

  return (
    <Layout config={config} document={document} />
  );
}
