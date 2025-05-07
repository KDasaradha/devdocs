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
        className="markdown-content max-w-none" 
        dangerouslySetInnerHTML={{ __html: contentHtml }} 
      />
  );
}