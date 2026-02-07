import SplashScreen from '@/components/SplashScreen';
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
        className={`${geistSans.variable} ${instrument.variable} ${FiraCode.variable} ${DepartureMono.variable} ${SignatureDecember.variable} antialiased relative`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <SplashScreen />

          <main className="py-12 px-10">{children}</main>
          <div className="pointer-events-none fixed bottom-0 left-0 z-1 h-12 w-full bg-background to-transparent backdrop-blur-xl [-webkit-mask-image:linear-gradient(to_top,black,transparent)]" />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
