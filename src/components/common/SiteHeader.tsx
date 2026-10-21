import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LayoutDashboard, LogOut, Menu, User, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./BrandLogo";
import { NavItem } from "./NavItem";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useHospitality";
import { mainNav } from "@/config/navigation";
import { paths } from "@/routes/paths";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const { isStaff } = useRoles();

  const handleSignOut = async () => { await signOut(); toast.success("You have been signed out"); };
  const close = () => { setOpen(false); setExpanded(null); };

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link to={paths.home} aria-label="CSLC home"><BrandLogo className="h-10 sm:h-12" /></Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main">
          {mainNav.map((g) => g.items ? (
            <div key={g.label} className="group relative">
              <button className={cn("flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium hover:text-primary", g.label === "Hospitality" && "text-primary")} aria-haspopup="true">
                {g.label} <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
              </button>
              <div className="invisible absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="rounded-xl border bg-popover p-2 shadow-card">
                  {g.items.map((i) => (
                    <NavItem key={i.label} to={i.to} className="block rounded-lg px-3 py-2 hover:bg-secondary">
                      <span className="block text-sm font-medium">{i.label}</span>
                      {i.description && <span className="block text-xs text-muted-foreground">{i.description}</span>}
                    </NavItem>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <NavItem key={g.label} to={g.to!} className="rounded-md px-3 py-2 text-sm font-medium hover:text-primary">{g.label}</NavItem>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild size="sm" variant="secondary" className="rounded-full">
                <Link to={isStaff ? paths.admin : paths.account}>{isStaff ? <LayoutDashboard className="h-4 w-4" /> : <User className="h-4 w-4" />}<span className="hidden sm:inline">{isStaff ? "Dashboard" : "My Bookings"}</span></Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" onClick={handleSignOut} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
            </>
          ) : (
            <Button asChild size="sm" className="rounded-full"><Link to={paths.auth}><User className="h-4 w-4" /> Sign in</Link></Button>
          )}
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary xl:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="max-h-[75vh] overflow-y-auto border-t bg-card xl:hidden" aria-label="Mobile">
          <div className="container py-2">
            {mainNav.map((g) => g.items ? (
              <div key={g.label} className="border-b last:border-0">
                <button className="flex w-full items-center justify-between py-3 text-left font-medium" aria-expanded={expanded === g.label} onClick={() => setExpanded(expanded === g.label ? null : g.label)}>
                  {g.label} <ChevronDown className={cn("h-4 w-4 transition", expanded === g.label && "rotate-180")} />
                </button>
                {expanded === g.label && (
                  <div className="grid pb-2 pl-3">
                    {g.items.map((i) => <NavItem key={i.label} to={i.to} onClick={close} className="rounded-lg px-3 py-2.5 text-sm hover:bg-secondary">{i.label}</NavItem>)}
                  </div>
                )}
              </div>
            ) : (
              <NavItem key={g.label} to={g.to!} onClick={close} className="block border-b py-3 font-medium last:border-0">{g.label}</NavItem>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
