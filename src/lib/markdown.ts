
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
import { loadConfig } from '@/lib/config'; // Load config for default title if needed
import { unified } from 'unified'; // Added unified import

const docsDirectory = path.join(process.cwd(), 'content/docs');

// Helper to remove specific code blocks or elements
const removeCodeBlocks = () => (tree: any) => {
  const { visit } = require('unist-util-visit'); // Use require inside function scope
  visit(tree, (node) => node.type === 'code' || node.type === 'html', (node, index, parent) => {
    if (parent && index !== null) {
        // Basic check for <script> tags - more robust parsing might be needed
        if (node.type === 'html' && /<\s*script[^>]*>[\s\S]*?<\/\s*script\s*>/i.test(node.value)) {
             console.log("Removing script tag from markdown for search index:", node.value.substring(0, 50) + "...");
             parent.children.splice(index, 1);
             return [visit.SKIP, index]; // Adjust index after removal and skip children
        }
        // Remove code blocks (md pre/code)
        if (node.type === 'code') {
             parent.children.splice(index, 1);
             return [visit.SKIP, index];
        }
    }
  });
};

// Normalizes a raw path/slug segment array to a slug string used for lookup.
function normalizeSlug(rawSlugSegments: string[] | undefined): string {
  const segments = rawSlugSegments || [];
  let slug = segments.join('/');

  // If slug is empty (root path), set it to 'index'
  if (slug === '') {
    return 'index';
  }

  // Remove potential trailing '.md' or '.mdx' if accidentally included
  slug = slug.replace(/\.mdx?$/, '');

  // Ensure consistency: no leading/trailing slashes
  slug = slug.replace(/^\/+|\/+$/g, '');

  // console.log(`normalizeSlug: raw [${segments.join(', ')}] -> normalized "${slug}"`);
  return slug || 'index'; // Ensure we always return 'index' for the root
}

// Tries to find the actual file path for a given normalized slug.
// Checks for .md, .mdx, and index files within directories.
function findMarkdownFile(normalizedSlug: string): string | null {
  const baseDir = docsDirectory;

  // Possible file locations based on the slug
  const potentialPaths = [
    // Direct file match (e.g., 'about.md', 'guides/topic.md')
    path.join(baseDir, `${normalizedSlug}.md`),
    path.join(baseDir, `${normalizedSlug}.mdx`),
  ];

  // If the slug represents a directory, check for an index file within it
  // (e.g., slug 'guides' should check for 'guides/index.md')
  // Exclude 'index' itself from this check as it's handled separately
  if (normalizedSlug !== 'index' && !normalizedSlug.endsWith('/index')) {
     potentialPaths.push(path.join(baseDir, normalizedSlug, 'index.md'));
     potentialPaths.push(path.join(baseDir, normalizedSlug, 'index.mdx'));
  } else if (normalizedSlug === 'index') {
     // Special case for the root index file
     potentialPaths.unshift(path.join(baseDir, 'index.mdx')); // Prioritize mdx
     potentialPaths.unshift(path.join(baseDir, 'index.md')); // Prioritize md
  }

  const uniquePotentialPaths = Array.from(new Set(potentialPaths)); // Remove duplicates
  // console.log(`findMarkdownFile for slug "${normalizedSlug}": Potential paths - [${uniquePotentialPaths.join(', ')}]`);


  for (const p of uniquePotentialPaths) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        // console.log(`   - Found matching file: "${p}"`);
        return p; // Return the first valid path found
      }
    } catch (e) {
       // Ignore errors like permission issues for non-existent paths, but log others
       if (e instanceof Error && e.code !== 'ENOENT') {
            console.warn(`   - Warning accessing potential path "${p}":`, e.message);
       }
    }
  }

  // console.log(`   - No matching file found for slug "${normalizedSlug}" in checked paths.`);
  return null; // No file found
}


