import type { Viewport } from 'next';

import { ThemeProvider } from '@/components/shared/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getRootMetadata } from '@/config/site';
import { getPosts, summaryOf } from '@/lib/posts/post-utils';
import { HUES, propertiesOf, STORAGE_KEY } from '@/lib/theme/hues';

import { CommandPalette } from './_components/CommandPalette';
import { bodyClassName } from './_components/document';
import { DynamicIsland, LinkPreviews } from './_components/DynamicIsland';
import { StoredHue } from './_components/StoredHue';
import './globals.css';

export const metadata = getRootMetadata();

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

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
  const posts = (await getPosts()).map(summaryOf);

  const known = Object.fromEntries(
    posts.map(({ slug, title, description }) => [slug, { title, description }])
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClassName}>
        <script dangerouslySetInnerHTML={{ __html: paintHue }} />
        <StoredHue />

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
