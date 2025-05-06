"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import lunr from 'lunr';
import type { SearchDoc, SiteConfig } from '@/types';
// Not importing getAllMarkdownDocumentsForSearch as it's server-side. Data will be passed via props.

interface SearchContextType {
  search: (query: string) => SearchDoc[];
  isInitialized: boolean;
  documents: SearchDoc[]; // Store documents for display
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
  searchDocs: SearchDoc[]; // Pass pre-fetched docs
}

export function SearchProvider({ children, searchDocs }: SearchProviderProps) {
  const [index, setIndex] = useState<lunr.Index | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (searchDocs.length > 0) {
      const idx = lunr(function () {
        this.ref('slug');
        this.field('title', { boost: 10 });
        this.field('content');

        searchDocs.forEach((doc) => {
          this.add({
            slug: doc.slug,
            title: doc.title,
            content: doc.content,
          });
        });
      });
      setIndex(idx);
      setIsInitialized(true);
    }
  }, [searchDocs]);

  const search = useCallback((query: string): SearchDoc[] => {
    if (!index || !query) return [];
    try {
      const results = index.search(`${query}*`); // Add wildcard for partial matches
      return results.map(result => {
        const doc = searchDocs.find(d => d.slug === result.ref);
        return doc || { slug: result.ref, title: result.ref, content: "" }; // Fallback
      });
    } catch (e) {
      // Lunr.js can throw errors if query is malformed (e.g. only colons)
      console.warn("Lunr search error:", e);
      return [];
    }
  }, [index, searchDocs]);

  return (
    <SearchContext.Provider value={{ search, isInitialized, documents: searchDocs }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
