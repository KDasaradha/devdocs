
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified, type Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw'; // To handle HTML in markdown safely
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrismPlus from 'rehype-prism-plus';
import rehypeStringify from 'rehype-stringify';
import type { MarkdownDocument, SearchDoc } from '@/types';
import { loadConfig } from '@/lib/config';
import { visit } from 'unist-util-visit';
import { toString as hastToString } from 'hast-util-to-string';
import { VFile } from 'vfile'; // Import VFile

const docsDirectory = path.join(process.cwd(), 'content/docs');

// Helper to remove specific code blocks or elements for search indexing
const removeElementsForSearch = () => (tree: any) => {
  visit(tree, ['element', 'code'], (node, index, parent) => {
    if (!parent || !parent.children || index === null) return; // Guard against invalid parent/index

    if (node.type === 'element' && node.tagName === 'script') {
      parent.children.splice(index, 1);
      return [visit.SKIP, index];
    }
    if (node.type === 'element' && node.tagName === 'pre') {
      parent.children.splice(index, 1);
      return [visit.SKIP, index];
    }
     if (node.type === 'code') {
        // Check if it's NOT inside a <pre> tag already handled above
       let isInsidePre = false;
       let currentParent = parent;
       while(currentParent) {
          if (currentParent.type === 'element' && currentParent.tagName === 'pre') {
            isInsidePre = true;
            break;
          }
          // Basic parent traversal, might need `unist-util-visit-parents` for robust check
          // For this simple case, checking immediate parent might suffice
          currentParent = (currentParent as any).parent; // This property might not exist depending on tree structure/plugins
       }
       if (!isInsidePre) {
         parent.children.splice(index, 1);
         return [visit.SKIP, index]; // Adjust index for next iteration
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

  // Convert directory index files ('folder/index') to directory slugs ('folder')
  if (slug.endsWith('/index')) {
    slug = slug.substring(0, slug.length - '/index'.length);
  }
  // Handle root index file explicitly ('index' or '/index' -> 'index')
  else if (path.basename(slug) === 'index' && (path.dirname(slug) === '.' || path.dirname(slug) === '/')) {
     slug = 'index';
  }

  // Ensure consistency: no leading/trailing slashes for non-root slugs
  // And handle the case where only 'index' remains after processing
  slug = slug.replace(/^\/+|\/+$/g, '');
  if (slug === '') {
     slug = 'index';
  }

  return slug;
}

// Tries to find the actual file path for a given normalized slug.
// Checks for .md, .mdx, and index files within directories.
function findMarkdownFile(normalizedSlug: string): string | null {
  const baseDir = docsDirectory;
  let potentialPaths: string[] = [];

  // Check for root index file explicitly first if slug is 'index'
  if (normalizedSlug === 'index') {
      potentialPaths = [
          path.join(baseDir, 'index.md'),
          path.join(baseDir, 'index.mdx'),
      ];
  } else {
      // For non-index slugs, check direct file match and then index file in subdirectory
       potentialPaths = [
        path.join(baseDir, `${normalizedSlug}.md`),
        path.join(baseDir, `${normalizedSlug}.mdx`),
        path.join(baseDir, normalizedSlug, 'index.md'),
        path.join(baseDir, normalizedSlug, 'index.mdx'),
      ];
  }

  for (const p of potentialPaths) {
    try {
      // Check if path exists and is a file
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        // console.log(`---> findMarkdownFile: Found match for slug "${normalizedSlug}" at path: "${p}"`);
        return p;
      }
    } catch (e) {
        // Log only errors other than 'file not found'
        if (e instanceof Error && (e as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.warn(`---> Warning accessing potential path "${p}":`, e.message);
        }
    }
  }

  // If no file is found after checking all potentials
  // console.warn(`---> findMarkdownFile: No matching file found for slug "${normalizedSlug}" in checked paths: [${potentialPaths.join(', ')}]`);
  return null;
}


// Create unified processor instances outside the function for efficiency
// Processor for rendering HTML content
const htmlProcessor = unified()
  .use(remarkParse) // Parse markdown
  .use(remarkGfm) // Support GitHub Flavored Markdown (tables, strikethrough, etc.)
  .use(remarkRehype, { allowDangerousHtml: true }) // Convert markdown to rehype HAST
  .use(rehypeRaw) // Handle raw HTML embedded in markdown
  .use(rehypeSlug) // Add 'id' attributes to headings
  .use(rehypeAutolinkHeadings, { // Add anchor links to headings
    behavior: 'prepend', // Prepend the link inside the heading
    properties: { className: ['anchor'], 'aria-hidden': 'true', tabIndex: -1 }, // Add classes and attributes to the link
    content: { // Customize the appearance of the link (e.g., a hash symbol)
        type: 'element',
        tagName: 'span',
        properties: { className: ['anchor-icon'] },
        children: [{ type: 'text', value: '#' }]
    }
  })
  .use(rehypePrismPlus, { showLineNumbers: false, ignoreMissing: true }) // Apply Prism syntax highlighting
  .use(rehypeStringify); // Convert HAST to HTML string
  // Removed invalid TS type assertion: as Processor<any, any, any, string>;


// Processor for extracting text content for search indexing
const searchProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(removeElementsForSearch) // Custom plugin to remove code blocks etc.
  .use(rehypeStringify);
  // Removed invalid TS type assertion: as Processor<any, any, any, string>;


// Gets the markdown content for a given slug array.
export async function getMarkdownContentBySlug(slugSegments: string[] | undefined): Promise<MarkdownDocument | null> {
  const normalizedSlug = normalizeSlug(slugSegments);
  // console.log(`---> getMarkdownContentBySlug: Attempting fetch for slug: "${normalizedSlug}" (from segments: [${(slugSegments || []).join(', ')}])`);

  const filePath = findMarkdownFile(normalizedSlug);

  if (!filePath) {
    // Log only if the request wasn't for 'index' - index failures are handled in page.tsx
    if (normalizedSlug !== 'index') {
        console.error(`---> getMarkdownContentBySlug: Markdown file NOT FOUND for requested slug "${normalizedSlug}".`);
    }
    return null; // Return null, let the page component handle the 404 logic
  }

  let fileContents: string;
  try {
    fileContents = fs.readFileSync(filePath, 'utf8');
    // console.log(`---> getMarkdownContentBySlug: Successfully READ file "${filePath}" for slug "${normalizedSlug}"`);
  } catch (readError) {
    console.error(`---> getMarkdownContentBySlug: Error READING file "${filePath}" (for slug "${normalizedSlug}"):`, readError);
    return null; // Return null on file read error
  }

  let documentMatter;
  try {
    // Check for BOM (Byte Order Mark) which can cause issues with gray-matter
    if (fileContents.charCodeAt(0) === 0xFEFF) {
      fileContents = fileContents.slice(1);
    }
    documentMatter = matter(fileContents);
  } catch (parseError) {
    console.error(`---> getMarkdownContentBySlug: Error PARSING frontmatter in file "${filePath}" (for slug "${normalizedSlug}"):`, parseError);
    // Treat content as full markdown without frontmatter if parsing fails
    documentMatter = { data: {}, content: fileContents, isEmpty: !fileContents, excerpt: '' };
  }

  const { data: frontmatter, content: rawMarkdownContent } = documentMatter;
  const markdownContentForProcessing = rawMarkdownContent ?? ''; // Ensure it's a string

  // Check for empty markdown content *after* parsing frontmatter
  if (markdownContentForProcessing.trim() === '') {
      console.warn(`---> getMarkdownContentBySlug: Markdown content is empty in file "${filePath}" for slug "${normalizedSlug}".`);
      // Proceed, but the contentHtml will be empty, allowing the page component to render fallback.
  }

  let processedContentHtml = '';
  try {
    // Process the content for HTML rendering
    const vfileHtml = new VFile({ path: filePath, value: markdownContentForProcessing }); // Create VFile
    const fileResultHtml = await htmlProcessor.process(vfileHtml);
    processedContentHtml = fileResultHtml.toString();
  } catch (htmlProcessingError) {
    console.error(`---> getMarkdownContentBySlug: Error PROCESSING markdown to HTML in file "${filePath}" (for slug "${normalizedSlug}"):`, htmlProcessingError);
    processedContentHtml = `<p class="text-destructive">Error processing markdown content.</p>`; // Provide a safe error message
  }

  // Determine title: Use frontmatter title, fallback to making title from slug
  let title = 'Untitled Document';
  if (typeof frontmatter.title === 'string' && frontmatter.title.trim() !== '') {
      title = frontmatter.title;
  } else {
      // Generate title from the *normalized* slug
      const titleSlug = normalizedSlug === 'index' ? 'Home' : normalizedSlug.split('/').pop() || 'Page';
      title = titleSlug
          .split(/[-_]/) // Split by hyphen or underscore
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      // Use site_name from config for the index page title if available
      if (normalizedSlug === 'index') {
         try {
           const config = loadConfig();
           title = config.site_name || "Home";
         } catch (configError) {
             console.warn("Error loading config for index page title fallback:", configError);
             title = "Home"; // Fallback if config load fails
         }
      }
  }

  // Store the relative path from 'content/docs'
  const sourceFilePath = path.relative(docsDirectory, filePath).replace(/\\/g, '/');
  const finalFrontmatter = { ...frontmatter, sourceFilePath }; // Add sourceFilePath to frontmatter

  return {
    slug: normalizedSlug,
    title: title,
    contentHtml: processedContentHtml, // Render this HTML
    rawContent: rawMarkdownContent, // Keep raw markdown for search index / edit links
    frontmatter: finalFrontmatter,
  };
}


// Recursively finds all markdown files (.md, .mdx) and returns their normalized slugs.
export function getAllMarkdownSlugs(directory: string = docsDirectory): string[] {
  const slugs = new Set<string>();

  function findFilesRecursively(dir: string, currentPath: string) {
    let entries;
    try {
      if (!fs.existsSync(dir)) {
        console.warn(`getAllMarkdownSlugs: Directory not found, skipping: ${dir}`);
        return; // Stop recursion if directory doesn't exist
      }
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      console.error(`Error reading directory ${dir}:`, err);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(currentPath, entry.name).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        findFilesRecursively(fullPath, relativePath);
      } else if (entry.isFile() && /\.(mdx|md)$/.test(entry.name)) {
        let slug = relativePath.replace(/\.mdx?$/, '');
        // Normalize 'folder/index' to 'folder'
        if (slug.endsWith('/index')) {
          slug = slug.substring(0, slug.length - '/index'.length);
          if (slug === '') slug = 'index'; // Handle case where it was 'index.md' at root
        }
        // Ensure root path ('/' or '') becomes 'index' after potential /index removal
        slug = (slug === '' || slug === '/') ? 'index' : slug.replace(/^\//, '');

        // Skip empty slugs if they somehow occur (e.g. root '/index.md' becoming '')
        if (slug) {
           slugs.add(slug);
        }
      }
    }
  }

  findFilesRecursively(directory, '');
  const resultSlugs = Array.from(slugs);
  // console.log(`getAllMarkdownSlugs: Found slugs: ${resultSlugs.join(', ')}`);
  return resultSlugs;
}


// Fetches all documents for search indexing
export async function getAllMarkdownDocumentsForSearch(): Promise<SearchDoc[]> {
  const slugs = getAllMarkdownSlugs();
  // console.log(`getAllMarkdownDocumentsForSearch: Found ${slugs.length} slugs for search indexing: [${slugs.join(', ')}]`);

  const documentPromises = slugs.map(async (slug) => {
    // Ensure slug 'index' is fetched correctly
    const slugSegments = slug === 'index' ? [] : slug.split('/');
    const doc = await getMarkdownContentBySlug(slugSegments);

    if (!doc || typeof doc.rawContent !== 'string') {
        console.warn(`Search Indexing: Skipping doc with null/invalid rawContent for slug: ${slug}`);
        return null;
    }

    // Process raw markdown to extract text content for search
    try {
      const vfileSearch = new VFile({ path: doc.frontmatter.sourceFilePath || `${slug}.md`, value: doc.rawContent });
      const tree = searchProcessor.parse(vfileSearch);
      const textContent = hastToString(tree) // Use the tree obtained from the searchProcessor
                        .replace(/\s+/g, ' ') // Normalize whitespace
                        .trim();

      return {
        slug: doc.slug,
        title: doc.title,
        content: textContent, // Use processed text content
      };
    } catch (processingError) {
       console.error(`Search Indexing: Error processing content for slug ${slug}:`, processingError);
       // Fallback to raw content if processing fails, might index unwanted code/tags
       return {
           slug: doc.slug,
           title: doc.title,
           content: doc.rawContent.replace(/\s+/g, ' ').trim(), // Basic normalization
       }
    }
  });

  const results = await Promise.all(documentPromises);

  const validDocs = results.filter((doc): doc is SearchDoc => {
      const isValid = doc !== null && typeof doc.content === 'string';
      if (!isValid && doc !== null) {
        // console.warn(`getAllMarkdownDocumentsForSearch: Filtered out document with invalid content (slug: ${doc?.slug}).`);
      } else if (doc === null) {
        // console.warn("getAllMarkdownDocumentsForSearch: Filtered out null document.");
      }
      return isValid;
  });

  // console.log(`getAllMarkdownDocumentsForSearch: Returning ${validDocs.length} valid documents for search index.`);
  return validDocs;
}

