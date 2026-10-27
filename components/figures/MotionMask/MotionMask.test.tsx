import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import MotionMask from './MotionMask';

const engine = vi.hoisted(() => ({ feedback: undefined as string | undefined }));

vi.mock('@/lib/shader', async (original) => ({
  ...(await original<typeof import('@/lib/shader')>()),
  createShader: (_: HTMLElement, __: string, ___: unknown, feedback?: string) => {
    engine.feedback = feedback;
    return { sync: () => {}, dispose: () => {} };
  },
}));

describe('MotionMask', () => {
  it('stands as one image, named, under a threshold, a decay, a switch and a pause', () => {
    render(<MotionMask />);

    expect(
      screen.getByRole('img', { name: 'Clouds drifting, with what moves between frames traced in the accent colour' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('slider')).toHaveLength(2);
    expect(screen.getByRole('switch', { name: 'Video' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play|pause/i })).toBeInTheDocument();
  });

  it('reads back its own last frame', () => {
    render(<MotionMask />);

    expect(engine.feedback).toContain('uniform sampler2D uFeedback');
  });
});
