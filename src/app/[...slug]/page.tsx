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
function getSlugFromParams(params: { slug?: string[] }): string {
  const slugArray = params.slug || [];
  // Join array segments, handle empty array (root) case
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
    const doc = await getMarkdownContentBySlug(slug); 
    if (doc) {
        const slugArray = slug === 'index' ? [] : slug.split('/');
        validParams.push({ slug: slugArray });
    } else {
       console.warn(`---> generateStaticParams: Skipping slug (content check failed): "${slug}"`);
    }
  }

  // console.log(`---> generateStaticParams: Returning ${validParams.length} valid param objects.`);
   if (validParams.length === 0 && allPossibleSlugs.length > 0) {
      console.error("----> generateStaticParams: CRITICAL - No valid slugs found with content. Check file paths, read permissions, and markdown processing logic in lib/markdown.ts.");
   }
  
  // Ensure the root path param ({ slug: [] }) is included IF 'index' is a valid slug
  // This handles the case where the root path is desired.
  const hasRootParam = validParams.some(p => p.slug.length === 0);
  if (!hasRootParam && allPossibleSlugs.includes('index')) {
    const indexDoc = await getMarkdownContentBySlug('index');
    if (indexDoc) {
      // console.log("--> generateStaticParams: Explicitly adding root param { slug: [] } as 'index' content exists.");
      validParams.push({ slug: [] });
    } else {
        console.warn("--> generateStaticParams: Root slug 'index' found by getAllMarkdownSlugs, but getMarkdownContentBySlug failed to load it.");
    }
  }
  
  return validParams;
}


export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const slugToFetch = getSlugFromParams(params);
  const doc = await getMarkdownContentBySlug(slugToFetch);
  const config = loadConfig();

  if (!doc) {
     // Log the specific slug that wasn't found
     console.error(`---> generateMetadata: Document not found for slug "${slugToFetch}". Returning default metadata.`);
     return {
        title: `Page Not Found | ${config.site_name || 'Docs'}`,
     }
  }

  return {
    title: `${doc.title} | ${config.site_name || 'Docs'}`,
    description: doc.frontmatter?.description as string || config.site_description || `Documentation for ${doc.title}`,
     openGraph: {
        title: `${doc.title} | ${config.site_name || 'Docs'}`,
        description: doc.frontmatter?.description as string || config.site_description,
        url: `${config.site_url || ''}/${doc.slug === 'index' ? '' : doc.slug}`,
     },
     twitter: {
        card: 'summary_large_image',
        title: `${doc.title} | ${config.site_name || 'Docs'}`,
        description: doc.frontmatter?.description as string || config.site_description,
     }
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const config: SiteConfig = loadConfig();
  const slugToFetch = getSlugFromParams(params);
  
  const document: MarkdownDocument | null = await getMarkdownContentBySlug(slugToFetch);
  
  if (!document) {
    // Add more context to the error log
    console.error(`[ Server ] DocPage: Document not found for slug "${slugToFetch}" requested by params: ${JSON.stringify(params)}. Triggering notFound().`);
    notFound(); // Trigger the standard 404 page
  }

  return (
    <Layout config={config} document={document} />
  );
}
```
  </change>
  <change>
    <file>src