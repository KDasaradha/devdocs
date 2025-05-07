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
  let normalized = slug.replace(/\.md$/, '').replace(/\\/g, '/'); // Remove extension, use forward slashes
  
  // Handle index files
  if (normalized.endsWith('/index')) {
    normalized = normalized.substring(0, normalized.length - '/index'.length);
  } else if (path.basename(normalized).toLowerCase() === 'index') {
     // handles 'index' or '/index' -> '' before removing slashes
     normalized = path.dirname(normalized);
  }

  // Remove leading/trailing slashes
  normalized = normalized.replace(/^\/+|\/+$/g, '');

  // If normalization resulted in an empty string (e.g., from "/" or "/index"), default to "index"
  return normalized === '' || normalized === '.' ? 'index' : normalized;
}

// Gets the markdown content for a given slug. Handles finding the correct file.
export async function getMarkdownContentBySlug(slug: string): Promise<MarkdownDocument | null> {
  const normalizedSlug = normalizeSlug(slug);
  const potentialFilePaths = [
    path.join(docsDirectory, `${normalizedSlug}.md`),         // e.g., docs/about.md
    path.join(docsDirectory, normalizedSlug, 'index.md'),   // e.g., docs/guides/index.md
  ];

  // Explicit check for root index.md
  if (normalizedSlug === 'index') {
      potentialFilePaths.push(path.join(docsDirectory, 'index.md'));
  }

  let filePathToTry: string | undefined;
  for (const p of potentialFilePaths) {
    if (fs.existsSync(p)) {
      filePathToTry = p;
      break;
    }
  }

  if (!filePathToTry) {
    console.warn(`Markdown file not found for slug "${slug}" (normalized to "${normalizedSlug}"). Checked paths: ${potentialFilePaths.join(', ')}`);
    return null;
  }

  try {
    const fileContents = fs.readFileSync(filePathToTry, 'utf8');
    if (typeof fileContents !== 'string') {
       console.error(`Error reading file content as string at "${filePathToTry}" (for slug "${slug}")`);
       return null;
    }
    
    // Use try-catch for gray-matter parsing
    let documentMatter;
    try {
       documentMatter = matter(fileContents);
    } catch (parseError) {
       console.error(`Error parsing frontmatter in file "${filePathToTry}" (for slug "${slug}"):`, parseError);
       // Return null or default content? Let's return null for now.
       return null; 
    }
    const { data, content } = documentMatter;

    // Process markdown content to HTML
    let processedContent;
    try {
      processedContent = await remark()
        .use(remarkGfm) // GitHub Flavored Markdown
        .use(remarkRehype, { allowDangerousHtml: true }) // Convert markdown to rehype AST
        .use(rehypeRaw) // Handle raw HTML in markdown
        .use(rehypeSlug) // Add IDs to headings
        .use(rehypeAutolinkHeadings, { // Add links to headings
          behavior: 'wrap',
          properties: { className: ['anchor'] } // Add class for styling anchor links
        })
        .use(rehypePrism, { showLineNumbers: false, ignoreMissing: true }) // Syntax highlighting
        .use(rehypeStringify) // Convert rehype AST to HTML string
        .process(content);
    } catch (remarkError) {
        console.error(`Error processing markdown content in file "${filePathToTry}" (for slug "${slug}"):`, remarkError);
        return null; // Cannot render if processing fails
    }

    const contentHtml = processedContent.toString();

    // Determine the title: frontmatter > filename (humanized) > 'Untitled'
    const filename = path.basename(filePathToTry, '.md');
    let title = 'Untitled Document'; // Default title
    
    if (data.title && typeof data.title === 'string') {
        title = data.title;
    } else if (filename.toLowerCase() !== 'index') {
        title = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
    } else {
        // For index files, try using the parent directory name
        const parentDir = path.basename(path.dirname(filePathToTry));
        if (parentDir !== 'docs' && parentDir !== '.') { // Avoid using 'docs' as title
             title = parentDir.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        } else if (normalizedSlug === 'index') {
             title = 'Homepage'; // Specific title for root index? Or use Site Name from config?
        }
    }
    

    return {
      slug: normalizedSlug, // The slug used to access this content
      title: title,
      contentHtml,
      rawContent: content || '', // Ensure rawContent is always a string for search indexing
      frontmatter: data || {}, // Ensure frontmatter is always an object
    };
  } catch (error) {
    console.error(`Error reading or processing markdown file at "${filePathToTry}" (for slug "${slug}"):`, error);
    return null;
  }
}

// Recursive function to find all .md files and return their normalized slugs
export function getAllMarkdownSlugs(directory: string = docsDirectory, currentSlugs: Set<string> = new Set(), base: string = ''): string[] {
  try {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      const relativePath = path.join(base, entry.name).replace(/\\/g, '/'); // Normalize path segment

      if (entry.isDirectory()) {
        getAllMarkdownSlugs(fullPath, currentSlugs, relativePath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const slug = normalizeSlug(relativePath);
        currentSlugs.add(slug);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error);
  }

  // Convert Set to Array only at the end
  if (directory === docsDirectory) {
    // Ensure root index is captured if it exists
    if (fs.existsSync(path.join(docsDirectory, 'index.md'))) {
        currentSlugs.add('index');
    }
    return Array.from(currentSlugs);
  }
  // For recursive calls, we don't return, just modify the Set
  return []; // Should not be reached in recursive calls returning value
}


export async function getAllMarkdownDocumentsForSearch(): Promise<SearchDoc[]> {
  const slugs = getAllMarkdownSlugs();
  const documentPromises = slugs.map(slug => getMarkdownContentBySlug(slug));
  const results = await Promise.all(documentPromises);

  // Filter out null results and map to SearchDoc format
  return results
    .filter((doc): doc is MarkdownDocument => doc !== null)
    .map(doc => ({
      slug: doc.slug,
      title: doc.title,
      content: doc.rawContent, // Use raw content for indexing
    }));
}
