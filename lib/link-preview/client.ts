import type { LinkMetadata } from './types';

const NOTHING: LinkMetadata = {};

/**
 * One request per link for the life of the page, shared by every hover of it:
 * the answer cannot change under the reader, and the second hover is free.
 */
const asked = new Map<string, Promise<LinkMetadata>>();

export function askAbout(href: string): Promise<LinkMetadata> {
  const held = asked.get(href);
  if (held) return held;

  const request = fetch(`/api/link-preview?url=${encodeURIComponent(href)}`)
    .then((response) => (response.ok ? response.json() : NOTHING))
    .catch(() => NOTHING);

  asked.set(href, request);
  return request;
}
