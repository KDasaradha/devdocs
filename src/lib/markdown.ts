import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrism from 'rehype-prism-plus';
import type { MarkdownDocument, SearchDoc } from '@/types';

const docsDirectory = path.join(process.cwd(), 'content/docs');

// Normalizes a file path or slug segment to a consistent format used for lookup.
function normalizeSlug(rawSlug: string): string {
  // Normalize slashes and remove markdown extensions
  let normalized = rawSlug.replace(/\\/g, '/').replace(/\.mdx?$/, '');

  // Handle 'index' cases specifically
  if (normalized === 'index' || normalized.endsWith('/index')) {
    // If it's 'folder/index', result is 'folder'. If it's just 'index', result is 'index'.
    normalized = normalized === 'index' ? 'index' : normalized.substring(0, normalized.length - '/index'.length);
  }

  // Remove leading/trailing slashes AFTER handling index logic
  normalized = normalized.replace(/^\/+|\/+$/g, '');

  // If after all processing, the slug is empty (e.g., from '/index'), it should be 'index'.
  const finalSlug = (normalized === '') ? 'index' : normalized;
  // console.log(`normalizeSlug: raw "${rawSlug}" -> normalized "${finalSlug}"`); // Debugging
  return finalSlug;
}

// Gets the markdown content for a given slug. Handles finding the correct file.
export async function getMarkdownContentBySlug(slug: string): Promise<MarkdownDocument | null> {
  const normalizedSlug = normalizeSlug(slug);
  // console.log(`---> getMarkdownContentBySlug: Attempting to fetch content for slug "${slug}" (normalized: "${normalizedSlug}")`);

  const potentialFilePaths: string[] = [];

  // Always prioritize index files if the normalized slug is 'index'
  if (normalizedSlug === 'index') {
    potentialFilePaths.push(path.join(docsDirectory, 'index.mdx'));
    potentialFilePaths.push(path.join(docsDirectory, 'index.md'));
  } else {
    // Check for direct file match first
    potentialFilePaths.push(path.join(docsDirectory, `${normalizedSlug}.mdx`));
    potentialFilePaths.push(path.join(docsDirectory, `${normalizedSlug}.md`));
    // Then check for directory index file
    potentialFilePaths.push(path.join(docsDirectory, normalizedSlug, 'index.mdx'));
    potentialFilePaths.push(path.join(docsDirectory, normalizedSlug, 'index.md'));
  }

  const uniquePotentialPaths = Array.from(new Set(potentialFilePaths));
  // console.log(`   - Potential paths: [${uniquePotentialPaths.join(', ')}]`);

  let filePath: string | undefined;
  let fileContents: string | undefined;
  let sourceFilePath: string | undefined; // Store the path relative to docsDirectory

  for (const p of uniquePotentialPaths) {
    try {
      // Check if the path exists and is a file
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        filePath = p;
        fileContents = fs.readFileSync(filePath, 'utf8');
        // Store the path relative to the docs directory, normalized
        sourceFilePath = path.relative(docsDirectory, filePath).replace(/\\/g, '/');
        // console.log(`   - Found matching file: "${filePath}" (Source relative: "${sourceFilePath}")`);
        break; // Found the file, no need to check further
      }
    } catch (error) {
      // Log errors accessing paths but continue checking other potential paths
      console.warn(`   - Warning accessing potential path "${p}" (continuing check):`, error instanceof Error ? error.message : String(error));
    }
  }

  // If no file content was read after checking all potentials
  if (!filePath || typeof fileContents !== 'string') {
    console.error(`---> getMarkdownContentBySlug: Markdown file NOT FOUND or could not be read for slug "${slug}" (normalized: "${normalizedSlug}") after checking paths: [${uniquePotentialPaths.join(', ')}]`);
    return null;
  }

  let documentMatter;
  try {
    // Parse frontmatter and markdown content
    documentMatter = matter(fileContents);
  } catch (parseError) {
    console.error(`---> getMarkdownContentBySlug: Error PARSING frontmatter in file "${filePath}" (for slug "${slug}"):`, parseError);
    // Return null or a default document structure? Returning null for now.
    return null;
  }

  const { data: frontmatter, content: rawMarkdownContent } = documentMatter;
  // Ensure rawMarkdownContent is a string, default to empty if undefined/null
  const markdownContentForProcessing = rawMarkdownContent ?? '';

  let processedContent;
  try {
    // Process markdown to HTML with plugins
    processedContent = await remark()
      .use(remarkGfm) // GitHub Flavored Markdown support
      .use(remarkRehype, { allowDangerousHtml: true }) // Convert markdown to Rehype AST
      .use(rehypeRaw) // Handle raw HTML in markdown
      .use(rehypeSlug) // Add IDs to headings
      .use(rehypeAutolinkHeadings, { // Add links to headings
        behavior: 'wrap', // Wraps the heading text in the link
        properties: {
          className: ['anchor'], // Class for styling the link
          'aria-hidden': 'true',
          tabIndex: -1,
        },
      })
      .use(rehypePrism, { showLineNumbers: false, ignoreMissing: true }) // Syntax highlighting
      .use(rehypeStringify) // Convert Rehype AST to HTML string
      .process(markdownContentForProcessing);
  } catch (remarkError) {
    console.error(`---> getMarkdownContentBySlug: Error PROCESSING markdown in file "${filePath}" (for slug "${slug}"):`, remarkError);
    // Decide how to handle processing errors, maybe return raw content or null?
    // Returning null for now indicates a failure to process.
    return null;
  }

  // Extract HTML string
  const contentHtml = processedContent.toString();

  // Determine title: Use frontmatter title, fallback to filename/directory name, then default
  const filename = path.basename(filePath, path.extname(filePath));
  let title = frontmatter.title || 'Untitled Document';

  if (!frontmatter.title) {
    if (filename.toLowerCase() !== 'index') {
      // Use filename for title if not an index file
      title = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } else {
      // For index files, use the parent directory name
      const parentDir = path.basename(path.dirname(filePath));
      if (parentDir.toLowerCase() !== 'docs' && parentDir !== '.' && parentDir !== '') {
        title = parentDir.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      } else if (normalizedSlug === 'index') {
        // If it's the root index file
        title = 'Homepage'; // Or fetch from site config?
      }
    }
  }

  // Include the sourceFilePath in the frontmatter for potential use (e.g., Edit links)
  const finalFrontmatter = { ...frontmatter, sourceFilePath };

  return {
    slug: normalizedSlug, // Return the normalized slug used for lookup
    title: title,
    contentHtml: contentHtml,
    rawContent: rawMarkdownContent, // For search indexing
    frontmatter: finalFrontmatter,
  };
}


