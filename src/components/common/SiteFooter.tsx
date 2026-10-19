import { Link } from "react-router-dom";
import { hospitalityServices, site } from "@/config/site";
import { paths } from "@/routes/paths";

export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary">
      <div className="container grid gap-10 py-12 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-primary">{site.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{site.location}</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Services</p>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            {hospitalityServices.map((s) => (
              <li key={s.id}><a href={`#${s.id}`} className="hover:text-primary">{s.title}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Account</p>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            <li><Link to={paths.auth} className="hover:text-primary">Sign in</Link></li>
            <li><Link to={`${paths.auth}?mode=signup`} className="hover:text-primary">Create account</Link></li>
            <li><a href="#contact" className="hover:text-primary">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  );
}
