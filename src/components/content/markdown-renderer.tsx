import ReactMarkdown from 'react-markdown';
import type { Options } from 'react-markdown';
import { CodeBlock } from './code-block';
import Image from 'next/image';

interface MarkdownRendererProps {
  contentHtml: string; // Now expects pre-processed HTML from server
}

// This component will now directly render HTML processed on the server.
// react-markdown is not strictly needed if all processing (including components)
// is done on the server. However, if client-side re-rendering or dynamic content
// within markdown is needed, it can be used.
// For now, let's assume the HTML is complete.

export function MarkdownRenderer({ contentHtml }: MarkdownRendererProps) {
  // If using react-markdown with custom components, we'd process raw markdown here.
  // But since we're getting HTML, we'll render it directly.
  // We need rehype-raw in the server-side processing for this to work safely.
  
  // For a pure HTML render:
  return (
     <div className="markdown-content prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
  );

  // If we were to use react-markdown with client-side component overrides (example):
  /*
  const components: Options['components'] = {
    code({ node, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const rawString = String(children).replace(/\n$/, '');
      if (match && !props.inline) {
        return (
          <CodeBlock rawString={rawString}>
            <code className={className} {...props}>
              {children}
            </code>
          </CodeBlock>
        );
      }
      return (
        <code className={cn(className, "before:content-none after:content-none font-mono text-sm bg-muted/80 px-1 py-0.5 rounded")} {...props}>
          {children}
        </code>
      );
    },
    img: (props) => {
      const { src, alt, width, height } = props;
      // Basic image handling, can be expanded
      if (src) {
        // Attempt to parse width/height if provided as string numbers
        const imgWidth = typeof width === 'string' ? parseInt(width, 10) : typeof width === 'number' ? width : undefined;
        const imgHeight = typeof height === 'string' ? parseInt(height, 10) : typeof height === 'number' ? height : undefined;

        if (imgWidth && imgHeight) {
             return <Image src={src} alt={alt || ""} width={imgWidth} height={imgHeight} className="rounded-md my-4 shadow-md" data-ai-hint="documentation illustration" />;
        }
        // Fallback for images without explicit dimensions or relative paths
        // For relative paths, you might need a loader or resolve them during build
        return <img src={src} alt={alt || ""} className="rounded-md my-4 shadow-md max-w-full h-auto" data-ai-hint="diagram chart"/>;
      }
      return null;
    },
    // Add other custom components here (h1, p, ul, etc.) if needed
    // The global CSS in globals.css already styles these elements
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
  */
}
