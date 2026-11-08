import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Check,
  FileText,
  HandHeart,
  HeartHandshake,
  History,
  Loader2,
  Lock,
  Mail,
  Repeat,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PaymentMethodPicker, payLabel } from "@/components/common/PaymentMethod";
import { useAuth } from "@/hooks/useAuth";
import { usePayment } from "@/hooks/usePayments";
import { programmeAreas } from "@/config/programmeAreas";
import {
  donationFrequencies,
  donationSchema,
  type DonationInput,
} from "@/services/programmes/donations";
import { kes } from "@/lib/booking";
import { cn } from "@/lib/utils";
import { accountView, paths } from "@/routes/paths";
import heroImage from "@/assets/programmes/donate-hero.webp";

const presets = [
  { amount: 500, tier: "Supporter" },
  { amount: 1000, tier: "Friend" },
  { amount: 2500, tier: "Partner" },
  { amount: 5000, tier: "Champion" },
];

const funds: { id: DonationInput["fund"]; title: string; short: string; icon: LucideIcon }[] = [
  { id: "general", title: "Where most needed", short: "Let CSLC direct your gift to the greatest need.", icon: Sparkles },
  ...programmeAreas.map((a) => ({ id: a.slug, title: a.title, short: a.short, icon: a.icon })),
];

const DRAFT_KEY = "cslc-donation-draft";
type Draft = Pick<DonationInput, "amount" | "fund" | "frequency">;
const readDraft = (): Partial<Draft> => {
  try {
    const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "{}");
    const parsed = donationSchema.pick({ amount: true, fund: true, frequency: true }).partial().safeParse(d);
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
};

const Step = ({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) => (
  <section className="space-y-4">
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {n}
      </span>
      <div>
        <h3 className="font-semibold leading-7">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
    <div className="sm:pl-10">{children}</div>
  </section>
);

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p role="alert" className="text-xs text-destructive">{msg}</p> : null;

const trust: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Lock, title: "Secure checkout", text: "Payments run through M-Pesa or Paystack. We never see or store card details or PINs." },
  { icon: FileText, title: "Instant receipt", text: "An official CSLC receipt is issued only after your payment is confirmed." },
  { icon: History, title: "Track your giving", text: "Every gift is saved to the donations history in your account." },
];

const faqs = [
  { q: "Is my payment secure?", a: "Yes. Amounts are checked on our servers and every payment is confirmed directly with M-Pesa or Paystack before a receipt is issued. Card details and M-Pesa PINs are entered with the payment provider, never on this site." },
  { q: "How do monthly, quarterly or yearly gifts work?", a: "Today's gift is charged once. Your chosen rhythm is recorded with the gift as a pledge so CSLC can plan with you — you will never be charged automatically." },
  { q: "Can I choose what my gift supports?", a: "Yes. Pick one of the four student programme areas, or choose “Where most needed” so CSLC can direct it to the greatest need." },
  { q: "Where can I find my receipts?", a: "Your receipt opens as soon as the payment is confirmed, and every donation is listed under My Donations in your account." },
];

