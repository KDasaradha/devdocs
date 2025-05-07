import { NextResponse } from 'next/server';
import { getAllMarkdownDocumentsForSearch } from '@/lib/markdown';
import type { SearchDoc } from '@/types';

// Configure caching for the search index - revalidate infrequently
// as it only changes when content changes and the app rebuilds/redeploys.
// 'force-cache' tells Next.js to cache the result indefinitely (or until next deployment)
// 'revalidate' could be set to a high number (e.g., 3600 seconds = 1 hour) if needed.
export const dynamic = 'force-static'; 
// Alternatively, for ISR: export const revalidate = 3600; 

export async function GET() {
  try {
    // console.log("API Route: /api/search-index called. Fetching search docs...");
    const searchDocs: SearchDoc[] = await getAllMarkdownDocumentsForSearch();
    // console.log(`API Route: /api/search-index returning ${searchDocs.length} documents.`);
    return NextResponse.json(searchDocs);
  } catch (error) {
    console.error("API Route: Error fetching search documents:", error);
    return NextResponse.json(
      { error: 'Failed to load search index' },
      { status: 500 }
    );
  }
}
