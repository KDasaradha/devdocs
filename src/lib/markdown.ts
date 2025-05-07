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
import rehypePrism from 'rehype-prism-plus'; // Using rehype-prism-plus for wider language support
import type { MarkdownDocument, SearchDoc } from '@/types';

const docsDirectory = path.join(process.cwd(), 'content/docs');

export async function getMarkdownContentBySlug(slug: string): Promise<MarkdownDocument | null> {
  // Normalize slug: treat empty or 'index' (case-insensitive) as 'index' for root
  const normalizedSlug = (slug === '' || slug.toLowerCase() === 'index') ? 'index' : slug.replace(/\.md$/, '');

  const directFilePath = path.join(docsDirectory, `${normalizedSlug}.md`);
  const indexFilePath = path.join(docsDirectory, normalizedSlug, 'index.md');

  let filePathToTry: string | undefined;
  let fileSourceDescription: string = "";


  if (fs.existsSync(directFilePath)) {
    filePathToTry = directFilePath;
    fileSourceDescription = `as '${normalizedSlug}.md'`;
  } else if (fs.existsSync(indexFilePath)) {
    filePathToTry = indexFilePath;
    fileSourceDescription = `as directory index '${normalizedSlug}/index.md'`;
  } else {
    console.warn(`Markdown file not found for slug "${normalizedSlug}". Tried paths:\n  - ${directFilePath}\n  - ${indexFilePath}`);
    return null;
  }

  try {
    const fileContents = fs.readFileSync(filePathToTry, 'utf8');
    const { data, content } = matter(fileContents);

    const processedContent = await remark()
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeSlug)
      .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
      .use(rehypePrism, { showLineNumbers: false, ignoreMissing: true })
      .use(rehypeStringify)
      .process(content);
    
    const contentHtml = processedContent.toString();

    return {
      slug: normalizedSlug, // Return the slug that was used to find the content
      title: data.title || normalizedSlug.split('/').pop()?.replace(/-/g, ' ').replace(/_/g, ' ') || 'Untitled',
      contentHtml,
      rawContent: content, // For search indexing
      frontmatter: data,
    };
  } catch (error) {
    console.error(`Error reading or processing markdown file at "${filePathToTry}" (for slug "${normalizedSlug}", found ${fileSourceDescription}):`, error);
    return null;
  }
}

export function getAllMarkdownSlugs(directory: string = docsDirectory, base: string = ''): string[] {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  let slugs: string[] = [];

  files.forEach((file) => {
    const currentPath = path.join(base, file.name);
    if (file.isDirectory()) {
      slugs = slugs.concat(getAllMarkdownSlugs(path.join(directory, file.name), currentPath));
    } else if (file.name.endsWith('.md')) {
      let slug = currentPath.replace(/\.md$/, '');
      slug = slug.replace(/\\/g, '/'); // Normalize to forward slashes

      if (path.basename(slug) === 'index') {
        slug = path.dirname(slug);
        if (slug === '.' || slug === '') { // Root index.md
          slug = 'index';
        }
      }
      slugs.push(slug);
    }
  });
  // Remove duplicates which might arise if e.g. a directory is named 'index'
  // and also contains an 'index.md'
  return [...new Set(slugs)];
}


export async function getAllMarkdownDocumentsForSearch(): Promise<SearchDoc[]> {
  const slugs = getAllMarkdownSlugs();
  const documents: SearchDoc[] = [];

  for (const slug of slugs) {
    const effectiveSlug = (slug === '.' || slug === '') ? 'index' : slug;
    const doc = await getMarkdownContentBySlug(effectiveSlug);
    if (doc) {
      documents.push({
        slug: doc.slug,
        title: doc.title,
        content: doc.rawContent,
      });
    } else {
      // This warning is now inside getMarkdownContentBySlug if file isn't found
      // console.warn(`Search: Document not found for slug '${effectiveSlug}' during search indexing.`);
    }
  }
  return documents;
}
