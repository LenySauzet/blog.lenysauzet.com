import { buildSearchIndex } from '@/lib/search/build-index';

/**
 * Written once at build, like every page here: the posts are static, so the index
 * over them is too. Reading `content/` on request would put a filesystem walk in
 * front of the first keystroke of every search.
 */
export const dynamic = 'force-static';

export async function GET() {
  return new Response(await buildSearchIndex(), {
    headers: { 'content-type': 'application/json' },
  });
}
