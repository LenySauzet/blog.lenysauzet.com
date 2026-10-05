import { describe, expect, it } from "vitest";

import { passDuration, walkDuration } from "./use-cascade";

describe("walkDuration", () => {
  it("is nothing to walk with one section or none", () => {
    expect(walkDuration(0)).toBe(0);
    expect(walkDuration(1)).toBe(0);
  });

  it("grows a beat per title while it has room", () => {
    expect(walkDuration(3)).toBeCloseTo(0.075);
    expect(walkDuration(5)).toBeCloseTo(0.15);
  });

  it("stops at the ceiling, however many sections arrive", () => {
    expect(walkDuration(13)).toBeCloseTo(0.22);
    expect(walkDuration(25)).toBeCloseTo(0.22);
    expect(walkDuration(100)).toBeCloseTo(0.22);
  });
});

describe("passDuration", () => {
  it("is the walk and the last title's own fade", () => {
    expect(passDuration(0)).toBeCloseTo(0.3);
    expect(passDuration(3)).toBeCloseTo(0.375);
    expect(passDuration(25)).toBeCloseTo(0.52);
  });
});
