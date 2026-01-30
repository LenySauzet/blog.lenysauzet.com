import siteConfig from '@/config/site';
import { getPosts } from '@/lib/posts-utils';
import type { Metadata } from 'next';
import Link from 'next/link';

const { pages, url } = siteConfig;

export const metadata: Metadata = {
  title: pages.home.title,
  description: pages.home.description,
  openGraph: {
    title: pages.home.openGraphTitle,
    url,
  },
};

export default async function Page() {
  const posts = await getPosts();
  return (
    <div>
      <h1>Latest Posts</h1>
      <ul>
        {posts.slice(0, 3).map((post) => (
          <li key={post.slug}>
            <Link href={`/posts/${post.slug}`}>{post.metadata.title}</Link>
            <p>{post.metadata.description}</p>
            <p>{post.metadata.date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
