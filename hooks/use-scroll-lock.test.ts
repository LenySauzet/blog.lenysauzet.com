import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useScrollLock } from './use-scroll-lock';

const body = document.body;

afterEach(() => body.removeAttribute('style'));

describe('useScrollLock', () => {
  it('holds the page still while locked and gives back what it found', () => {
    body.style.paddingRight = '3px';
    const lock = renderHook(({ locked }) => useScrollLock(locked), { initialProps: { locked: true } });
    expect(body.style.overflow).toBe('hidden');

    lock.rerender({ locked: false });
    expect(body.style.overflow).toBe('');
    expect(body.style.paddingRight).toBe('3px');
  });

  it('stays locked until the last of two overlapping locks lets go', () => {
    const first = renderHook(() => useScrollLock(true));
    const second = renderHook(() => useScrollLock(true));

    first.unmount();
    expect(body.style.overflow).toBe('hidden');

    second.unmount();
    expect(body.style.overflow).toBe('');
  });
});
