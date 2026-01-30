import siteConfig from '@/config/site'
import { getPosts } from '@/lib/posts-utils'

const { url, rss: rssConfig } = siteConfig

export async function GET() {
  const posts = await getPosts()

  const itemsXml = posts
    .map(
      (post) =>
        `<item>
        <title>${escapeXml(post.metadata.title)}</title>
        <link>${url}/posts/${post.slug}</link>
        <guid isPermaLink="true">${url}/posts/${post.slug}</guid>
        <description>${escapeXml(post.metadata.description)}</description>
        <pubDate>${new Date(post.metadata.date).toUTCString()}</pubDate>
      </item>`
    )
    .join('\n')

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>${rssConfig.channelTitle}</title>
        <link>${url}</link>
        <description>${rssConfig.channelDescription}</description>
        <language>${rssConfig.language}</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <atom:link href="${url}/rss" rel="self" type="application/rss+xml"/>
        ${itemsXml}
    </channel>
  </rss>`

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
