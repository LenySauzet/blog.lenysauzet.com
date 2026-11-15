import { Geist, Instrument_Serif } from 'next/font/google';
import localFont from 'next/font/local';

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
  src: '../../public/fonts/FiraCode.woff2',
  variable: '--font-mono-code',
});

const DepartureMono = localFont({
  src: '../../public/fonts/DepartureMono-Regular.woff2',
  variable: '--font-mono',
});

export const bodyClassName = `${geistSans.variable} ${instrument.variable} ${FiraCode.variable} ${DepartureMono.variable} antialiased relative selection:bg-primary/[0.07] selection:text-primary`;
