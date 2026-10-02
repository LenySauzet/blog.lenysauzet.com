import type { Viewport } from 'next';
import { Geist, Instrument_Serif } from 'next/font/google';
import localFont from 'next/font/local';

import { CommandPalette } from '@/components/CommandPalette';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getRootMetadata } from '@/config/site';
import { getPosts } from '@/lib/post-utils';

import { DynamicIsland, LinkPreviews } from './_components/DynamicIsland';
import './globals.css';

const geistSans = Geist({
  variable: '--font-display',
  subsets: ['latin'],
});

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

const FiraCode = localFont({
  src: '../public/fonts/FiraCode.woff2',
  variable: '--font-mono-code',
});

const DepartureMono = localFont({
  src: '../public/fonts/DepartureMono-Regular.woff2',
  variable: '--font-mono',
});

const SignatureDecember = localFont({
  src: '../public/fonts/Signature-December.otf',
  display: 'swap',
  variable: '--font-signature',
});

export const metadata = getRootMetadata();

// The mobile chrome follows the OS, not the toggle: an accepted trade-off for
// not shipping a client effect just for it.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const known = Object.fromEntries(
    (await getPosts()).map(({ slug, metadata }) => [
      slug,
      { title: metadata.shortTitle ?? metadata.title, description: metadata.description },
    ])
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${instrument.variable} ${FiraCode.variable} ${DepartureMono.variable} ${SignatureDecember.variable} antialiased relative h-screen overflow-hidden selection:bg-primary/[0.07] selection:text-primary`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={400}>
            <DynamicIsland />
            <LinkPreviews posts={known} />
            <main className="h-full">{children}</main>
            <CommandPalette slugs={Object.keys(known)} />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
