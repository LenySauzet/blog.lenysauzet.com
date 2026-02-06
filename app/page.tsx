import { PostsList } from '@/components/PostsList';
import { getPosts } from '@/lib/post-utils';

export default async function Page() {
  const posts = await getPosts();

  return (
    <PostsList
      posts={posts.map(({ slug, metadata }) => ({
        slug,
        metadata: { title: metadata.title, date: metadata.date },
      }))}
    />
  );
}
