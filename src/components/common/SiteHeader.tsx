import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Mail, Menu, User, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { paths } from "@/routes/paths";
import { cn } from "@/lib/utils";

const links = [
  { href: "#home", label: "Home" },
  { href: "#services", label: "Services" },
  { href: "#why", label: "About Us" },
  { href: "#contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("You have been signed out");
  };

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link to={paths.home} aria-label="CSLC home">
          <BrandLogo className="h-10 sm:h-12" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l, i) => (
            <a key={l.href} href={l.href} className={cn("relative py-2 text-sm font-medium transition-colors hover:text-primary", i === 0 ? "text-primary after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded after:bg-primary" : "text-foreground")}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href="#contact" className="hidden items-center gap-2 md:flex">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card"><Mail className="h-4 w-4 text-primary" /></span>
            <span className="text-xs leading-tight"><span className="block text-muted-foreground">Need Help?</span><span className="font-semibold">Contact us</span></span>
          </a>
          {user ? (
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
            </Button>
          ) : (
            <button onClick={() => navigate(paths.auth)} aria-label="Sign in" className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-primary shadow-card transition hover:bg-secondary">
              <User className="h-5 w-5" />
            </button>
          )}
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="container lg:hidden">
          <div className="flex flex-col rounded-xl bg-card p-2 shadow-card">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-sm font-medium hover:bg-secondary">{l.label}</a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
