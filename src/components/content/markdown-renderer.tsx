
import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Handles GitHub Flavored Markdown
import rehypeRaw from 'rehype-raw'; // Allows rendering raw HTML from the markdown content

// Custom components
import { CodeBlock } from './code-block';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  markdownContent: string; // This prop should receive the HTML string processed by lib/markdown.ts
}

// Custom components to override default HTML element rendering
const components: Components = {
  pre: ({ node, className, children, ...props }: any) => {
    // Logic to extract raw string for CodeBlock copy functionality
    let rawString = '';
    if (React.Children.count(children) === 1) {
      const child = React.Children.toArray(children)[0] as React.ReactElement;
      if (child && child.props && typeof child.props.children === 'string') {
        rawString = child.props.children.replace(/\n$/, '');
      }
    } else if (typeof children === 'string') { 
      rawString = children.replace(/\n$/, '');
    } else {
         rawString = React.Children.toArray(children).map(child => {
             if (typeof child === 'string') return child;
             if (React.isValidElement(child) && child.props.children) return String(child.props.children);
             return '';
         }).join('');
    }
    // The 'children' for 'pre' will be the 'code' element with its highlighted content
    return (
      <CodeBlock rawString={rawString} className={className} {...props}>
        {children} 
      </CodeBlock>
    );
  },
  code: ({ node, inline, className, children, ...props }: any) => {
    // For inline code, apply specific styling
    if (inline) {
      return <code className={cn("bg-muted/70 text-accent px-1.5 py-0.5 rounded text-sm font-mono", className)} {...props}>{children}</code>;
    }
    // For code blocks, className (like language-js) is passed to CodeBlock via the <pre> wrapper
    // The direct <code> tag here will be inside CodeBlock's <pre>
    return <code className={cn("font-mono", className)} {...props}>{children}</code>;
  },
  // Add 'group' class to headings to help style the prepended anchor links on hover
  h1: ({ node, ...props }) => <h1 className="group" {...props} />,
  h2: ({ node, ...props }) => <h2 className="group" {...props} />,
  h3: ({ node, ...props }) => <h3 className="group" {...props} />,
  h4: ({ node, ...props }) => <h4 className="group" {...props} />,
  h5: ({ node, ...props }) => <h5 className="group" {...props} />,
  h6: ({ node, ...props }) => <h6 className="group" {...props} />,
};

export function MarkdownRenderer({ markdownContent }: MarkdownRendererProps) {
    if (!markdownContent) {
        // console.warn("MarkdownRenderer received empty markdownContent prop.");
        return <p className="text-muted-foreground italic">(Content is empty)</p>;
    }

    return (
      <ReactMarkdown
        className="prose dark:prose-invert max-w-none"
        // remarkPlugins process markdown before it's converted to HAST (HTML Abstract Syntax Tree)
        remarkPlugins={[remarkGfm]} 
        // rehypePlugins process the HAST.
        // Since markdownContent is expected to be pre-processed HTML string (from lib/markdown.ts),
        // rehypeRaw is essential for ReactMarkdown to parse and render this HTML.
        // Other transformations like slugging, autolinking, and prism highlighting
        // should have already been done in lib/markdown.ts. Re-applying them here is redundant
        // and likely the source of the nested <a> tag error.
        rehypePlugins={[rehypeRaw]} 
        components={components}
      >
        {markdownContent}
      </ReactMarkdown>
    );
}

