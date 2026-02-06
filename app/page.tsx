import { getPosts } from '@/lib/post-utils';
import { format } from 'date-fns';
import Link from 'next/link';

export default async function Page() {
  const posts = await getPosts();

  const years = posts.map((post) => new Date(post.metadata.date).getFullYear());
  const uniqueYears = [...new Set(years)];

  uniqueYears.sort((a, b) => b - a);

  return (
    <div>
      {uniqueYears.map((year) => (
        <div className="flex flex-col gap-5" key={year}>
          <span className="text-sm uppercase font-mono">{year}</span>
          <ul key={year} className="">
            {posts
              .filter(
                (post) => new Date(post.metadata.date).getFullYear() === year,
              )
              .map((post) => (
                <li
                  key={post.slug}
                  className="flex gap-2 justify-between items-center border-b py-4 group cursor-pointer"
                >
                  <Link
                    href={`/posts/${post.slug}`}
                    className="group-hover:text-foreground transition-colors text-foreground/50"
                  >
                    {post.metadata.title}
                  </Link>
                  <span className="text-sm font-mono group-hover:text-foreground transition-colors text-foreground/50">
                    {format(new Date(Date.parse(post.metadata.date)), 'MMM d')}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
