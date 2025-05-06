import ReactMarkdown from 'react-markdown';
import type { Options } from 'react-markdown';
import { CodeBlock } from './code-block';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  contentHtml: string; 
}

export function MarkdownRenderer({ contentHtml }: MarkdownRendererProps) {
  return (
     <div 
        className={cn(
          "markdown-content max-w-none", // Removed prose classes
          // Custom styles that might not be fully covered by prose
          "[&_code]:font-mono [&_code]:text-sm [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
          "[&_pre]:bg-muted/50 [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-sm [&_pre]:shadow-inner",
          "[&_img]:rounded-md [&_img]:my-4 [&_img]:shadow-md [&_img]:max-w-full [&_img]:h-auto",
          // Basic styling for headings, paragraphs, lists if prose is not available
          "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:my-4",
          "[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-3",
          "[&_h3]:text-xl [&_h3]:font-bold [&_h3]:my-2",
          "[&_p]:my-2 [&_p]:leading-relaxed",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2",
          "[&_a]:text-primary hover:[&_a]:underline"
        )} 
        dangerouslySetInnerHTML={{ __html: contentHtml }} 
      />
  );
}

