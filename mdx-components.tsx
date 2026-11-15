import type { MDXComponents } from 'mdx/types';

import Bezier from '@/components/figures/Bezier';
import Chart, { PieChart } from '@/components/figures/Chart';
import ConfusionMatrix from '@/components/figures/ConfusionMatrix';
import Coverage from '@/components/figures/Coverage';
import Figure from '@/components/figures/Figure';
import Halftone from '@/components/figures/Halftone';
import Lerp from '@/components/figures/Lerp';
import LitWave from '@/components/figures/LitWave';
import RaySphere from '@/components/figures/RaySphere';
import { Sandpack } from '@/components/figures/Sandpack';
import VideoHalftone from '@/components/figures/VideoHalftone';
import Wave from '@/components/figures/Wave';
import BeforeAfterImage from '@/components/media/BeforeAfterImage';
import Image from '@/components/media/Image';
import Slideshow from '@/components/media/Slideshow';
import Tweet from '@/components/media/Tweet';
import VideoPlayer from '@/components/media/VideoPlayer';
import Anchor from '@/components/prose/Anchor/Anchor';
import Blockquote from '@/components/prose/Blockquote';
import { Callout } from '@/components/prose/Callout';
import Card from '@/components/prose/Card';
import { CodeBlock } from '@/components/prose/CodeBlock';
import {
  ButtonShowcase,
  ChartShowcase,
  InputShowcase,
  SelectShowcase,
  SliderShowcase,
  ToggleShowcase,
} from '@/components/prose/ComponentShowcase';
import Details from '@/components/prose/Details';
import Fullbleed from '@/components/prose/Fullbleed';
import { List, ListItem } from '@/components/prose/List';
import { PostH2 } from '@/components/prose/PostH2';
import SupportCallout from '@/components/prose/SupportCallout';
import Table from '@/components/prose/Table';
import { Badge } from '@/components/ui/badge';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { FootnoteRef, FootnotesList } from './components/prose/Footnotes';

// `src` narrowed: the img type also allows a Blob, which remark never emits.
function MarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  if (typeof src !== 'string') return null;
  return <Image src={src} alt={alt ?? ''} />;
}

export const components = {
  Anchor,
  Badge,
  BeforeAfterImage,
  ButtonShowcase,
  Callout,
  Card,
  Chart,
  ChartShowcase,
  ConfusionMatrix,
  Details,
  Figure,
  InputShowcase,
  SelectShowcase,
  SliderShowcase,
  ToggleShowcase,
  Bezier,
  Coverage,
  Fullbleed,
  Image,
  Halftone,
  Lerp,
  LitWave,
  PieChart,
  RaySphere,
  VideoHalftone,
  Wave,
  Sandpack,
  Slideshow,
  SupportCallout,
  Tweet,

  a: Anchor,
  h1: ({ children }) => (
    <h1 className="font-display text-4xl font-bold tracking-tight mt-0 mb-6">
      {children}
    </h1>
  ),
  h2: ({ children }) => <PostH2>{children}</PostH2>,
  // Both body size: a larger h4 would outsize its own h3.
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
  em: ({ children }) => (
    <span className="italic font-medium text-subtle-foreground">{children}</span>
  ),
  blockquote: Blockquote,
  table: Table,
  thead: TableHeader,
  tbody: TableBody,
  // Mapped whole: a `({ children })` wrapper drops GFM's inline alignment style.
  tr: TableRow,
  th: TableHead,
  td: TableCell,
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
