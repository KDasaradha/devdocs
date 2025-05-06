import Link from 'next/link';
import { BookMarked } from 'lucide-react'; // Using a generic book/docs icon

interface SiteLogoProps {
  siteName: string;
}

export function SiteLogo({ siteName }: SiteLogoProps) {
  return (
    <Link href="/" className="flex items-center space-x-2 text-xl font-bold group">
      <BookMarked className="h-7 w-7 text-primary group-hover:animate-pulse" />
      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        {siteName}
      </span>
    </Link>
  );
}
