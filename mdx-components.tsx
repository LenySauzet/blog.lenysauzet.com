import Anchor from '@/components/Anchor/Anchor';
import { Callout } from '@/components/Callout';
import { CodeBlock } from '@/components/CodeBlock';
import Image from '@/components/Image';
import { List, ListItem } from '@/components/List';
import { PostH2 } from '@/components/PostH2';
import { Sandpack } from '@/components/Sandpack';
import VideoPlayer from '@/components/VideoPlayer';
import type { MDXComponents } from 'mdx/types';
import { FootnoteRef, FootnotesList } from './components/Footnotes';

/**
 * Bridges markdown `![alt](src)` onto the Image component so both syntaxes
 * behave identically. `src` is narrowed because remark always emits a string,
 * while the HTML img type also allows a Blob.
 */
function MarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  if (typeof src !== 'string') return null;
  return <Image src={src} alt={alt ?? ''} />;
}

const components = {
  Anchor,
  Callout,
  Image,
  Sandpack,

  a: Anchor,
  h1: ({ children }) => (
    <h1 className="font-display text-4xl font-bold tracking-tight mt-0 mb-6">
      {children}
    </h1>
  ),
  h2: ({ children }) => <PostH2>{children}</PostH2>,
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
    <p className="font-display text-muted-foreground text-base leading-7">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-medium text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <span className="italic text-muted-foreground/75">{children}</span>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary pl-4 my-6 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  figure: CodeBlock,
  ul: ({ children }) => <List variant="unordered">{children}</List>,
  ol: ({ children }) => <List variant="ordered">{children}</List>,
  li: ({ children }) => <ListItem>{children}</ListItem>,
  hr: () => <hr className="border-border my-8" />,
  img: MarkdownImage,
  FootnoteRef: ({ id }) => <FootnoteRef id={id} />,
  FootnotesList: ({ notes }) => <FootnotesList notes={notes} />,
  VideoPlayer,
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
