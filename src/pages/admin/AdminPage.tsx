import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Activity, BedDouble, CalendarCheck, Home, LayoutDashboard, Layers, LogOut, Menu, Settings as Cog, User, Users as UsersIcon } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/ui/button";
import { Bookings, Facilities, Logs, Overview, Profile, Services, Settings, Users } from "@/components/admin/AdminViews";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useHospitality";
import { paths } from "@/routes/paths";
import { cn } from "@/lib/utils";

const views = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "bookings", label: "Bookings", icon: CalendarCheck },
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
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const list = views.filter((v) => !v.superOnly || isSuperAdmin);
  const view = list.find((v) => v.id === params.get("view"))?.id ?? "overview";
  const go = (v: string) => { setParams({ view: v }); setOpen(false); };
  const title = list.find((v) => v.id === view)!.label;

  return (
    <div className="flex min-h-screen bg-muted">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-64 border-r bg-card p-4 transition-transform lg:static lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <Link to={paths.home}><BrandLogo className="h-10" /></Link>
        <nav className="mt-8 grid gap-1" aria-label="Admin">
          {list.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => go(id)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition", view === id ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
          <Link to={paths.home} className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-secondary"><Home className="h-4 w-4" /> View site</Link>
          <button onClick={() => signOut()} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-secondary"><LogOut className="h-4 w-4" /> Sign out</button>
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-foreground/40 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between gap-3 border-b bg-card px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
            <h1 className="text-lg font-bold">{title}</h1>
          </div>
          <p className="truncate text-sm text-muted-foreground">{user?.email} · <span className="text-primary">{isSuperAdmin ? "Super admin" : "Admin"}</span></p>
        </header>
        <main className="p-4 sm:p-6">
          {view === "overview" && <Overview go={go} />}
          {view === "bookings" && <Bookings />}
          {view === "services" && <Services />}
          {view === "facilities" && <Facilities />}
          {view === "users" && <Users />}
          {view === "logs" && <Logs />}
          {view === "profile" && <Profile />}
          {view === "settings" && <Settings />}
        </main>
      </div>
    </div>
  );
};
export default AdminPage;
