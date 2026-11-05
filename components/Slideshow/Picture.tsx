import NextImage from 'next/image';
import type { Ref } from 'react';

export interface PictureProps {
  src: string;
  alt?: string;
  width: number;
  height: number;
  sizes: string;
  /** A CSS length, past either side. */
  bleed: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'sync' | 'async';
  ref?: Ref<HTMLDivElement>;
}

export function Picture({ src, alt = '', width, height, sizes, bleed, loading, decoding, ref }: PictureProps) {
  return (
    <div
      ref={ref}
      className="absolute inset-y-0"
      style={{ left: `calc(-1 * ${bleed})`, width: `calc(100% + 2 * ${bleed})` }}
    >
      <NextImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={loading}
        decoding={decoding}
        draggable={false}
        className="pointer-events-none size-full object-cover select-none"
      />
    </div>
  );
}
