import siteConfig from '@/config/site';
import { getPosts } from '@/lib/posts-utils';
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
    const { default: Post } = await import(`@/content/${slug}.mdx`);
    return <Post />;
  } catch {
    notFound();
  }
}

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;
