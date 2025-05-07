import React from 'react'; // Ensure React is imported
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrism from 'rehype-prism-plus';
import rehypeRaw from 'rehype-raw';
import { CodeBlock } from './code-block';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  markdownContent: string;
}

// Define custom components to pass to ReactMarkdown
const components: Components = {
  pre: ({ node, className, children, ...props }: any) => {
    // The 'pre' element itself will be replaced by CodeBlock logic.
    // We extract the raw string and children which should be the <code> element.
    let rawString = '';
    let codeContent: React.ReactNode = children;

    // Attempt to extract raw string from the first child if it's a code element
    if (React.Children.count(children) === 1) {
      const child = React.Children.toArray(children)[0] as React.ReactElement;
      if (child && child.props && typeof child.props.children === 'string') { // Check if children is string
        rawString = child.props.children.replace(/\n$/, '');
        codeContent = child.props.children; // Pass the actual code content
      }
    } else if (typeof children === 'string') { // Also handle direct string children
      rawString = children.replace(/\n$/, '');
      codeContent = children;
    } else {
        // Attempt to reconstruct raw string from potentially nested children
        // This might happen with complex syntax highlighting structures.
        // It's less precise but provides a fallback.
         rawString = React.Children.toArray(children).map(child => {
             if (typeof child === 'string') return child;
             if (React.isValidElement(child) && child.props.children) return String(child.props.children);
             return '';
         }).join('');
         codeContent = children; // Keep original children for rendering highlights
    }


    // Pass the extracted content to CodeBlock.
    // CodeBlock will render its own <pre> and <code> tags internally.
    // Pass the language className detected by rehype-prism.
    return (
      <CodeBlock rawString={rawString} className={className} {...props}>
        {codeContent}
      </CodeBlock>
    );
  },
  // Apply basic styles to inline code
  code: ({ node, inline, className, children, ...props }: any) => {
     // Use the 'inline' prop provided by react-markdown to detect inline code
    if (inline) {
      return <code className={cn("bg-muted/70 text-accent px-1.5 py-0.5 rounded text-sm font-mono", className)} {...props}>{children}</code>;
    }
    // If it's a block code, it will be rendered within the 'pre' component handler above.
    // Render the children directly here as they contain the syntax highlighting spans.
    return <code className={className} {...props}>{children}</code>;
  },
  // Add group class to headings for anchor link hover effect
  h1: ({ node, ...props }) => <h1 className="group" {...props} />,
  h2: ({ node, ...props }) => <h2 className="group" {...props} />,
  h3: ({ node, ...props }) => <h3 className="group" {...props} />,
  h4: ({ node, ...props }) => <h4 className="group" {...props} />,
  h5: ({ node, ...props }) => <h5 className="group" {...props} />,
  h6: ({ node, ...props }) => <h6 className="group" {...props} />,
};

export function MarkdownRenderer({ markdownContent }: MarkdownRendererProps) {
    if (!markdownContent) {
        console.warn("MarkdownRenderer received empty markdownContent prop.");
        return <p className="text-muted-foreground italic">(Content is empty)</p>;
    }

    return (
      <ReactMarkdown
        className="prose dark:prose-invert max-w-none"
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          rehypeSlug,
          [rehypeAutolinkHeadings, {
              behavior: 'wrap',
              properties: {
                className: ['anchor'],
                'aria-hidden': 'true',
                tabIndex: -1
              },
          }],
          [rehypePrism, { showLineNumbers: false, ignoreMissing: true }]
        ]}
        components={components}
      >
        {markdownContent}
      </ReactMarkdown>
    );
}
