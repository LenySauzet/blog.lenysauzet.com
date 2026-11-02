import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useZoomStage } from './use-zoom-stage';
import { ZOOM_TRANSITION } from './zoom';

// jsdom runs no layout animation, so the stages are driven by hand: `settle` is what
// Motion's completion calls, and the timer what stands in when Motion drops it.
const ON_TIME = ZOOM_TRANSITION.duration * 1000 + 100;

describe('useZoomStage', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('lands when the morph completes', () => {
    const { result } = renderHook(() => useZoomStage());
    act(() => result.current.open());
    expect(result.current.stage).toBe('opening');
    expect(result.current.lifted).toBe(true);
    act(() => result.current.settle());
    expect(result.current.stage).toBe('open');
    // A stray completion once it rests changes nothing.
    act(() => result.current.settle());
    expect(result.current.stage).toBe('open');
  });

  it('ends each stage on time when Motion never completes it', () => {
    const { result } = renderHook(() => useZoomStage());
    act(() => result.current.open());
    act(() => vi.advanceTimersByTime(ON_TIME));
    expect(result.current.stage).toBe('open');
    act(() => result.current.close());
    act(() => vi.advanceTimersByTime(ON_TIME));
    expect(result.current.stage).toBe('closed');
    expect(result.current.lifted).toBe(false);
  });

  it('closes cleanly when dismissed mid-open, a late completion changing nothing', () => {
    const { result } = renderHook(() => useZoomStage());
    act(() => result.current.open());
    act(() => result.current.close());
    act(() => result.current.settle());
    expect(result.current.stage).toBe('closed');
    act(() => result.current.settle());
    act(() => vi.advanceTimersByTime(ON_TIME));
    expect(result.current.stage).toBe('closed');
  });
});
