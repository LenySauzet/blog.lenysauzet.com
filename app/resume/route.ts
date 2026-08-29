import siteConfig from '@/config/site'

const FILENAME = siteConfig.resumeUrl.split('/').pop() ?? 'resume.pdf'

/**
 * The PDF lives on the CDN, but `download` is ignored across origins: linked
 * straight to it the browser navigates away instead of saving. Served from here it
 * carries its own disposition, so the file lands and the reader stays on the page.
 */
export async function GET() {
    const upstream = await fetch(siteConfig.resumeUrl)

    if (!upstream.ok || !upstream.body) {
        return new Response('Resume unavailable', { status: 502 })
    }

    return new Response(upstream.body, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${FILENAME}"`,
            'Cache-Control': 'public, max-age=3600',
        },
    })
}
