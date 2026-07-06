import { useEffect, useState } from "react";
import type { ChallengeDetail, ChallengeDetailResponse } from "@codereps/shared";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { getChallenge } from "../../data/challenges";
import type { Challenge } from "../../data/types";

/**
 * Loads a challenge for the practice screen. The API detail (real starter +
 * runnable tests) is canonical when it exists; the mock catalog remains the
 * fallback for design-era slugs that aren't authored yet. Fixes the S1-6
 * gap where library links to seeded slugs hit NotFound.
 */
export interface LoadedChallenge {
  /** Display shape the practice panels render. null after loading = genuinely unknown slug. */
  display: Challenge | null;
  /** Present only for real (seeded) challenges — powers the runner. */
  runnable: ChallengeDetail | null;
  loading: boolean;
}

/** Derive the prompt-panel fields from promptMd (paragraph / "- " bullets / "Behaves like:"). */
export function parsePromptMd(md: string): {
  prompt: string;
  requirements: string[];
  behavesLike: string;
} {
  const lines = md.split("\n");
  const requirements: string[] = [];
  const paragraphs: string[] = [];
  let behavesLike = "";

  let current: string[] = [];
  const flush = (): void => {
    if (current.length === 0) return;
    const text = current.join(" ").trim();
    current = [];
    if (/^behaves like:/i.test(text)) {
      behavesLike = text.replace(/^behaves like:\s*/i, "");
    } else if (text) {
      paragraphs.push(text);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      flush();
      requirements.push(trimmed.slice(2));
    } else if (trimmed === "") {
      flush();
    } else {
      current.push(trimmed);
    }
  }
  flush();

  return { prompt: paragraphs.join(" "), requirements, behavesLike };
}

const EXT: Record<ChallengeDetail["language"], string> = {
  javascript: "js",
  typescript: "ts",
  tsx: "tsx",
  css: "css",
};

function titleCaseTag(tag: string): string {
  return tag
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function detailToDisplay(detail: ChallengeDetail): Challenge {
  const { prompt, requirements, behavesLike } = parsePromptMd(detail.promptMd);
  const topicTag = detail.tags.find((t) => t !== "par-unverified") ?? detail.category;
  return {
    slug: detail.slug,
    title: detail.title,
    category: detail.category,
    topic: titleCaseTag(topicTag),
    difficulty: detail.difficulty,
    language: detail.language,
    fileName: `${detail.slug}.${EXT[detail.language]}`,
    parSeconds: detail.parSeconds,
    prompt,
    requirements,
    behavesLike,
    starterCode: detail.starterCode,
    solutionCode: "", // never present pre-submit (will-bite #2)
    yourCode: "",
    tests: [], // display-era field; real results come from the runner
  };
}

export function useChallenge(slug: string | undefined): LoadedChallenge {
  const { session, loading: authLoading } = useAuth();
  const [detail, setDetail] = useState<ChallengeDetail | null>(null);
  const [fetching, setFetching] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    setDetail(null);
    setSettled(false);
    if (!slug || authLoading) return;
    if (!session) {
      setSettled(true); // anonymous practice: mock catalog only
      return;
    }
    let cancelled = false;
    setFetching(true);
    api<ChallengeDetailResponse>(`/api/v1/challenges/${slug}`)
      .then((res) => {
        if (!cancelled) setDetail(res.challenge);
      })
      .catch(() => {
        /* unknown slug or API down — fall back to the mock catalog */
      })
      .finally(() => {
        if (!cancelled) {
          setFetching(false);
          setSettled(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug, session, authLoading]);

  const mock = getChallenge(slug) ?? null;
  return {
    display: detail ? detailToDisplay(detail) : mock,
    runnable: detail,
    loading: (authLoading || fetching || !settled) && !mock,
  };
}
