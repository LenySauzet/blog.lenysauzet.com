import { ThemeProvider } from '@/components/theme-provider';
import type { Metadata } from 'next';
import { Geist, Instrument_Serif } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = Geist({
  variable: '--font-display',
  subsets: ['latin'],
});

// const geistSans = localFont({
//   src: '../public/fonts/Geist-Regular.ttf',
//   variable: '--font-display',
// });

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

export const metadata: Metadata = {
  title: {
    template: '%s - The Blog of Lény Sauzet',
    default: 'The Blog of Lény Sauzet',
  },
  description: "Hi I'm Lény, and this is my blog. In here, you'll find all the articles I wished I had when I was learning about web development, shaders, real-time 3D on the web, and more.  Each piece I write aims to dive deep into the topics I'm passionate about, while also making complex topics more accessible through interactive playgrounds, visualization, and well detailed walkthroughs. My goal is to give you the tools and intuition to explore further on your own.",

  generator: 'Next.js',
  applicationName: "Lény's Blog",
  referrer: 'origin-when-cross-origin',
  keywords: ['Lény Sauzet', 'Innovation Engineer', 'Software Engineer', 'Full Stack Developer', 'Blog', 'AI Engineer', 'Modern Web Architecture', 'Mobile App Development', 'Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Creative Coding', '3D Web Development', 'Game Development', 'Tech Devlog', 'Programming Tutorials', 'Software Engineering Insights', 'Coding Experiments'],
  authors: [{ name: 'Lény Sauzet', url: 'https://lenysauzet.com' }],
  creator: 'Lény Sauzet',
  publisher: 'Lény Sauzet',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  metadataBase: new URL('https://blog.lenysauzet.com'),
  alternates: {
    canonical: '/',
  },

  openGraph: {
    title: 'The Blog of Lény Sauzet',
    description: "Hi I'm Lény, and this is my blog. In here, you'll find all the articles I wished I had when I was learning about web development, shaders, real-time 3D on the web, and more.  Each piece I write aims to dive deep into the topics I'm passionate about, while also making complex topics more accessible through interactive playgrounds, visualization, and well detailed walkthroughs. My goal is to give you the tools and intuition to explore further on your own.",
    url: 'https://blog.lenysauzet.com',
    siteName: 'The Blog of Lény Sauzet',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${instrument.variable} ${FiraCode.variable} ${DepartureMono.variable} ${SignatureDecember.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
