import type { MDXComponents } from 'mdx/types';
import Image, { type ImageProps } from 'next/image';

const components = {
  h1: ({ children }) => (
    <h1 style={{ color: 'red', fontSize: '48px' }}>{children}</h1>
  ),
  img: ({ alt = '', ...props }: ImageProps) => (
    <Image
      alt={alt}
      sizes="100vw"
      style={{ width: '100%', height: 'auto' }}
      {...props}
    />
  ),
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
