import { resolveImageUrl } from '@/lib/cdn';
import { getImageDimensions } from '@/lib/image-utils';

import { BeforeAfterSlider } from './BeforeAfterSlider';

export interface BeforeAfterImageProps {
  /** Paths relative to the CDN's images prefix, or absolute URLs. */
  beforeSrc: string;
  afterSrc: string;
  /** Doubles as the caption and the slider's accessible name. */
  alt: string;
  /** Initial divider position, 0–100. */
  defaultPosition?: number;
  /** Both given skips the build-time dimension lookup. */
  width?: number;
  height?: number;
}

// Server component: URL resolution and the dimension lookup run at build time,
// so only the interactive slider crosses to the client. Both images share the
// same intrinsic size (they're overlaid), so one lookup covers both.
export default async function BeforeAfterImage({
  beforeSrc,
  afterSrc,
  alt,
  defaultPosition = 50,
  width,
  height,
}: BeforeAfterImageProps) {
  const before = resolveImageUrl(beforeSrc);
  const after = resolveImageUrl(afterSrc);
  const dimensions =
    width && height ? { width, height } : await getImageDimensions(before);

  return (
    <figure className="my-6 flex w-full flex-col items-start gap-0">
      <BeforeAfterSlider
        beforeSrc={before}
        afterSrc={after}
        alt={alt}
        defaultPosition={defaultPosition}
        {...dimensions}
      />
      <figcaption className="pt-2.5 font-display text-sm leading-6 text-muted-foreground">
        {alt}
      </figcaption>
    </figure>
  );
}
