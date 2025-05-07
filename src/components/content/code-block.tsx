"use client";

import React, { useState, useEffect } from 'react';
import { ClipboardCopy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils'; // Import cn for conditional classes

interface CodeBlockProps {
  rawString: string;
  children: React.ReactNode;
  className?: string; // Allow passing className for language detection etc.
}

export function CodeBlock({ rawString, children, className }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawString);
      setIsCopied(true);
      toast({ title: "Copied to clipboard!" });
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
      console.error('Failed to copy text: ', err);
    }
  };

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  // NOTE: The parent `pre` tag might be added by the markdown processor (rehype-prism-plus).
  // This component should wrap the `code` element typically found inside the `pre`.
  // However, the way it's likely used in MarkdownRenderer via `components` prop means
  // this component *replaces* the `pre` element. We need to provide the `pre` wrapper here.

  return (
    <div className="relative group my-4"> 
      {/* Add the pre tag here if this component replaces it */}
      <pre className={cn("bg-muted/50 p-4 rounded-md overflow-x-auto font-mono text-sm shadow-inner relative", className)}>
        {/* The actual code content is passed as children */}
        <code>{children}</code> 
         <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
            aria-label="Copy code to clipboard"
          >
            {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <ClipboardCopy className="h-4 w-4" />}
          </Button>
      </pre>
     
    </div>
  );
}
