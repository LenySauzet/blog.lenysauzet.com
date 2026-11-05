import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLift } from './Lift';

describe('useLift', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('opens a frame after the click, once the box it lifts from stands in place', () => {
    const root = document.createElement('div');
    const { result } = renderHook(() => useLift({ current: root }));

    act(() => result.current.open());
    expect(result.current.stage).toBe('closed');
    act(() => vi.advanceTimersToNextFrame());

    expect(result.current.stage).toBe('opening');
  });
});
