import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/layout';
import { loadConfig } from '@/lib/config';
import { getAllMarkdownDocumentsForSearch } from '@/lib/markdown';
import type { SiteConfig, SearchDoc } from '@/types';

export default async function NotFoundPage() {
  const config: SiteConfig = loadConfig();
  // Fetch search docs even for 404 page if search is part of the global layout
  const searchDocs: SearchDoc[] = await getAllMarkdownDocumentsForSearch();

  return (
    <Layout config={config} document={null} searchDocs={searchDocs}>
      <div className="flex flex-col items-center justify-center text-center py-20">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-6">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Oops! The page you are looking for doesn't exist. It might have been moved or deleted.
        </p>
        <Button asChild size="lg">
          <Link href="/">Go back to Homepage</Link>
        </Button>
      </div>
    </Layout>
  );
}
