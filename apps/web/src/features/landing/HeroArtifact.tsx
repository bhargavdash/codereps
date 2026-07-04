/** A static miniature of the practice screen — the product as its own hero image. */
const K = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: "var(--color-syn-key)" }}>{children}</span>
);
const F = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: "var(--color-syn-fn)" }}>{children}</span>
);
const L = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: "var(--color-syn-lit)" }}>{children}</span>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: "var(--color-syn-punc)" }}>{children}</span>
);

export function HeroArtifact() {
  return (
    <div className="w-[560px] max-w-full shrink-0 overflow-hidden rounded-xl border border-border-2 bg-editor shadow-[0_40px_90px_-40px_oklch(0_0_0_/_0.8)]">
      {/* window bar */}
      <div className="flex h-[38px] items-center gap-2 border-b border-border bg-[oklch(0.13_0.004_250)] px-3.5">
        <span className="size-2.5 rounded-full bg-[oklch(0.3_0.01_250)]" />
        <span className="size-2.5 rounded-full bg-[oklch(0.3_0.01_250)]" />
        <span className="size-2.5 rounded-full bg-[oklch(0.3_0.01_250)]" />
        <span className="mono ml-2 text-[12px] text-muted">debounce.js</span>
        <span className="flex-1" />
        <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-border-2 px-[7px] py-0.5">
          <span className="size-[5px] rounded-full bg-muted" />
          <span className="mono text-[10px] text-muted">AI OFF</span>
        </span>
      </div>

      <div className="flex h-[344px]">
        {/* code */}
        <div className="flex min-w-0 flex-1">
          <div
            aria-hidden="true"
            className="mono w-10 shrink-0 bg-surface-2 pr-2 pt-3.5 text-right text-[12px] leading-[21px] text-faint"
          >
            {Array.from({ length: 11 }, (_, i) => (
              <div key={i} style={i === 7 ? { color: "var(--color-ink-mute)" } : undefined}>
                {i + 1}
              </div>
            ))}
          </div>
          <pre className="mono flex-1 whitespace-pre pt-3.5 pl-4 text-[12px] leading-[21px] text-ink">
            <div style={{ color: "var(--color-syn-com)" }}>// from memory</div>
            <div>
              <K>function</K> <F>debounce</F>
              <P>(</P>fn<P>,</P> wait<P>)</P> <P>{"{"}</P>
            </div>
            <div>
              {"  "}
              <K>let</K> t <P>=</P> <L>null</L>
              <P>;</P>
            </div>
            <div>
              {"  "}
              <K>return</K> <P>(</P>
              <P>...</P>args<P>)</P> <P>=&gt;</P> <P>{"{"}</P>
            </div>
            <div>
              {"    "}
              <F>clearTimeout</F>
              <P>(</P>t<P>);</P>
            </div>
            <div>
              {"    "}t <P>=</P> <F>setTimeout</F>
              <P>(</P>
              <P>()</P> <P>=&gt;</P> <P>{"{"}</P>
            </div>
            <div>
              {"      "}
              <F>fn</F>
              <P>(</P>
              <P>...</P>args<P>);</P>
            </div>
            <div className="-ml-4 bg-line pl-4">
              {"    "}
              <P>{"}"}</P>
              <P>,</P> wait<P>);</P>
              <span className="cr-blink ml-px inline-block h-[0.95em] w-0.5 translate-y-[1px] bg-primary align-text-bottom" />
            </div>
            <div>
              {"  "}
              <P>{"};"}</P>
            </div>
            <div>
              <P>{"}"}</P>
            </div>
          </pre>
        </div>

        {/* mini rail */}
        <div className="flex w-[176px] shrink-0 flex-col border-l border-border bg-surface p-4">
          <span className="mono text-[10px] tracking-[0.1em] text-muted-2">ELAPSED</span>
          <span className="mono text-[34px] font-medium leading-[1.2] text-ink">3:07</span>
          <span className="mono mt-0.5 text-[11.5px] text-muted">PAR 4:00</span>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-[oklch(0.2_0.006_250)]">
            <div className="h-full w-[78%] rounded-full bg-primary" />
          </div>
          <div className="flex-1" />
          <div className="mb-3 flex items-center justify-between">
            <span className="mono text-[10px] tracking-[0.08em] text-muted-2">FAULTS</span>
            <span className="mono text-[13px] text-muted">00</span>
          </div>
          <span className="flex items-center justify-center rounded-md bg-primary py-[9px] text-[13px] font-medium text-on-primary">
            Submit rep
          </span>
        </div>
      </div>
    </div>
  );
}
