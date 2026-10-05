import { describe, expect, it } from "vitest";

import { TOKENS, colourOf, toggled } from "./series";

const series = (key: string, color?: string) => ({ key, label: key, color });

describe("colourOf", () => {
  it("hands each series the chart token at its place", () => {
    expect(colourOf(series("a"), 0)).toBe(TOKENS[0]);
    expect(colourOf(series("b"), 2)).toBe(TOKENS[2]);
  });

  it("wraps past the last token rather than running out", () => {
    expect(colourOf(series("f"), TOKENS.length)).toBe(TOKENS[0]);
  });

  it("lets a series name its own colour, for when the colour is the subject", () => {
    expect(colourOf(series("green", "oklch(0.78 0.21 145)"), 0)).toBe(
      "oklch(0.78 0.21 145)",
    );
  });
});

describe("toggled", () => {
  it("hides a shown series and shows a hidden one", () => {
    expect([...toggled(new Set(), "a", 3)]).toEqual(["a"]);
    expect([...toggled(new Set(["a"]), "a", 3)]).toEqual([]);
  });

  it("refuses to hide the last visible series", () => {
    const hidden = new Set(["a", "b"]);
    expect(toggled(hidden, "c", 3)).toBe(hidden);
  });

  it("still hides the second of three", () => {
    expect([...toggled(new Set(["a"]), "b", 3)]).toEqual(["a", "b"]);
  });

  it("leaves the set it was handed alone", () => {
    const hidden = new Set(["a"]);
    toggled(hidden, "b", 3);
    expect([...hidden]).toEqual(["a"]);
  });
});
