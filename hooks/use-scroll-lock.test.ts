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

  it('gives back the width of a classic scrollbar, and takes it away again', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 1265, configurable: true });
    const lock = renderHook(() => useScrollLock(true));
    expect(body.style.paddingRight).toBe('15px');
    expect(body.style.getPropertyValue('--removed-body-scroll-bar-size')).toBe('15px');

    lock.unmount();
    expect(body.style.paddingRight).toBe('');
    expect(body.style.getPropertyValue('--removed-body-scroll-bar-size')).toBe('');
    Reflect.deleteProperty(window, 'innerWidth');
    Reflect.deleteProperty(document.documentElement, 'clientWidth');
  });

  // Under Radix's lock the scrollbar is already gone: writing 0 would override its measure.
  it('writes nothing when there is no scrollbar to give back', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 1280, configurable: true });
    const lock = renderHook(() => useScrollLock(true));

    expect(body.style.paddingRight).toBe('');
    expect(body.style.getPropertyValue('--removed-body-scroll-bar-size')).toBe('');
    lock.unmount();
    Reflect.deleteProperty(window, 'innerWidth');
    Reflect.deleteProperty(document.documentElement, 'clientWidth');
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
