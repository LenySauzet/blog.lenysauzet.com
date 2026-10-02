export interface Section {
  label: string;
  /** The heading level, which the length of its tick reports. */
  level: number;
  progress: number;
  /** Where the column must be for this section to sit at the top. */
  top: number;
}

export interface Tick {
  progress: number;
  section?: Section;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export const tickAt = (count: number, progress: number) =>
  count < 2 ? 0 : Math.round(clamp(progress) * (count - 1));

/**
 * Sections fall where they fall; the rail is a regular grid. Each one takes the
 * tick nearest it, and the next one down when that is already spoken for, so two
 * headings a paragraph apart stay two marks rather than becoming one.
 */
export function layOutTicks(count: number, sections: Section[]): Tick[] {
  const ticks: Tick[] = Array.from({ length: Math.max(0, count) }, (_, index) => ({
    progress: count < 2 ? 0 : index / (count - 1),
  }));

  for (const section of [...sections].sort((a, b) => a.progress - b.progress)) {
    let index = tickAt(count, section.progress);
    while (index < ticks.length && ticks[index].section) index += 1;

    if (index < ticks.length) ticks[index].section = section;
  }

  return ticks;
}
