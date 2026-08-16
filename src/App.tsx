import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Collab from "@/pages/Collab";
import Privacy from "@/pages/Privacy";
import Reasoning from "@/pages/Reasoning";
import { RedirectAuthenticatedUser } from "@/components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
