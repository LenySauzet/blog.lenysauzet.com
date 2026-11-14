import { Geist, Instrument_Serif } from 'next/font/google';
import localFont from 'next/font/local';

import { HUES, propertiesOf, STORAGE_KEY } from '@/lib/theme/hues';

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

export const bodyClassName = `${geistSans.variable} ${instrument.variable} ${FiraCode.variable} ${DepartureMono.variable} antialiased relative h-screen overflow-hidden selection:bg-primary/[0.07] selection:text-primary`;

export const paintHue = `try{var p=${JSON.stringify(
  Object.fromEntries(HUES.map((hue) => [hue.id, propertiesOf(hue)]))
)}[localStorage.getItem(${JSON.stringify(
  STORAGE_KEY
)})];if(p)for(var k in p)document.documentElement.style.setProperty(k,p[k])}catch(e){}`;
