import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrism from 'rehype-prism-plus';
import rehypeRaw from 'rehype-raw'; // Needed for inline HTML if any
import { CodeBlock } from './code-block'; // Import custom CodeBlock

interface MarkdownRendererProps {
  content: string; // Pass raw markdown content
}

// Define custom components to pass to ReactMarkdown
const components: Components = {
  // Target 'pre' elements, assuming they contain a 'code' child
  pre({ node, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const codeElement = React.Children.toArray(children).find(
      (child: any) => child?.type === 'code'
    );

    if (codeElement && typeof codeElement === 'object' && codeElement.props) {
      const rawString = String(codeElement.props.children).replace(/\n$/, '');
      return (
        <CodeBlock rawString={rawString} className={className} {...props}>
          {/* Pass the original children (the code element itself) */}
          {children} 
        </CodeBlock>
      );
    } else {
        // Fallback for pre tags without a code child or unexpected structure
        return <pre className={className} {...props}>{children}</pre>;
    }
  },
  // Optional: Customize other elements like images, links, headings if needed
  // img: ({node, ...props}) => <Image alt={props.alt || ''} src={props.src || ''} width={700} height={400} {...props} className="rounded-md my-6 shadow-md max-w-full h-auto border border-border" />,
  // a: ({node, ...props}) => <Link href={props.href || '#'} {...props} className="text-primary hover:underline decoration-primary/50 underline-offset-2" />,
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    // Use ReactMarkdown and pass the custom components map
    <ReactMarkdown
      className="prose dark:prose-invert max-w-none" // Apply prose styling here
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        rehypeRaw, // Process raw HTML
        rehypeSlug, // Add slugs to headings
        [rehypeAutolinkHeadings, { // Add links to headings
            behavior: 'wrap', 
            properties: { className: ['anchor'] } 
        }],
        [rehypePrism, { showLineNumbers: false, ignoreMissing: true }] // Syntax highlighting
      ]}
      components={components} // Use custom components map
    >
      {content}
    </ReactMarkdown>
  );
}
