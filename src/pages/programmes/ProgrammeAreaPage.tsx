import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, CalendarDays, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { Eyebrow } from "@/components/home/InstitutionSections";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { findProgrammeArea, programmeAreas } from "@/config/programmeAreas";
import { useAreaActivities } from "@/hooks/programmes/useActivities";
import type { ActivityRow } from "@/services/programmes/activities";
import { paths, programmeAreaUrl } from "@/routes/paths";

const fmt = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });

const Meta = ({ a }: { a: ActivityRow }) => (
  <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
    <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{fmt(a.activity_date)}</span>
    {a.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{a.location}</span>}
  </p>
);

const ProgrammeAreaPage = () => {
  const { slug } = useParams();
  const area = findProgrammeArea(slug);
  const q = useAreaActivities(area?.slug);
  const [open, setOpen] = useState<ActivityRow | null>(null);

  if (!area)
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="container flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
          <p>Programme not found.</p>
          <Button asChild><Link to={`${paths.about}#programmes`}>All programmes</Link></Button>
        </main>
        <SiteFooter />
      </div>
    );

  const items = q.data ?? [];
  const [featured, ...rest] = items;
  const fallback = area.image;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
          <img src={area.image} alt="" fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-hero-dark" />
          <div className="container py-16 text-center sm:py-24">
            <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap justify-center gap-2 text-sm opacity-80">
              <Link to={paths.home} className="hover:underline">Home</Link><span>/</span>
              <Link to={`${paths.about}#programmes`} className="hover:underline">About</Link><span>/</span>
              <span aria-current="page">{area.title}</span>
            </nav>
            <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{area.title}</h1>
            <p className="mt-3 font-script text-3xl text-accent sm:text-4xl">Thematic Areas</p>
          </div>
        </section>

        <section className="container grid gap-10 py-14 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <Eyebrow>About this thematic area</Eyebrow>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{area.short}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{area.description}</p>
          </div>
          <ul className="space-y-3 rounded-2xl border bg-card p-6 shadow-card">
            {area.focus.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm font-medium">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />{f}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-secondary/50 py-14">
          <div className="container">
            <Eyebrow>Past activities</Eyebrow>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Highlights & stories</h2>
            {q.isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : q.isError ? (
              <p className="mt-6 rounded-xl border border-dashed bg-card p-6 text-sm text-muted-foreground">Activities could not be loaded. Please try again shortly.</p>
            ) : items.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed bg-card p-6 text-sm italic text-muted-foreground">Past activities for this programme will be shared here soon.</p>
            ) : (
              <div className="mt-8 space-y-8">
                <button onClick={() => setOpen(featured)} className="group grid w-full overflow-hidden rounded-2xl border bg-card text-left shadow-card transition hover:shadow-lg md:grid-cols-2">
                  <img src={featured.image_url || fallback} alt="" loading="lazy" className="h-60 w-full object-cover transition duration-500 group-hover:scale-[1.03] md:h-full md:min-h-72" />
                  <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
                    <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Latest</span>
                    <h3 className="text-xl font-bold group-hover:text-primary sm:text-2xl">{featured.title}</h3>
                    <Meta a={featured} />
                    <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">{featured.summary || featured.body}</p>
                    <span className="flex items-center gap-1 text-sm font-semibold text-primary">Read more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                  </div>
                </button>
                {rest.length > 0 && (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((a) => (
                      <button key={a.id} onClick={() => setOpen(a)} className="group flex flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-card transition hover:-translate-y-1 hover:shadow-lg">
                        <img src={a.image_url || fallback} alt="" loading="lazy" className="h-48 w-full object-cover" />
                        <div className="flex flex-1 flex-col gap-2 p-5">
                          <Meta a={a} />
                          <h3 className="font-bold group-hover:text-primary">{a.title}</h3>
                          <p className="line-clamp-3 text-sm text-muted-foreground">{a.summary || a.body}</p>
                          <span className="mt-auto flex items-center gap-1 pt-2 text-sm font-semibold text-primary">Read more <ArrowRight className="h-4 w-4" /></span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="container py-14">
          <h2 className="text-xl font-bold">Other thematic areas</h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {programmeAreas.filter((p) => p.slug !== area.slug).map((p) => (
              <Link key={p.slug} to={programmeAreaUrl(p.slug)} className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm font-semibold transition hover:border-primary hover:text-primary">
                <p.icon className="h-5 w-5 shrink-0 text-primary" />{p.title}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {open && (
            <article className="space-y-4">
              <img src={open.image_url || fallback} alt="" className="h-56 w-full rounded-xl object-cover sm:h-72" />
              <DialogHeader><DialogTitle className="text-left text-2xl">{open.title}</DialogTitle></DialogHeader>
              <Meta a={open} />
              {open.summary && <p className="font-medium">{open.summary}</p>}
              <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{open.body}</div>
            </article>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProgrammeAreaPage;
