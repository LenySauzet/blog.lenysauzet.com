import type { MDXComponents } from 'mdx/types';
import Image, { type ImageProps } from 'next/image';
import Anchor from './components/Anchor/Anchor';
import { FootnoteRef, FootnotesList } from './components/Footnotes';

function RoundedImage({ alt = '', ...props }: ImageProps) {
  return <Image alt={alt} className="rounded-lg" {...props} />;
}

const components = {
  a: Anchor,
  h1: ({ children }) => <h1 className="text-4xl font-bold">{children}</h1>,
  img: RoundedImage,
  FootnoteRef: ({ id }) => <FootnoteRef id={id} />,
  FootnotesList: ({ notes }) => <FootnotesList notes={notes} />,
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
