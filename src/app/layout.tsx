
import type { Metadata, Viewport } from 'next';
import { inter, firaCode } from '@/lib/fonts';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { loadConfig } from '@/lib/config';
import type { SiteConfig } from '@/types';

const config: SiteConfig = loadConfig();

export const metadata: Metadata = {
  metadataBase: config.site_url ? new URL(config.site_url) : undefined,
  title: {
    default: config.site_name || "DevDocs++",
    template: `%s | ${config.site_name || "DevDocs++"}`,
  },
  description: config.site_description,
  authors: config.site_author ? [{ name: config.site_author }] : [],
  icons: config.favicon_path
    ? [
        { rel: 'icon', url: config.favicon_path, type: 'image/x-icon', sizes: '16x16' },
        // You can add more specific icon links here if needed, e.g., for different sizes or apple-touch-icon
        // { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
        // { rel: 'apple-touch-icon', sizes: '180x180', url: '/apple-touch-icon.png' },
      ]
    : [{ rel: 'icon', url: '/favicon.ico', type: 'image/x-icon', sizes: '16x16' }], // Default fallback
  openGraph: {
    title: config.site_name,
    description: config.site_description,
    url: config.site_url,
    siteName: config.site_name,
    images: config.logo_path ? [
      {
        url: config.logo_path,
        width: 800, // Specify width and height for OG images if possible
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
    images: config.logo_path ? [config.logo_path] : [],
    // Consider adding twitter:creator or twitter:site if applicable
  },
};

// Optional: Configure viewport settings
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'hsl(var(--background))' },
    { media: '(prefers-color-scheme: dark)', color: 'hsl(var(--background))' },
  ],
  // Add other viewport settings if needed
   width: 'device-width',
   initialScale: 1,
  // maximumScale: 1, // Often better not to restrict maximum scale for accessibility
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Added suppressHydrationWarning to <html> tag for next-themes compatibility
    <html lang="en" suppressHydrationWarning>
      {/* Removed explicit empty <head /> tag. Next.js handles head content via Metadata API. */}
      <body
        className={`${inter.variable} ${firaCode.variable} font-sans antialiased`}
        suppressHydrationWarning // Keep this here ONLY if browser extensions are known to cause issues
      >
        <ThemeProvider
          attribute="class"
          defaultTheme={config.theme.default || "system"}
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
