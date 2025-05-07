
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified, type Processor } from 'unified'; // Import unified
import remarkParse from 'remark-parse'; // Use remark-parse for the parsing step
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrismPlus from 'rehype-prism-plus'; // Reverted to rehype-prism-plus
import rehypeStringify from 'rehype-stringify';
import type { MarkdownDocument, SearchDoc } from '@/types';
import { loadConfig } from '@/lib/config';
import { visit } from 'unist-util-visit'; // Correct import for visit
import { toString as hastToString } from 'hast-util-to-string'; // Correct import for hast-util-to-string

const docsDirectory = path.join(process.cwd(), 'content/docs');

// Helper to remove specific code blocks or elements for search indexing
const removeElementsForSearch = () => (tree: any) => {
  visit(tree, ['element', 'code'], (node, index, parent) => {
    if (node.type === 'element' && node.tagName === 'script') {
      // console.log("Search Index: Removing script tag:", hastToString(node).substring(0, 50) + "...");
      parent.children.splice(index, 1);
      return [visit.SKIP, index]; // Adjust index after removal and skip children
    }
    if (node.type === 'element' && node.tagName === 'pre') {
        // console.log("Search Index: Removing pre block:", hastToString(node).substring(0, 50) + "...");
        parent.children.splice(index, 1);
        return [visit.SKIP, index];
    }
     if (node.type === 'code') { // Also handles markdown code blocks if they weren't in <pre>
        // console.log("Search Index: Removing code block:", hastToString(node).substring(0, 50) + "...");
        parent.children.splice(index, 1);
        return [visit.SKIP, index];
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

  // Ensure consistency: no leading/trailing slashes for non-root slugs
  slug = slug.replace(/^\/+|\/+$/g, '');

  return slug || 'index'; // Ensure we always return 'index' for the root
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

  // console.log(`findMarkdownFile for slug "${normalizedSlug}": Potential paths - [${potentialPaths.join(', ')}]`);

  for (const p of potentialPaths) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        // console.log(`   - Found matching file: "${p}"`);
        return p; // Return the first valid path found
      }
    } catch (e) {
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
    console.error(`---> getMarkdownContentBySlug: Markdown file NOT FOUND for slug "${normalizedSlug}". Checked in dir: ${docsDirectory}`);
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
    documentMatter = { data: {}, content: fileContents, isEmpty: !fileContents, excerpt: '' };
  }

  const { data: frontmatter, content: rawMarkdownContent } = documentMatter;
  const markdownContentForProcessing = rawMarkdownContent ?? '';

  let processedContent;
  try {
    // Define the unified pipeline
    const processor = unified()
      .use(remarkParse) // Use remark-parse
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeSlug)
      .use(rehypeAutolinkHeadings, {
        behavior: 'wrap', // Changed from 'append' or 'prepend' if causing issues, wrap is often safer
        properties: { className: ['anchor'], 'aria-hidden': 'true', tabIndex: -1 }
      })
      .use(rehypePrismPlus, { showLineNumbers: false, ignoreMissing: true }) // Use rehype-prism-plus
      .use(rehypeStringify);

    // Process the content
    const fileResult = await processor.process(markdownContentForProcessing);
    processedContent = fileResult.toString();

  } catch (remarkError) {
    console.error(`---> getMarkdownContentBySlug: Error PROCESSING markdown in file "${filePath}" (for slug "${normalizedSlug}"):`, remarkError);
    // Provide fallback content or return null depending on desired behavior
    return {
        slug: normalizedSlug,
        title: `Error Processing: ${normalizedSlug}`,
        contentHtml: `<p>Error processing markdown content.</p><pre>${(remarkError as Error).message}</pre>`,
        rawContent: rawMarkdownContent,
        frontmatter: { sourceFilePath: path.relative(docsDirectory, filePath).replace(/\\/g, '/') },
    };
  }

  const contentHtml = processedContent;

  // Determine title: Use frontmatter title, fallback to making title from slug
  let title = 'Untitled Document';
  if (typeof frontmatter.title === 'string' && frontmatter.title.trim() !== '') {
      title = frontmatter.title;
  } else {
      const titleSlug = normalizedSlug === 'index' ? 'Home' : normalizedSlug.split('/').pop() || 'Page';
      title = titleSlug
          .split(/[-_]/) // Split by hyphen or underscore
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      if (normalizedSlug === 'index') {
         const config = loadConfig();
         title = config.site_name || "Home";
      }
  }

  // Store the relative path from 'content/docs'
  const sourceFilePath = path.relative(docsDirectory, filePath).replace(/\\/g, '/');
  const finalFrontmatter = { ...frontmatter, sourceFilePath };

  return {
    slug: normalizedSlug,
    title: title,
    contentHtml: contentHtml,
    rawContent: rawMarkdownContent,
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
        return;
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
        if (slug.endsWith('/index')) {
          slug = slug.substring(0, slug.length - '/index'.length);
        } else if (path.basename(slug) === 'index') {
           // Handles root index file case if currentPath was ''
          slug = 'index';
        }
        // Ensure root path ('') becomes 'index'
        slug = slug || 'index';
        slugs.add(slug);
      }
    }
  }

  findFilesRecursively(directory, '');
  // No need to explicitly add 'index' here anymore, the logic above should handle it.
  return Array.from(slugs);
}

// Fetches all documents for search indexing
export async function getAllMarkdownDocumentsForSearch(): Promise<SearchDoc[]> {
  const slugs = getAllMarkdownSlugs();
  // console.log(`getAllMarkdownDocumentsForSearch: Found ${slugs.length} slugs for search indexing: [${slugs.join(', ')}]`);

  const documentPromises = slugs.map(async (slug) => {
    const doc = await getMarkdownContentBySlug(slug === 'index' ? undefined : slug.split('/'));
    if (!doc || typeof doc.rawContent !== 'string') {
        console.warn(`Search Indexing: Skipping doc with null/invalid rawContent for slug: ${slug}`);
        return null;
    }

    // Process raw markdown to extract text content for search
    try {
      const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(removeElementsForSearch); // Use the custom plugin to remove elements

      const tree = processor.parse(doc.rawContent);
      const textContent = hastToString(tree) // Directly convert the mdast tree to string
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
        ```
        
      