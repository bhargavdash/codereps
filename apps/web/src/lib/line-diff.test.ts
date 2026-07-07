import { describe, expect, it } from "vitest";
import { diffLines } from "./line-diff";

describe("diffLines", () => {
  it("identical inputs have no changed lines", () => {
    const code = "a\nb\nc";
    expect(diffLines(code, code)).toEqual({ aChanged: [], bChanged: [] });
  });

  it("flags a modified line on both sides", () => {
    const result = diffLines("a\nX\nc", "a\nY\nc");
    expect(result.aChanged).toEqual([2]);
    expect(result.bChanged).toEqual([2]);
  });

  it("flags insertions only on the side that has them", () => {
    const result = diffLines("a\nc", "a\nb\nc");
    expect(result.aChanged).toEqual([]);
    expect(result.bChanged).toEqual([2]);
  });

  it("handles fully different documents", () => {
    const result = diffLines("x\ny", "p\nq\nr");
    expect(result.aChanged).toEqual([1, 2]);
    expect(result.bChanged).toEqual([1, 2, 3]);
  });
});
