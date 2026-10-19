import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, HeartHandshake, Leaf, MapPin, ShieldCheck, Sparkles, Users, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hospitalityServices, site } from "@/config/site";
import { paths } from "@/routes/paths";
import { useAuth } from "@/hooks/useAuth";
import hero from "@/assets/hero.jpg";

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-secondary">
      <img src={hero} alt="CSLC grounds and building" width={1600} height={912} fetchPriority="high" className="absolute inset-y-0 right-0 h-full w-full object-cover md:w-[70%]" />
      <div className="absolute inset-0 bg-background/80 md:bg-hero-fade md:bg-transparent" />
      <div className="container relative pb-36 pt-32 md:pb-44 md:pt-40">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide shadow-card">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Stay. Meet. Celebrate.
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Welcome to CSLC</h1>
          <p className="font-script text-5xl leading-tight text-primary sm:text-6xl">Hospitality Services</p>
          <p className="mt-4 max-w-md text-muted-foreground">Accommodation, conference facilities, dining, grounds, catering and hostels at {site.location.split(",")[0]} — everything you need for your stay or event.</p>
          <Button asChild size="lg" className="mt-7 rounded-full px-7">
            <a href="#services">Explore Services <ArrowRight className="h-4 w-4" /></a>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function QuickServicesCard() {
  return (
    <div className="container relative z-10 -mt-24">
      <div className="rounded-2xl bg-card p-5 shadow-card md:p-6">
        <p className="mb-4 text-sm font-semibold">What are you planning?</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {hospitalityServices.map(({ id, title, icon: Icon }) => (
            <a key={id} href={`#${id}`} className="flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition hover:border-primary hover:bg-secondary hover:text-primary">
              <Icon className="h-4 w-4 shrink-0 text-primary" /> <span className="truncate">{title}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

const features = [
  { icon: MapPin, title: "Central Location", text: "Based at Ufungamano House in Nairobi." },
  { icon: HeartHandshake, title: "Warm Hospitality", text: "A welcoming environment for every guest." },
  { icon: ShieldCheck, title: "Secure Accounts", text: "Your details are kept safe with us." },
  { icon: Leaf, title: "Peaceful Grounds", text: "Green spaces for rest and reflection." },
];

export function FeatureStrip() {
  return (
    <section className="container grid gap-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
      {features.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary"><Icon className="h-5 w-5 text-primary" /></span>
          <div><p className="text-sm font-semibold">{title}</p><p className="text-sm text-muted-foreground">{text}</p></div>
        </div>
      ))}
    </section>
  );
}

export function ServicesGrid() {
  return (
    <section id="services" className="container scroll-mt-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Our Hospitality Services</h2>
          <p className="mt-1 text-muted-foreground">Six ways we can host you.</p>
        </div>
        <Button asChild variant="outline" className="rounded-full border-primary text-primary">
          <a href="#contact">Make an Enquiry <ArrowRight className="h-4 w-4" /></a>
        </Button>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {hospitalityServices.map((s) => (
          <article id={s.id} key={s.id} className="group relative h-72 scroll-mt-24 overflow-hidden rounded-2xl shadow-card">
            <img src={s.image} alt={s.title} loading="lazy" width={944} height={704} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-overlay" />
            <span className="absolute left-4 top-4 rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary">{s.tag}</span>
            <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground">
              <h3 className="text-xl font-bold">{s.title}</h3>
              <p className="mt-1 text-sm opacity-90">{s.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const reasons = [
  { icon: Sparkles, title: "Wide Range of Services", text: "Stay, meet, dine and celebrate in one place." },
  { icon: Users, title: "Built for Groups", text: "Suited to delegates, students and organisations." },
  { icon: CalendarCheck, title: "Simple Enquiries", text: "Create an account to manage your requests." },
  { icon: HeartHandshake, title: "Mission-Driven", text: "Serving the Christian student leadership community." },
];

export function WhyChoose() {
  return (
    <section id="why" className="container grid scroll-mt-6 items-center gap-10 py-16 lg:grid-cols-2">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Why Choose <span className="font-script text-4xl font-normal text-primary">CSLC?</span></h2>
        <div className="mt-2 h-0.5 w-12 rounded bg-accent" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {reasons.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary"><Icon className="h-4 w-4 text-primary" /></span>
              <div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-muted-foreground">{text}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative overflow-hidden rounded-2xl shadow-card">
        <img src={hospitalityServices[3].image} alt="CSLC gardens" loading="lazy" width={944} height={704} className="h-72 w-full object-cover sm:h-80" />
        <div className="absolute inset-0 bg-primary/60" />
        <div className="absolute inset-0 flex flex-col justify-center p-8 text-primary-foreground">
          <p className="text-[11px] font-semibold uppercase tracking-widest">Let's plan</p>
          <p className="mt-2 max-w-xs text-2xl font-bold sm:text-3xl">Your Next Event or Stay Awaits!</p>
          <p className="mt-2 max-w-xs text-sm opacity-90">Tell us what you need and our team will get back to you.</p>
          <Button asChild variant="secondary" className="mt-5 w-fit rounded-full">
            <a href="#contact">Plan With Us <ArrowRight className="h-4 w-4" /></a>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function ContactBand() {
  const { user } = useAuth();
  return (
    <section id="contact" className="container scroll-mt-6 pb-16">
      <div className="flex flex-col gap-6 rounded-2xl bg-primary p-8 text-primary-foreground md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <MapPin className="mt-1 h-7 w-7 shrink-0 text-accent" />
          <div>
            <p className="text-lg font-bold">Visit or Contact Us</p>
            <p className="text-sm opacity-90">{site.name} · {site.location}</p>
            <p className="mt-1 text-sm opacity-80">{user ? `Signed in as ${user.email}.` : "Create an account to send and track enquiries as booking opens."}</p>
          </div>
        </div>
        {!user && (
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="rounded-full"><Link to={`${paths.auth}?mode=signup`}><UserPlus className="h-4 w-4" /> Create Account</Link></Button>
            <Button asChild variant="outline" className="rounded-full border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"><Link to={paths.auth}><LogIn className="h-4 w-4" /> Sign In</Link></Button>
          </div>
        )}
      </div>
    </section>
  );
}
