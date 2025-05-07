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
function normalizeSlug(slug: string): string {
  // console.log(`normalizeSlug: Input slug: "${slug}"`); // Optional debug logging
  let normalized = slug.replace(/\\/g, '/').replace(/\.mdx?$/, ''); // Remove .md or .mdx, use forward slashes

  // Handle index files: 'folder/index' -> 'folder', 'index' -> 'index'
  if (normalized.endsWith('/index')) {
    normalized = normalized.substring(0, normalized.length - '/index'.length);
  } else if (path.basename(normalized).toLowerCase() === 'index' && normalized !== 'index') {
     // handles '/index' or 'some/path/index' by taking the dirname.
     // but if it was just 'index', it should remain 'index'.
     normalized = path.dirname(normalized);
  }

  // Remove leading/trailing slashes only after index logic
  normalized = normalized.replace(/^\/+|\/+$/g, '');

  // If normalization resulted in an empty string (from root path like '/index') or '.', default to "index"
  const finalSlug = (normalized === '' || normalized === '.') ? 'index' : normalized;
  // console.log(`normalizeSlug: Input "${slug}" -> Output "${finalSlug}"`); // Optional debug logging
  return finalSlug;
}

// Gets the markdown content for a given slug. Handles finding the correct file.
export async function getMarkdownContentBySlug(slug: string): Promise<MarkdownDocument | null> {
  const normalizedSlug = normalizeSlug(slug);
  // console.log(`---> getMarkdownContentBySlug: Trying normalized slug "${normalizedSlug}"`);

  const potentialFilePaths: string[] = [];

  // 1. Check for exact match .md or .mdx
  potentialFilePaths.push(path.join(docsDirectory, `${normalizedSlug}.md`));
  potentialFilePaths.push(path.join(docsDirectory, `${normalizedSlug}.mdx`));

  // 2. Check for index file inside a directory with the same name as the slug
  potentialFilePaths.push(path.join(docsDirectory, normalizedSlug, 'index.md'));
  potentialFilePaths.push(path.join(docsDirectory, normalizedSlug, 'index.mdx'));

  // 3. If the normalized slug IS 'index', also check for root index files explicitly
  if (normalizedSlug === 'index') {
    potentialFilePaths.unshift(path.join(docsDirectory, 'index.mdx')); // Check root .mdx first
    potentialFilePaths.unshift(path.join(docsDirectory, 'index.md')); // Check root .md
  }

  const uniquePotentialPaths = Array.from(new Set(potentialFilePaths));
  // console.log(`   Potential paths for "${normalizedSlug}":`, uniquePotentialPaths);

  let filePath: string | undefined;
  let fileContents: string | undefined;

  for (const p of uniquePotentialPaths) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        filePath = p;
        fileContents = fs.readFileSync(filePath, 'utf8');
        // console.log(`   Found and read file at: ${filePath}`);
        break; // Stop checking once a valid file is found and read
      }
    } catch (error) {
      console.warn(`   Error accessing potential path "${p}" (continuing check):`, error instanceof Error ? error.message : String(error));
      // Continue to the next potential path
    }
  }

  if (!filePath || typeof fileContents !== 'string') {
    console.warn(`---> getMarkdownContentBySlug: Markdown file NOT FOUND or could not be read for slug "${slug}" (normalized: "${normalizedSlug}")`);
    return null; // Return null if no file is found or readable
  }

  let documentMatter;
  try {
    documentMatter = matter(fileContents);
  } catch (parseError) {
    console.error(`---> getMarkdownContentBySlug: Error PARSING frontmatter in file "${filePath}" (for slug "${slug}"):`, parseError);
    return null; // Cannot proceed without parsed content/frontmatter
  }

  const { data: frontmatter, content: rawMarkdownContent } = documentMatter;
  const markdownContentForProcessing = rawMarkdownContent ?? ''; // Ensure string

  let processedContent;
  try {
    processedContent = await remark()
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeSlug)
      .use(rehypeAutolinkHeadings, {
        behavior: 'wrap',
        properties: { className: ['anchor'], 'aria-hidden': 'true', tabIndex: -1 }
      })
      .use(rehypePrism, { showLineNumbers: false, ignoreMissing: true })
      .use(rehypeStringify)
      .process(markdownContentForProcessing);
  } catch (remarkError) {
    console.error(`---> getMarkdownContentBySlug: Error PROCESSING markdown in file "${filePath}" (for slug "${slug}"):`, remarkError);
    return null; // Markdown processing failed
  }

  const contentHtml = processedContent.toString();

  // Derive title from frontmatter first, then filename (if not index), then directory name (if index)
  const filename = path.basename(filePath, path.extname(filePath));
  let title = frontmatter.title || 'Untitled Document'; // Default title

  if (!frontmatter.title) {
    if (filename.toLowerCase() !== 'index') {
      // Use filename for title if it's not 'index'
      title = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } else {
      // If filename is 'index', use parent directory name, unless parent is 'docs'
      const parentDir = path.basename(path.dirname(filePath));
      if (parentDir.toLowerCase() !== 'docs' && parentDir !== '.' && parentDir !== '') {
        title = parentDir.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      } else if (normalizedSlug === 'index') {
        // Explicitly handle the root index file case if still untitled
        title = 'Homepage'; // Or load from site config?
      }
    }
  }

  // console.log(`---> getMarkdownContentBySlug: Successfully processed slug "${normalizedSlug}", Title: "${title}"`);
  return {
    slug: normalizedSlug, // Return the normalized slug used for lookup
    title: title,
    contentHtml: contentHtml,
    rawContent: rawMarkdownContent,
    frontmatter: frontmatter || {},
  };
}

