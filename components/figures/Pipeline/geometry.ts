import { FRAME_HEADER } from '@/components/figures/Diagram';
import { edge, rect } from '@/lib/rect';
import { vec2 } from '@/lib/vec2';

export const HEIGHT = 420;

const TOP = 40;
const PADDING = 16;
const ROW = 44;
const STEP = 32;
const GAP = 4;
const STAGES = ['Vertex shader', 'Rasterizer', 'Fragment shader', 'Frame buffer'];

const column = (left: number, width: number, names: readonly string[]) => {
  const frame = rect(
    vec2(left, TOP),
    width,
    FRAME_HEADER + names.length * ROW + (names.length - 1) * STEP + PADDING,
  );
  const boxes = names.map((name, index) => ({
    name,
    box: rect(
      vec2(left + PADDING, TOP + FRAME_HEADER + index * (ROW + STEP)),
      width - 2 * PADDING,
      ROW,
    ),
  }));

  return { frame, boxes };
};

const cpu = { title: 'CPU', ...column(52, 228, ['Vertex data']) };
const gpu = { title: 'GPU', ...column(324, 296, STAGES) };

export const FRAMES = [cpu, gpu];

export const ARROWS = [
  { from: edge(cpu.boxes[0].box, 'right', GAP), to: edge(gpu.boxes[0].box, 'left', GAP) },
  ...gpu.boxes.slice(1).map(({ box }, index) => ({
    from: edge(gpu.boxes[index].box, 'bottom', GAP),
    to: edge(box, 'top', GAP),
  })),
];
