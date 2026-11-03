import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BookMarked,
  CalendarDays,
  HandHeart,
  Hotel,
  Library,
  MapPin,
  ShoppingBag,
  Sparkles,
  Store,
  Phone,
  Mail,
  School,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { hospitalityServices, site } from "@/config/site";
import { branchUrl, eventUrl, paths, serviceUrl } from "@/routes/paths";
import { useEvents } from "@/hooks/programmes/useProgrammes";
import hero from "@/assets/hero.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import { useEffect, useState } from "react";
const heroes = [hero, hero2, hero3];
import reading from "@/assets/bookshop-reading.jpg";
import grad from "@/assets/grad.jpg";

export const Eyebrow = ({ children, light }: { children: React.ReactNode; light?: boolean }) => (
  <p className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] ${light ? "text-accent" : "text-primary"}`}>
    <span className="h-px w-6 bg-current" /> {children}
  </p>
);

const pillars: { icon: LucideIcon; title: string; text: string; to: string }[] = [
  { icon: Store, title: "Bookshop", text: "Yaya Centre & Kisumu", to: paths.bookshop },
  { icon: Hotel, title: "Hospitality", text: "Stay, meet and dine", to: "#hospitality" },
  { icon: CalendarDays, title: "Student Programmes", text: "Events & materials", to: paths.events },
  { icon: BookMarked, title: "Spiritual Resources", text: "Devotionals & Bible study", to: paths.devotionals },
  { icon: HandHeart, title: "Give", text: "Support student ministry", to: paths.donate },
];

const Go = ({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) =>
  to.startsWith("#") ? <a href={to} className={className}>{children}</a> : <Link to={to} className={className}>{children}</Link>;

export function InstitutionHero() {
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setSlide((i) => (i + 1) % heroes.length), 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      {heroes.map((src, i) => (
        <img key={src} src={src} alt={i ? "" : "Ufungamano House, home of CSLC"} aria-hidden={i > 0} fetchPriority={i ? "low" : "high"} loading={i ? "lazy" : "eager"} width={1600} height={912} className={`absolute inset-0 -z-20 h-full w-full object-cover transition-opacity duration-[900ms] ease-in-out will-change-[opacity,transform] motion-safe:animate-kenburns motion-reduce:transition-none ${i === slide ? "opacity-100" : "opacity-0"}`} />
      ))}
      <div className="absolute inset-0 -z-10 bg-hero-dark" />
      <div className="container pb-16 pt-20 md:pb-24 md:pt-28">
        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Eyebrow light>Ufungamano House, Nairobi</Eyebrow>
          <h1 className="mt-4 font-sans text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Christian Student <span className="text-accent">Leadership Centre</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm opacity-90 sm:text-base">
            One institution, three interconnected departments - a Christian bookshop, hospitality
            services and student programmes - serving students, churches and the wider community.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-7">
              <a href="#departments">Explore CSLC <ArrowRight className="h-4 w-4" /></a>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-full px-7">
              <Link to={paths.about}>About Us</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 bg-primary/70 backdrop-blur">
        <div className="container grid grid-cols-2 gap-px py-2 sm:grid-cols-3 lg:grid-cols-5">
          {pillars.map(({ icon: Icon, title, text, to }) => (
            <Go key={title} to={to} className="group flex items-center gap-3 rounded-lg px-2 py-3 transition hover:bg-primary-foreground/10">
              <Icon className="h-6 w-6 shrink-0 text-accent transition group-hover:scale-110" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{title}</span>
                <span className="block truncate text-xs opacity-75">{text}</span>
              </span>
            </Go>
          ))}
        </div>
      </div>
    </section>
  );
}

const departments = [
  { title: "Bookshop & E-commerce", text: "Christian books, Bibles and resources from our Yaya Centre and Kisumu branches — browse and shop online.", image: reading, to: paths.bookshop, cta: "Shop Books", icon: ShoppingBag },
  { title: "Hospitality Services", text: "Accommodation, conference halls, dining, grounds, outside catering and hostels at Ufungamano House.", image: hospitalityServices[1].image, to: "#hospitality", cta: "View Services", icon: Hotel },
  { title: "Student Programmes", text: "Events, programme materials, devotionals and Bible study resources that equip student leaders.", image: grad, to: paths.events, cta: "See Programmes", icon: School },
];

export function Departments() {
  return (
    <section id="departments" className="container scroll-mt-20 py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 ">
        <div>
          <Eyebrow>Our departments</Eyebrow>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Three Departments, One Mission</h2>
          <p className="mt-1 text-muted-foreground">Each department serves a different need within the same CSLC community.</p>
        </div>
        <Link to={paths.about} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">About CSLC <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {departments.map(({ title, text, image, to, cta, icon: Icon }) => (
          <Go key={title} to={to} className="group overflow-hidden rounded-2xl border bg-card shadow-card transition hover:-translate-y-1">
            <div className="relative h-52 overflow-hidden">
              <img src={image} alt={title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card text-primary shadow-card"><Icon className="h-5 w-5" /></span>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">{cta} <ArrowUpRight className="h-4 w-4" /></span>
            </div>
          </Go>
        ))}
      </div>
    </section>
  );
}

export function IntroSplit() {
  const points = [
    { icon: Library, title: "Christian literature", text: "Two bookshop branches serving readers across Kenya." },
    { icon: Hotel, title: "Hospitality", text: "Spaces to stay, meet, dine and gather." },
    { icon: CalendarDays, title: "Programmes", text: "Events and materials for student leaders." },
    { icon: HandHeart, title: "Giving", text: "Donations that support student ministry." },
  ];
  return (
    <section className="grid bg-secondary/50 lg:grid-cols-2">
      <img src={hospitalityServices[3].image} alt="CSLC grounds" loading="lazy" className="h-72 w-full object-cover lg:h-full" />
      <div className="container grid gap-8 py-14 lg:max-w-none lg:grid-cols-[1.2fr_1fr] lg:px-12">
        <div>
          <Eyebrow>About CSLC</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold leading-tight">Rooted at Ufungamano House, <span className="font-script text-4xl font-normal text-primary">serving many</span></h2>
          <p className="mt-4 text-sm text-muted-foreground">
            The {site.name} brings together its bookshop, hospitality and student programmes so that
            every visit, purchase and gathering supports the same community.
          </p>
          <Button asChild className="mt-6 rounded-full"><Link to={paths.about}>Learn More About Us <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
        <div className="space-y-5 lg:border-l lg:pl-6">
          {points.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-muted-foreground">{text}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BookshopBand() {
  const branches = [
    { name: "Yaya Centre Bookshop", to: branchUrl("yaya") },
    { name: "Kisumu Bookshop", to: branchUrl("kisumu") },
  ];
  return (
    <section className="container grid items-center gap-10 py-16 lg:grid-cols-2">
      <div>
        <Eyebrow>Bookshop & E-commerce</Eyebrow>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Books that nurture faith and leadership</h2>
        <p className="mt-3 text-muted-foreground">Browse our catalogue online, choose a branch and check out securely. Each branch shows only what it has in stock.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {branches.map((b) => (
            <Link key={b.name} to={b.to} className="flex items-center justify-between rounded-xl border bg-card p-4 transition hover:border-primary hover:text-primary">
              <span className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4 text-primary" />{b.name}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ))}
        </div>
        <Button asChild className="mt-6 rounded-full"><Link to={paths.bookshop}>Browse All Books <ShoppingBag className="h-4 w-4" /></Link></Button>
      </div>
      <img src={reading} alt="Reading at the CSLC bookshop" loading="lazy" className="h-80 w-full rounded-2xl object-cover shadow-card" />
    </section>
  );
}

export function HospitalityBand() {
  return (
    <section id="hospitality" className="relative isolate scroll-mt-20 overflow-hidden bg-primary py-16 text-primary-foreground">
      <img src={hospitalityServices[0].image} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25" />
      <div className="container">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow light>Hospitality</Eyebrow>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              <span className="font-script text-5xl font-normal text-accent">Hospitality Services</span>
            </h2>
            <p className="mt-1 opacity-85">Six ways we can host you at Ufungamano House.</p>
          </div>
          <Button asChild variant="secondary" className="rounded-full"><Link to={paths.book}>Book Now <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {hospitalityServices.map(({ id, title, description, icon: Icon }) => (
            <Link key={id} to={serviceUrl(id)} className="group rounded-xl border border-primary-foreground/15 bg-primary/60 p-4 text-center backdrop-blur transition hover:-translate-y-1 hover:border-accent">
              <Icon className="mx-auto h-7 w-7 text-accent" />
              <p className="mt-3 text-sm font-semibold">{title}</p>
              <p className="mt-1 line-clamp-2 text-xs opacity-75">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const programmeLinks = [
  { icon: CalendarDays, title: "Events", to: paths.events },
  { icon: BookOpen, title: "Daily Devotionals", to: paths.devotionals },
  { icon: BookMarked, title: "Bible Study", to: paths.bibleStudy },
  { icon: Library, title: "Programme Materials", to: paths.materials },
  { icon: HandHeart, title: "Donate", to: paths.donate },
];

export function ProgrammesSection() {
  const { data: events = [] } = useEvents();
  const upcoming = events.slice(0, 3);
  return (
    <section className="container py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Student Programmes & Spiritual Resources</Eyebrow>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Grow, gather and give</h2>
        </div>
        <Link to={paths.events} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">All Events <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <div className="mb-8 flex flex-wrap gap-2">
        {programmeLinks.map(({ icon: Icon, title, to }) => (
          <Link key={title} to={to} className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary">
            <Icon className="h-4 w-4 text-primary" /> {title}
          </Link>
        ))}
      </div>
      {upcoming.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((e) => (
            <Link key={e.id} to={eventUrl(e.id)} className="group overflow-hidden rounded-2xl border bg-card shadow-card transition hover:-translate-y-1">
              {e.poster_url && <img src={e.poster_url} alt={e.title} loading="lazy" className="h-48 w-full object-cover" />}
              <div className="p-5">
                <p className="text-xs font-semibold text-primary">{new Date(e.event_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} · {e.venue}</p>
                <h3 className="mt-1 font-bold">{e.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">New events will appear here once published.</p>
      )}
    </section>
  );
}

export function EnquiryBand() {
  return (
    <section id="contact" className="container scroll-mt-20 pb-16">
      <div className="grid gap-6 rounded-2xl bg-primary p-8 text-primary-foreground md:grid-cols-[1.4fr_1fr] md:items-center md:p-10">
        <div>
          <Eyebrow light>Get in touch</Eyebrow>
          <p className="mt-2 text-2xl font-bold sm:text-3xl">Plan a visit, an order or an event with us</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm opacity-90">
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" />{site.location}</span>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:underline"><Phone className="h-4 w-4 text-accent" />{site.phone}</a>
            <a href={`mailto:${site.email}`} className="flex items-center gap-2 hover:underline"><Mail className="h-4 w-4 text-accent" />{site.email}</a>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <Button asChild variant="secondary" className="rounded-full"><Link to={paths.contact}>Send an Enquiry</Link></Button>
          <Button asChild variant="outline" className="rounded-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to={paths.donate}>Donate</Link></Button>
        </div>
      </div>
    </section>
  );
}
