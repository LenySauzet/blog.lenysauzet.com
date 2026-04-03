import Anchor from '@/components/Anchor/Anchor';
import VideoPlayer from '@/components/VideoPlayer';
import type { MDXComponents } from 'mdx/types';
import Image, { type ImageProps } from 'next/image';
import { FootnoteRef, FootnotesList } from './components/Footnotes';

function RoundedImage({ alt = '', ...props }: ImageProps) {
  return <Image alt={alt} className="rounded-lg" {...props} />;
}

const components = {
  Anchor,

  a: Anchor,
  h1: ({ children }) => (
    <h1 className="font-display text-4xl font-bold tracking-tight mt-0 mb-6">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display text-2xl font-semibold tracking-tight mt-12 mb-4 text-foreground">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display text-xl font-semibold mt-8 mb-3 text-foreground">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-display text-lg font-medium mt-6 mb-2 text-foreground">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="font-display text-muted-foreground text-base leading-7 mb-4">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-medium text-foreground">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary pl-4 my-6 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="font-mono-code text-sm bg-muted rounded px-1.5 py-0.5 text-foreground">
      {children}
    </code>
  ),
  ul: ({ children }) => (
    <ul className="font-serif list-disc list-outside pl-6 mb-4 space-y-1 text-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="font-serif list-decimal list-outside pl-6 mb-4 space-y-1 text-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  hr: () => <hr className="border-border my-8" />,
  img: RoundedImage,
  FootnoteRef: ({ id }) => <FootnoteRef id={id} />,
  FootnotesList: ({ notes }) => <FootnotesList notes={notes} />,
  VideoPlayer,
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
