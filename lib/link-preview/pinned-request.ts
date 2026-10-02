import { request as insecurely, type IncomingMessage } from 'node:http';
import { request as securely } from 'node:https';
import type { LookupFunction } from 'node:net';

/** The socket is given the address that was checked while the request keeps its
    hostname, so the certificate and the `Host` header stay the site's own. */
const pinnedTo =
  (address: string): LookupFunction =>
  (_hostname, options, callback) => {
    const family = address.includes(':') ? 6 : 4;

    if (options.all) callback(null, [{ address, family }]);
    else callback(null, address, family);
  };

export function requestPinned(
  url: URL,
  address: string,
  headers: Record<string, string>,
  timeout: number
): Promise<IncomingMessage> {
  const send = url.protocol === 'https:' ? securely : insecurely;

  return new Promise((resolve, reject) => {
    const sent = send(
      url,
      {
        headers,
        lookup: pinnedTo(address),
        timeout,
        // Node pools sockets by name, and a reused one never reaches this lookup.
        agent: false,
      },
      resolve
    );

    sent.on('timeout', () => sent.destroy(new Error('timed out')));
    sent.on('error', reject);
    sent.end();
  });
}
