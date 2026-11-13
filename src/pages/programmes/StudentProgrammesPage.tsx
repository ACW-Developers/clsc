import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookMarked,
  BookOpen,
  CalendarDays,
  FileText,
  HandHeart,
  MapPin,
  PenLine,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eyebrow } from "@/components/home/InstitutionSections";
import { EventCard } from "@/components/programmes/ProgrammeViews";
import { useEvents, useMaterials } from "@/hooks/programmes/useProgrammes";
import { useResources } from "@/hooks/programmes/useResources";
import { eventDate } from "@/services/programmes/programmes";
import { programmeAreas } from "@/config/programmeAreas";
import { eventUrl, paths, programmeAreaUrl } from "@/routes/paths";
import hero from "@/assets/grad.jpg";
import gather from "@/assets/banner.jpg";

const day = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });

/** Student Programmes hub: one entry point for events, learning, spiritual resources and giving. */
export default function StudentProgrammesPage() {
  const events = useEvents();
  const materials = useMaterials();
  const devotionals = useResources("devotional");
  const studies = useResources("bible_study");
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (events.data ?? []).filter((e) => e.event_date >= today);
  const next = upcoming[0];
  const devotional = devotionals.data?.[0];
  const latestStudies = (studies.data ?? []).slice(0, 3);

  const stats = [
    { v: upcoming.length, l: "Upcoming events", q: events },
    { v: materials.data?.length ?? 0, l: "Programme materials", q: materials },
    { v: devotionals.data?.length ?? 0, l: "Daily devotionals", q: devotionals },
    { v: studies.data?.length ?? 0, l: "Bible study guides", q: studies },
  ];

  const explore: { icon: LucideIcon; title: string; text: string; to: string; count?: number }[] = [
    { icon: FileText, title: "Programme Materials", text: "Guides, handbooks and media organised by category and topic.", to: paths.materials, count: materials.data?.length },
    { icon: Sun, title: "Daily Devotionals", text: "Scripture, reflection and prayer for every day of the week.", to: paths.devotionals, count: devotionals.data?.length },
    { icon: BookOpen, title: "Bible Study", text: "Study guides, reading plans and teaching resources.", to: paths.bibleStudy, count: studies.data?.length },
    { icon: PenLine, title: "Student Contributions", text: "Share original devotionals, reflections and study materials.", to: paths.contributions },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
          <img src={hero} alt="" fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover motion-safe:animate-kenburns" />
          <div className="absolute inset-0 -z-10 bg-hero-dark" />
          <div className="container grid gap-10 pb-14 pt-14 md:pb-20 md:pt-20 lg:grid-cols-[1.25fr_1fr] lg:items-center">
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              <nav aria-label="Breadcrumb" className="mb-5 text-xs font-semibold opacity-80">
                <Link to={paths.home} className="hover:underline">Home</Link> / Student Programmes
              </nav>
              <Eyebrow light>Student Programmes & Spiritual Resources</Eyebrow>
              <h1 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Equipping students to <span className="text-accent">lead, grow and serve</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 opacity-90 sm:text-base">
                Events, learning materials, daily devotionals and Bible study resources that nurture
                Christ-centred student leaders on campus and beyond.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link to={paths.events}>Upcoming events <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="rounded-full px-7">
                  <Link to={paths.donate}>Support a student</Link>
                </Button>
              </div>
            </div>

            {next && (
              <Link
                to={eventUrl(next.id)}
                className="group hidden overflow-hidden rounded-2xl border border-primary-foreground/20 bg-background/10 shadow-2xl backdrop-blur-md transition hover:-translate-y-1 lg:block"
              >
                {next.poster_url && (
                  <img src={next.poster_url} alt={next.title} className="h-56 w-full object-cover transition duration-700 group-hover:scale-105" />
                )}
                <div className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Next event</p>
                  <h2 className="mt-2 line-clamp-2 text-xl font-bold">{next.title}</h2>
                  <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm opacity-85">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{eventDate(next.event_date)}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{next.venue || "Venue to be announced"}</span>
                  </p>
                </div>
              </Link>
            )}
          </div>

          <div className="border-t border-primary-foreground/15 bg-primary/70 backdrop-blur">
            <dl className="container grid grid-cols-2 gap-px py-4 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.l} className="px-2 py-2">
                  <dd className="text-2xl font-bold text-accent sm:text-3xl">
                    {s.q.isLoading ? <Skeleton className="h-8 w-10 bg-primary-foreground/20" /> : s.v}
                  </dd>
                  <dt className="text-xs opacity-80 sm:text-sm">{s.l}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Explore */}
        <section className="container py-14 sm:py-16" aria-labelledby="explore">
          <Eyebrow>Explore</Eyebrow>
          <h2 id="explore" className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">Everything for your journey</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
            <Link
              to={paths.events}
              className="group relative isolate flex min-h-64 flex-col justify-end overflow-hidden rounded-2xl p-6 text-primary-foreground shadow-card sm:col-span-2 lg:row-span-2"
            >
              <img src={gather} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 -z-10 bg-hero-dark" />
              <span className="mb-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <CalendarDays className="h-5 w-5" />
              </span>
              <h3 className="mt-10 text-2xl font-bold sm:text-3xl">Events Calendar</h3>
              <p className="mt-2 max-w-md text-sm opacity-90">
                Conferences, trainings, worship nights and summits. Reserve your ticket online and pay securely.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                {upcoming.length ? `${upcoming.length} upcoming` : "View calendar"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
            {explore.map(({ icon: Icon, title, text, to, count }) => (
              <Link
                key={title}
                to={to}
                className="group flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-card"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground transition group-hover:text-primary" aria-hidden />
                </div>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{text}</p>
                {count !== undefined && (
                  <p className="mt-3 text-xs font-semibold text-primary">{count} available</p>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* Upcoming events */}
        <section className="bg-secondary py-14 sm:py-16" aria-labelledby="upcoming">
          <div className="container">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow>Gather with us</Eyebrow>
                <h2 id="upcoming" className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">Upcoming events</h2>
              </div>
              <Link to={paths.events} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                All events <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {events.isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
              </div>
            ) : upcoming.length ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.slice(0, 3).map((e) => <EventCard key={e.id} e={e} />)}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
                New events will appear here once published.
              </p>
            )}
          </div>
        </section>

        {/* Spiritual resources */}
        <section className="container py-14 sm:py-16" aria-labelledby="resources">
          <Eyebrow>Spiritual resources</Eyebrow>
          <h2 id="resources" className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">Grow in the Word</h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
            <article className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-card sm:p-8">
              <Sun className="absolute -right-6 -top-6 h-40 w-40 opacity-10" aria-hidden />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Latest devotional</p>
              {devotionals.isLoading ? (
                <Skeleton className="mt-4 h-24 bg-primary-foreground/20" />
              ) : devotional ? (
                <>
                  <p className="mt-4 text-xs opacity-80">{day(devotional.publish_date)}</p>
                  <h3 className="mt-1 text-2xl font-bold sm:text-3xl">{devotional.title}</h3>
                  <p className="mt-4 border-l-2 border-accent pl-4 text-sm italic opacity-90">{devotional.scripture}</p>
                  <p className="mt-4 line-clamp-3 text-sm leading-7 opacity-90">{devotional.description}</p>
                </>
              ) : (
                <p className="mt-4 text-sm opacity-90">Devotionals will appear here once published.</p>
              )}
              <Button asChild variant="secondary" className="mt-6 rounded-full">
                <Link to={paths.devotionals}>Read devotionals <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </article>
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold"><BookMarked className="h-5 w-5 text-primary" /> Bible study</h3>
                <Link to={paths.bibleStudy} className="text-sm font-semibold text-primary hover:underline">View all</Link>
              </div>
              <ul className="mt-4 divide-y">
                {studies.isLoading
                  ? [0, 1, 2].map((i) => <li key={i} className="py-3"><Skeleton className="h-10" /></li>)
                  : latestStudies.length
                    ? latestStudies.map((s) => (
                        <li key={s.id}>
                          <Link to={paths.bibleStudy} className="group block py-3">
                            <p className="font-semibold transition group-hover:text-primary">{s.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{s.scripture} · {s.category}</p>
                          </Link>
                        </li>
                      ))
                    : <li className="py-6 text-center text-sm text-muted-foreground">Study guides will appear here once published.</li>}
              </ul>
            </div>
          </div>
        </section>

        {/* Thematic areas */}
        <section className="bg-secondary py-14 sm:py-16" aria-labelledby="areas">
          <div className="container">
            <Eyebrow>Thematic Areas</Eyebrow>
            <h2 id="areas" className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">Our programme focus</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {programmeAreas.map((a) => (
                <Link
                  key={a.slug}
                  to={programmeAreaUrl(a.slug)}
                  className="group relative isolate flex min-h-60 flex-col justify-end overflow-hidden rounded-2xl p-5 text-primary-foreground shadow-card"
                >
                  <img src={a.image} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 -z-10 bg-hero-dark" />
                  <a.icon className="mb-auto h-6 w-6 text-accent" aria-hidden />
                  <h3 className="mt-8 font-bold leading-snug">{a.title}</h3>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent">
                    Learn more <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Get involved */}
        <section className="container py-14 sm:py-16">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
              <PenLine className="h-8 w-8 text-primary" />
              <h2 className="mt-4 text-2xl font-bold">Share your voice</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                Submit an original devotional, reflection or study guide. Approved contributions are published with your name.
              </p>
              <Button asChild variant="outline" className="mt-6 w-fit rounded-full">
                <Link to={paths.contributions}>Contribute <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="flex flex-col rounded-2xl bg-accent p-6 text-accent-foreground shadow-card sm:p-8">
              <HandHeart className="h-8 w-8 text-primary" />
              <h2 className="mt-4 text-2xl font-bold">Invest in a student</h2>
              <p className="mt-2 flex-1 text-sm opacity-85">
                Your gift funds leadership training, mentorship, wellness campaigns and outreach for students.
              </p>
              <Button asChild className="mt-6 w-fit rounded-full">
                <Link to={paths.donate}>Donate now <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
