import { useState } from "react";
import { z } from "zod";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Loader2,
  Building2,
} from "lucide-react";

import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { PageContainer } from "@/components/common/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supportService } from "@/services/support";
import { site } from "@/config/site";
import hero from "@/assets/svc-grounds.jpg";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  subject: z.string().trim().min(1, "Subject is required").max(150),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

const ContactPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [sending, setSending] = useState(false);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((previous) => ({
        ...previous,
        [key]: e.target.value,
      }));
    };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parsed = schema.safeParse(form);

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSending(true);

    try {
      await supportService.submitEnquiry(parsed.data as typeof form);

      toast.success(
        "Thank you for reaching out. The CSLC team will be in touch soon.",
      );

      setForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to send your message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const contactItems = [
    {
      icon: Mail,
      label: "Email us",
      value: site.email,
      href: `mailto:${site.email}`,
      description: "Send us your questions anytime.",
    },
    {
      icon: Phone,
      label: "Call our team",
      value: site.phone,
      href: `tel:${site.phone.replace(/\s/g, "")}`,
      description: "Speak with our team directly.",
    },
    {
      icon: MapPin,
      label: "Visit us",
      value: site.location,
      href: "#our-location",
      description: "We look forward to welcoming you.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative isolate overflow-hidden bg-slate-950">
          <img
            src={hero}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />

          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/70 via-slate-950/70 to-slate-950/70" />

          <div className="absolute -right-24 -top-28 -z-10 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -right-12 -top-16 -z-10 h-56 w-56 rounded-full border border-white/10" />

          <PageContainer className="relative py-14 text-center sm:py-16 lg:py-20">
            <div className="mx-auto flex max-w-3xl flex-col items-center">
              {/* BREADCRUMB */}
              <nav
                aria-label="Breadcrumb"
                className="mb-5 flex items-center justify-center gap-2 text-xs font-medium tracking-wide text-white/70 sm:text-sm"
              >
                <a href="/" className="transition hover:text-white">
                  Home
                </a>
                <span className="text-white/40">/</span>
                <span className="text-white" aria-current="page">
                  Contact Us
                </span>
              </nav>

              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Let’s start a
                <span className="block text-orange-400">conversation.</span>
              </h1>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/75 sm:text-base sm:leading-7">
                Questions about our services or programmes? We’re here to help.
              </p>

              <a
                href="#contact-form"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-50"
              >
                Get in touch
                <ArrowDownRight className="h-4 w-4" />
              </a>
            </div>
          </PageContainer>

          <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-orange-400/50 to-transparent" />
        </section>

        {/* MAIN CONTACT CONTENT */}
        <PageContainer className="py-12 sm:py-16 lg:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            {/* LEFT: CONTACT INFORMATION */}
            <aside className="space-y-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  CONTACT CSLC
                </p>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  We’d love to hear from you.
                </h2>

                <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
                  Whether you’re making an enquiry, planning a visit or need
                  assistance, our team is ready to help.
                </p>
              </div>

              <div className="space-y-3">
                {contactItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className="group flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-5"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{item.label}</p>

                        <p className="mt-1 break-words text-sm font-medium text-foreground/85">
                          {item.value}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>

                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                    </a>
                  );
                })}
              </div>

              {/* QUICK REASSURANCE */}
              <div className="rounded-2xl bg-muted/60 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                    <MessageCircle className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-semibold">Not sure who to contact?</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Send us a message with your enquiry and we’ll help direct
                      it to the appropriate team.
                    </p>
                  </div>
                </div>
              </div>

              {/* LOCATION MAP */}
              <div id="our-location" className="scroll-mt-24">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                      FIND US
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      Visit our location
                    </h3>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
                  <iframe
                    title="CSLC location map — Ufungamano House, Nairobi"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=36.8050%2C-1.2950%2C36.8250%2C-1.2790&layer=mapnik&marker=-1.2870%2C36.8150"
                    className="h-64 w-full sm:h-72"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />

                  <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate text-xs font-medium text-muted-foreground">
                        {site.location}
                      </span>
                    </div>

                    <a
                      href="https://www.openstreetmap.org/?mlat=-1.2870&mlon=36.8150#map=16/-1.2870/36.8150"
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-xs font-semibold text-primary hover:underline"
                    >
                      Directions
                    </a>
                  </div>
                </div>
              </div>
            </aside>

            {/* RIGHT: ENQUIRY FORM */}
            <section id="contact-form" className="scroll-mt-24">
              <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-[0_18px_60px_-30px_rgba(0,0,0,0.18)]">
                <div className="relative overflow-hidden border-b border-border bg-muted/40 px-5 py-6 sm:px-8 sm:py-8">
                  <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-primary/5" />

                  <div className="relative flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                      <Send className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        Send us a message
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Fill in the details below and our team will get back to
                        you as soon as possible.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={submit} className="space-y-5 p-5 sm:p-8">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="c-name">Full name</Label>
                      <Input
                        id="c-name"
                        name="name"
                        autoComplete="name"
                        placeholder="Your full name"
                        value={form.name}
                        onChange={set("name")}
                        maxLength={100}
                        required
                        disabled={sending}
                        className="h-12 rounded-xl bg-background px-4 transition focus-visible:ring-primary/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="c-email">Email address</Label>
                      <Input
                        id="c-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={set("email")}
                        maxLength={255}
                        required
                        disabled={sending}
                        className="h-12 rounded-xl bg-background px-4 transition focus-visible:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="c-subject">What can we help with?</Label>
                    <Input
                      id="c-subject"
                      name="subject"
                      placeholder="e.g. Accommodation booking enquiry"
                      value={form.subject}
                      onChange={set("subject")}
                      maxLength={150}
                      required
                      disabled={sending}
                      className="h-12 rounded-xl bg-background px-4 transition focus-visible:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="c-message">Your message</Label>
                      <span className="text-xs text-muted-foreground">
                        {form.message.length}/2000
                      </span>
                    </div>

                    <Textarea
                      id="c-message"
                      name="message"
                      placeholder="Tell us a little more about your enquiry..."
                      value={form.message}
                      onChange={set("message")}
                      rows={6}
                      maxLength={2000}
                      required
                      disabled={sending}
                      className="min-h-36 resize-y rounded-xl bg-background px-4 py-3 leading-6 transition focus-visible:ring-primary/30"
                    />
                  </div>

                  <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      Your enquiry will be shared with the CSLC team.
                    </p>

                    <Button
                      type="submit"
                      disabled={sending}
                      className="h-12 w-full rounded-xl px-6 font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:w-auto"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send message
                          <Send className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
                Prefer email? You can also reach us directly at{" "}
                <a
                  href={`mailto:${site.email}`}
                  className="font-medium text-primary hover:underline"
                >
                  {site.email}
                </a>
              </p>
            </section>
          </div>
        </PageContainer>

        {/* SIMPLE CLOSING BANNER */}
        <section className="px-4 pb-12 sm:px-6 sm:pb-16">
          <div
            className="mx-auto max-w-7xl overflow-hidden rounded-3xl"
            style={{ backgroundColor: "#751624" }}
          >
            <div className="flex flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-10">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                  CHRISTIAN STUDENT LEADERSHIP CENTRE
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                  We look forward to connecting with you.
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Thank you for your interest in CSLC and our services.
                </p>
              </div>

              <a
                href="#contact-form"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-50"
              >
                Contact our team
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ContactPage;
