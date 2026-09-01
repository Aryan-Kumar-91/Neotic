import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

const authDisabled = import.meta.env.VITE_DISABLE_AUTH === "true";

export default function ProtectedRoute() {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(!authDisabled && !auth.currentUser);

  useEffect(() => {
    if (authDisabled) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (authDisabled) return <Outlet />;
  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function RedirectAuthenticatedUser() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(!authDisabled && !auth.currentUser);

  useEffect(() => {
    if (authDisabled) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
