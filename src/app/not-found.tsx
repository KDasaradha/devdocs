import Link from 'next/link';
import { Button } from '@/components/ui/button';
// Removed Layout, loadConfig, getAllMarkdownDocumentsForSearch, SiteConfig, SearchDoc imports

// This component should be self-contained and not rely on potentially failing
// server-side data fetching like loadConfig which might be the reason the 404
// page itself was failing to render previously.
export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
      <h1 className="text-6xl font-bold text-destructive mb-4">404</h1>
      <h2 className="text-3xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Oops! The page you requested could not be found. It might have been moved, deleted, or the link might be incorrect.
      </p>
      <Button asChild size="lg">
        <Link href="/">Go back to Homepage</Link>
      </Button>
    </div>
  );
}