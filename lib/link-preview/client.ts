import type { LinkMetadata } from './types';

const NOTHING: LinkMetadata = {};

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
