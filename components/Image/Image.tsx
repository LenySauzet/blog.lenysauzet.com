import { resolveImageUrl } from '@/lib/cdn';
import { measureImage } from '@/lib/image-utils';

import ImageZoom from './ImageZoom';

export interface ImageProps {
  /** A CDN image path or an absolute URL. */
  src: string;
  /** Also the caption. */
  alt: string;
  /** Both given skip the build-time lookup. */
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
}

export default async function Image({
  src,
  alt,
  width,
  height,
  quality = 100,
  ...props
}: ImageProps) {
  const url = resolveImageUrl(src);
  // `measured` stays on the server: the DOM has no use for it.
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
