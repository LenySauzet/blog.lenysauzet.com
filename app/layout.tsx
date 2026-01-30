import { ThemeProvider } from '@/components/theme-provider';
import { getRootMetadata } from '@/config/site';
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
