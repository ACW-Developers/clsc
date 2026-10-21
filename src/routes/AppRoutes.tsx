import { Route, Routes } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/AuthPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import SetupAdminPage from "@/pages/SetupAdminPage";
import ComingSoonPage from "@/pages/ComingSoonPage";
import AccountPage from "@/pages/hospitality/AccountPage";
import AdminPage from "@/pages/admin/AdminPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { RequireAuth } from "@/components/common/RouteGuards";
import { paths } from "./paths";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path={paths.home} element={<HomePage />} />
        <Route path={paths.auth} element={<AuthPage />} />
        <Route path={paths.resetPassword} element={<ResetPasswordPage />} />
        <Route path={paths.adminSetup} element={<SetupAdminPage />} />
        <Route path={paths.account} element={<RequireAuth><AccountPage /></RequireAuth>} />
        <Route path={paths.admin} element={<RequireAuth staff><AdminPage /></RequireAuth>} />
        <Route path={paths.comingSoon} element={<ComingSoonPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
