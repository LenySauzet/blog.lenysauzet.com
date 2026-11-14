import { resolveImageUrl } from '@/lib/cdn';
import { measureImage } from '@/lib/image-utils';
import { cn } from '@/lib/utils';

import { type SlideshowImage, SlideshowCarousel } from './SlideshowCarousel';

export interface SlideshowProps {
  /** CDN paths or absolute URLs; an object's `alt` names its own slide. */
  images: (string | SlideshowImage)[];
  /** Also the caption. */
  alt: string;
  autoPlay?: boolean;
  /** Milliseconds. */
  interval?: number;
  /** Both given skip the build-time lookup. */
  width?: number;
  height?: number;
  className?: string;
}

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
