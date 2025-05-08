
import type { Metadata, Viewport } from 'next';
import { inter, firaCode } from '@/lib/fonts';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { loadConfig } from '@/lib/config';
import type { SiteConfig } from '@/types';
import { cn } from '@/lib/utils';

const config: SiteConfig = loadConfig();

// Function to create absolute URLs for assets
const createAbsoluteUrl = (path: string | undefined, baseUrl: string | undefined): string | undefined => {
  if (!path || !baseUrl) return undefined;
  if (path.startsWith('http')) return path;
  try {
    // Ensure the base URL has a trailing slash if it doesn't have one and isn't just the origin
    const urlBase = baseUrl.endsWith('/') || new URL(baseUrl).pathname === '/' ? baseUrl : `${baseUrl}/`;
    return new URL(path, urlBase).toString();
  } catch (e) {
    console.error(`Error creating absolute URL for path "${path}" with base "${baseUrl}":`, e);
    // Fallback for cases where baseUrl might be invalid or path is tricky
    const cleanBase = baseUrl.replace(/\/$/, '');
    return path.startsWith('/') ? `${cleanBase}${path}` : `${cleanBase}/${path}`;
  }
};

const absoluteLogoUrl = createAbsoluteUrl(config.logo_path, config.site_url || 'http://localhost:3000');
const absoluteFaviconUrl = createAbsoluteUrl(config.favicon_path, config.site_url || 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: config.site_url ? new URL(config.site_url) : undefined,
  title: {
    default: config.site_name || "DevDocs++",
    template: `%s | ${config.site_name || "DevDocs++"}`,
  },
  description: config.site_description,
  authors: config.site_author ? [{ name: config.site_author }] : [],
  // Use the generated absolute favicon URL or fallback
  icons: absoluteFaviconUrl
    ? [
        { rel: 'icon', url: absoluteFaviconUrl, type: 'image/x-icon', sizes: 'any' },
        // Add more icon links if needed, e.g., apple-touch-icon
      ]
    : [{ rel: 'icon', url: '/favicon.ico', type: 'image/x-icon', sizes: '16x16' }], // Default fallback
  openGraph: {
    title: config.site_name || "DevDocs++", // Use default config if available
    description: config.site_description,
    url: config.site_url,
    siteName: config.site_name,
    // Use the generated absolute logo URL
    images: absoluteLogoUrl ? [
      {
        url: absoluteLogoUrl,
        width: 800, // Example width, adjust if known
        height: 600, // Example height, adjust if known
        alt: `${config.site_name} Logo`,
      },
    ] : [],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: config.site_name || "DevDocs++",
    description: config.site_description,
    // Use the generated absolute logo URL
    images: absoluteLogoUrl ? [absoluteLogoUrl] : [],
    // Consider adding twitter:creator or twitter:site
  },
};

// Optional: Configure viewport settings
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'hsl(var(--background))' },
    { media: '(prefers-color-scheme: dark)', color: 'hsl(var(--background))' },
  ],
   width: 'device-width',
   initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Added suppressHydrationWarning to <html> tag for next-themes compatibility
    <html lang="en" suppressHydrationWarning>
      {/* Ensure head is explicitly included and is empty, Next.js handles metadata */}
      <head />
      {/* Added suppressHydrationWarning to body for browser extensions and hydration issues */}
      <body
        className='font-sans antialiased'
      >
        <ThemeProvider
          attribute="class"
          defaultTheme={config.theme?.default || "system"} // Add null check for config.theme
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
