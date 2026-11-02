import NextImage from 'next/image';
import type { Ref } from 'react';

export interface PictureProps {
  src: string;
  alt?: string;
  width: number;
  height: number;
  sizes: string;
  /** How far past either side of its box the image reaches, as a CSS length. */
  bleed: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'sync' | 'async';
  ref?: Ref<HTMLDivElement>;
}

/**
 * An image covering its box and reaching `bleed` past either side, which a seam's bulge
 * draws from. Every copy of a slide's image is one, so the slide, its cross-fade and its
 * lift all crop alike.
 */
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
