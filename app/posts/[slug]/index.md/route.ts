import { toMarkdown } from '@/lib/post-markdown';
import { getPosts } from '@/lib/post-utils';

/** Written at build beside the page it mirrors, from the same posts. */
export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  // Drafts too: hidden from every listing, reachable by whoever has the URL,
  // which is what the page itself does.
  const posts = await getPosts({ includeDrafts: true });

  return posts.map((post) => ({ slug: post.slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const posts = await getPosts({ includeDrafts: true });
  const post = posts.find((candidate) => candidate.slug === slug);

  if (!post) return new Response('Not found.', { status: 404 });

  return new Response(toMarkdown(post), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
}
