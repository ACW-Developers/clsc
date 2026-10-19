import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import authImage from "@/assets/auth.jpg";
import icon from "@/assets/cslc-icon.png.asset.json";
import { BrandLogo } from "./BrandLogo";
import { paths } from "@/routes/paths";

/** Split-screen layout: hospitality image left, form card right. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={authImage} alt="CSLC hospitality team" width={912} height={1200} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-overlay" />
        <div className="absolute bottom-12 left-11 right-11 text-primary-foreground">
          <BrandLogo className="mb-6 h-14 rounded-lg bg-card p-2" />
          <h2 className="text-3xl font-bold">Welcome to CSLC Hospitality</h2>
          <p className="mt-2 max-w-md opacity-90">Stay, meet, dine and celebrate at Ufungamano House. Sign in to manage your enquiries and bookings.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-card p-6 shadow-card sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <img src={icon.url} alt="CSLC crest" width={894} height={724} className="h-16 w-auto" />
            <p className="mt-3 text-lg font-bold text-primary">Christian Student Leadership Centre</p>
            <p className="text-sm text-muted-foreground">Hospitality Services</p>
          </div>
          {children}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <Link to={paths.home} className="inline-flex items-center gap-1 text-primary hover:underline"><ArrowLeft className="h-3 w-3" /> Go to Home</Link>
            <p className="mt-1">© {new Date().getFullYear()} CSLC · Ufungamano House</p>
          </div>
        </div>
      </div>
    </div>
  );
}
