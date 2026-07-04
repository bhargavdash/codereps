import { Link } from "react-router-dom";
import { buttonClasses } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";

/** Empty state that teaches the way back, not a dead "nothing here". */
export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-8 text-center">
      <Logo size={26} textSize={22} />
      <div className="flex flex-col gap-2">
        <h1 className="text-[23px] font-semibold tracking-[-0.01em]">No rep at this address</h1>
        <p className="max-w-[42ch] text-[14.5px] leading-relaxed text-muted">
          That challenge isn't in your library. Pick one that is and get a rep in.
        </p>
      </div>
      <Link to="/library" className={buttonClasses("primary", "md")}>
        Browse the library
      </Link>
    </div>
  );
}
