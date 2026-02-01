import { ThemeProvider } from '@/components/theme-provider';
import { getRootMetadata } from '@/config/site';
import { Geist, Instrument_Serif } from 'next/font/google';
import localFont from 'next/font/local';
import Footer from './_components/Footer';
import Header from './_components/Header';
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

export const metadata = getRootMetadata();

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
          <Header />
          <main className="max-w-2xl mx-auto py-12">{children}</main>
          <Footer />

          {/* <div className="fixed top-0 right-0 m-4">
            <ModeToggle />
          </div> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
