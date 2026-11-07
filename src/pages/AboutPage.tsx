import { Link } from "react-router-dom";
import { ArrowRight, BookMarked, Hotel, Store, UserRound, FileText } from "lucide-react";
import { programmeAreas } from "@/config/programmeAreas";
import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/home/InstitutionSections";
import { site } from "@/config/site";
import { paths, programmeAreaUrl } from "@/routes/paths";
import { useLeadership } from "@/hooks/useLeadership";
import hero from "@/assets/banner.jpg";
import grounds from "@/assets/ufungamano.jpg";

const Placeholder = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-xl border border-dashed bg-muted/40 p-4 text-sm italic text-muted-foreground">{children}</p>
);

const AboutPage = () => {
  const team = useLeadership();
  const members = team.data ?? [];
  return (
  <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background">
    <SiteHeader />
    <main className="flex-1">
      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <img src={hero} alt="" fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-hero-dark" />
        <div className="container py-16 text-center sm:py-24">
          <nav aria-label="Breadcrumb" className="mb-4 flex justify-center gap-2 text-sm opacity-80">
            <Link to={paths.home} className="hover:underline">Home</Link><span>/</span><span aria-current="page">About</span>
          </nav>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">About <span className="font-script text-5xl font-normal text-accent sm:text-6xl">CSLC?</span></h1>
          <p className="mt-3 font-script text-3xl text-accent sm:text-4xl">Empowered to Transform</p>
          <p className="mx-auto mt-3 max-w-xl text-sm opacity-90 sm:text-base">{site.name}, {site.location}.</p>
        </div>
      </section>

      <section className="container grid items-center gap-10 py-16 lg:grid-cols-2">
        <img src={grounds} alt="CSLC grounds at Ufungamano House" loading="lazy" className="h-84 w-full rounded-2xl object-cover shadow-card" />
        <div>
          <Eyebrow>Institutional overview</Eyebrow>
          <h2 className="mt-2 text-3xl font-bold">Our institution history</h2>
          <div className="mt-3 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              The Christian Student Leadership Centre, Ufungamano House, is a ministry to the Nairobi University community. 
              Its main objective is to facilitate the development of leadership and other skills to the students and the academic communit
            </p>
            <p>
              In 1965, the University Chaplaincy was given a British Christian Aid Fund
              to buy the Centre, which was quite small at that time.
            </p>

            <p>
              By 1966, a joint Protestant/Anglican/Catholic Board on the Churches
              Chaplaincy and the Catholic Chaplaincy to the University decided to
              reconstruct and enlarge the house so that it could be used as an
              ecumenical Student Centre.
            </p>

            <p>
              Thus, the NCCK (National Council of Churches of Kenya) and KEC
              (Kenya Episcopal Conference) jointly negotiated and raised funds from
              both local and overseas donors towards the building of Ufungamano House.
              The founding fathers of the Centre had the vision to embark on an
              endeavour that gave birth to Ufungamano House.
            </p>

            <p>
              The name Ufungamano House encompasses the true function of the Centre,
              which seeks to unify the Protestant and Catholic faiths in the spirit
              of ecumenical Christian service to the University community.
            </p>

            <p>
              It has come a long way from its humble beginnings.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[{ i: Store, t: "Bookshop", to: paths.bookshop }, { i: Hotel, t: "Hospitality", to: paths.book }, { i: BookMarked, t: "Programmes", to: paths.events }].map(({ i: Icon, t, to }) => (
              <Link key={t} to={to} className="flex items-center gap-2 rounded-xl border bg-card p-3 text-sm font-semibold transition hover:border-primary hover:text-primary"><Icon className="h-4 w-4 text-primary" />{t}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/50 py-16">
        <div className="container grid gap-8 md:grid-cols-2">
          <div id="mission" className="scroll-mt-24 rounded-2xl bg-card p-6 shadow-card">
            <Eyebrow>Our mission</Eyebrow>
            <h2 className="mb-4 mt-2 text-2xl font-bold">Our Mission</h2>
            <Placeholder>To provide university students with a place and forum for holistic Christian formation and transformational leadership training</Placeholder>
          </div>
          <div id="history" className="scroll-mt-24 rounded-2xl bg-card p-6 shadow-card">
            <Eyebrow>Our history</Eyebrow>
            <h2 className="mb-4 mt-2 text-2xl font-bold">Our History</h2>
            <Placeholder>A Christian Centre of excellence empowering university students holistically in order to transform society.</Placeholder>
          </div>
        </div>
      </section>

      <section id="programmes" className="container scroll-mt-24 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Student programmes</Eyebrow>
          <h2 className="mt-2 text-3xl font-bold">Empowered to <span className="font-script text-4xl font-normal text-accent">Transform</span></h2>
          <p className="mt-3 text-muted-foreground">Four programme areas shape how we walk with students — in faith, leadership and life.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {programmeAreas.map((a) => (
            <Link key={a.slug} to={programmeAreaUrl(a.slug)} className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="relative h-48 overflow-hidden">
                <img src={a.image} alt={a.title} loading="lazy" width={1200} height={800} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-card text-primary shadow-card"><a.icon className="h-5 w-5" /></span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h3 className="font-bold leading-snug group-hover:text-primary">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.short}</p>
                <span className="mt-auto flex items-center gap-1 pt-3 text-sm font-semibold text-primary">Explore programme <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="team" className="container scroll-mt-24 py-16">
        <Eyebrow>Leadership & team</Eyebrow>
        <h2 className="mt-2 text-3xl font-bold">Meet the Team</h2>
        {members.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed bg-muted/40 p-4 text-sm italic text-muted-foreground">
            Our leadership team profiles will be published here soon.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <article key={m.id} className="group overflow-hidden rounded-2xl border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-lg">
                <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                  {m.image_url ? (
                    <img src={m.image_url} alt={m.full_name} loading="lazy" width={480} height={480} className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-primary"><UserRound className="h-14 w-14" /></span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 h-1 bg-accent" />
                </div>
                <div className="p-5 text-center">
                  <h3 className="text-lg font-bold">{m.title ? `${m.title} ` : ""}{m.full_name}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary">{m.role}</p>
                  {m.bio && <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">{m.bio}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="research" className="container scroll-mt-24 pb-16">
        <div className="grid gap-6 rounded-2xl bg-primary p-8 text-primary-foreground md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex gap-4">
            <FileText className="h-8 w-8 shrink-0 text-accent" />
            <div>
              <h2 className="text-2xl font-bold">Research & Publications</h2>
              <p className="mt-1 text-sm opacity-85">Details of CSLC research and publications will be shared here once provided. Meanwhile, explore our programme materials.</p>
            </div>
          </div>
          <Button asChild variant="secondary" className="rounded-full"><Link to={paths.materials}>Programme Materials</Link></Button>
        </div>
      </section>
      <section aria-label="Our partners" className="overflow-hidden border-y bg-secondary/40 py-6">
        <div className="flex w-max animate-marquee gap-0 whitespace-nowrap text-sm font-semibold tracking-wide text-foreground/80 sm:text-base hover:[animation-play-state:paused]">
          {[0, 1].map((k) => (
            <span key={k} aria-hidden={k > 0} className="flex items-center">
              {["National Council of Churches of Kenya (NCCK)", "Kenya Conference of Catholic Bishops (KCCB)", "University of Nairobi (UoN)", "National Council of Churches of Kenya (NCCK)", "Kenya Conference of Catholic Bishops (KCCB)", "University of Nairobi (UoN)"].map((n, i) => (
                <span key={i} className="flex items-center">
                  <span className="px-6">{n}</span>
                  <span className="text-xl leading-none text-accent">·</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
  );
};

export default AboutPage;
