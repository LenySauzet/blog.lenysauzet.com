export interface Section {
  label: string;
  level: number;
  progress: number;
  /** Where the section sits in the column, before the rail's own landing. */
  top: number;
}

export interface Tick {
  progress: number;
  section?: Section;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Compares what the rail reads, `progress` included: a shorter viewport
    leaves every heading where it was and still lengthens the travel under it,
    so comparing the measurements alone would hold a stale place on the rail. */
export const sameSections = (a: Section[], b: Section[]) =>
  a.length === b.length &&
  a.every(
    (section, index) =>
      section.top === b[index].top &&
      section.label === b[index].label &&
      section.progress === b[index].progress
  );

export const tickAt = (count: number, progress: number) =>
  count < 2 ? 0 : Math.round(clamp(progress) * (count - 1));

/** Sections fall where they fall and the rail is a regular grid, so each takes
    the tick nearest it, or the next one down when that is spoken for: two
    headings a paragraph apart stay two marks. */
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
