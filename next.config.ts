import bundleAnalyzer from '@next/bundle-analyzer';
import createMDX from '@next/mdx';
import type { NextConfig } from 'next';
import { join } from 'node:path';

import { codeTheme } from './config/code-theme';
import siteConfig from './config/site';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    // Named, not imported: functions cannot cross into Turbopack, and CommonJS cannot require ESM.
    remarkPlugins: ['remark-unwrap-images', 'remark-math', 'remark-gfm'],
    rehypePlugins: [
      // Before rehype-code, which would otherwise highlight the math nodes.
      'rehype-mathjax',
      // Absolute: the loader resolves a path from the MDX file's directory.
      [join(__dirname, 'lib/rehype-code.mjs'), { theme: codeTheme, keepBackground: false, defaultLang: { block: 'plaintext' } }],
    ],
  },
});

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  images: {
    // Next 16 coerces any quality outside this list.
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: new URL(siteConfig.cdnUrl).hostname,
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = withBundleAnalyzer(withMDX(nextConfig));
