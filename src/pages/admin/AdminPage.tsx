import { useSearchParams } from "react-router-dom";
import {
  Activity,
  BedDouble,
  CalendarCheck,
  LayoutDashboard,
  Layers,
  HeartHandshake,
  LifeBuoy,
  ShoppingBag,
  Receipt,
  Settings as Cog,
  User,
  Users as UsersIcon,
  BookOpen,
  Package,
  UserRound,
  ChartNoAxesCombined,
  CalendarDays,
  FileText,
  Sun,
  BookMarked,
  Sparkles,
  Star,
  Newspaper,
} from "lucide-react";
import { ActivitiesAdmin } from "@/components/programmes/ActivitiesAdmin";
import { ContributionsModeration, ResourcesAdmin } from "@/components/programmes/ResourceViews";
import { DashboardShell } from "@/components/common/DashboardShell";
import { ProfileForm } from "@/components/common/ProfileForm";
import { ReceiptsTable } from "@/components/common/ReceiptsTable";
import {
  Bookings,
  Facilities,
  Logs,
  Overview,
  Services,
  Settings,
  Users,
} from "@/components/admin/AdminViews";
import { useRoles } from "@/hooks/useHospitality";
import { PhaseRecords } from "@/components/common/PhaseRecords";
import { AdminSupport } from "@/components/admin/AdminSupport";
import { BookManagement } from "@/components/bookshop/BookManagement";
import { Inventory } from "@/components/bookshop/Inventory";
import type { DashView } from "@/components/common/DashboardShell";
import {
  DonationsInsights,
  EventsAdmin,
  MaterialsAdmin,
} from "@/components/programmes/ProgrammeAdmin";
import { TrafficAnalytics } from "@/components/admin/TrafficAnalytics";
import { AdminReviews } from "@/components/admin/AdminReviews";
import { LeadershipAdmin } from "@/components/admin/LeadershipAdmin";

const views: (DashView & { superOnly?: boolean })[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  {
    id: "bookings",
    label: "Bookings",
    icon: CalendarCheck,
    group: "Hospitality",
  },
  {
    id: "orders",
    label: "Orders",
    icon: ShoppingBag,
    group: "Bookshop",
  },
  {
    id: "books",
    label: "Books",
    icon: BookOpen,
    group: "Bookshop",
    superOnly: true,
  },
  { id: "inventory", label: "Stock & Sales", icon: Package, group: "Bookshop" },
  {
    id: "events",
    label: "Events",
    icon: CalendarDays,
    group: "Student Programmes",
  },
  {
    id: "materials",
    label: "Materials",
    icon: FileText,
    group: "Student Programmes",
  },
  {
    id: "devotionals",
    label: "Devotionals",
    icon: Sun,
    group: "Student Programmes",
  },
  {
    id: "biblestudy",
    label: "Bible Study",
    icon: BookMarked,
    group: "Student Programmes",
  },
  {
    id: "contributions",
    label: "Contributions",
    icon: Sparkles,
    group: "Student Programmes",
  },
  {
    id: "activities",
    label: "Programme Activities",
    icon: Newspaper,
    group: "Student Programmes",
    superOnly: true,
  },
  {
    id: "donations",
    label: "Donations",
    icon: HeartHandshake,
    group: "Student Programmes",
  },
  { id: "support", label: "Support", icon: LifeBuoy },
  { id: "receipts", label: "Receipts", icon: Receipt },
  { id: "services", label: "Services", icon: Layers, group: "Hospitality" },
  {
    id: "facilities",
    label: "Facilities",
    icon: BedDouble,
    group: "Hospitality",
  },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "reviews", label: "Reviews", icon: Star, superOnly: true },
  {
    id: "leadership",
    label: "Leadership",
    icon: UserRound,
    superOnly: true,
  },
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
    <DashboardShell
      views={list}
      view={view}
      go={go}
      subtitle={isSuperAdmin ? "Super admin" : "Admin"}
    >
      {view === "overview" && <Overview go={go} />}
      {view === "bookings" && <Bookings />}
      {view === "orders" && <PhaseRecords kind="orders" management />}
      {view === "books" && <BookManagement />}
      {view === "inventory" && <Inventory />}
      {view === "events" && <EventsAdmin />}
      {view === "materials" && <MaterialsAdmin />}
      {view === "devotionals" && <ResourcesAdmin kind="devotional" />}
      {view === "biblestudy" && <ResourcesAdmin kind="bible_study" />}
      {view === "contributions" && <ContributionsModeration />}
      {view === "activities" && <ActivitiesAdmin />}
      {view === "donations" && <DonationsInsights />}
      {view === "support" && <AdminSupport />}
      {view === "receipts" && <ReceiptsTable />}
      {view === "services" && <Services />}
      {view === "facilities" && <Facilities />}
      {view === "users" && <Users />}
      {view === "reviews" && <AdminReviews />}
      {view === "leadership" && <LeadershipAdmin />}
      {view === "traffic" && <TrafficAnalytics />}
      {view === "logs" && <Logs />}
      {view === "profile" && <ProfileForm />}
      {view === "settings" && <Settings />}
    </DashboardShell>
  );
};
export default AdminPage;
