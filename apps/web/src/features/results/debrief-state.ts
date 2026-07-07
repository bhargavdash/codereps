import type { Category, ClientCaseResult, Language, SubmitResponse } from "@codereps/shared";

/**
 * Router state handed from PracticeScreen to DebriefScreen after
 * submit/abandon (S3-3 → S3-4). A refresh loses it by design for now —
 * the debrief redirects back to the practice screen.
 */
export interface DebriefState {
  submit: SubmitResponse;
  yourCode: string;
  cases: ClientCaseResult[];
  faults: number;
  display: {
    slug: string;
    title: string;
    category: Category;
    topic: string;
    difficulty: number;
    parSeconds: number;
    language: Language;
  };
}
