import bundleAnalyzer from '@next/bundle-analyzer';
import createMDX from '@next/mdx';
import type { NextConfig } from 'next';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
});

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
};

module.exports = withBundleAnalyzer(withMDX(nextConfig));
