import type { Metadata, Viewport } from 'next';
import { inter, firaCode } from '@/lib/fonts';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { loadConfig } from '@/lib/config';
import { SiteConfig } from '@/types';

const config: SiteConfig = loadConfig();

export const metadata: Metadata = {
  metadataBase: config.site_url ? new URL(config.site_url) : undefined, // Add metadataBase for absolute URLs
  title: {
    default: config.site_name || "DevDocs++", // Add fallback title
    template: `%s | ${config.site_name || "DevDocs++"}`, // Add fallback title
  },
  description: config.site_description,
  authors: config.site_author ? [{ name: config.site_author }] : [],
  // Use the favicon_path from config.yml. Ensure the path starts with '/' if relative to public dir.
  // Add multiple sizes for better compatibility
  icons: config.favicon_path ? [
      { rel: 'icon', url: config.favicon_path }, // Standard favicon
      // Example: Add apple-touch-icon if you have one
      // { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' }, 
      ] 
      : [{ rel: 'icon', url: '/favicon.ico' }], // Default fallback
  // Open Graph and Twitter Card metadata (Basic Example)
  openGraph: {
    title: config.site_name,
    description: config.site_description,
    url: config.site_url,
    siteName: config.site_name,
    // Assuming logo_path can be used as an Open Graph image
    images: config.logo_path ? [
      {
        url: config.logo_path, // Needs to be an absolute URL or Next.js needs metadataBase
        width: 800, // Provide dimensions if known
        height: 600,
        alt: `${config.site_name} Logo`,
      },
    ] : [],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: config.site_name,
    description: config.site_description,
     // Assuming logo_path can be used as a Twitter image
    images: config.logo_path ? [config.logo_path] : [], // Needs absolute URL
    // Optional: Add Twitter handle if available
    // creator: '@yourTwitterHandle', 
  },
};


// Optional: Configure viewport settings
// export const viewport: Viewport = {
//   themeColor: [
//     { media: '(prefers-color-scheme: light)', color: 'hsl(var(--background))' }, // Use CSS vars
//     { media: '(prefers-color-scheme: dark)', color: 'hsl(var(--background))' },
//   ],
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Removed suppressHydrationWarning from <html>
    <html lang="en">
      <body
        className={`${inter.variable} ${firaCode.variable} font-sans antialiased`}
        suppressHydrationWarning // Keep this here ONLY if browser extensions are known to cause issues
      >
        <ThemeProvider
          attribute="class"
          defaultTheme={config.theme.default}
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
