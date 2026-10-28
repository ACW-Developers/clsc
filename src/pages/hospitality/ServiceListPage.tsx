import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Compass,
  Hotel,
  Loader2,
  MapPin,
  SearchX,
  Sparkles,
  Users,
} from "lucide-react";

import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useServices, useSubServices } from "@/hooks/useHospitality";
import { hospitalityServices } from "@/config/site";
import { facilityUrl, paths } from "@/routes/paths";
import { kes } from "@/lib/booking";
import NotFoundPage from "@/pages/NotFoundPage";
import { categoryConfig } from "@/config/facilityCategories";

const ServiceListPage = () => {
  const { slug = "" } = useParams();

  const services = useServices();
  const subs = useSubServices();

  const meta = hospitalityServices.find((s) => s.id === slug);
  const service = services.data?.find((s) => s.slug === slug);

  if (!services.isLoading && !service && !meta) {
    return <NotFoundPage />;
  }

  const list = (subs.data ?? []).filter(
    (f) => f.service_id === service?.id && f.is_published,
  );

  const hero = service?.image_url || meta?.image;
  const title = service?.name ?? meta?.title ?? "Our Facilities";
  const description = service?.description || meta?.description;
  const category = categoryConfig(slug);

  const availableCount = list.filter((f) => f.is_available).length;

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-background">
      <SiteHeader />

      {/* Premium service hero */}
      <section className="relative isolate min-h-[300px] overflow-hidden bg-slate-950 sm:min-h-[370px] lg:min-h-[420px]">
        {hero && (
          <img
            src={hero}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/60 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />

        <div className="container relative z-10 flex min-h-[300px] flex-col justify-center py-12 text-white sm:min-h-[370px] lg:min-h-[420px]">
          <nav
            className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/75"
            aria-label="Breadcrumb"
          >
            <Link to={paths.home} className="transition hover:text-white">
              Home
            </Link>
            <span>/</span>
            <span>Hospitality</span>
            <span>/</span>
            <span className="font-medium text-white">{title}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/0 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur-sm">
              CSLC Hospitality
            </div>

            <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {title}
            </h1>

            {description && (
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                {description}
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-lg font-semibold shadow-lg"
              >
                <a href="#facilities">
                  Explore facilities
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>

              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm backdrop-blur-sm">
                <CheckCircle2 className="h-4 w-4 text-orange-300" />
                Comfortable, convenient spaces
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container min-w-0 flex-1 py-10 sm:py-14">
        {/* Introductory section */}
        <section className="mb-9 border-b pb-7 sm:mb-10 sm:pb-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                <span className="hidden sm:h-px w-7 bg-primary font-semibold" />
                Find your ideal space
              </div>

              <h2
                id="facilities"
                className="text-2xl font-bold tracking-tight sm:text-3xl"
              >
                Explore our facilities
              </h2>

              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                Discover our available spaces, compare facilities, and choose
                the option that best suits your needs.
              </p>
            </div>

            {!subs.isLoading && !services.isLoading && (
              <div className="flex flex-wrap gap-3">
                <div className="flex min-w-[125px] items-center gap-3 rounded-xl border bg-card px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Hotel className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-none">
                      {list.length}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Facilities
                    </p>
                  </div>
                </div>

                <div className="flex min-w-[125px] items-center gap-3 rounded-xl border bg-card px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-none">
                      {availableCount}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Available
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Loading state */}
        {subs.isLoading || services.isLoading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border bg-card">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading facilities...
            </p>
          </div>
        ) : subs.error || services.error ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive"
          >
            Unable to load facilities:{" "}
            {(subs.error as Error | null)?.message ??
              (services.error as Error | null)?.message}
          </div>
        ) : !list.length ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed px-5 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <SearchX className="h-8 w-8 text-muted-foreground" />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              No facilities available yet
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              We are updating this section. Please check back soon to explore
              our facilities.
            </p>

            <Button asChild variant="outline" className="mt-5">
              <Link to={paths.home}>
                Return home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Facility cards */}
            <section aria-label={`${title} facilities`}>
              <div className="grid min-w-0 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
                {list.map((f) => {
                  const img = f.images?.[0] || f.image_url;
                  const details =
                    f.details &&
                    typeof f.details === "object" &&
                    !Array.isArray(f.details)
                      ? (f.details as Record<string, unknown>)
                      : null;

                  const detailItems = details
                    ? category.information
                        .slice(0, 2)
                        .map((key) => ({
                          key,
                          value: details[key],
                        }))
                        .filter(
                          (item): item is { key: string; value: string } =>
                            typeof item.value === "string" &&
                            item.value.trim().length > 0,
                        )
                    : [];

                  return (
                    <article
                      key={f.id}
                      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5"
                    >
                      {/* Card image */}
                      <Link
                        to={facilityUrl(slug, f.id)}
                        aria-label={`View ${f.name}`}
                        className="relative block aspect-[16/10] overflow-hidden bg-muted"
                      >
                        {img ? (
                          <img
                            src={img}
                            alt={f.name}
                            loading="lazy"
                            decoding="async"
                            width={640}
                            height={400}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Hotel className="h-12 w-12 text-muted-foreground/50" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />

                        <Badge
                          variant={f.is_available ? "secondary" : "destructive"}
                          className="absolute left-4 top-4 border-0 shadow-sm"
                        >
                          <span
                            className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                              f.is_available ? "bg-emerald-500" : "bg-white"
                            }`}
                          />
                          {f.is_available ? "Available to book" : "Unavailable"}
                        </Badge>

                        {f.images && f.images.length > 1 && (
                          <span className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                            +{f.images.length - 1} more photos
                          </span>
                        )}

                        <span className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 shadow-md transition-transform duration-300 group-hover:rotate-45">
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </Link>

                      {/* Card content */}
                      <div className="flex flex-1 flex-col p-5 sm:p-6">
                        <div className="flex-1">
                          <Link
                            to={facilityUrl(slug, f.id)}
                            className="inline-block"
                          >
                            <h3 className="text-lg font-bold tracking-tight transition-colors group-hover:text-primary sm:text-xl">
                              {f.name}
                            </h3>
                          </Link>

                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                            {f.description ||
                              "Explore this facility and discover the available booking options."}
                          </p>

                          {/* Relevant facility information */}
                          {detailItems.length > 0 && (
                            <div className="mt-4 space-y-2 border-t pt-4">
                              {detailItems.map((item) => (
                                <div
                                  key={item.key}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                  <span className="min-w-0 break-words text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                      {item.key}:
                                    </span>{" "}
                                    {item.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Capacity and pricing */}
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                          {f.capacity ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                <Users className="h-4 w-4" />
                              </span>
                              <span>
                                <span className="block font-semibold text-foreground">
                                  {f.capacity}
                                </span>
                                <span className="text-xs">Capacity</span>
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                <Compass className="h-4 w-4" />
                              </span>
                              <span>Explore facility</span>
                            </div>
                          )}

                          <div className="min-w-0 text-right">
                            <p className="text-xs text-muted-foreground">
                              {f.price == null ? "Pricing" : "Starting from"}
                            </p>
                            <p className="mt-1 break-words text-lg font-bold text-primary">
                              {kes(f.price)}
                            </p>
                            {f.price != null && f.price_unit && (
                              <p className="text-xs text-muted-foreground">
                                {f.price_unit}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Card action */}
                        <Button
                          asChild
                          className="mt-5 w-full rounded-lg"
                          variant={f.is_available ? "default" : "outline"}
                        >
                          <Link to={facilityUrl(slug, f.id)}>
                            {f.is_available
                              ? "View facility & book"
                              : "View facility details"}
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Closing call to action */}
            <section className="relative mt-12 overflow-hidden rounded-2xl bg-slate-950 px-6 py-9 text-white sm:mt-16 sm:px-10 sm:py-12">
              <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />

              <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div className="max-w-xl">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-orange-300">
                    <Clock3 className="h-4 w-4" />
                    Plan your next visit
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Found the right space?
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-white/70 sm:text-base">
                    Explore a facility's details, check availability, and
                    continue to booking when you are ready.
                  </p>
                </div>

                <Button asChild size="lg" className="shrink-0">
                  <Link to={paths.home}>
                    Explore CSLC
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
};

export default ServiceListPage;
