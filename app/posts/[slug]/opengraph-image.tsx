import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import Logo from '@/components/Logo';
import BlendedText from '@/components/OG/BlendedText';
import DotMatrix from '@/components/OG/DotMatrix';
import Shapes from '@/components/OG/Shapes';

export const alt = 'The Blog of Lény Sauzet';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [instrumentSerif, geist] = await Promise.all([
    readFile(join(process.cwd(), 'public/fonts/InstrumentSerif-Regular.ttf')),
    readFile(join(process.cwd(), 'public/fonts/Geist-Bold.ttf')),
  ]);

  const logoData = await readFile(
    join(process.cwd(), 'public/static/favicon/icon.png'),
  );
  const logoSrc = Uint8Array.from(logoData).buffer;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        background: 'linear-gradient(214deg, #A0A0A0 0%, #1F2426 96.12%)',
        // background: 'linear-gradient(212deg, #37398F 19.79%, #6075B8 70.31%, #B3DFED 100%)',
      }}
    >
      <Shapes />
      <DotMatrix />
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, #000 0%, transparent 85.94%)',
        }}
      />

      <div
        style={{
          width: '100%',
          height: '100%',
          padding: '120px',
          display: 'flex',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            width: '100%',
          }}
        >
          <div
          style={{
            width: '100%',
            height: '100%',
            fontSize: 60,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            fontFamily: 'Geist',

          }}
          >
            {/* <BlendedText>How to use Framer Motion with Emotion styled-components</BlendedText> */}
            Lorem ipsum dolor sit amet, consectetur adipiscing elit
          </div>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 25,
              fontFamily: 'Geist',
            }}
          >
            <Logo fill="#FFFFFF" />
            @LenySauzet
          </div>
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
