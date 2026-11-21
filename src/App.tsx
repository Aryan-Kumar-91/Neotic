import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RedirectAuthenticatedUser } from "@/components/ProtectedRoute";

const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Collab = lazy(() => import("@/pages/Collab"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Reasoning = lazy(() => import("@/pages/Reasoning"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400">Loading Neotic...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<RedirectAuthenticatedUser />}>
            <Route path="/login" element={<Login />} />
          </Route>
          <Route path="/" element={<Home />} />
          <Route path="/collab/:roomId" element={<Collab />} />
          <Route path="/reasoning" element={<Reasoning />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
