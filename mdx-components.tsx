import Anchor from '@/components/Anchor/Anchor';
import BeforeAfterImage from '@/components/BeforeAfterImage';
import { Badge } from '@/components/ui/badge';
import Blockquote from '@/components/Blockquote';
import { Callout } from '@/components/Callout';
import { ButtonShowcase, InputShowcase } from '@/components/ComponentShowcase';
import Card from '@/components/Card';
import Details from '@/components/Details';
import Fullbleed from '@/components/Fullbleed';
import { CodeBlock } from '@/components/CodeBlock';
import Image from '@/components/Image';
import { List, ListItem } from '@/components/List';
import { PostH2 } from '@/components/PostH2';
import { Sandpack } from '@/components/Sandpack';
import VideoPlayer from '@/components/VideoPlayer';
import type { MDXComponents } from 'mdx/types';
import { FootnoteRef, FootnotesList } from './components/Footnotes';

/**
 * Bridges markdown `![alt](src)` onto Image. `src` is narrowed because the HTML
 * img type also allows a Blob, which remark never emits.
 */
function MarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  if (typeof src !== 'string') return null;
  return <Image src={src} alt={alt ?? ''} />;
}

const components = {
  Anchor,
  Badge,
  BeforeAfterImage,
  ButtonShowcase,
  Callout,
  Card,
  Details,
  InputShowcase,
  Fullbleed,
  Image,
  Sandpack,

  a: Anchor,
  h1: ({ children }) => (
    <h1 className="font-display text-4xl font-bold tracking-tight mt-0 mb-6">
      {children}
    </h1>
  ),
  h2: ({ children }) => <PostH2>{children}</PostH2>,
  // h3 and h4 are both body size; weight and colour carry the hierarchy, not
  // scale. h4 keeping text-lg would have made it larger than its own parent.
  h3: ({ children }) => (
    <h3 className="font-display text-base font-medium mt-8 mb-3 text-foreground">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-display text-base font-bold mt-6 mb-2 text-muted-foreground">
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
  // The dimmest text tier, shared with Anchor's discreet variant, the Card
  // title and the article date. Carries a touch more weight than the body so
  // the italic keeps its presence at a lower contrast.
  em: ({ children }) => (
    <span className="italic font-medium text-subtle-foreground">{children}</span>
  ),
  blockquote: Blockquote,
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
