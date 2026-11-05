export interface Section {
  label: string;
  level: number;
  progress: number;
  /** Pixels into the column, before the rail's landing. */
  top: number;
}

export interface Tick {
  progress: number;
  section?: Section;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

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
