import { PostsList } from '@/components/PostsList';
import { getPosts } from '@/lib/post-utils';
import { IndexSection } from './_components/IndexSection';

export default async function Page() {
  const posts = await getPosts();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      <IndexSection />
      <PostsList
        posts={posts.map(({ slug, metadata }) => ({
          slug,
          metadata: { title: metadata.title, date: metadata.date },
        }))}
      />
    </div>
  );
}
