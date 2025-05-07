import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NavPage } from '@/lib/navigation';
import { getNavLinkHref } from '@/lib/navigation';

interface PageNavigationProps {
  prevPage: NavPage | null;
  nextPage: NavPage | null;
}

export function PageNavigation({ prevPage, nextPage }: PageNavigationProps) {
  if (!prevPage && !nextPage) {
    return null;
  }

  return (
    <nav className="mt-12 pt-8 border-t border-border flex justify-between items-center" aria-label="Document navigation">
      <div>
        {prevPage && (
          <Button variant="outline" asChild>
            <Link href={getNavLinkHref(prevPage.path)} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <div className="text-left">
                <span className="text-xs text-muted-foreground block">Previous</span>
                <span className="font-medium">{prevPage.title}</span>
              </div>
            </Link>
          </Button>
        )}
      </div>
      <div>
        {nextPage && (
          <Button variant="outline" asChild>
            <Link href={getNavLinkHref(nextPage.path)} className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Next</span>
                <span className="font-medium">{nextPage.title}</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </nav>
  );
}