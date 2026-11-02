import { Link } from "react-router-dom";
import { BookMarked, Hotel, Store, UserRound, FileText } from "lucide-react";
import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/home/InstitutionSections";
import { site } from "@/config/site";
import { paths } from "@/routes/paths";
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
          <p className="mx-auto mt-4 max-w-xl text-sm opacity-90 sm:text-base">{site.name}, {site.location}.</p>
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

      <section id="team" className="container scroll-mt-24 py-16">
        <Eyebrow>Leadership & team</Eyebrow>
        <h2 className="mt-2 text-3xl font-bold">Meet the Team</h2>
        <p className="mt-1 text-sm text-muted-foreground">Names and photos will be added once confirmed.</p>
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {team.map((m) => (
            <div key={m.role} className="rounded-2xl border bg-card p-5 text-center shadow-card">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-primary"><UserRound className="h-9 w-9" /></span>
              <p className="mt-4 font-semibold">Name to be confirmed</p>
              <p className="text-sm text-primary">{m.role}</p>
              <p className="mt-1 text-xs text-muted-foreground">{m.area}</p>
              <Link to={m.to} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View section <ArrowRight className="h-3 w-3" /></Link>
            </div>
          ))}
        </div>
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
    </main>
    <SiteFooter />
  </div>
);

export default AboutPage;
