import { describe, expect, it } from 'vitest';

import { frameTitle } from '@/components/figures/Diagram';
import { centre } from '@/lib/rect';
import { bounds, clearOfFade, inside, overlap, SIZES, titleBox } from '@/test/figure';

import { ARROWS, FRAMES, HEIGHT } from './geometry';

const PADDING = 8;

const boxes = FRAMES.flatMap(({ boxes }) => boxes);

describe('the pipeline', () => {
  it('stays clear of the faded edges', () => {
    for (const { title, frame } of FRAMES) expect(clearOfFade(bounds(title, frame), HEIGHT)).toBe(true);
  });

  it('keeps every stage inside its frame and apart from the others', () => {
    for (const { title, frame, boxes } of FRAMES)
      for (const { name, box } of boxes) expect(inside(bounds(title, frame), bounds(name, box)), name).toBe(true);

    for (const [i, a] of boxes.entries())
      for (const b of boxes.slice(i + 1)) expect(overlap(bounds(a.name, a.box), bounds(b.name, b.box))).toBe(false);
  });

  it('fits every name inside its box, with room to spare, at every type size', () => {
    for (const size of SIZES)
      for (const { name, box } of boxes) {
        const { left, right, top, bottom } = bounds(name, box);
        const room = { name, left: left + PADDING, right: right - PADDING, top, bottom };

        expect(inside(room, titleBox(name, centre(box), size)), `${name} in ${size}`).toBe(true);
      }
  });

  it('heads every frame with its title, above whatever it holds', () => {
    for (const size of SIZES)
      for (const { title, frame, boxes } of FRAMES) {
        const name = titleBox(title, frameTitle(frame), size);

        expect(inside(bounds(title, frame), name), `${title} in ${size}`).toBe(true);
        for (const { box } of boxes) expect(name.bottom).toBeLessThan(box.corner.y);
      }
  });

  it('runs every arrow between two stages without entering either', () => {
    for (const { from, to } of ARROWS) {
      const run = Math.hypot(to.x - from.x, to.y - from.y);
      expect(run).toBeGreaterThan(16);

      for (const { name, box } of boxes) {
        const area = bounds(name, box);
        for (const end of [from, to])
          expect(end.x > area.left && end.x < area.right && end.y > area.top && end.y < area.bottom).toBe(false);
      }
    }
  });
});
