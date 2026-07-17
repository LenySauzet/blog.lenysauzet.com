import { resolveCdnUrl } from '@/lib/cdn';
import { getImageDimensions } from '@/lib/image-utils';

import ImageZoom from './ImageZoom';

export interface ImageProps {
  /** Path relative to the CDN root, or an absolute URL. */
  src: string;
  /** Required. Doubles as the caption and the lightbox's accessible name. */
  alt: string;
  /** Optional: skips the build-time dimension lookup when both are given. */
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  className?: string;
}

/**
 * The image component for posts.
 *
 * ```mdx
 * <Image src="shade-of-halftone/circle-sdf.png" alt="Diagram breaking down..." />
 * ```
 *
 * A server component by design: URL resolution and the dimension lookup are
 * data concerns that belong at build time, and keeping them here means the
 * figure and its caption ship as plain HTML. Only the zoom interaction crosses
 * into the client.
 */
export default async function Image({
  src,
  alt,
  width,
  height,
  quality = 100,
  ...props
}: ImageProps) {
  const url = resolveCdnUrl(src);
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
