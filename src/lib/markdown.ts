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
  let normalized = slug.replace(/\\/g, '/').replace(/\.mdx?$/, ''); 

  if (normalized.endsWith('/index')) {
    normalized = normalized.substring(0, normalized.length - '/index'.length);
  } else if (path.basename(normalized).toLowerCase() === 'index' && normalized !== 'index') {
     normalized = path.dirname(normalized);
  }

  normalized = normalized.replace(/^\/+|\/+$/g, '');

  const finalSlug = (normalized === '' || normalized === '.') ? 'index' : normalized;
  return finalSlug;
}

// Gets the markdown content for a given slug. Handles finding the correct file.
export async function getMarkdownContentBySlug(slug: string): Promise<MarkdownDocument | null> {
  const normalizedSlug = normalizeSlug(slug);

  const potentialFilePaths: string[] = [];

  potentialFilePaths.push(path.join(docsDirectory, `${normalizedSlug}.md`));
  potentialFilePaths.push(path.join(docsDirectory, `${normalizedSlug}.mdx`));
  potentialFilePaths.push(path.join(docsDirectory, normalizedSlug, 'index.md'));
  potentialFilePaths.push(path.join(docsDirectory, normalizedSlug, 'index.mdx'));

  if (normalizedSlug === 'index') {
    potentialFilePaths.unshift(path.join(docsDirectory, 'index.mdx'));
    potentialFilePaths.unshift(path.join(docsDirectory, 'index.md'));
  }

  const uniquePotentialPaths = Array.from(new Set(potentialFilePaths));

  let filePath: string | undefined;
  let fileContents: string | undefined;
  let sourceFilePath: string | undefined; // Store the path relative to docsDirectory

  for (const p of uniquePotentialPaths) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        filePath = p;
        fileContents = fs.readFileSync(filePath, 'utf8');
        // Store the path relative to the docs directory
        sourceFilePath = path.relative(docsDirectory, filePath).replace(/\\/g, '/');
        break; 
      }
    } catch (error) {
      console.warn(`   Error accessing potential path "${p}" (continuing check):`, error instanceof Error ? error.message : String(error));
    }
  }

  if (!filePath || typeof fileContents !== 'string') {
    console.warn(`---> getMarkdownContentBySlug: Markdown file NOT FOUND or could not be read for slug "${slug}" (normalized: "${normalizedSlug}")`);
    return null; 
  }

  let documentMatter;
  try {
    documentMatter = matter(fileContents);
  } catch (parseError) {
    console.error(`---> getMarkdownContentBySlug: Error PARSING frontmatter in file "${filePath}" (for slug "${slug}"):`, parseError);
    return null; 
  }

  const { data: frontmatter, content: rawMarkdownContent } = documentMatter;
  const markdownContentForProcessing = rawMarkdownContent ?? ''; 

  let processedContent;
  try {
    processedContent = await remark()
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true }) 
      .use(rehypeRaw) 
      .use(rehypeSlug) 
      .use(rehypeAutolinkHeadings, { 
        behavior: 'wrap', // Changed back to wrap as prepend caused nested <a>
        properties: {
          className: ['anchor'], 
          'aria-hidden': 'true',
          tabIndex: -1,
        },
        // Removed explicit content, let default '#' be used by plugin
        // content: { type: 'text', value: '#' } 
      })
      .use(rehypePrism, { showLineNumbers: false, ignoreMissing: true }) 
      .use(rehypeStringify) 
      .process(markdownContentForProcessing);
  } catch (remarkError) {
    console.error(`---> getMarkdownContentBySlug: Error PROCESSING markdown in file "${filePath}" (for slug "${slug}"):`, remarkError);
    return null; 
  }

  const contentHtml = processedContent.toString();

  const filename = path.basename(filePath, path.extname(filePath));
  let title = frontmatter.title || 'Untitled Document'; 

  if (!frontmatter.title) {
    if (filename.toLowerCase() !== 'index') {
      title = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } else {
      const parentDir = path.basename(path.dirname(filePath));
      if (parentDir.toLowerCase() !== 'docs' && parentDir !== '.' && parentDir !== '') {
        title = parentDir.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      } else if (normalizedSlug === 'index') {
        title = 'Homepage'; 
      }
    }
  }

  // Include the sourceFilePath in the frontmatter
  const finalFrontmatter = { ...frontmatter, sourceFilePath };

  return {
    slug: normalizedSlug, 
    title: title,
    contentHtml: contentHtml,
    rawContent: rawMarkdownContent,
    frontmatter: finalFrontmatter,
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
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error);
  }

  if (directory === docsDirectory) {
     if (fs.existsSync(path.join(docsDirectory, 'index.md')) || fs.existsSync(path.join(docsDirectory, 'index.mdx'))) {
         if (!currentSlugs.has('index')) {
              currentSlugs.add('index');
         }
     }
    return Array.from(currentSlugs).filter(s => s); 
  }
  return []; 
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
    content: doc.rawContent, 
  }));
}
