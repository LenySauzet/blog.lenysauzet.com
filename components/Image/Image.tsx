import { resolveImageUrl } from '@/lib/cdn';
import { getImageDimensions } from '@/lib/image-utils';

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

// Server component: URL resolution and the dimension lookup run at build time,
// so the figure and caption ship as plain HTML; only the zoom crosses to client.
export default async function Image({
  src,
  alt,
  width,
  height,
  quality = 100,
  ...props
}: ImageProps) {
  const url = resolveImageUrl(src);
  const dimensions =
    width && height ? { width, height } : await getImageDimensions(url);

  return (
    <figure className="my-6 flex w-full flex-col items-start gap-0">
      <ImageZoom src={url} alt={alt} quality={quality} {...dimensions} {...props} />
      <figcaption className="pt-2.5 font-display text-sm leading-6 text-muted-foreground">
        {alt}
      </figcaption>
    </figure>
  );
}
