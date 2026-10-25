import { Route, Routes } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import HomePage from "@/pages/HomePage";
import ContactPage from "@/pages/ContactPage";
import AuthPage from "@/pages/AuthPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import SetupAdminPage from "@/pages/SetupAdminPage";
import ComingSoonPage from "@/pages/ComingSoonPage";
import AccountPage from "@/pages/hospitality/AccountPage";
import AdminPage from "@/pages/admin/AdminPage";
import ServiceListPage from "@/pages/hospitality/ServiceListPage";
import FacilityPage from "@/pages/hospitality/FacilityPage";
import CheckoutPage from "@/pages/hospitality/CheckoutPage";
import ReceiptPage from "@/pages/hospitality/ReceiptPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { RequireAuth } from "@/components/common/RouteGuards";
import { paths } from "./paths";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path={paths.home} element={<HomePage />} />
        <Route path={paths.contact} element={<ContactPage />} />
        <Route path={paths.auth} element={<AuthPage />} />
        <Route path={paths.resetPassword} element={<ResetPasswordPage />} />
        <Route path={paths.adminSetup} element={<SetupAdminPage />} />
        <Route
          path={paths.account}
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />
        <Route
          path={paths.admin}
          element={
            <RequireAuth staff>
              <AdminPage />
            </RequireAuth>
          }
        />
        <Route path={paths.serviceList} element={<ServiceListPage />} />
        <Route path={paths.facility} element={<FacilityPage />} />
        <Route path={paths.checkout} element={<RequireAuth><CheckoutPage /></RequireAuth>} />
        <Route path={paths.receipt} element={<RequireAuth><ReceiptPage /></RequireAuth>} />
        <Route path={paths.comingSoon} element={<ComingSoonPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
