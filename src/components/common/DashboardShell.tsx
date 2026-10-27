import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Sun,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import icon from "@/assets/cslc-icon.png";
import { BrandLogo } from "./BrandLogo";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useSupport";
import { paths } from "@/routes/paths";
import { cn } from "@/lib/utils";

export interface DashView {
  id: string;
  label: string;
  icon: LucideIcon;
  group?: "General" | "Hospitality" | "Bookshop" | "Student Programmes";
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
  const notes = useNotifications();
  const unread = (notes.data ?? []).filter((n) => !n.read_at);
  const badgeFor = (id: string) =>
    unread.some((n) => n.link?.includes(`view=${id}`));
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    try {
      await qc.cancelQueries();
      qc.clear();
      if ("caches" in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((key) => window.caches.delete(key)));
      }
      // Revalidate the page without deleting the user's session or preferences.
      await fetch(window.location.href, {
        cache: "reload",
        credentials: "same-origin",
      });
      window.location.reload();
    } catch {
      toast.error("Could not fully clear the cache. Reloading the site.");
      window.location.reload();
    }
  };
  const bottomViews = views
    .filter((v) =>
      ["overview", "bookings", "receipts", "facilities", "profile"].includes(
        v.id,
      ),
    )
    .slice(0, 5);
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("cslc-sidebar") === "1",
  );
  const toggle = () => {
    localStorage.setItem("cslc-sidebar", collapsed ? "0" : "1");
    setCollapsed(!collapsed);
  };
  const [groups, setGroups] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("cslc-sidebar-groups") || "{}"); }
    catch { return {}; }
  });
  const toggleGroup = (group: string) => {
    const next = { ...groups, [group]: groups[group] === false };
    setGroups(next);
    localStorage.setItem("cslc-sidebar-groups", JSON.stringify(next));
  };
  const mini = collapsed && !mobile;
  const title = views.find((v) => v.id === view)?.label;
  const item =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200";
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
        <nav
          className="mt-3 grid min-h-0 gap-1 overflow-y-auto"
          aria-label="Dashboard"
        >
          {(
            [
              "General",
              "Hospitality",
              "Bookshop",
              "Student Programmes",
            ] as const
          ).map((group) => (
            <div key={group} className="grid gap-1">
              {!mini && views.some((v) => (v.group ?? "General") === group) && (
                group === "General" ? <h2 className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase text-muted-foreground">General</h2> :
                <Button variant="ghost" onClick={() => toggleGroup(group)} aria-expanded={groups[group] !== false}
                  aria-controls={`group-${group.replace(/ /g, "-")}`} className="mt-2 h-9 justify-between px-3 text-xs font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary">
                  {group}<ChevronDown className={cn("h-4 w-4 transition-transform duration-200", groups[group] === false && "-rotate-90")} />
                </Button>
              )}
              <div id={`group-${group.replace(/ /g, "-")}`} className="grid gap-1" hidden={!mini && group !== "General" && groups[group] === false}>
              {(mini || group === "General" || groups[group] !== false) && views
                .filter((v) => (v.group ?? "General") === group)
                .map(({ id, label, icon: Icon }) => (
                  <Button
                    variant="ghost"
                    key={id}
                    onClick={() => select(id)}
                    title={mini ? label : undefined}
                    aria-label={label}
                    aria-current={view === id ? "page" : undefined}
                    className={cn(
                      item,
                      mini ? "justify-center px-0" : "justify-start",
                      view === id
                        ? "bg-primary text-primary-foreground hover:bg-primary-glow hover:text-primary-foreground"
                        : "hover:bg-primary/10 hover:text-primary focus-visible:bg-primary/10",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" /> {!mini && label}
                    {badgeFor(id) && (
                      <span
                        className="ml-auto h-2 w-2 shrink-0 rounded-full bg-destructive"
                        aria-label="New activity"
                      />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-auto grid gap-1 border-t pt-3">
          <Link
            to={paths.home}
            title="View site"
            aria-label="View site"
            className={cn(
              item,
              mini ? "justify-center px-0" : "justify-start",
              "hover:bg-primary/10 hover:text-primary focus-visible:bg-primary/10",
            )}
          >
            <Home className="h-4 w-4 shrink-0" /> {!mini && "View site"}
          </Link>
          <Button
            variant="ghost"
            onClick={() => signOut()}
            title="Sign out"
            aria-label="Sign out"
            className={cn(
              item,
              mini ? "justify-center px-0" : "justify-start",
              "text-destructive hover:bg-secondary",
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" /> {!mini && "Sign out"}
          </Button>
        </div>
      </aside>
      {mobile && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b bg-card/95 px-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-11 w-11 shrink-0 lg:hidden [&_svg]:!h-7 [&_svg]:!w-7"
                  onClick={() => setMobile(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-7 w-7" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open menu</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="hidden h-11 w-11 lg:inline-flex [&_svg]:!h-7 [&_svg]:!w-7"
                  onClick={toggle}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <Menu className="h-7 w-7" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {collapsed ? "Expand sidebar" : "Collapse sidebar"}
              </TooltipContent>
            </Tooltip>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold sm:text-lg">
                {title}
              </h1>
              {subtitle && (
                <p className="truncate text-xs text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Toggle theme"
                  onClick={() =>
                    setTheme(resolvedTheme === "dark" ? "light" : "dark")
                  }
                >
                  {resolvedTheme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle theme</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Clear data cache and refresh"
                  disabled={refreshing}
                  onClick={refresh}
                >
                  <RefreshCw
                    className={cn("h-5 w-5", refreshing && "animate-spin")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear cache & refresh</TooltipContent>
            </Tooltip>
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main className="px-3 py-4 pb-24 sm:p-6 sm:pb-24 lg:pb-6">
          {children}
        </main>
        <nav
          aria-label="Mobile dashboard"
          className="dashboard-bottom fixed inset-x-0 bottom-0 z-20 flex justify-around border-t bg-card lg:hidden"
        >
          {bottomViews.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant="ghost"
              aria-label={label}
              aria-current={view === id ? "page" : undefined}
              onClick={() => select(id)}
              className={cn(
                "h-16 min-w-0 flex-1 flex-col gap-1 px-1 text-[10px]",
                view === id && "text-primary bg-secondary",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate max-w-full">
                {label === "Booking History" ? "Bookings" : label}
              </span>
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
}
