import { toMarkdown } from '@/lib/post-markdown';
import { getPosts } from '@/lib/post-utils';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  // Drafts too, as their page resolves.
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
