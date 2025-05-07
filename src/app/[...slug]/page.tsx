import { Layout } from '@/components/layout/layout';
import { loadConfig } from '@/lib/config';
import { getMarkdownContentBySlug, getAllMarkdownSlugs, getAllMarkdownDocumentsForSearch } from '@/lib/markdown';
import type { SiteConfig, MarkdownDocument, SearchDoc } from '@/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import path from 'path';

interface DocPageProps {
  params: {
    slug?: string[];
  };
}

// Helper function to convert the slug array from params into a single string path
function getSlugFromParams(params: { slug?: string[] }): string {
  const slugArray = params.slug || [];
  const joinedSlug = slugArray.length > 0 ? slugArray.join('/') : 'index';
  // normalizeSlug might not be needed here if getMarkdownContentBySlug handles it,
  // but keeping it consistent with generateStaticParams might be safer.
  // However, internal linking should use the normalized slug.
  // Let's simplify and let getMarkdownContentBySlug handle normalization internally.
  return joinedSlug === '' ? 'index' : joinedSlug;
}


// Generate static params, but filter to ensure only valid pages are generated
export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  const allPossibleSlugs = getAllMarkdownSlugs();
  const validParams: { slug: string[] }[] = [];

  console.log(`---> generateStaticParams: Found ${allPossibleSlugs.length} possible slugs: [${allPossibleSlugs.join(', ')}]`);

  for (const slug of allPossibleSlugs) {
    // Check if content exists for this slug before adding it to params
    // console.log(`   Checking slug: "${slug}"`);
    const doc = await getMarkdownContentBySlug(slug); // Use the same function as the page
    if (doc) {
        // console.log(`     ✔ Valid content found for slug: "${slug}"`);
        const slugArray = slug === 'index' ? [] : slug.split('/');
        validParams.push({ slug: slugArray });
    } else {
       console.warn(`   - Skipping slug in generateStaticParams (content check failed): "${slug}"`);
    }
  }

  console.log(`---> generateStaticParams: Returning ${validParams.length} valid param objects.`);
   if (validParams.length === 0 && allPossibleSlugs.length > 0) {
      console.error("----> generateStaticParams: CRITICAL - No valid slugs found with content. Check file paths, read permissions, and markdown processing logic.");
   }
  // Ensure the root path param ({ slug: [] }) is included if 'index' is a valid slug
  // This can be missed if 'index' normalization differs between getAllMarkdownSlugs and getMarkdownContentBySlug
  const hasRootParam = validParams.some(p => p.slug.length === 0);
  if (!hasRootParam && allPossibleSlugs.includes('index')) {
    const indexDoc = await getMarkdownContentBySlug('index');
    if (indexDoc) {
      console.log("--> generateStaticParams: Explicitly adding root param { slug: [] } as 'index' content exists.");
      validParams.push({ slug: [] });
    }
  }
  
  return validParams;
}


export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const slugToFetch = getSlugFromParams(params);
  // console.log(`generateMetadata: Looking for doc with slug: "${slugToFetch}"`);
  const doc = await getMarkdownContentBySlug(slugToFetch);
  const config = loadConfig();

  if (!doc) {
    console.warn(`generateMetadata: Document not found for slug "${slugToFetch}". Returning 'Not Found' metadata.`);
     // Option 1: Return specific 404 metadata (if not using notFound())
     // return {
     //    title: `Page Not Found | ${config.site_name || 'Docs'}`,
     //    description: `The requested page '${slugToFetch}' was not found.`
     // };
     // Option 2: Trigger notFound() - Recommended for consistency
     // Note: Calling notFound() directly in generateMetadata might have implications depending on Next.js version behavior.
     // A safer approach is to handle it in the page component. Let's return basic metadata here.
     return {
        title: `Page Not Found | ${config.site_name || 'Docs'}`,
     }
  }

  // console.log(`generateMetadata: Found doc titled "${doc.title}" for slug "${slugToFetch}".`);
  return {
    title: `${doc.title} | ${config.site_name || 'Docs'}`,
    description: doc.frontmatter?.description as string || config.site_description || `Documentation for ${doc.title}`,
     // Add Open Graph and Twitter metadata using doc details
     openGraph: {
        title: `${doc.title} | ${config.site_name || 'Docs'}`,
        description: doc.frontmatter?.description as string || config.site_description,
        url: `${config.site_url || ''}/${doc.slug === 'index' ? '' : doc.slug}`,
        // Add an image if available in frontmatter or config
        // images: doc.frontmatter?.image ? [{ url: doc.frontmatter.image }] : config.logo_path ? [{url: config.logo_path}] : [],
     },
     twitter: {
        card: 'summary_large_image',
        title: `${doc.title} | ${config.site_name || 'Docs'}`,
        description: doc.frontmatter?.description as string || config.site_description,
         // images: doc.frontmatter?.image ? [doc.frontmatter.image] : config.logo_path ? [config.logo_path] : [],
     }
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const config: SiteConfig = loadConfig();
  const slugToFetch = getSlugFromParams(params);
  // console.log(`DocPage rendering: Request params: ${JSON.stringify(params.slug)}, Trying to fetch slug: "${slugToFetch}"`);
  
  const document: MarkdownDocument | null = await getMarkdownContentBySlug(slugToFetch);
  
  // CRITICAL: Check if document is null *before* trying to fetch searchDocs or render Layout
  if (!document) {
    console.error(`DocPage: Document not found for slug "${slugToFetch}". Triggering notFound().`);
    notFound(); // Trigger the standard 404 page
  }

  // Fetch all documents needed for search *after* confirming the current page exists
  const searchDocs: SearchDoc[] = await getAllMarkdownDocumentsForSearch();

  // console.log(`DocPage: Rendering layout for "${slugToFetch}" with title "${document.title}".`);
  // Render the Layout with the successfully fetched document content
  return (
    <Layout config={config} document={document} searchDocs={searchDocs} />
  );
}

// Ensure fs is imported if used within this file (e.g., for debugging checks, though ideally not needed here)
import fs from 'fs';