// Recursively finds all markdown files (.md, .mdx) and returns their normalized slugs.
export function getAllMarkdownSlugs(directory: string = docsDirectory, currentSlugs: Set<string> = new Set(), base: string = ''): string[] {
  try {
    // Check if the base directory exists before trying to read it
    if (!fs.existsSync(directory)) {
      console.warn(`Directory not found, skipping slug search: ${directory}`);
      return [];
    }
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      // Construct relative path correctly, ensuring forward slashes
      const relativePath = path.join(base, entry.name).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        // Recurse into subdirectories
        getAllMarkdownSlugs(fullPath, currentSlugs, relativePath);
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
        // If it's a markdown file, normalize its path to get the slug
        const slug = normalizeSlug(relativePath);
        if (slug) { // Ensure slug is not empty after normalization
            currentSlugs.add(slug);
        }
      }
    }
  } catch (error) {
    // Log errors reading directories but try to continue if possible
    console.error(`Error reading directory ${directory}:`, error);
  }

  // Only return the final array when the initial call completes
  if (directory === docsDirectory) {
     // Special check for root index.md/index.mdx
     if (fs.existsSync(path.join(docsDirectory, 'index.md')) || fs.existsSync(path.join(docsDirectory, 'index.mdx'))) {
         if (!currentSlugs.has('index')) {
              // console.log("getAllMarkdownSlugs: Explicitly adding root 'index' slug.");
              currentSlugs.add('index');
         }
     }
    // Filter out any potentially empty slugs just in case
    return Array.from(currentSlugs).filter(s => s);
  }
  // Return empty array for recursive calls, results are accumulated in `currentSlugs`
  return [];
}


// Fetches all documents for search indexing
export async function getAllMarkdownDocumentsForSearch(): Promise<SearchDoc[]> {
  const slugs = getAllMarkdownSlugs();
  // console.log(`getAllMarkdownDocumentsForSearch: Found ${slugs.length} slugs for search indexing: [${slugs.join(', ')}]`);
  const documentPromises = slugs.map(slug => getMarkdownContentBySlug(slug));
  const results = await Promise.all(documentPromises);

  const validDocs = results.filter((doc): doc is MarkdownDocument => {
      if (doc === null) {
         // console.warn("getAllMarkdownDocumentsForSearch: Filtered out null document.");
         return false;
      }
      if (typeof doc.rawContent !== 'string') {
          // console.warn(`getAllMarkdownDocumentsForSearch: Filtered out document with invalid rawContent (slug: ${doc.slug}).`);
          return false;
      }
      return true;
  });

  // console.log(`getAllMarkdownDocumentsForSearch: Returning ${validDocs.length} valid documents for search index.`);
  return validDocs.map(doc => ({
    slug: doc.slug,
    title: doc.title,
    content: doc.rawContent, // Use raw content for search index
  }));
}
```
  </change>
  <change>
    <file>src/app/[...slug]/page.tsx</file>
    <description>Update page component to improve error logging when a document is not found for a given slug.</description>
    <content><![CDATA[import { Layout } from '@/components/layout/layout';
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
    <file>src/app/not-found.tsx</file>
    <description>Simplify the 404 page to remove any server-side data fetching which might fail if the configuration or markdown loading itself has issues.</description>
    <content><![CDATA[import Link from 'next/link';
import { Button } from '@/components/ui/button';
// Removed Layout, loadConfig, getAllMarkdownDocumentsForSearch, SiteConfig, SearchDoc imports

// This component should be self-contained and not rely on potentially failing
// server-side data fetching like loadConfig which might be the reason the 404
// page itself was failing to render previously.
export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
      <h1 className="text-6xl font-bold text-destructive mb-4">404</h1>
      <h2 className="text-3xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Oops! The page you requested could not be found. It might have been moved, deleted, or the link might be incorrect.
      </p>
      <Button asChild size="lg">
        <Link href="/">Go back to Homepage</Link>
      </Button>
    </div>
  );
}
