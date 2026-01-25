import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'The Blog of Lény Sauzet'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default async function Image({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params;

    const interSemiBold = await readFile(
        join(process.cwd(), 'public/fonts/Inter-SemiBold.ttf')
    )

    const logoData = await readFile(join(process.cwd(), 'public/static/favicon/icon.png'))
    const logoSrc = Uint8Array.from(logoData).buffer

    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 128,
                    background: 'white',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {slug} - The Blog of Lény Sauzet
            </div>
        ),
        {
            ...size,
            fonts: [
                {
                    name: 'Inter',
                    data: interSemiBold,
                    style: 'normal',
                    weight: 400,
                },
            ],
        }
    )
}