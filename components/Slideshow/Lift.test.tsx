import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ZOOM_TRANSITION } from '@/components/Lightbox';

import { useLift } from './Lift';

// jsdom runs no layout animation, so the stages are driven by hand: `settle` is what
// Motion's completion calls, and the timer what stands in when Motion drops it.
const ON_TIME = ZOOM_TRANSITION.duration * 1000 + 100;

describe('useLift', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const lift = () => {
    const root = document.createElement('div');
    return renderHook(() => useLift({ current: root }));
  };
  const opened = (hook: ReturnType<typeof lift>) => {
    act(() => hook.result.current.open());
    // The lift starts a frame later, once the box it lifts from stands in place.
    expect(hook.result.current.stage).toBe('closed');
    act(() => vi.advanceTimersToNextFrame());
  };

  it('opens a frame after the click, and lands when the morph completes', () => {
    const hook = lift();
    opened(hook);
    expect(hook.result.current.stage).toBe('opening');
    expect(hook.result.current.lifted).toBe(true);
    act(() => hook.result.current.settle());
    expect(hook.result.current.stage).toBe('open');
    // A stray completion once it rests changes nothing.
    act(() => hook.result.current.settle());
    expect(hook.result.current.stage).toBe('open');
  });

  it('ends each stage on time when Motion never completes it', () => {
    const hook = lift();
    opened(hook);
    act(() => vi.advanceTimersByTime(ON_TIME));
    expect(hook.result.current.stage).toBe('open');
    act(() => hook.result.current.close());
    act(() => vi.advanceTimersByTime(ON_TIME));
    expect(hook.result.current.stage).toBe('closed');
    expect(hook.result.current.lifted).toBe(false);
  });

  it('closes cleanly when dismissed mid-open, a late completion changing nothing', () => {
    const hook = lift();
    opened(hook);
    act(() => hook.result.current.close());
    act(() => hook.result.current.settle());
    expect(hook.result.current.stage).toBe('closed');
    act(() => hook.result.current.settle());
    act(() => vi.advanceTimersByTime(ON_TIME));
    expect(hook.result.current.stage).toBe('closed');
  });
});
