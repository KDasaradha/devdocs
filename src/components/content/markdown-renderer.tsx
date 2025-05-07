import React from 'react';
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
    let rawString = '';
    let codeContent: React.ReactNode = children;

    if (React.Children.count(children) === 1) {
      const child = React.Children.toArray(children)[0] as React.ReactElement;
      if (child && child.props && typeof child.props.children === 'string') {
        rawString = child.props.children.replace(/\n$/, '');
        codeContent = child.props.children; 
      }
    } else if (typeof children === 'string') { 
      rawString = children.replace(/\n$/, '');
      codeContent = children;
    } else {
         rawString = React.Children.toArray(children).map(child => {
             if (typeof child === 'string') return child;
             if (React.isValidElement(child) && child.props.children) return String(child.props.children);
             return '';
         }).join('');
         codeContent = children; 
    }

    return (
      <CodeBlock rawString={rawString} className={className} {...props}>
        {codeContent}
      </CodeBlock>
    );
  },
  code: ({ node, inline, className, children, ...props }: any) => {
    if (inline) {
      return <code className={cn("bg-muted/70 text-accent px-1.5 py-0.5 rounded text-sm font-mono", className)} {...props}>{children}</code>;
    }
    return <code className={className} {...props}>{children}</code>;
  },
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
              behavior: 'prepend', // Changed from 'wrap'
              properties: {
                className: ['anchor'],
                'aria-hidden': 'true',
                tabIndex: -1,
              },
              content: { type: 'text', value: '#' } // Add content for the link
          }],
          [rehypePrism, { showLineNumbers: false, ignoreMissing: true }]
        ]}
        components={components}
      >
        {markdownContent}
      </ReactMarkdown>
    );
}
