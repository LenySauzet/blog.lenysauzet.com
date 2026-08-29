import { resolveImageUrl } from '@/lib/cdn';
import { measureImage } from '@/lib/image-utils';

import ImageZoom from './ImageZoom';

export interface ImageProps {
  /** Path relative to the CDN's images prefix, or an absolute URL. */
  src: string;
  /** Doubles as the caption and the lightbox's accessible name. */
  alt: string;
  /** Both given skips the build-time dimension lookup. */
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
}

// URL resolution and the dimension lookup run at build time, so only the zoom
// crosses to the client.
export default async function Image({
  src,
  alt,
  width,
  height,
  quality = 100,
  ...props
}: ImageProps) {
  const url = resolveImageUrl(src);
  // Only the two numbers travel on: whether the CDN answered at build time is not
  // something the DOM should be handed, and what a reader sees is decided at runtime.
  const measurement = width && height ? { width, height } : await measureImage(url);
  const dimensions = { width: measurement.width, height: measurement.height };

  return (
    <figure className="my-6 flex w-full flex-col items-start gap-0">
      <ImageZoom
        src={url}
        alt={alt}
        quality={quality}
        {...dimensions}
        {...props}
      />
      <figcaption className="pt-2.5 font-display text-sm leading-6 text-subtle-foreground">
        {alt}
      </figcaption>
    </figure>
  );
}
