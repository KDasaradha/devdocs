"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSearch } from './search-provider';
import { cn } from '@/lib/utils';
import { getNavLinkHref } from '@/lib/navigation'; // Import the helper

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ReturnType<typeof search>>([]);
  const [isFocused, setIsFocused] = useState(false);
  const { search, isInitialized } = useSearch();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query && isInitialized) {
      setResults(search(query).slice(0, 10)); // Limit to 10 results
    } else {
      setResults([]);
    }
  }, [query, search, isInitialized]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative w-full max-w-xs" ref={searchContainerRef}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search documentation..."
          className="pl-10 pr-10 h-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          disabled={!isInitialized}
          aria-label="Search documentation"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClearSearch}
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {isFocused && query && (
        <Card className="absolute top-full mt-2 w-full shadow-lg z-50">
          <CardContent className="p-0">
            {results.length > 0 ? (
              <ScrollArea className="h-auto max-h-72">
                <ul className="py-2">
                  {results.map(({ slug, title }) => (
                    <li key={slug}>
                      <Link
                        href={getNavLinkHref(slug)} // Use helper for consistent link
                        className="block px-4 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                        onClick={() => {
                          setQuery('');
                          setIsFocused(false);
                        }}
                      >
                        {title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">
                {isInitialized ? 'No results found.' : 'Initializing search...'}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Minimal Button component if not using ShadCN's
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string, size?: string }
>(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium", className)}
      ref={ref}
      {...props}
    />
  )
});
Button.displayName = "Button";