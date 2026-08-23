import Footnote from '@/components/Footnote';
import { ScrambledText } from '@/components/ScrambledText';
import { UpdatedBadge } from '@/components/UpdatedBadge';
import siteConfig from '@/config/site';
import { getPosts } from '@/lib/post-utils';
import { readingTimeOf } from '@/lib/reading-time';
import { relativeTime } from '@/lib/relative-time';
import { format } from 'date-fns';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

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

    const pageTitle = `${metadata.title} - ${siteName}`;

    return {
      title: pageTitle,
      description: metadata.description,
      alternates: { canonical: postUrl },
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
      <article className="flex flex-col gap-8 pt-28 sm:pt-80 px-4">
        <div className="w-full min-w-0 max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-5xl font-serif tracking-tight text-balance leading-tight">
              {metadata.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* One string, so a single decode crosses the whole line. */}
              <time
                dateTime={metadata.date}
                className="font-mono text-sm uppercase text-subtle-foreground"
              >
                <ScrambledText delay={0.5} speed={1.6} windowSize={3}>
                  {`${format(new Date(Date.parse(metadata.date)), 'MMM d, yyyy')} · ${minutes} min read`}
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

          {/* No font-weight here. The prose scale is built on a 400 body, so
              `strong`, `em` and `h3` can step up to 500 and read as emphasis; a
              blanket font-medium put the body at 500 and flattened all three. */}
          <div className="flex flex-col gap-5">
            <Post />
          </div>
        </div>

        <Footnote />
      </article>
    );
  } catch {
    notFound();
  }
}

export async function generateStaticParams() {
  // Drafts are hidden from the feed but still built, so their URL resolves
  // under `dynamicParams = false`.
  const posts = await getPosts({ includeDrafts: true });
  return posts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;
