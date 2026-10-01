import { buildSearchIndex } from '@/lib/search/build-index';

/** The posts are static, so the index over them is written once, at build. */
export const dynamic = 'force-static';

export async function GET() {
  return new Response(await buildSearchIndex(), {
    headers: { 'content-type': 'application/json' },
  });
}
