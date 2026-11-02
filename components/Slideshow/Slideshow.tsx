import { resolveImageUrl } from '@/lib/cdn';
import { measureImage } from '@/lib/image-utils';
import { cn } from '@/lib/utils';

import { type SlideshowImage, SlideshowCarousel } from './SlideshowCarousel';

export interface SlideshowProps {
  /**
   * In order, each a path relative to the CDN's images prefix or an absolute URL, alone
   * or with what it shows as `alt`, which a screen reader reads on that slide.
   */
  images: (string | SlideshowImage)[];
  /** Doubles as the caption and the slideshow's accessible name. */
  alt: string;
  /** Plays on its own, cross-fading and going round, with a pause button. */
  autoPlay?: boolean;
  /** Milliseconds each image holds while playing. */
  interval?: number;
  /** Both given skips the build-time lookup of the first image. */
  width?: number;
  height?: number;
  className?: string;
}

// URL resolution and the lookup run at build time, so only the carousel crosses to
// the client. The first image sets the frame; the others are cropped to it.
export default async function Slideshow({
  images,
  alt,
  autoPlay = false,
  interval = 5000,
  width,
  height,
  className,
}: SlideshowProps) {
  if (images.length === 0) return null;
  // A bare path shows nothing a reader needs beyond the caption.
  const resolved = images.map((image) =>
    typeof image === 'string'
      ? { src: resolveImageUrl(image), alt: '' }
      : { src: resolveImageUrl(image.src), alt: image.alt }
  );
  const measurement = width && height ? { width, height } : await measureImage(resolved[0].src);

  return (
    <figure className={cn('my-6 flex w-full flex-col items-start gap-0', className)}>
      <SlideshowCarousel
        images={resolved}
        alt={alt}
        autoPlay={autoPlay}
        interval={interval}
        width={measurement.width}
        height={measurement.height}
        className="w-full"
      />
      <figcaption className="pt-2.5 font-display text-sm leading-6 text-subtle-foreground">{alt}</figcaption>
    </figure>
  );
}
