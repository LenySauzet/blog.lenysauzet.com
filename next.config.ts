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
    // Markdown images render as a <figure>, which is invalid inside the <p>
    // remark would otherwise wrap them in. Lifting them out keeps the markup
    // valid and hydration quiet.
    //
    // Named rather than imported: Turbopack resolves the plugin itself, since
    // functions cannot cross into Rust. It also sidesteps this config being
    // compiled to CommonJS, which cannot require an ESM-only package.
    remarkPlugins: ['remark-unwrap-images'],
    // Shiki highlights fenced blocks at build time — zero client JS. The theme
    // is a plain serializable object (see config/code-theme.ts); a copy button
    // is layered on via the figure override in mdx-components.tsx.
    rehypePlugins: [
      // block-only default: plain inline `code` stays untouched and keeps its
      // pill styling (see mdx-components.tsx), only fenced blocks are highlighted.
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
