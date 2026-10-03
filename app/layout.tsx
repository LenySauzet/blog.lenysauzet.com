import type { Viewport } from 'next';
import { Geist, Instrument_Serif } from 'next/font/google';
import localFont from 'next/font/local';

import { CommandPalette } from '@/components/CommandPalette';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getRootMetadata } from '@/config/site';
import { HUES, propertiesOf, STORAGE_KEY } from '@/lib/hues';
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

/**
 * Paints the reader's accent before the first frame, the way next-themes does
 * for the theme class. Left to React, the page would paint the default and
 * correct it on hydration, which is a visible flash of the wrong colour.
 *
 * Built from `HUES` rather than written out, so a preset cannot exist here and
 * nowhere else.
 */
const paintHue = `try{var p=${JSON.stringify(
  Object.fromEntries(HUES.map((hue) => [hue.id, propertiesOf(hue)]))
)}[localStorage.getItem(${JSON.stringify(
  STORAGE_KEY
)})];if(p)for(var k in p)document.documentElement.style.setProperty(k,p[k])}catch(e){}`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const posts = (await getPosts()).map(({ slug, metadata }) => ({
    slug,
    title: metadata.shortTitle ?? metadata.title,
    description: metadata.description,
    date: metadata.date,
  }));

  const known = Object.fromEntries(
    posts.map(({ slug, title, description }) => [slug, { title, description }])
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${instrument.variable} ${FiraCode.variable} ${DepartureMono.variable} ${SignatureDecember.variable} antialiased relative h-screen overflow-hidden selection:bg-primary/[0.07] selection:text-primary`}
      >
        <script dangerouslySetInnerHTML={{ __html: paintHue }} />

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
            <CommandPalette posts={posts} />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