// Recursively finds all markdown files and returns their normalized slugs.
export function getAllMarkdownSlugs(directory: string = docsDirectory, currentSlugs: Set<string> = new Set(), base: string = ''): string[] {
  try {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      const relativePath = base ? path.join(base, entry.name).replace(/\\/g, '/') : entry.name.replace(/\\/g, '/');

      if (entry.isDirectory()) {
        getAllMarkdownSlugs(fullPath, currentSlugs, relativePath);
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
        const slug = normalizeSlug(relativePath);
        if (slug) {
            currentSlugs.add(slug);
            // console.log(`getAllMarkdownSlugs: Added slug "${slug}" from path "${relativePath}"`);
        } else {
            // console.warn(`getAllMarkdownSlugs: Generated empty slug for path "${relativePath}" - skipping.`);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error);
  }

  // Final processing only when returning from the initial call
  if (directory === docsDirectory) {
     // Explicitly add root 'index' slug if corresponding file exists
     if (fs.existsSync(path.join(docsDirectory, 'index.md')) || fs.existsSync(path.join(docsDirectory, 'index.mdx'))) {
         if (!currentSlugs.has('index')) {
              currentSlugs.add('index');
              // console.log("getAllMarkdownSlugs: Explicitly added root 'index' slug.");
         }
     }
    return Array.from(currentSlugs).filter(s => s); // Filter ensure no empty strings
  }
  // This function is recursive, intermediate calls shouldn't return the Set as an array
  return []; // Return empty array for recursive calls
}


// Fetches all documents for search indexing
export async function getAllMarkdownDocumentsForSearch(): Promise<SearchDoc[]> {
  const slugs = getAllMarkdownSlugs();
  const documentPromises = slugs.map(slug => getMarkdownContentBySlug(slug));
  const results = await Promise.all(documentPromises);

  const validDocs = results.filter((doc): doc is MarkdownDocument => doc !== null && typeof doc.rawContent === 'string');

  return validDocs.map(doc => ({
    slug: doc.slug,
    title: doc.title,
    content: doc.rawContent, // Use raw content for search index
  }));
}