// Gets the markdown content for a given slug array.
export async function getMarkdownContentBySlug(slugSegments: string[] | undefined): Promise<MarkdownDocument | null> {
  const normalizedSlug = normalizeSlug(slugSegments);
  // console.log(`---> getMarkdownContentBySlug: Attempting fetch for slug: "${normalizedSlug}" (from segments: [${(slugSegments || []).join(', ')}])`);

  const filePath = findMarkdownFile(normalizedSlug);

  if (!filePath) {
    // console.error(`---> getMarkdownContentBySlug: Markdown file NOT FOUND for slug "${normalizedSlug}".`);
    return null;
  }

  let fileContents: string;
  try {
    fileContents = fs.readFileSync(filePath, 'utf8');
  } catch (readError) {
    console.error(`---> getMarkdownContentBySlug: Error READING file "${filePath}" (for slug "${normalizedSlug}"):`, readError);
    return null;
  }

  let documentMatter;
  try {
    documentMatter = matter(fileContents);
  } catch (parseError) {
    console.error(`---> getMarkdownContentBySlug: Error PARSING frontmatter in file "${filePath}" (for slug "${normalizedSlug}"):`, parseError);
    // Continue processing, but maybe without frontmatter or with defaults
    documentMatter = { data: {}, content: fileContents, isEmpty: false, excerpt: '' };
  }

  const { data: frontmatter, content: rawMarkdownContent } = documentMatter;
  const markdownContentForProcessing = rawMarkdownContent ?? ''; // Ensure it's a string

  let processedContent;
  try {
    // Use unified pipeline for processing
    const processor = unified()
      .use(remark) // Parse markdown
      .use(remarkGfm) // Support GFM (tables, footnotes, etc.)
      .use(remarkRehype, { allowDangerousHtml: true }) // Convert markdown to hast
      .use(rehypeRaw) // Handle raw HTML in markdown
      .use(rehypeSlug) // Add IDs to headings
      .use(rehypeAutolinkHeadings, { // Add links to headings
        behavior: 'wrap',
        properties: { className: ['anchor'], 'aria-hidden': 'true', tabIndex: -1 }
      })
      .use(rehypePrism, { showLineNumbers: false, ignoreMissing: true }) // Apply syntax highlighting
      .use(rehypeStringify); // Convert hast to HTML string

    processedContent = await processor.process(markdownContentForProcessing);

  } catch (remarkError) {
    console.error(`---> getMarkdownContentBySlug: Error PROCESSING markdown in file "${filePath}" (for slug "${normalizedSlug}"):`, remarkError);
    return null; // Stop if markdown processing fails
  }

  const contentHtml = processedContent.toString();

  // Determine title: Use frontmatter title, fallback to making title from slug
  let title = 'Untitled Document';
  if (typeof frontmatter.title === 'string' && frontmatter.title.trim() !== '') {
      title = frontmatter.title;
  } else {
      // Generate title from the last segment of the normalized slug
      const titleSlug = normalizedSlug === 'index' ? 'Home' : normalizedSlug.split('/').pop() || 'Page';
      // A more robust title generation: split by '-', replace with space, capitalize words
      title = titleSlug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      if (normalizedSlug === 'index') {
         // Override for root index page, maybe use site name?
         const config = loadConfig();
         title = config.site_name || "Home"; // Use site name or fallback to Home
      }
  }
  // console.log(`---> getMarkdownContentBySlug: Determined title for slug "${normalizedSlug}" as: "${title}"`);

  // Store the relative path from 'content/docs' for edit links etc.
  const sourceFilePath = path.relative(docsDirectory, filePath).replace(/\\/g, '/');
  const finalFrontmatter = { ...frontmatter, sourceFilePath };

  return {
    slug: normalizedSlug,
    title: title,
    contentHtml: contentHtml,
    rawContent: rawMarkdownContent, // Keep raw content for search/editing
    frontmatter: finalFrontmatter,
  };
}


