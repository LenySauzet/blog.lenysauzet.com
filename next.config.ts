import bundleAnalyzer from '@next/bundle-analyzer';
import createMDX from '@next/mdx';
import type { NextConfig } from 'next';

import { codeTheme } from './config/code-theme';
import siteConfig from './config/site';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    // Named, not imported: Turbopack resolves plugins itself since functions
    // cannot cross into Rust, and this config compiles to CommonJS, which cannot
    // require an ESM-only package. remark-unwrap-images lifts markdown images out
    // of the <p> remark wraps them in, where our <figure> would be invalid.
    remarkPlugins: ['remark-unwrap-images', 'remark-math'],
    rehypePlugins: [
      // Renders to SVG at build time: no client JS, no CLS, no web-font loading.
      // Chosen over KaTeX for deeply-nested radicals. MUST run before
      // rehype-pretty-code, which would otherwise try to highlight the
      // `language-math` nodes remark-math emits.
      'rehype-mathjax',
      // Fenced blocks only. Inline code is left unhighlighted and takes a flat
      // --code-inline instead: a bare identifier tokenises as plain text in any
      // grammar, so highlighting only ever dimmed it into the prose.
      ['rehype-pretty-code', { theme: codeTheme, keepBackground: false, defaultLang: { block: 'plaintext' } }],
    ],
  },
});

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  images: {
    // Required from Next 16 on: a quality outside this list is coerced to the
    // nearest allowed value.
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: new URL(siteConfig.cdnUrl).hostname,
        pathname: '/**',
      },
    ],
  },
};

module.exports = withBundleAnalyzer(withMDX(nextConfig));
