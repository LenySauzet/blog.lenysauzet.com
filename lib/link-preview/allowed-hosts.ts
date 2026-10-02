import { getPosts } from '@/lib/post-utils';

const AUTHORITY = /https?:\/\/([^\s/"'<>)\]]+)/g;

const bare = (host: string) => host.toLowerCase().replace(/^www\./, '');

const collect = async () => {
  const posts = await getPosts({ includeDrafts: true });
  const hosts = new Set<string>();

  for (const post of posts) {
    for (const [, authority] of post.content.matchAll(AUTHORITY)) {
      hosts.add(bare(authority.split(':')[0]));
    }
  }

  return hosts;
};

let known: Promise<Set<string>> | undefined;

/**
 * The route would otherwise fetch whatever anyone handed it, and the only URLs
 * it ever needs are the ones a reader can hover. Read once per instance, since
 * content only changes on a deploy.
 */
export const isLinkedFromAPost = async (host: string) =>
  (known ??= collect()).then((hosts) => hosts.has(bare(host)));
