import { getPosts } from '@/lib/posts-utils';
import Link from 'next/link';

export default async function Page() {
  const posts = await getPosts();
  return (
    <div>
      {/* <h1>Latest Posts</h1> */}
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
