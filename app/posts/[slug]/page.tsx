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
      <article className="max-w-3xl mx-auto p-4 flex flex-col gap-8">
        <div className="flex flex-col gap-2 ">
          <h1 className="text-5xl font-serif tracking-tight text-balance leading-tight">
            {metadata.title}
          </h1>
          <time itemProp="datepublished" dateTime={metadata.date}>
            {/* <TextScramble
              className="font-mono text-sm uppercase text-muted-foreground/75"
              as="span"
            >
              {format(new Date(Date.parse(metadata.date)), 'MMM d, yyyy')}
            </TextScramble> */}

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
        <div className="text-muted-foreground leading-7 flex flex-col gap-6 font-medium">
          <Post />
        </div>
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
