import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { LandingScreen } from "./features/landing/LandingScreen";
import { LoginScreen } from "./features/auth/LoginScreen";
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
      <AuthProvider>
        <Suspense fallback={<ScreenFallback />}>
          <Routes>
            <Route path="/" element={<LandingScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route
              path="/warmup"
              element={
                <ProtectedRoute>
                  <WarmupScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/log"
              element={
                <ProtectedRoute>
                  <LogScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/library"
              element={
                <ProtectedRoute>
                  <LibraryScreen />
                </ProtectedRoute>
              }
            />
            {/* Gated since S3-1: reps persist now, so a session is required. */}
            <Route
              path="/practice/:slug"
              element={
                <ProtectedRoute>
                  <PracticeScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/practice/:slug/debrief"
              element={
                <ProtectedRoute>
                  <DebriefScreen />
                </ProtectedRoute>
              }
            />
            <Route path="/design-system" element={<DesignSystemScreen />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
