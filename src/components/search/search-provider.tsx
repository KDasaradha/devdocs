"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import lunr from 'lunr';
import type { SearchDoc } from '@/types';

interface SearchContextType {
  search: (query: string) => SearchDoc[];
  isInitialized: boolean;
  documents: SearchDoc[]; 
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
  // Removed searchDocs prop, will fetch data internally
}

// Store the index and documents globally within the client-side module scope 
// to avoid refetching/rebuilding on every component re-render.
let globalIndex: lunr.Index | null = null;
let globalDocuments: SearchDoc[] = [];
let isFetchingOrFetched = false; // Prevent multiple fetches

export function SearchProvider({ children }: SearchProviderProps) {
  const [index, setIndex] = useState<lunr.Index | null>(globalIndex);
  const [documents, setDocuments] = useState<SearchDoc[]>(globalDocuments);
  const [isInitialized, setIsInitialized] = useState(!!globalIndex); // Initialize based on global state

  useEffect(() => {
    // Fetch only if index hasn't been built yet and not currently fetching
    if (!isInitialized && !isFetchingOrFetched) {
      isFetchingOrFetched = true; // Mark as fetching
      console.log("SearchProvider: Fetching search index data...");
      fetch('/api/search-index')
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch search index: ${res.statusText}`);
          }
          return res.json();
        })
        .then((fetchedDocs: SearchDoc[]) => {
          console.log(`SearchProvider: Received ${fetchedDocs.length} documents for search index.`);
          if (fetchedDocs.length > 0) {
            const idx = lunr(function () {
              this.ref('slug');
              this.field('title', { boost: 10 });
              this.field('content');

              fetchedDocs.forEach((doc) => {
                // Add validation to ensure doc properties are valid before adding
                if (doc && typeof doc.slug === 'string' && typeof doc.title === 'string' && typeof doc.content === 'string') {
                    this.add({
                      slug: doc.slug,
                      title: doc.title,
                      content: doc.content,
                    });
                } else {
                    console.warn("SearchProvider: Skipping invalid document during indexing:", doc);
                }
              });
            });
            console.log("SearchProvider: Lunr index built successfully.");
            globalIndex = idx; // Store globally
            globalDocuments = fetchedDocs; // Store globally
            setIndex(idx);
            setDocuments(fetchedDocs);
            setIsInitialized(true);
          } else {
             console.warn("SearchProvider: Fetched search index data is empty.");
             isFetchingOrFetched = false; // Allow retry if fetch was empty? Or accept empty state?
          }
        })
        .catch(error => {
          console.error("SearchProvider: Error fetching or building search index:", error);
          isFetchingOrFetched = false; // Allow retry on error
        });
    } else if (isInitialized && (!index || documents.length === 0)) {
       // If already initialized globally but not in local state, sync state
       setIndex(globalIndex);
       setDocuments(globalDocuments);
    }
  }, [isInitialized, index, documents]); // Dependencies ensure effect runs if state needs sync

  const search = useCallback((query: string): SearchDoc[] => {
    if (!index || !query) return [];
    try {
      // Add basic query sanitization to prevent common Lunr errors
       const sanitizedQuery = query
         .replace(/[:*^~[\]]/g, '') // Remove characters that cause issues
         .trim();

       if (!sanitizedQuery) return [];

      // Try searching with wildcard first, then exact match if needed
      let results = index.search(`${sanitizedQuery}*`);
      if (results.length === 0 && !query.endsWith('*')) {
          results = index.search(sanitizedQuery);
      }
      
      return results.map(result => {
        // Use locally stored documents for mapping results
        const doc = documents.find(d => d.slug === result.ref);
        return doc || { slug: result.ref, title: result.ref, content: "" }; // Fallback
      });
    } catch (e) {
      console.error("Lunr search error for query:", query, e);
      return [];
    }
  }, [index, documents]); // Depend on local state

  return (
    <SearchContext.Provider value={{ search, isInitialized, documents }}>
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
