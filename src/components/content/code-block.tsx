"use client";

import React, { useState, useEffect } from 'react';
import { ClipboardCopy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CodeBlockProps {
  rawString: string;
  children: React.ReactNode;
}

export function CodeBlock({ rawString, children }: CodeBlockProps) {
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

  return (
    <div className="relative group my-4">
      <pre className="bg-muted/50 p-4 rounded-md overflow-x-auto font-mono text-sm shadow-inner">
        {children}
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
        aria-label="Copy code to clipboard"
      >
        {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <ClipboardCopy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
