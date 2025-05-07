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

function normalizeSlug(slug: string): string {
  const cleanedSlug = slug.replace(/\.md$/, '').replace(/\\/g, '/'); // Remove extension, normalize slashes
  if (cleanedSlug === '' || cleanedSlug === '/' || cleanedSlug.toLowerCase() === 'index') {
    return 'index'; // Root index file
  }
  if (cleanedSlug.endsWith('/index')) {
    return cleanedSlug.substring(0, cleanedSlug.length - '/index'.length); // 'folder/index' -> 'folder'
  }
    if (cleanedSlug.startsWith('/')) {
    return cleanedSlug.substring(1); // Remove leading slash if present
  }
  return cleanedSlug;
}

export async function getMarkdownContentBySlug(slug: string): Promise<MarkdownDocument | null> {
  const normalizedSlug = normalizeSlug(slug);

  // Potential file paths:
  // 1. Direct match: about.md -> /path/to/content/docs/about.md
  // 2. Directory index: guides/getting-started -> /path/to/content/docs/guides/getting-started/index.md
  // 3. Root index: index -> /path/to/content/docs/index.md
  const directFilePath = path.join(docsDirectory, `${normalizedSlug}.md`);
  const indexFilePath = path.join(docsDirectory, normalizedSlug, 'index.md');
  const rootIndexFilePath = path.join(docsDirectory, 'index.md'); // Explicit check for root

  let filePathToTry: string | undefined;
  let resolvedSlug = normalizedSlug;

  if (fs.existsSync(directFilePath)) {
    filePathToTry = directFilePath;
  } else if (fs.existsSync(indexFilePath)) {
    filePathToTry = indexFilePath;
    // No need to change resolvedSlug here, it represents the directory path
  } else if (normalizedSlug === 'index' && fs.existsSync(rootIndexFilePath)) {
    filePathToTry = rootIndexFilePath;
  } else {
    console.warn(`Markdown file not found for slug "${slug}" (normalized to "${normalizedSlug}"). Tried paths:\n  - ${directFilePath}\n  - ${indexFilePath}${normalizedSlug === 'index' ? `\n  - ${rootIndexFilePath}` : ''}`);
    return null;
  }

  try {
    const fileContents = fs.readFileSync(filePathToTry, 'utf8');
    // Ensure gray-matter doesn't throw on empty files or non-md files if they sneak in
    if (typeof fileContents !== 'string') {
       console.error(`Error reading file content as string at "${filePathToTry}" (for slug "${slug}")`);
       return null;
    }
    const { data, content } = matter(fileContents);

    const processedContent = await remark()
      .use(remarkGfm) // GitHub Flavored Markdown
      .use(remarkRehype, { allowDangerousHtml: true }) // Convert markdown to rehype AST
      .use(rehypeRaw) // Handle raw HTML in markdown
      .use(rehypeSlug) // Add IDs to headings
      .use(rehypeAutolinkHeadings, { // Add links to headings
        behavior: 'wrap', 
        properties: { className: ['anchor'] } 
      }) 
      .use(rehypePrism, { showLineNumbers: false, ignoreMissing: true }) // Syntax highlighting
      .use(rehypeStringify) // Convert rehype AST to HTML string
      .process(content);

    const contentHtml = processedContent.toString();

    // Determine the title: frontmatter > filename (humanized) > 'Untitled'
    const filename = path.basename(filePathToTry, '.md');
    const humanizedFilename = filename === 'index' 
        ? path.basename(path.dirname(filePathToTry)).replace(/-/g, ' ').replace(/_/g, ' ') // Use parent dir name for index files
        : filename.replace(/-/g, ' ').replace(/_/g, ' ');
    const title = data.title || humanizedFilename || 'Untitled';

    return {
      slug: resolvedSlug, // The slug used to access this content
      title: title,
      contentHtml,
      rawContent: content, // For search indexing
      frontmatter: data,
    };
  } catch (error) {
    console.error(`Error reading or processing markdown file at "${filePathToTry}" (for slug "${slug}"):`, error);
    return null;
  }
}

// Recursive function to find all .md files and return their slugs
export function getAllMarkdownSlugs(directory: string = docsDirectory, base: string = ''): string[] {
  let slugs: string[] = [];
  try {
    const files = fs.readdirSync(directory, { withFileTypes: true });

    files.forEach((file) => {
      const relativePath = base ? path.join(base, file.name) : file.name;
      if (file.isDirectory()) {
        slugs = slugs.concat(getAllMarkdownSlugs(path.join(directory, file.name), relativePath));
      } else if (file.isFile() && file.name.endsWith('.md')) {
        const slugPath = relativePath.replace(/\\/g, '/'); // Normalize slashes
        const normalized = normalizeSlug(slugPath);
        slugs.push(normalized);
      }
    });
  } catch (error) {
      console.error(`Error reading directory ${directory}:`, error);
      // Depending on requirements, you might want to re-throw or return empty/partial list
  }

  // Ensure root 'index' is present if index.md exists at the root
  const rootIndexPath = path.join(docsDirectory, 'index.md');
  if (fs.existsSync(rootIndexPath) && !slugs.includes('index')) {
      slugs.push('index');
  }
  
  // Remove potential duplicates which might arise from different normalizations ending up the same
  return [...new Set(slugs)];
}


export async function getAllMarkdownDocumentsForSearch(): Promise<SearchDoc[]> {
  const slugs = getAllMarkdownSlugs();
  const documents: SearchDoc[] = [];

  // Using Promise.all for potentially faster fetching if async operations were heavier
  const docPromises = slugs.map(async (slug) => {
    const doc = await getMarkdownContentBySlug(slug);
    if (doc) {
      return {
        slug: doc.slug,
        title: doc.title,
        content: doc.rawContent, // Use raw content for indexing
      };
    } else {
      // Warning already logged in getMarkdownContentBySlug
      return null;
    }
  });

  const results = await Promise.all(docPromises);
  
  // Filter out any null results (where fetching failed)
  return results.filter((doc): doc is SearchDoc => doc !== null);
}