import { Link } from "react-router-dom";
import { buttonClasses } from "../../components/ui/Button";
import { Logo, LogoMark } from "../../components/ui/Logo";
import { Play } from "../../components/icons";
import { HeroArtifact } from "./HeroArtifact";

function Dot() {
  return <span className="size-[3px] rounded-full bg-faint" />;
}

const triad = [
  {
    label: "THE REP",
    labelColor: "var(--color-muted-2)",
    body: "Implement a debounce, a generic type, a component from a description — from memory, in a real editor. 15 to 45 minutes, then close it.",
  },
  {
    label: "THE CLOCK",
    labelColor: "var(--color-muted-2)",
    body: "Every rep runs against a par time and a hidden test suite. You get a split, a verdict, and the standard solution side by side.",
  },
  {
    label: "THE DECAY",
    labelColor: "var(--color-accent)",
    body: "Fluency is a number that falls when you stop. Streaks, a year of reps, and honest per-category readiness keep you accountable.",
  },
];

export function LandingScreen() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="mx-auto flex h-[68px] max-w-[1320px] items-center justify-between border-b border-hair px-10">
        <Link to="/" className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-bg">
          <Logo size={22} textSize={17} />
        </Link>
        <div className="flex items-center gap-2.5">
          <Link to="/login" className={buttonClasses("ghost", "md", "bg", "text-[oklch(0.75_0.01_250)] hover:text-ink")}>
            Sign in
          </Link>
          <Link to="/login" className={buttonClasses("primary", "md")}>
            Start training
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] px-10">
        {/* HERO */}
        <section className="flex flex-col items-center gap-16 py-[84px] lg:flex-row">
          <div className="flex max-w-[620px] flex-1 flex-col gap-[30px]">
            <h1
              className="text-[clamp(2.75rem,5vw,3.75rem)] font-semibold leading-[1.04] tracking-[-0.03em]"
              style={{ textWrap: "balance" }}
            >
              AI writes your code. Can you still write it yourself?
            </h1>
            <p className="max-w-[520px] text-[18px] leading-[1.55] text-muted">
              Understanding survives. Execution atrophies. CodeReps is where you keep the muscle —
              short, timed reps from memory. No autocomplete, no AI, no paste. Scored against par,
              tracked as it decays.
            </p>
            <div className="mt-1 flex items-center gap-3.5">
              <Link to="/login" className={buttonClasses("primary", "lg", "bg", "gap-2.5")}>
                <Play size={15} />
                Start a rep
              </Link>
              <a
                href="#method"
                className={buttonClasses("secondary", "lg", "bg", "bg-[oklch(0.16_0.005_250)]")}
              >
                See the method
              </a>
            </div>
            <div className="mt-1.5 flex items-center gap-[18px]">
              <span className="mono text-[12.5px] text-muted-2">no autocomplete</span>
              <Dot />
              <span className="mono text-[12.5px] text-muted-2">no AI</span>
              <Dot />
              <span className="mono text-[12.5px] text-muted-2">no paste</span>
            </div>
          </div>

          <HeroArtifact />
        </section>

        {/* THESIS */}
        <section id="method" className="scroll-mt-6 border-t border-border pb-16 pt-12">
          <p
            className="max-w-[1000px] text-[clamp(1.75rem,3.4vw,2.375rem)] font-medium leading-[1.22] tracking-[-0.015em]"
            style={{ textWrap: "balance" }}
          >
            <span className="text-muted">LeetCode tests whether you can</span>{" "}
            <span className="text-ink">solve it.</span>{" "}
            <span className="text-muted">CodeReps tests whether you can still</span>{" "}
            <span style={{ color: "var(--color-primary-mid)" }}>execute</span>{" "}
            <span className="text-muted">what you already understand.</span>
          </p>

          <div className="mt-10 flex flex-col gap-8 md:flex-row md:gap-12">
            {triad.map((t) => (
              <div key={t.label} className="flex flex-1 flex-col gap-2.5 border-t border-border pt-5">
                <span className="mono text-[12px] tracking-[0.08em]" style={{ color: t.labelColor }}>
                  {t.label}
                </span>
                <p className="text-[15.5px] leading-[1.55] text-muted">{t.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t border-hair">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-10 py-7">
          <div className="flex items-center gap-2.5">
            <LogoMark size={16} muted />
            <span className="mono text-[12.5px] text-muted-2">CodeReps · train your fluency</span>
          </div>
          <Link to="/login" className="text-[13px] text-muted-2 transition-colors hover:text-ink">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
