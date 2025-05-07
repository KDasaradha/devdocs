
import React from 'react'; // Ensure React is imported
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; // Use rehypeRaw to handle pre-processed HTML

// Custom components
import { CodeBlock } from './code-block';
import { cn } from '@/lib/utils';
import Link from 'next/link'; // Import Next.js Link for internal links

interface MarkdownRendererProps {
  markdownContent: string; // This prop receives the HTML string processed by lib/markdown.ts
}

// Custom components to override default HTML element rendering
const components: Components = {
  pre: ({ node, className, children, ...props }: any) => {
    // Logic to extract raw string for CodeBlock copy functionality
    let rawString = '';
    // This logic tries to extract text content from the first child of `pre`, which is usually `code`
    if (React.Children.count(children) === 1) {
      const child = React.Children.toArray(children)[0] as React.ReactElement;
      // More robustly check if the child is a 'code' element
      if (child && child.type === 'code' && child.props) {
         if (typeof child.props.children === 'string') {
           rawString = child.props.children.replace(/\n$/, '');
         } else if (Array.isArray(child.props.children)) {
            // Handle cases where children of <code> are arrays of strings/elements (like highlighted code)
             rawString = React.Children.toArray(child.props.children).map(c => {
                if (typeof c === 'string') return c;
                // Try to get text from nested elements (e.g., spans from syntax highlighting)
                if (React.isValidElement(c) && typeof c.props.children === 'string') return c.props.children;
                if (React.isValidElement(c) && Array.isArray(c.props.children)) {
                     return c.props.children.map((cc: any) => typeof cc === 'string' ? cc : '').join('');
                 }
                return '';
             }).join('');
         }
      }
    } else {
      // Fallback for unexpected structures: try to concatenate all string children
      rawString = React.Children.toArray(children).map(child => {
        if (typeof child === 'string') return child;
        if (React.isValidElement(child) && typeof child.props.children === 'string') return child.props.children;
        // Add more robust extraction if needed
        return '';
      }).join('');
    }
    // Remove trailing newline if present
    rawString = rawString.replace(/\n$/, '');

    // Find the <code> element within children to pass its props (like className)
    const codeChild = React.Children.toArray(children).find(
      (child) => React.isValidElement(child) && child.type === 'code'
    ) as React.ReactElement | undefined;

    const codeClassName = codeChild?.props?.className || className; // Use code's className if available, fallback to pre's

    return (
      <CodeBlock rawString={rawString} className={codeClassName} {...props}>
        {/* Pass the original children (likely the <code> tag with spans) */}
        {children}
      </CodeBlock>
    );
  },
  code: ({ node, inline, className, children, ...props }: any) => {
    // For inline code, apply specific styling
    if (inline) {
      return <code className={cn("bg-muted/70 text-accent px-1.5 py-0.5 rounded text-sm font-mono", className)} {...props}>{children}</code>;
    }
    // For code blocks, the <code> tag is rendered *inside* the <CodeBlock> component's <pre>.
    // We just need to pass the className and children.
    return <code className={cn("font-mono", className)} {...props}>{children}</code>;
  },
  // Add group class to headings to enable hover effect on the anchor link
  h1: ({ node, ...props }) => <h1 className="group" {...props} />,
  h2: ({ node, ...props }) => <h2 className="group" {...props} />,
  h3: ({ node, ...props }) => <h3 className="group" {...props} />,
  h4: ({ node, ...props }) => <h4 className="group" {...props} />,
  h5: ({ node, ...props }) => <h5 className="group" {...props} />,
  h6: ({ node, ...props }) => <h6 className="group" {...props} />,
  // Fix nested anchor issue
  a: ({ node, href, children, ...props }: any) => {
    // Check if it's an autolink-headings anchor
    if (props.className?.includes('anchor') && href && href.startsWith('#')) {
      // Render the anchor link as a plain span or similar non-interactive element
      // inside the heading, as the heading itself is likely wrapped by the main anchor.
      // OR, ensure rehype-autolink-headings is configured NOT to wrap, but to prepend/append.
      // Let's assume the wrap behavior is fixed in markdown.ts by removing the wrap option.
      // Now we just need to render the link correctly.
      return <a href={href} {...props}>{children}</a>;
    }

    // Handle internal links with Next.js Link
    if (href && href.startsWith('/')) {
      return <Link href={href} {...props}>{children}</Link>;
    }
    // Handle external links or other anchor links
    if (href) {
      return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
    }

    // Fallback for links without href (shouldn't happen often in markdown)
    return <span {...props}>{children}</span>;
  },
};


export function MarkdownRenderer({ markdownContent }: MarkdownRendererProps) {
  if (!markdownContent) {
    return <div className="prose dark:prose-invert max-w-none"><p className="text-muted-foreground italic">(Content is empty)</p></div>;
  }

  return (
    <ReactMarkdown
      className="prose dark:prose-invert max-w-none"
      remarkPlugins={[remarkGfm]}
      // Use rehypeRaw to correctly process the HTML string from the server
      rehypePlugins={[rehypeRaw]}
      components={components}
      // Pass the pre-processed HTML string
    >
      {markdownContent}
    </ReactMarkdown>
  );
}
