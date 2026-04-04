import Footnote from '@/components/Footnote';
import { ScrambledText } from '@/components/ScrambledText';
import siteConfig from '@/config/site';
import { getPosts } from '@/lib/post-utils';
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
    return (
      <article className="flex flex-col gap-8 pt-28 sm:pt-80 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-5xl font-serif tracking-tight text-balance leading-tight">
              {metadata.title}
            </h1>
            <time itemProp="datepublished" dateTime={metadata.date}>
              <ScrambledText
                delay={0.5}
                speed={0.8}
                windowSize={3}
                className="font-mono text-sm uppercase text-muted-foreground/75"
              >
                {format(new Date(Date.parse(metadata.date)), 'MMM d, yyyy')}
              </ScrambledText>
            </time>
          </div>

          <div className="flex flex-col gap-5 font-medium">
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
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;
