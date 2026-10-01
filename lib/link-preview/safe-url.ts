import { lookup } from 'dns/promises';

const PRIVATE_V4 =
  /^(0|10|127)\.|^169\.254\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\.|^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./;

const PRIVATE_V6 = /^(::1?$|::ffff:|f[cd]|fe80:)/i;

const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal)$/i;

const isPrivate = (address: string) =>
  address.includes(':') ? PRIVATE_V6.test(address) : PRIVATE_V4.test(address);

/**
 * A preview route fetches whatever it is handed, which is a request forgery
 * primitive unless every address behind the name is checked, not just the name:
 * a public hostname is free to resolve to the metadata endpoint of whatever is
 * running this. The check runs again on each redirect for the same reason.
 */
export async function reachesTheOpenWeb(url: URL): Promise<boolean> {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  if (PRIVATE_HOST.test(url.hostname)) return false;

  const bare = url.hostname.replace(/^\[|\]$/g, '');
  if (/^[\d.]+$|:/.test(bare)) return !isPrivate(bare);

  try {
    const addresses = await lookup(url.hostname, { all: true });
    return addresses.length > 0 && addresses.every(({ address }) => !isPrivate(address));
  } catch {
    return false;
  }
}