// Recursively finds all markdown files (.md, .mdx) and returns their normalized slugs.
export function getAllMarkdownSlugs(directory: string = docsDirectory): string[] {
  const slugs = new Set<string>();

  function findFilesRecursively(dir: string, currentPath: string) {
    let entries;
    try {
      // Check if directory exists before reading
      if (!fs.existsSync(dir)) {
        // console.warn(`Directory not found, skipping slug search: ${dir}`);
        return;
      }
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      console.error(`Error reading directory ${dir}:`, err);
      return; // Stop recursion for this path if directory is unreadable
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      // Construct relative path correctly, ensuring forward slashes
      const relativePath = path.join(currentPath, entry.name).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        findFilesRecursively(fullPath, relativePath);
      } else if (entry.isFile() && /\.(mdx|md)$/.test(entry.name)) {
        // Normalize the path to get the slug
        let slug = relativePath.replace(/\.mdx?$/, '');
        // Handle index files: 'path/to/index' becomes 'path/to'
        // Ensure root index file ('index') remains 'index'
        if (slug.endsWith('/index')) {
          slug = slug.substring(0, slug.length - '/index'.length) || 'index'; // Handle '/index' becoming '' -> 'index'
        } else if (slug === 'index') {
            // Keep 'index' as 'index'
        }
        // Ensure root path ('') becomes 'index' - redundant if above handles '/index'
        slug = slug || 'index';
         // Check for empty slug again after index processing (e.g. if input was '/')
        if (slug) {
             slugs.add(slug);
        }
      }
    }
  }

  findFilesRecursively(directory, '');
  // Add the root index explicitly if not found (in case it's literally '/index.md')
  if (!slugs.has('index') && (fs.existsSync(path.join(docsDirectory, 'index.md')) || fs.existsSync(path.join(docsDirectory, 'index.mdx')))) {
      slugs.add('index');
  }
  // console.log(`getAllMarkdownSlugs: Found slugs: [${Array.from(slugs).join(', ')}]`);
  return Array.from(slugs);
}

// Fetches all documents for search indexing
export async function getAllMarkdownDocumentsForSearch(): Promise<SearchDoc[]> {
  const slugs = getAllMarkdownSlugs();
  const { toString } = await import('hast-util-to-string'); // Dynamically import hast-util-to-string

  // console.log(`getAllMarkdownDocumentsForSearch: Found ${slugs.length} slugs for search indexing: [${slugs.join(', ')}]`);

  const documentPromises = slugs.map(async (slug) => {
    const doc = await getMarkdownContentBySlug(slug === 'index' ? undefined : slug.split('/'));
    if (!doc || typeof doc.rawContent !== 'string') return null;

    // Process raw markdown to remove code blocks and potentially other irrelevant parts for search
    try {
      const file = await unified()
        .use(remark) // Parse markdown
        .use(remarkGfm)
        .use(removeCodeBlocks) // Custom plugin to remove code/script tags
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeStringify) // Convert back to HTML temporarily to strip tags
        .process(doc.rawContent);

      // Convert the processed HAST back to plain text for indexing
      // This requires parsing the HTML string back to HAST and then using hast-util-to-string
      // Alternatively, use a simpler text extraction method on rawMarkdownContent if performance is key
      const textContent = file.toString() // Basic text extraction, might include unwanted artifacts
                      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
                      .replace(/\s+/g, ' ') // Normalize whitespace
                      .trim();

      return {
        slug: doc.slug,
        title: doc.title,
        content: textContent, // Use processed text content for search index
      };
    } catch (processingError) {
       console.error(`Error processing content for search index (slug: ${slug}):`, processingError);
       // Fallback to using raw content for search if processing fails, but log it
       return {
           slug: doc.slug,
           title: doc.title,
           content: doc.rawContent,
       }
    }
  });

  const results = await Promise.all(documentPromises);

  const validDocs = results.filter((doc): doc is SearchDoc => {
      const isValid = doc !== null && typeof doc.content === 'string';
      if (!isValid && doc !== null) {
        // console.warn(`getAllMarkdownDocumentsForSearch: Filtered out document with invalid rawContent (slug: ${doc?.slug}).`);
      } else if (doc === null) {
        // console.warn("getAllMarkdownDocumentsForSearch: Filtered out null document.");
      }
      return isValid;
  });

  // console.log(`getAllMarkdownDocumentsForSearch: Returning ${validDocs.length} valid documents for search index.`);
  return validDocs;
}

