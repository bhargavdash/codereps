import type { Category } from "@codereps/shared";

export type { Category };

/** Display labels for the domain categories (schema uses `dsa`, UI says "Algorithms"). */
export const CATEGORY_LABEL: Record<Category, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  react: "React",
  css: "CSS Layout",
  dsa: "Algorithms",
};

export interface TestCase {
  name: string;
  ms: number;
  passed: boolean;
}

export interface Challenge {
  slug: string;
  title: string;
  category: Category;
  /** secondary tag shown next to category, e.g. "Timing" */
  topic: string;
  difficulty: number; // 1–5
  language: "javascript" | "typescript" | "tsx" | "css";
  fileName: string;
  parSeconds: number;
  /** the challenge described in words — never shows code */
  prompt: string;
  /** inline code marked with backticks, rendered mono */
  requirements: string[];
  behavesLike: string;
  starterCode: string;
  solutionCode: string;
  /** a plausible "your rep" for the debrief diff */
  yourCode: string;
  tests: TestCase[];
}

export type Readiness = "sharp" | "ready" | "needs-work" | "untrained";

export interface ReadinessRow {
  label: string;
  readiness: Readiness;
  evidence: string;
  fluency: number | null;
  /** sparkline points, 7 values 0..1 (1 = high fluency) — direction reads as trend */
  trend: number[];
  rising: boolean;
}

export interface LibraryRow {
  slug: string;
  title: string;
  category: Category;
  difficulty: number;
  best: number | null;
  daysAgo: number | null;
  reps: number;
}

export interface WarmupRep {
  n: number;
  kind: "review" | "weak-spot" | "new";
  slug: string;
  title: string;
  subtitle: string;
  parSeconds: number;
  state: "done" | "now" | "todo";
}
