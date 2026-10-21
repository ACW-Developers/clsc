import { Link } from "react-router-dom";
import { MapPin, Mail } from "lucide-react";
import { hospitalityServices, site } from "@/config/site";
import { comingSoon, paths } from "@/routes/paths";
import { BrandLogo } from "./BrandLogo";

export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandLogo className="h-14 rounded-lg bg-card p-2" />
          <p className="mt-4 text-sm text-muted-foreground">
            Hospitality, resources and programmes serving the Christian student
            leadership community.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Contact</p>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              {site.location}
            </li>
            <li className="flex gap-2">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <a href="/#contact" className="hover:text-primary">
                Send an enquiry
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Services</p>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            {hospitalityServices.map((s) => (
              <li key={s.id}>
                <a href={`/#${s.id}`} className="hover:text-primary">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Useful Links</p>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            <li>
              <Link to={paths.book} className="hover:text-primary">
                Book Now
              </Link>
            </li>
            <li>
              <Link to={paths.account} className="hover:text-primary">
                My Bookings
              </Link>
            </li>
            <li>
              <Link to={comingSoon("mission")} className="hover:text-primary">
                About CSLC
              </Link>
            </li>
            <li>
              <Link to={comingSoon("bookshop")} className="hover:text-primary">
                Bookshop
              </Link>
            </li>
            <li>
              <Link to={comingSoon("events")} className="hover:text-primary">
                Student Programmes
              </Link>
            </li>
            <li>
              <Link to={paths.auth} className="hover:text-primary">
                Sign in / Register
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  );
}