/** Donation experience: frequency, amount, designation, details and payment. Sign-in is required to pay. */
export function DonateForm() {
  const { user } = useAuth();
  const give = usePayment();
  const draft = readDraft();
  const [f, setF] = useState<DonationInput>({
    name: (user?.user_metadata?.full_name as string) ?? "",
    email: user?.email ?? "",
    phone: "",
    amount: draft.amount ?? 1000,
    message: "",
    fund: draft.fund ?? "general",
    frequency: draft.frequency ?? "once",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DonationInput, string>>>({});

  useEffect(() => {
    if (!user) return;
    setF((c) => ({
      ...c,
      name: c.name || ((user.user_metadata?.full_name as string) ?? ""),
      email: c.email || (user.email ?? ""),
    }));
  }, [user]);

  useEffect(() => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ amount: f.amount, fund: f.fund, frequency: f.frequency }));
  }, [f.amount, f.fund, f.frequency]);

  const patch = (p: Partial<DonationInput>) => {
    setF((c) => ({ ...c, ...p }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(p)) delete next[k as keyof DonationInput];
      return next;
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = donationSchema.safeParse(f);
    if (!r.success) {
      const out: typeof errors = {};
      for (const issue of r.error.issues) out[issue.path[0] as keyof DonationInput] ??= issue.message;
      setErrors(out);
      return;
    }
    give.mutate({ kind: "donation", ...r.data });
  };

  const amount = Number.isFinite(f.amount) ? Math.max(0, f.amount) : 0;
  const fund = funds.find((x) => x.id === f.fund) ?? funds[0];
  const freq = donationFrequencies.find((x) => x.id === f.frequency)!;
  const signIn = `${paths.auth}?next=${encodeURIComponent(paths.donate)}`;

  return (
    <div className="mx-auto max-w-7xl space-y-10 sm:space-y-14">
      {/* Trust strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        {trust.map((t) => (
          <div key={t.title} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <t.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{t.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Giving form */}
        <form
          noValidate
          onSubmit={submit}
          className="min-w-0 space-y-8 rounded-3xl border border-border/70 bg-card p-5 shadow-xl shadow-primary/[0.04] sm:p-8 lg:col-span-7"
        >
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Give with purpose</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Make a gift</h2>
              <p className="mt-1 text-sm text-muted-foreground">It takes less than a minute.</p>
            </div>
            <Badge variant="secondary" className="rounded-full">Sandbox · no real money</Badge>
          </header>

          <Step n={1} title="How often would you like to give?">
            <div role="radiogroup" aria-label="Giving frequency" className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5 sm:grid-cols-4">
              {donationFrequencies.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  role="radio"
                  aria-checked={f.frequency === x.id}
                  onClick={() => patch({ frequency: x.id })}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    f.frequency === x.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {x.label}
                </button>
              ))}
            </div>
            {f.frequency !== "once" && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-secondary px-3 py-2.5 text-xs leading-5 text-secondary-foreground">
                <Repeat className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Today's gift is charged once and recorded as your {freq.label.toLowerCase()} pledge. You'll never be charged automatically.
              </p>
            )}
          </Step>

          <Step n={2} title="Choose an amount" hint="Select a gift level or enter your own amount.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {presets.map((p) => {
                const on = f.amount === p.amount;
                return (
                  <button
                    key={p.amount}
                    type="button"
                    aria-pressed={on}
                    onClick={() => patch({ amount: p.amount })}
                    className={cn(
                      "relative rounded-2xl border-2 px-3 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      on ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
                    )}
                  >
                    {on && <Check className="absolute right-2.5 top-2.5 h-4 w-4" />}
                    <span className={cn("block text-[11px] font-semibold uppercase tracking-wider", on ? "text-primary-foreground/80" : "text-muted-foreground")}>{p.tier}</span>
                    <span className="mt-1 block text-lg font-bold">{kes(p.amount)}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="amt">Or enter a custom amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">KSh</span>
                <Input
                  id="amt"
                  type="number"
                  min={10}
                  max={1000000}
                  step={1}
                  inputMode="numeric"
                  value={Number.isFinite(f.amount) && f.amount ? f.amount : ""}
                  onChange={(e) => patch({ amount: e.target.value === "" ? NaN : Number(e.target.value) })}
                  placeholder="Enter amount"
                  aria-invalid={!!errors.amount}
                  className="h-12 rounded-xl pl-14 text-base font-semibold"
                />
              </div>
              <FieldError msg={errors.amount} />
            </div>
          </Step>

          <Step n={3} title="Where should your gift go?">
            <div role="radiogroup" aria-label="Gift designation" className="grid gap-2.5 sm:grid-cols-2">
              {funds.map((x) => {
                const on = f.fund === x.id;
                return (
                  <button
                    key={x.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => patch({ fund: x.id })}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      x.id === "general" && "sm:col-span-2",
                      on ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                    )}
                  >
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", on ? "bg-primary text-primary-foreground" : "bg-muted text-primary")}>
                      <x.icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{x.title}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{x.short}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Step>

          {!user ? (
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/[0.03] p-6 text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <HeartHandshake className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-semibold">Sign in to complete your gift</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                Your choices are saved. Signing in links your receipt and giving history to your account.
              </p>
              <Button asChild className="mt-5 h-12 w-full max-w-xs rounded-xl font-semibold">
                <Link to={signIn}>Sign in to give {kes(amount)}</Link>
              </Button>
            </div>
          ) : (
            <>
              <Step n={4} title="Your details" hint="Used for your receipt and payment prompt.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="dn">Full name</Label>
                    <Input id="dn" autoComplete="name" maxLength={120} value={f.name} onChange={(e) => patch({ name: e.target.value })} aria-invalid={!!errors.name} className="h-12 rounded-xl" />
                    <FieldError msg={errors.name} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="de">Email address</Label>
                    <Input id="de" type="email" autoComplete="email" maxLength={200} value={f.email} onChange={(e) => patch({ email: e.target.value })} aria-invalid={!!errors.email} className="h-12 rounded-xl" />
                    <FieldError msg={errors.email} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dp">{give.method === "mpesa" ? "M-Pesa number" : "Phone number"}</Label>
                    <Input id="dp" type="tel" inputMode="tel" autoComplete="tel" placeholder="07XX XXX XXX" maxLength={16} value={f.phone} onChange={(e) => patch({ phone: e.target.value })} aria-invalid={!!errors.phone} className="h-12 rounded-xl" />
                    <FieldError msg={errors.phone} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="dm">
                      Message <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea id="dm" maxLength={400} rows={3} value={f.message} onChange={(e) => patch({ message: e.target.value })} placeholder="Leave an encouraging word for students…" className="resize-y rounded-xl" />
                    <FieldError msg={errors.message} />
                  </div>
                </div>
              </Step>

              <Step n={5} title="Payment">
                <PaymentMethodPicker value={give.method} onChange={give.setMethod} />
              </Step>

              <div className="space-y-4 rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20 sm:p-6">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-primary-foreground/70">Gift</dt><dd className="text-right font-medium">{freq.id === "once" ? "One-time gift" : `${freq.label} pledge`}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-primary-foreground/70">Supports</dt><dd className="text-right font-medium">{fund.title}</dd></div>
                  <div className="flex items-end justify-between gap-4 border-t border-primary-foreground/20 pt-3"><dt className="font-semibold">Charged today</dt><dd className="text-2xl font-bold tracking-tight">{kes(amount)}</dd></div>
                </dl>
                <Button type="submit" variant="secondary" disabled={give.isPending} className="h-12 w-full rounded-xl text-sm font-semibold">
                  {give.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{give.method === "mpesa" ? "Sending M-Pesa prompt…" : "Opening secure checkout…"}</>
                  ) : (
                    <><HandHeart className="mr-2 h-4 w-4" />{payLabel(give.method)} · {kes(amount)}</>
                  )}
                </Button>
                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-primary-foreground/70">
                  <ShieldCheck className="h-3.5 w-3.5" /> Confirmed with the payment provider before any receipt is issued.
                </p>
              </div>
              {give.error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{give.error.message}</p>}
            </>
          )}
        </form>

        {/* Impact panel */}
        <aside className="space-y-5 lg:sticky lg:top-28 lg:col-span-5">
          <div className="relative isolate overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-xl">
            <img src={heroImage} alt="Students celebrating together at sunset" loading="lazy" decoding="async" className="h-56 w-full object-cover sm:h-64" />
            <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-t from-primary via-primary/20 to-transparent sm:h-64" />
            <div className="relative -mt-16 space-y-4 p-6 sm:p-7">
              <p className="font-script text-4xl leading-none text-accent">Empowered to Transform</p>
              <p className="text-sm leading-7 text-primary-foreground/80">
                Your generosity helps CSLC nurture servant leaders, deepen faith and walk alongside students through campus life and beyond.
              </p>
              <ul className="space-y-3 pt-1">
                {programmeAreas.map((a) => (
                  <li key={a.slug} className="flex items-center gap-3">
                    <img src={a.image} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-xl object-cover ring-2 ring-primary-foreground/20" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{a.title}</span>
                      <span className="block truncate text-xs text-primary-foreground/70">{a.short}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <p className="font-semibold">Already given?</p>
                <p className="text-sm leading-6 text-muted-foreground">View receipts and your full giving history any time.</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link to={user ? accountView("donations") : signIn}>My donations</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="rounded-full">
                    <Link to={paths.contact}><Mail className="mr-1.5 h-3.5 w-3.5" />Ask a question</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Giving questions</h2>
        <Accordion type="single" collapsible className="mt-6 rounded-3xl border border-border/70 bg-card px-5 shadow-sm sm:px-7">
          {faqs.map((x, i) => (
            <AccordionItem key={x.q} value={`q${i}`} className={i === faqs.length - 1 ? "border-b-0" : ""}>
              <AccordionTrigger className="text-left text-sm font-semibold sm:text-base">{x.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-6 text-muted-foreground">{x.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
