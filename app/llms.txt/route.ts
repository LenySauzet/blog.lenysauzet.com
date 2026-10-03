import siteConfig from '@/config/site';
import { getPosts } from '@/lib/post-utils';

export const dynamic = 'force-static';

const { url, title, descriptionShort } = siteConfig;

/** llmstxt.org: a heading, a summary, then sections of links. Each one points
    at the post's Markdown rather than its page, which is the whole point. */
export async function GET() {
  const posts = await getPosts();

  const body = [
    `# ${title.default}`,
    '',
    `> ${descriptionShort}`,
    '',
    '## Posts',
    '',
    ...posts.map(
      ({ slug, metadata }) =>
        `- [${metadata.title}](${url}/posts/${slug}/index.md): ${metadata.description}`
    ),
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
