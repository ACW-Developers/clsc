import { Route, Routes } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/AuthPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import NotFoundPage from "@/pages/NotFoundPage";
import AdminPage from "@/pages/AdminPage";
import AdminSetupPage from "@/pages/AdminSetupPage";
import { paths } from "./paths";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path={paths.home} element={<HomePage />} />
        <Route path={paths.auth} element={<AuthPage />} />
        <Route path={paths.resetPassword} element={<ResetPasswordPage />} />
        <Route path={paths.admin} element={<AdminPage />} />
        <Route path={paths.adminSetup} element={<AdminSetupPage />} />
        {/* Module routes go here, above the catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
