import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Home, LogOut, Menu, Moon, Sun, RefreshCw, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import icon from "@/assets/cslc-icon.png";
import { BrandLogo } from "./BrandLogo";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { paths } from "@/routes/paths";
import { cn } from "@/lib/utils";

export interface DashView {
  id: string;
  label: string;
  icon: LucideIcon;
}

/** Responsive dashboard frame: expanded (icons + labels) or collapsed (icons only). */
export function DashboardShell({
  views,
  view,
  go,
  subtitle,
  children,
}: {
  views: DashView[];
  view: string;
  go: (v: string) => void;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  const { signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    try {
      await qc.cancelQueries();
      await qc.resetQueries({ predicate: (q) => !["myRoles", "setup"].includes(String(q.queryKey[0])) });
      toast.success("Dashboard refreshed");
    } finally { setRefreshing(false); }
  };
  const bottomViews = views.filter((v) => ["overview", "bookings", "receipts", "facilities", "profile"].includes(v.id)).slice(0, 5);
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("cslc-sidebar") === "1",
  );
  const toggle = () => {
    localStorage.setItem("cslc-sidebar", collapsed ? "0" : "1");
    setCollapsed(!collapsed);
  };
  const mini = collapsed && !mobile;
  const title = views.find((v) => v.id === view)?.label;
  const item =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition";
  const select = (v: string) => {
    go(v);
    setMobile(false);
  };

  return (
    <div className="flex min-h-screen bg-muted">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-card p-3 transition-all lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobile ? "w-64 translate-x-0" : "-translate-x-full",
          mini ? "lg:w-[4.5rem]" : "lg:w-64",
        )}
      >
        <div className="-mx-3 -mt-3 border-b">
          <Link
            to={paths.home}
            className="flex h-16 items-center justify-start px-3"
            aria-label="CSLC home"
          >
            {mini ? (
              <img src={icon} alt="CSLC" className="h-11 w-11 object-contain" />
            ) : (
              <BrandLogo className="h-12" />
            )}
          </Link>
        </div>
        <nav className="mt-6 grid gap-1" aria-label="Dashboard">
          {views.map(({ id, label, icon: Icon }) => (
            <Button variant="ghost"
              key={id}
              onClick={() => select(id)}
              title={mini ? label : undefined}
              aria-label={label}
              aria-current={view === id ? "page" : undefined}
              className={cn(
                item,
                mini && "justify-center px-0",
                view === id ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" /> {!mini && label}
            </Button>
          ))}
        </nav>
        <div className="mt-auto grid gap-1 border-t pt-3">
          <Link to={paths.home} title="View site" aria-label="View site" className={cn(item, mini && "justify-center px-0", "hover:bg-secondary")}>
            <Home className="h-4 w-4 shrink-0" /> {!mini && "View site"}
          </Link>
          <Button variant="ghost" onClick={() => signOut()} title="Sign out" aria-label="Sign out" className={cn(item, mini && "justify-center px-0", "text-destructive hover:bg-secondary")}>
            <LogOut className="h-4 w-4 shrink-0" /> {!mini && "Sign out"}
          </Button>
        </div>
      </aside>
      {mobile && (
        <div className="fixed inset-0 z-30 bg-foreground/40 lg:hidden" onClick={() => setMobile(false)} />
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b bg-card/95 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu">
              <Menu className="h-7 w-7" />
            </Button>
            <Button size="icon" variant="ghost" className="hidden h-11 w-11 lg:inline-flex" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title="Toggle sidebar">
              <Menu className="h-7 w-7" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button size="icon" variant="ghost" title="Toggle theme" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</Button>
            <Button size="icon" variant="ghost" title="Clear data cache and refresh" aria-label="Clear data cache and refresh" disabled={refreshing} onClick={refresh}><RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} /></Button>
            <UserMenu />
          </div>
        </header>
        <main className="p-4 pb-24 sm:p-6 sm:pb-24 lg:pb-6">{children}</main>
        <nav aria-label="Mobile dashboard" className="dashboard-bottom fixed inset-x-0 bottom-0 z-20 flex justify-around border-t bg-card lg:hidden">
          {bottomViews.map(({ id, label, icon: Icon }) => <Button key={id} variant="ghost" aria-label={label} aria-current={view === id ? "page" : undefined} onClick={() => select(id)} className={cn("h-16 min-w-0 flex-1 flex-col gap-1 px-1 text-[10px]", view === id && "text-primary bg-secondary")}><Icon className="h-5 w-5" /><span className="truncate max-w-full">{label === "Booking History" ? "Bookings" : label}</span></Button>)}
        </nav>
      </div>
    </div>
  );
}
