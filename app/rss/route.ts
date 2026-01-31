import siteConfig from '@/config/site';
import { getPosts } from '@/lib/posts-utils';

const { url, rss: rssConfig } = siteConfig;

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const posts = await getPosts();

  const itemsXml = posts
    .sort((a, b) => {
      if (new Date(a.metadata.date) > new Date(b.metadata.date)) {
        return -1;
      }
      return 1;
    })
    .map(
      (post) =>
        `<item>
      <title>${escapeXml(post.metadata.title)}</title>
      <link>${url}/posts/${post.slug}</link>
      <description>${escapeXml(post.metadata.description ?? '')}</description>
      <pubDate>${new Date(post.metadata.date).toUTCString()}</pubDate>
      <guid isPermaLink="true">${url}/posts/${post.slug}</guid>
    </item>`,
    )
    .join('\n');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(rssConfig.channelTitle)}</title>
    <link>${url}</link>
    <description>${escapeXml(rssConfig.channelDescription)}</description>
    <language>${rssConfig.language}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${url}/rss" rel="self" type="application/rss+xml"/>
    ${itemsXml}
  </channel>
</rss>`;

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
