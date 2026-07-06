import { describe, expect, it } from "vitest";
import { compileForRun } from "./compile";

describe("compileForRun", () => {
  it("passes plain JavaScript through unchanged in behavior", () => {
    const result = compileForRun("function add(a, b) { return a + b; }", "javascript");
    expect(result.ok).toBe(true);
    if (result.ok) {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const add = new Function(`${result.code}; return add;`)() as (a: number, b: number) => number;
      expect(add(2, 3)).toBe(5);
    }
  });

  it("strips TypeScript annotations", () => {
    const result = compileForRun(
      "function twice(n: number): number { return n * 2; }",
      "typescript",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.code).not.toContain(": number");
      const twice = new Function(`${result.code}; return twice;`)() as (n: number) => number;
      expect(twice(21)).toBe(42);
    }
  });

  it("compiles TSX to classic createElement calls", () => {
    const result = compileForRun(
      "const El = ({ n }: { n: number }) => <div>{n}</div>;",
      "tsx",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.code).toContain("React.createElement");
      expect(result.code).not.toContain("<div>");
    }
  });

  it("reports a syntax error with its line number", () => {
    const result = compileForRun("function broken( {\n  return 1;\n}", "javascript");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.line).toBeGreaterThanOrEqual(1);
      expect(result.message).toMatch(/^Line \d+:/);
    }
  });

  it("leaves CSS untouched", () => {
    const css = ".grid { display: grid; }";
    expect(compileForRun(css, "css")).toEqual({ ok: true, code: css });
  });
});
