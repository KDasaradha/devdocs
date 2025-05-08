"use client";

import React, { useState, useEffect } from 'react';
import { ClipboardCopy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  rawString: string;
  children: React.ReactNode; // This will contain the highlighted code elements from rehype-prism
  className?: string; // Language class like 'language-python' comes here from the original <pre>
}

export function CodeBlock({ rawString, children, className }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    // Check if running in a browser environment and if Clipboard API is available
    if (typeof window === 'undefined' || !navigator.clipboard) {
      toast({
        title: 'Copy not supported',
        description: 'Clipboard access is not available in this environment.',
        variant: 'destructive',
      });
      console.error('Clipboard API is not available');
      return;
    }

    try {
      await navigator.clipboard.writeText(rawString);
      setIsCopied(true);
      toast({ title: 'Copied to clipboard!' });
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'An error occurred while copying to the clipboard.',
        variant: 'destructive',
      });
      console.error('Failed to copy text: ', err);
    }
  };

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  // Extract language from className, e.g., "language-js" -> "js"
  const language = className?.match(/language-(\S+)/)?.[1];

  return (
    <div className="relative group my-4">
      {/* Render the <pre> tag here */}
      <pre
        className={cn(
          // Base styles for pre
          'bg-muted/50 p-4 rounded-md overflow-x-auto text-sm shadow-inner relative',
          // Add language class back for styling if needed, though prism adds it to <code>
          className
        )}
      >
        {/* Render the <code> tag here */}
        {/* The children passed from MarkdownRenderer already contain the highlighted spans */}
        <code className={cn('font-mono', className)}>{children}</code>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
        >
          {isCopied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <ClipboardCopy className="h-4 w-4" />
          )}
        </Button>
      </pre>
    </div>
  );
}