import type { ReactNode } from "react";
import { Link, NavLink, useLocation, useSearchParams } from "react-router-dom";
import { BookOpen, MapPin, ShoppingBag } from "lucide-react";
import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { useCart } from "@/hooks/bookshop/useCart";
import { cn } from "@/lib/utils";
import { branchUrl, paths } from "@/routes/paths";
import { branches } from "@/services/bookshop/catalog";

export function ShopFrame({ children }: { children: ReactNode }) {
  const cart = useCart(), { pathname } = useLocation(), [params] = useSearchParams();
  const branchActive = (id: string) => pathname === branchUrl(id) || (pathname.startsWith("/bookshop/books/") && (params.get("branch") ?? cart.branch) === id);
  const pill = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="bookshop-nav sticky top-20 z-30 border-b bg-card/90 backdrop-blur-md">
        <div className="container flex items-center justify-between gap-2 py-2.5">
          <Link to={paths.bookshop} className="hidden items-center gap-2 font-bold text-primary sm:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><BookOpen className="h-4 w-4" /></span>
            CSLC Bookshop
          </Link>
          <nav aria-label="Bookshop" className="flex min-w-0 flex-1 items-center justify-between gap-1 sm:flex-none sm:justify-end">
            <div className="flex items-center gap-1 rounded-full bg-muted p-1">
              <NavLink end to={paths.bookshop} className={({ isActive }) => cn(pill, isActive ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>All</NavLink>
              {branches.map((b) => (
                <Link key={b.id} to={branchUrl(b.id)} aria-current={branchActive(b.id) ? "page" : undefined}
                  className={cn(pill, branchActive(b.id) ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  <MapPin className="hidden h-3.5 w-3.5 sm:block" />{b.id === "yaya" ? "Yaya Centre" : b.name}
                </Link>
              ))}
            </div>
            <Link to={paths.cart} aria-label={`Cart, ${cart.count} item${cart.count === 1 ? "" : "s"}`}
              className={cn(pill, "relative ml-2 bg-primary px-4 text-primary-foreground hover:bg-primary/90 hover:shadow-card")}>
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {cart.count > 0 && (
                <span key={cart.count} className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 animate-pop-in items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground ring-2 ring-card">
                  {cart.count}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </div>
      {children}
      <SiteFooter />
    </div>
  );
}
