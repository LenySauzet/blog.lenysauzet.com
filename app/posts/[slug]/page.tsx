import { format } from 'date-fns';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AnnouncePost } from '@/app/_components/DynamicIsland';
import Anchor from '@/components/prose/Anchor/Anchor';
import { ScrambledText } from '@/components/shared/ScrambledText';
import siteConfig from '@/config/site';
import { postDate } from '@/lib/posts/post-date';
import { getPosts } from '@/lib/posts/post-utils';
import { readingTimeOf } from '@/lib/posts/reading-time';
import { relativeTime } from '@/lib/posts/relative-time';

import PostFooter from './_components/PostFooter';
import { UpdatedBadge } from './_components/UpdatedBadge';

const { url, authorName, siteName, twitter } = siteConfig;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { metadata } = await import(`@/content/${slug}.mdx`);
    const postUrl = `${url}/posts/${slug}`;

    // The root layout's template suffixes the page title, but not the social ones.
    const pageTitle = `${metadata.title} - ${siteName}`;

    return {
      title: metadata.title,
      description: metadata.description,
      alternates: {
        canonical: postUrl,
        types: { 'text/markdown': `${postUrl}/index.md` },
      },
      openGraph: {
        title: pageTitle,
        description: metadata.description,
        url: postUrl,
        type: 'article',
        publishedTime: metadata.date,
        modifiedTime: metadata.updated,
        authors: [authorName],
        siteName,
      },
      twitter: {
        card: twitter.card,
        title: pageTitle,
        description: metadata.description,
        creator: twitter.handle,
      },
    };
  } catch {
    return { title: 'Article not found' };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const { default: Post, metadata } = await import(`@/content/${slug}.mdx`);
    const minutes = await readingTimeOf(slug);
    return (
      <article className="flex flex-col gap-8 pt-28 sm:pt-56 px-4">
        <AnnouncePost title={metadata.title} shortTitle={metadata.shortTitle} />
        <div className="w-full min-w-0 max-w-2xl mx-auto">
          <div className="mb-3">
            <Anchor href="/" direction="left" discreet underline={false} favicon={false}>
              Home
            </Anchor>
          </div>

          <div className="mb-6">
            <h1 className="text-5xl font-serif tracking-tight text-balance leading-tight">
              {metadata.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* One string: split in two, each half would scramble on its own. */}
              <time
                dateTime={metadata.date}
                className="font-mono text-sm uppercase text-subtle-foreground"
              >
                <ScrambledText delay={0.5} speed={1.6} windowSize={3}>
                  {`${format(postDate(metadata.date), 'MMM d, yyyy')} · ${minutes} min read`}
                </ScrambledText>
              </time>
              {metadata.updated && (
                <UpdatedBadge
                  date={metadata.updated}
                  label={relativeTime(metadata.updated)}
                />
              )}
            </div>
          </div>

          {/* No font-weight: strong, em and h3 are 500, so the body must stay at 400. */}
          <div data-prose className="flex flex-col gap-5">
            <Post />
          </div>
        </div>

        <PostFooter />
      </article>
    );
  } catch {
    notFound();
  }
}

export async function generateStaticParams() {
  // Drafts are built too, so their URL resolves.
  const posts = await getPosts({ includeDrafts: true });
  return posts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;
