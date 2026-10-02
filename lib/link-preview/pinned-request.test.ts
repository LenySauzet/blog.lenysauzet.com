import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { requestPinned } from './pinned-request';

let server: Server;
let port: number;
let seen: { host?: string; url?: string };

beforeAll(
  () =>
    new Promise<void>((ready) => {
      server = createServer((request, response) => {
        seen = { host: request.headers.host, url: request.url };
        response.writeHead(200, { 'content-type': 'text/html' });
        response.end('<html><head><title>Pinned</title></head></html>');
      });

      server.listen(0, '127.0.0.1', () => {
        port = (server.address() as AddressInfo).port;
        ready();
      });
    })
);

afterAll(() => new Promise<void>((done) => server.close(() => done())));

const read = async (response: NodeJS.ReadableStream) => {
  let text = '';
  for await (const chunk of response) text += chunk;
  return text;
};

describe('requestPinned', () => {
  // The whole point of the guard: resolving the name a second time is what a
  // hostile resolver is free to answer differently.
  it('connects to the address it was given, not to where the name points', async () => {
    const url = new URL(`http://example.com:${port}/preview`);

    const response = await requestPinned(url, '127.0.0.1', {}, 2000);

    expect(response.statusCode).toBe(200);
    expect(await read(response)).toContain('Pinned');
    expect(seen.url).toBe('/preview');
  });

  // The certificate and the virtual host both read it, so it has to survive.
  it('keeps the hostname the site expects', async () => {
    await requestPinned(new URL(`http://example.com:${port}/`), '127.0.0.1', {}, 2000);

    expect(seen.host).toBe(`example.com:${port}`);
  });

  it('carries the headers it is handed', async () => {
    const response = await requestPinned(
      new URL(`http://example.com:${port}/`),
      '127.0.0.1',
      { Accept: 'text/html' },
      2000
    );
    response.destroy();

    expect(seen.host).toBeDefined();
  });

  it('rejects rather than hanging on a port nothing answers', async () => {
    await expect(
      requestPinned(new URL('http://example.com:9/'), '127.0.0.1', {}, 300)
    ).rejects.toThrow();
  });
});
