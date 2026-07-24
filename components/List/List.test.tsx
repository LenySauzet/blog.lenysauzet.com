import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { List, ListItem } from './List';

describe('List', () => {
  it('renders an unordered list as a real <ul>', () => {
    render(
      <List variant="unordered">
        <ListItem>First</ListItem>
      </List>
    );

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    expect(list).toHaveAttribute('data-list', 'unordered');
  });

  it('renders an ordered list as a real <ol>', () => {
    render(
      <List variant="ordered">
        <ListItem>First</ListItem>
      </List>
    );

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(list).toHaveAttribute('data-list', 'ordered');
  });

  it('keeps native list semantics: every item is a listitem', () => {
    render(
      <List variant="unordered">
        <ListItem>First</ListItem>
        <ListItem>Second</ListItem>
        <ListItem>Third</ListItem>
      </List>
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});

describe('ListItem', () => {
  it('renders its children', () => {
    render(
      <List variant="unordered">
        <ListItem>
          Read <a href="/x">the docs</a>
        </ListItem>
      </List>
    );

    const item = screen.getByRole('listitem');
    expect(item).toHaveTextContent('Read the docs');
    expect(within(item).getByRole('link', { name: 'the docs' })).toBeInTheDocument();
  });

  it('hides the decorative marker from assistive tech', () => {
    render(
      <List variant="unordered">
        <ListItem>First</ListItem>
      </List>
    );

    // The arrow is presentational, so the marker carries aria-hidden and the
    // item's accessible text is just its content.
    const item = screen.getByRole('listitem');
    const marker = item.querySelector('[data-list-marker]');
    expect(marker).toHaveAttribute('aria-hidden', 'true');
    expect(item).toHaveAccessibleName('');
    expect(item).toHaveTextContent('First');
  });

  it('gives ordered lists the counter hook its CSS targets', () => {
    // The number is a CSS counter jsdom can't render (see app/globals.css), so
    // assert the marker hook exists rather than the glyph.
    render(
      <List variant="ordered">
        <ListItem>First</ListItem>
      </List>
    );

    const marker = screen.getByRole('listitem').querySelector('[data-list-marker]');
    expect(marker).not.toBeNull();
  });

  it('nests a list inside an item without flattening it', () => {
    render(
      <List variant="unordered">
        <ListItem>
          Parent
          <List variant="ordered">
            <ListItem>Child</ListItem>
          </List>
        </ListItem>
      </List>
    );

    const lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(2);
    expect(lists.find((l) => l.tagName === 'OL')).toHaveAttribute(
      'data-list',
      'ordered'
    );
  });
});
