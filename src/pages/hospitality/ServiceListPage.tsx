import { Link, useParams } from "react-router-dom";
import { ArrowRight, Loader2, Users } from "lucide-react";
import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { useServices, useSubServices } from "@/hooks/useHospitality";
import { hospitalityServices } from "@/config/site";
import { facilityUrl, paths } from "@/routes/paths";
import { kes } from "@/lib/booking";
import NotFoundPage from "@/pages/NotFoundPage";

const ServiceListPage = () => {
  const { slug = "" } = useParams();
  const services = useServices();
  const subs = useSubServices();
  const meta = hospitalityServices.find((s) => s.id === slug);
  const service = services.data?.find((s) => s.slug === slug);
  if (!services.isLoading && !service && !meta) return <NotFoundPage />;
  const list = (subs.data ?? []).filter((f) => f.service_id === service?.id && f.is_published);
  const hero = service?.image_url || meta?.image;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <section className="relative h-64 overflow-hidden sm:h-80">
        {hero && <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="category-overlay absolute inset-0" />
        <div className="container relative flex h-full flex-col items-center justify-center text-center text-primary-foreground">
          <nav className="mb-2 text-sm opacity-90" aria-label="Breadcrumb">
            <Link to={paths.home} className="hover:underline">Home</Link> / Hospitality
          </nav>
          <h1 className="text-3xl font-bold sm:text-4xl">{service?.name ?? meta?.title}</h1>
          <p className="mt-2 max-w-2xl opacity-90">{service?.description || meta?.description}</p>
        </div>
      </section>
      <main className="container flex-1 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-bold">Explore {service?.name ?? meta?.title}</h2>
          <span className="text-sm text-muted-foreground">{list.length} facilities</span>
        </div>
        {subs.isLoading || services.isLoading ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        ) : subs.error ? (
          <p className="text-destructive">{(subs.error as Error).message}</p>
        ) : !list.length ? (
          <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            No facilities have been listed here yet. Please check back soon.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((f) => {
              const img = f.images[0] ?? f.image_url;
              return (
                <Link key={f.id} to={facilityUrl(slug, f.id)} className="group min-w-0 overflow-hidden rounded-lg border bg-card shadow-card transition hover:-translate-y-0.5">
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {img && <img src={img} alt={f.name} loading="lazy" decoding="async" width={640} height={480} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                  </div>
                  <div className="space-y-2 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-lg font-semibold">{f.name}</h2>
                      <Badge variant={f.is_available ? "secondary" : "destructive"}>{f.is_available ? "Bookable" : "Unavailable"}</Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{f.description}</p>
                    <div className="flex items-center justify-between pt-1 text-sm">
                      <span className="font-semibold text-primary">
                        {kes(f.price)} {f.price != null && <span className="font-normal text-muted-foreground">{f.price_unit}</span>}
                      </span>
                      {f.capacity && <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-4 w-4" /> {f.capacity}</span>}
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium text-primary">View details <ArrowRight className="h-4 w-4" /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};
export default ServiceListPage;
