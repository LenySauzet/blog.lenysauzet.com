import { resolveImageUrl } from '@/lib/cdn';
import { getImageDimensions } from '@/lib/image-utils';
import { cn } from '@/lib/utils';

import { BeforeAfterSlider } from './BeforeAfterSlider';

export interface BeforeAfterImageProps {
  /** CDN image paths or absolute URLs. */
  beforeSrc: string;
  afterSrc: string;
  /** Also the caption. */
  alt: string;
  /** 0 to 100. */
  defaultPosition?: number;
  /** Both given skip the build-time lookup. */
  width?: number;
  height?: number;
  className?: string;
}

// One lookup covers both images: overlaid, they share an intrinsic size.
export default async function BeforeAfterImage({
  beforeSrc,
  afterSrc,
  alt,
  defaultPosition = 50,
  width,
  height,
  className,
}: BeforeAfterImageProps) {
  const before = resolveImageUrl(beforeSrc);
  const after = resolveImageUrl(afterSrc);
  const dimensions =
    width && height ? { width, height } : await getImageDimensions(before);

  return (
    <figure className={cn('my-6 flex w-full flex-col items-start gap-0', className)}>
      <BeforeAfterSlider
        beforeSrc={before}
        afterSrc={after}
        alt={alt}
        defaultPosition={defaultPosition}
        {...dimensions}
      />
      <figcaption className="pt-2.5 font-display text-sm leading-6 text-subtle-foreground">
        {alt}
      </figcaption>
    </figure>
  );
}
