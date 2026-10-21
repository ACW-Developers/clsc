import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { Button } from "@/components/ui/button";
import { findSoonLabel } from "@/config/navigation";
import { paths } from "@/routes/paths";

const ComingSoonPage = () => {
  const { slug = "" } = useParams();
  const title = findSoonLabel(slug) ?? "This page";
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <section className="container flex flex-1 flex-col items-center justify-center py-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary"><Sparkles className="h-3.5 w-3.5 text-accent" /> Coming Soon</span>
        <h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">{title}</h1>
        <p className="font-script text-4xl text-primary">is on its way</p>
        <p className="mt-4 max-w-md text-muted-foreground">We're building this part of the CSLC platform. In the meantime, explore our hospitality services or make a booking.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" className="rounded-full"><Link to={paths.home}><ArrowLeft className="h-4 w-4" /> Back to Home</Link></Button>
          <Button asChild className="rounded-full"><Link to={paths.book}>Book Hospitality</Link></Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
};
export default ComingSoonPage;
