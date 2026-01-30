import Logo from '@/components/Logo';
import DotMatrix from '@/components/OG/DotMatrix';
import Shapes from '@/components/OG/Shapes';
import siteConfig from '@/config/site';
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = siteConfig.siteName;
export const size = {
  width: 1800,
  height: 945,
};

export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { metadata } = await import(`@/content/${slug}.mdx`);

  const [instrumentSerif, geist] = await Promise.all([
    readFile(join(process.cwd(), 'public/fonts/InstrumentSerif-Regular.ttf')),
    readFile(join(process.cwd(), 'public/fonts/Geist-Bold.ttf')),
  ]);

  return new ImageResponse(
    <div
      tw="w-full h-full flex items-center justify-center text-white"
      style={{
        background: 'linear-gradient(214deg, #A0A0A0 0%, #1F2426 96.12%)',
        // background: 'linear-gradient(212deg, #37398F 19.79%, #6075B8 70.31%, #B3DFED 100%)',
      }}
    >
      <DotMatrix />
      <Shapes />

      <div
        tw="absolute w-full h-full"
        style={{
          background:
            'linear-gradient(180deg, #000 0%, rgba(0, 0, 0, 0.00) 85.94%)',
        }}
      />

      <div
        tw="absolute top-0 left-0 w-full h-full flex items-center justify-center text-8xl"
        style={{
          fontFamily: 'Geist',
        }}
      >
        {metadata.title}
      </div>

      <div tw="w-full h-full p-[150px] px-[200px] flex">
        <div
          tw="w-full flex justify-between items-center text-3xl mt-auto"
          style={{
            fontFamily: 'Geist',
          }}
        >
          <Logo fill="#FFFFFF" />
          {siteConfig.twitter.handle}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: 'Instrument Serif',
          data: instrumentSerif,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'Geist',
          data: geist,
          style: 'normal',
          weight: 400,
        },
      ],
    },
  );
}
