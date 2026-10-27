import Figure from '@/components/Figure';
import Diagram, { Arrow, Box, Frame } from '@/components/figures/Diagram';

import { ARROWS, FRAMES, HEIGHT } from './geometry';

export interface PipelineProps {
  className?: string;
}

export default function Pipeline({ className }: PipelineProps) {
  return (
    <Figure
      className={className}
      caption="The road from a mesh to the screen. The CPU hands its vertices over once, and every stage after that runs on the GPU: a vertex shader places each point, the rasterizer turns the triangles into fragments, and a fragment shader colours each one into the frame buffer.">
      <Diagram height={HEIGHT} title="The graphics pipeline, from the CPU to the frame buffer">
        {FRAMES.map(({ title, frame, boxes }) => (
          <g key={title}>
            <Frame box={frame} title={title} />
            {boxes.map(({ name, box }) => (
              <Box key={name} box={box}>
                {name}
              </Box>
            ))}
          </g>
        ))}
        {ARROWS.map(({ from, to }, index) => (
          <Arrow key={index} from={from} to={to} tone="ink" width={1.5} />
        ))}
      </Diagram>
    </Figure>
  );
}
