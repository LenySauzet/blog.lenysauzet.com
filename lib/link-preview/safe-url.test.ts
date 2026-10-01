import { beforeEach, describe, expect, it, vi } from 'vitest';

const lookup = vi.hoisted(() => vi.fn());
vi.mock('dns/promises', () => ({ lookup, default: { lookup } }));

const { reachesTheOpenWeb } = await import('./safe-url');

const reaches = (href: string) => reachesTheOpenWeb(new URL(href));

beforeEach(() => vi.clearAllMocks());

const resolvesTo = (...addresses: string[]) =>
  lookup.mockResolvedValueOnce(addresses.map((address) => ({ address, family: 4 })));

describe('reachesTheOpenWeb', () => {
  it('allows a name that resolves to the open internet', async () => {
    resolvesTo('140.82.121.4');
    expect(await reaches('https://github.com/a')).toBe(true);
  });

  // The whole point: a public name is free to point anywhere.
  it('refuses a public name resolving to a private address', async () => {
    resolvesTo('169.254.169.254');
    expect(await reaches('https://totally-fine.example.com')).toBe(false);
  });

  it('refuses a name where any one address is private', async () => {
    resolvesTo('93.184.216.34', '10.0.0.5');
    expect(await reaches('https://example.com')).toBe(false);
  });

  it('refuses a name that resolves to nothing', async () => {
    lookup.mockRejectedValueOnce(new Error('ENOTFOUND'));
    expect(await reaches('https://nowhere.example')).toBe(false);
  });

  it.each([
    'http://localhost/a',
    'http://printer.local',
    'http://api.internal/v1',
    'http://127.0.0.1:3000',
    'http://10.1.2.3',
    'http://192.168.1.1',
    'http://172.20.0.1',
    'http://169.254.169.254/latest/meta-data',
    'http://100.100.100.200',
    'http://0.0.0.0',
    'http://[::1]:8080',
    'http://[fd00::1]',
  ])('refuses %s without asking a resolver', async (href) => {
    expect(await reaches(href)).toBe(false);
    expect(lookup).not.toHaveBeenCalled();
  });

  it('allows a public address written out in full', async () => {
    expect(await reaches('https://93.184.216.34')).toBe(true);
    expect(lookup).not.toHaveBeenCalled();
  });

  it.each(['file:///etc/passwd', 'ftp://example.com', 'gopher://example.com'])(
    'refuses the %s scheme',
    async (href) => {
      expect(await reaches(href)).toBe(false);
    }
  );
});
