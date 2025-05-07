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
  title: {
    default: config.site_name,
    template: `%s | ${config.site_name}`,
  },
  description: config.site_description,
  authors: config.site_author ? [{ name: config.site_author }] : [],
  // Add icons configuration if favicon_path is set
  ...(config.favicon_path ? { icons: { icon: config.favicon_path } } : {}),
};

// Optional: Configure viewport settings
// export const viewport: Viewport = {
//   themeColor: [
//     { media: '(prefers-color-scheme: light)', color: 'white' },
//     { media: '(prefers-color-scheme: dark)', color: 'black' },
//   ],
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.variable} ${firaCode.variable} font-sans antialiased`}
        suppressHydrationWarning // Added to specifically target body attribute mismatches
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

```