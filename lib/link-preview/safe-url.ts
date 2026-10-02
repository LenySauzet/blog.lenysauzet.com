import { lookup } from 'dns/promises';

const PRIVATE_V4 =
  /^(0|10|127)\.|^169\.254\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\.|^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./;

const PRIVATE_V6 = /^(::1?$|::ffff:|f[cd]|fe80:)/i;

const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal)$/i;

const isPrivate = (address: string) =>
  address.includes(':') ? PRIVATE_V6.test(address) : PRIVATE_V4.test(address);

/** Returns the address the caller must then pin: handing the name on instead
    leaves the request free to be sent elsewhere, nothing obliging a hostile
    resolver to answer the second lookup the way it answered the first. */
export async function resolvePublicAddress(url: URL): Promise<string | undefined> {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
  if (PRIVATE_HOST.test(url.hostname)) return undefined;

  const literal = url.hostname.replace(/^\[|\]$/g, '');
  if (/^[\d.]+$|:/.test(literal)) return isPrivate(literal) ? undefined : literal;

  try {
    const addresses = await lookup(url.hostname, { all: true });
    if (!addresses.length || addresses.some(({ address }) => isPrivate(address))) {
      return undefined;
    }

    return addresses[0].address;
  } catch {
    return undefined;
  }
}
