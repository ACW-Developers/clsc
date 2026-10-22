import { useSearchParams } from "react-router-dom";
import {
  Activity,
  BedDouble,
  CalendarCheck,
  LayoutDashboard,
  Layers,
  Receipt,
  Settings as Cog,
  User,
  Users as UsersIcon,
} from "lucide-react";
import { DashboardShell } from "@/components/common/DashboardShell";
import { ProfileForm } from "@/components/common/ProfileForm";
import { ReceiptsTable } from "@/components/common/ReceiptsTable";
import { Bookings, Facilities, Logs, Overview, Services, Settings, Users } from "@/components/admin/AdminViews";
import { useRoles } from "@/hooks/useHospitality";

const views = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "bookings", label: "Bookings", icon: CalendarCheck },
  { id: "receipts", label: "Receipts", icon: Receipt },
  { id: "services", label: "Services", icon: Layers },
  { id: "facilities", label: "Facilities", icon: BedDouble },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "logs", label: "Activity Logs", icon: Activity },
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: Cog, superOnly: true },
];

const AdminPage = () => {
  const [params, setParams] = useSearchParams();
  const { isSuperAdmin } = useRoles();
  const list = views.filter((v) => !v.superOnly || isSuperAdmin);
  const view = list.find((v) => v.id === params.get("view"))?.id ?? "overview";
  const go = (v: string) => setParams({ view: v });
  return (
    <DashboardShell views={list} view={view} go={go} subtitle={isSuperAdmin ? "Super admin" : "Admin"}>
      {view === "overview" && <Overview go={go} />}
      {view === "bookings" && <Bookings />}
      {view === "receipts" && <ReceiptsTable />}
      {view === "services" && <Services />}
      {view === "facilities" && <Facilities />}
      {view === "users" && <Users />}
      {view === "logs" && <Logs />}
      {view === "profile" && <ProfileForm />}
      {view === "settings" && <Settings />}
    </DashboardShell>
  );
};
export default AdminPage;
