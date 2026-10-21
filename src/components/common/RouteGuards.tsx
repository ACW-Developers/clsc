import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useHospitality";
import { paths } from "@/routes/paths";

export const FullLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

/** UI guard only — database policies remain the real authority. */
export function RequireAuth({
  children,
  staff,
}: {
  children: ReactNode;
  staff?: boolean;
}) {
  const { user, loading } = useAuth();
  const { isStaff, isLoading } = useRoles();
  const loc = useLocation();
  if (loading || (user && isLoading)) return <FullLoader />;
  if (!user)
    return (
      <Navigate
        to={`${paths.auth}?next=${encodeURIComponent(loc.pathname + loc.search)}`}
        replace
      />
    );
  if (staff && !isStaff) return <Navigate to={paths.account} replace />;
  return <>{children}</>;
}
