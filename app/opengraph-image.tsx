import Logo from '@/components/Logo';
import siteConfig from '@/config/site';
import { ImageResponse } from 'next/og';

export const alt = siteConfig.siteName;
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Drawn from Logo, so the share card can never fall behind the mark. X takes
// it too: without a twitter-image, Next fills twitter:image from this one.
export default function Image() {
  return new ImageResponse(
    <div tw="w-full h-full flex items-center justify-center bg-black text-white">
      <Logo width={104} height={104} />
    </div>,
    size
  );
}
