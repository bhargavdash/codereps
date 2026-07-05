import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, Container } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { RepDots } from "../../components/ui/RepDots";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Skeleton } from "../../components/ui/Skeleton";
import { Search } from "../../components/icons";
import { CATEGORY_LABEL } from "../../data/types";
import { fmtRecency } from "../../lib/format";
import { useLibraryRows } from "./useLibraryRows";

const categoryFilters = [
  { value: "all", label: "All" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "react", label: "React" },
  { value: "css", label: "CSS" },
  { value: "dsa", label: "Algorithms" },
];
const levelFilters = [
  { value: "all", label: "All levels" },
  { value: "d12", label: "D1–2" },
  { value: "d3", label: "D3" },
  { value: "d4", label: "D4+" },
];

function statusDot(best: number | null, reps: number) {
  if (reps === 0 || best === null)
    return <span className="size-2 shrink-0 rounded-full border-[1.5px] border-faint" />;
  const color = best >= 70 ? "var(--color-pass)" : "var(--color-timeout)";
  return <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />;
}

function HeadCell({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span className={"mono text-[10.5px] tracking-[0.08em] text-muted-2 " + (className ?? "")}>
      {children}
    </span>
  );
}

/** Column-shaped skeleton rows so the table doesn't jump when data lands. */
function SkeletonRows() {
  return (
    <div aria-hidden="true">
      {[86, 62, 74, 58, 70, 66].map((titleWidth, i) => (
        <div
          key={i}
          className="flex items-center gap-5 px-5 py-[15px] [&:not(:last-child)]:border-b [&:not(:last-child)]:border-hair"
        >
          <span className="w-2 shrink-0" />
          <span className="flex-1">
            <Skeleton width={`${titleWidth * 2.4}px`} />
          </span>
          <span className="w-[130px]">
            <Skeleton width={72} />
          </span>
          <span className="w-[92px]">
            <Skeleton width={52} height={7} />
          </span>
          <span className="flex w-14 justify-end">
            <Skeleton width={20} />
          </span>
          <span className="flex w-[92px] justify-end">
            <Skeleton width={40} />
          </span>
          <span className="flex w-11 justify-end">
            <Skeleton width={16} />
          </span>
        </div>
      ))}
    </div>
  );
}

export function LibraryScreen() {
  const { state, retry } = useLibraryRows();
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [query, setQuery] = useState("");

  const allRows = state.status === "ready" ? state.rows : [];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (level === "d12" && r.difficulty > 2) return false;
      if (level === "d3" && r.difficulty !== 3) return false;
      if (level === "d4" && r.difficulty < 4) return false;
      if (q && !r.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allRows, category, level, query]);

  const trained = allRows.filter((r) => r.reps > 0).length;

  return (
    <AppShell>
      <Container size="wide" className="flex flex-col gap-5 py-7">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[27px] font-semibold tracking-[-0.015em]">Library</h1>
            <span className="text-[13.5px] text-muted" aria-live="polite">
              {state.status === "ready" ? (
                <>
                  <span className="mono text-[oklch(0.8_0.005_250)]">{allRows.length}</span> challenges ·{" "}
                  <span className="mono text-[oklch(0.8_0.005_250)]">{trained}</span> trained
                </>
              ) : (
                <span className="text-muted-2">loading the logbook…</span>
              )}
            </span>
          </div>
          <div className="w-[260px]">
            <Input
              icon={<Search size={15} />}
              placeholder="Search challenges"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search challenges"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <SegmentedControl
            aria-label="Filter by category"
            options={categoryFilters}
            value={category}
            onChange={setCategory}
          />
          <SegmentedControl
            aria-label="Filter by level"
            options={levelFilters}
            value={level}
            onChange={setLevel}
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-[10px] border border-border">
          <div className="flex items-center gap-5 border-b border-border bg-surface-2 px-5 py-[11px]">
            <span className="w-2 shrink-0" />
            <HeadCell className="flex-1">CHALLENGE</HeadCell>
            <HeadCell className="w-[130px]">CATEGORY</HeadCell>
            <HeadCell className="w-[92px]">LEVEL</HeadCell>
            <HeadCell className="w-14 text-right">BEST</HeadCell>
            <HeadCell className="w-[92px] text-right">TRAINED</HeadCell>
            <HeadCell className="w-11 text-right">REPS</HeadCell>
          </div>

          {state.status === "loading" ? (
            <SkeletonRows />
          ) : state.status === "error" ? (
            <div className="flex flex-col items-center gap-3 px-5 py-16 text-center" role="alert">
              <div className="flex flex-col gap-1.5">
                <span className="text-[15px] font-medium text-ink">Couldn't load the library</span>
                <span className="text-[13px] text-muted">{state.message}</span>
              </div>
              <Button variant="secondary" size="sm" offset="bg" onClick={retry}>
                Try again
              </Button>
            </div>
          ) : allRows.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-5 py-16 text-center">
              <span className="text-[15px] font-medium text-ink">The logbook is empty</span>
              <span className="text-[13px] text-muted">
                Challenges appear here as they're published. Check back soon.
              </span>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-5 py-16 text-center">
              <span className="text-[15px] font-medium text-ink">Nothing matches those filters</span>
              <span className="text-[13px] text-muted">Clear a filter, or search a different name.</span>
            </div>
          ) : (
            rows.map((r) => (
              <Link
                key={r.slug}
                to={`/practice/${r.slug}`}
                className="flex items-center gap-5 px-5 py-[13px] transition-colors [&:not(:last-child)]:border-b [&:not(:last-child)]:border-hair hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              >
                {statusDot(r.best, r.reps)}
                <span
                  className="flex-1 text-[14.5px] font-medium"
                  style={{ color: r.reps === 0 ? "var(--color-ink-dim)" : "var(--color-ink)" }}
                >
                  {r.title}
                </span>
                <span className="w-[130px] text-[13px] text-muted">{CATEGORY_LABEL[r.category]}</span>
                <span className="w-[92px]">
                  <RepDots level={r.difficulty} size={7} />
                </span>
                <span
                  className="mono w-14 text-right text-[14px]"
                  style={{
                    color:
                      r.best === null
                        ? "var(--color-faint)"
                        : r.best < 70
                          ? "var(--color-accent)"
                          : "var(--color-ink)",
                  }}
                >
                  {r.best ?? "—"}
                </span>
                <span
                  className="mono w-[92px] text-right text-[12.5px]"
                  style={{
                    color:
                      r.daysAgo === 0
                        ? "var(--color-pass)"
                        : r.daysAgo === null
                          ? "var(--color-faint)"
                          : "var(--color-muted)",
                  }}
                >
                  {fmtRecency(r.daysAgo)}
                </span>
                <span className="mono w-11 text-right text-[13px] text-muted">{r.reps}</span>
              </Link>
            ))
          )}
        </div>
      </Container>
    </AppShell>
  );
}
