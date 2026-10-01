import { describe, expect, it } from 'vitest';

import { readMetadata } from './metadata';

const read = (head: string, base = 'https://example.com/a/b') =>
  readMetadata(`<html><head>${head}</head><body>ignored</body></html>`, base);

describe('readMetadata', () => {
  it('reads what a page says about itself', () => {
    const meta = read(`
      <meta property="og:title" content="Akimbot | Teaser">
      <meta property="og:description" content="A teaser.">
      <meta property="og:image" content="https://img.example.com/a.jpg">
      <meta property="og:site_name" content="YouTube">
    `);

    expect(meta).toEqual({
      title: 'Akimbot | Teaser',
      description: 'A teaser.',
      image: 'https://img.example.com/a.jpg',
      site: 'YouTube',
    });
  });

  it('falls back to twitter tags, then to the document title', () => {
    expect(read('<meta name="twitter:title" content="From Twitter">').title).toBe(
      'From Twitter'
    );
    expect(read('<title>From the title</title>').title).toBe('From the title');
  });

  // Relative on more sites than you would expect, and a bare path is useless to
  // a browser sitting on our own origin.
  it('resolves a relative image against the page it came from', () => {
    expect(read('<meta property="og:image" content="/cover.png">').image).toBe(
      'https://example.com/cover.png'
    );
  });

  it('drops an image it cannot make an address of', () => {
    expect(read('<meta property="og:image" content="  ">').image).toBeUndefined();
  });

  it('turns entities back into text', () => {
    expect(read('<meta property="og:title" content="Rock &amp; Roll &#39;72">').title).toBe(
      "Rock & Roll '72"
    );
  });

  it('reads single quotes and unquoted attributes', () => {
    expect(read("<meta property='og:title' content='Quoted'>").title).toBe('Quoted');
    expect(read('<meta property=og:title content=Bare>').title).toBe('Bare');
  });

  // Two of the same tag is common, and the first is the one the page meant.
  it('keeps the first of a repeated tag', () => {
    expect(
      read(`
        <meta property="og:title" content="First">
        <meta property="og:title" content="Second">
      `).title
    ).toBe('First');
  });

  it('collapses the whitespace a wrapped attribute carries', () => {
    expect(read('<meta property="og:description" content="one\n  two">').description).toBe(
      'one two'
    );
  });

  it('says nothing about a page that says nothing', () => {
    expect(read('')).toEqual({
      title: undefined,
      description: undefined,
      image: undefined,
      site: undefined,
    });
  });
});
