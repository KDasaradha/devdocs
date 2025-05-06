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
  const fullSlug = slug === 'index' || slug === '' ? 'index' : slug;
  const realSlug = fullSlug.replace(/\.md$/, '');
  const filePath = path.join(docsDirectory, `${realSlug}.md`);

  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
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
      slug: realSlug,
      title: data.title || realSlug.split('/').pop()?.replace(/-/g, ' ') || 'Untitled',
      contentHtml,
      rawContent: content, // For search indexing
      frontmatter: data,
    };
  } catch (error) {
    console.error(`Error reading markdown file for slug "${realSlug}":`, error);
    return null;
  }
}

export function getAllMarkdownSlugs(directory: string = docsDirectory, base: string = ''): string[] {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  let slugs: string[] = [];

  files.forEach((file) => {
    const filePath = path.join(directory, file.name);
    const relativePath = path.join(base, file.name);
    if (file.isDirectory()) {
      slugs = slugs.concat(getAllMarkdownSlugs(filePath, relativePath));
    } else if (file.name.endsWith('.md')) {
      const slug = relativePath.replace(/\.md$/, '');
      // Treat 'index.md' at any level as the directory's root page
      if (file.name === 'index.md') {
        slugs.push(path.dirname(slug) === '.' ? 'index' : path.dirname(slug));
      } else {
        slugs.push(slug);
      }
    }
  });
  // Normalize paths to use forward slashes
  return slugs.map(s => s.replace(/\\/g, '/'));
}


export async function getAllMarkdownDocumentsForSearch(): Promise<SearchDoc[]> {
  const slugs = getAllMarkdownSlugs();
  const documents: SearchDoc[] = [];

  for (const slug of slugs) {
    const doc = await getMarkdownContentBySlug(slug);
    if (doc) {
      documents.push({
        slug: doc.slug,
        title: doc.title,
        content: doc.rawContent,
      });
    }
  }
  return documents;
}
