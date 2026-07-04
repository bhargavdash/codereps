import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingScreen } from "./features/landing/LandingScreen";
import { WarmupScreen } from "./features/warmup/WarmupScreen";
import { LogScreen } from "./features/log/LogScreen";
import { LibraryScreen } from "./features/library/LibraryScreen";
import { NotFound } from "./features/misc/NotFound";

// CodeMirror is heavy; the editor surfaces load it on demand so the landing stays lean.
const PracticeScreen = lazy(() =>
  import("./features/practice/PracticeScreen").then((m) => ({ default: m.PracticeScreen })),
);
const DebriefScreen = lazy(() =>
  import("./features/results/DebriefScreen").then((m) => ({ default: m.DebriefScreen })),
);
const DesignSystemScreen = lazy(() =>
  import("./features/design-system/DesignSystemScreen").then((m) => ({ default: m.DesignSystemScreen })),
);

function ScreenFallback() {
  return <div className="min-h-screen bg-bg" aria-busy="true" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<ScreenFallback />}>
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/warmup" element={<WarmupScreen />} />
          <Route path="/practice/:slug" element={<PracticeScreen />} />
          <Route path="/practice/:slug/debrief" element={<DebriefScreen />} />
          <Route path="/log" element={<LogScreen />} />
          <Route path="/library" element={<LibraryScreen />} />
          <Route path="/design-system" element={<DesignSystemScreen />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
