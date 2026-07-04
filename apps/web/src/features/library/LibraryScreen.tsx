import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, Container } from "../../components/layout/AppShell";
import { Input } from "../../components/ui/Input";
import { RepDots } from "../../components/ui/RepDots";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Search } from "../../components/icons";
import { LIBRARY_ROWS, LIBRARY_TOTALS } from "../../data/app-data";
import { CATEGORY_LABEL } from "../../data/types";
import { fmtRecency } from "../../lib/format";

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

export function LibraryScreen() {
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LIBRARY_ROWS.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (level === "d12" && r.difficulty > 2) return false;
      if (level === "d3" && r.difficulty !== 3) return false;
      if (level === "d4" && r.difficulty < 4) return false;
      if (q && !r.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [category, level, query]);

  return (
    <AppShell>
      <Container size="wide" className="flex flex-col gap-5 py-7">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[27px] font-semibold tracking-[-0.015em]">Library</h1>
            <span className="text-[13.5px] text-muted">
              <span className="mono text-[oklch(0.8_0.005_250)]">{LIBRARY_TOTALS.challenges}</span> challenges ·{" "}
              <span className="mono text-[oklch(0.8_0.005_250)]">{LIBRARY_TOTALS.trained}</span> trained
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

          {rows.length === 0 ? (
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
