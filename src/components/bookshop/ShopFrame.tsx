import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BookOpen, MapPin, ShoppingCart } from "lucide-react";
import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/bookshop/useCart";
import { branchUrl, paths } from "@/routes/paths";
export function ShopFrame({ children }: { children: ReactNode }) {
  const cart = useCart();
  return <div className="min-h-screen bg-background"><SiteHeader /><div className="bookshop-nav border-b bg-secondary"><div className="container flex flex-wrap items-center justify-between gap-2 py-3"><Link to={paths.bookshop} className="flex items-center gap-2 font-bold text-primary"><BookOpen className="h-5 w-5" />CSLC Bookshop</Link><nav aria-label="Bookshop" className="flex flex-wrap items-center gap-1"><Button asChild variant="ghost" size="sm"><Link to={branchUrl("yaya")}><MapPin className="h-4 w-4" />Yaya Centre</Link></Button><Button asChild variant="ghost" size="sm"><Link to={branchUrl("kisumu")}><MapPin className="h-4 w-4" />Kisumu</Link></Button><Button asChild size="sm"><Link to={paths.cart}><ShoppingCart className="h-4 w-4" />Cart ({cart.count})</Link></Button></nav></div></div>{children}<SiteFooter /></div>;
}