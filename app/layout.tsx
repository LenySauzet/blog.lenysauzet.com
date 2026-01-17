import type { Metadata } from 'next';
import { Geist, Instrument_Serif } from 'next/font/google';
import localFont from 'next/font/local';
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

export const metadata: Metadata = {
  title: 'The Blog of Leny Sauzet',
  description:
    "Hi I'm Lény, and this is my blog. In here, you'll find all the articles I wished I had when I was learning about web development, shaders, real-time 3D on the web, and more.  Each piece I write aims to dive deep into the topics I'm passionate about, while also making complex topics more accessible through interactive playgrounds, visualization, and well detailed walkthroughs. My goal is to give you the tools and intuition to explore further on your own.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${instrument.variable} ${FiraCode.variable} ${DepartureMono.variable} ${SignatureDecember.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
