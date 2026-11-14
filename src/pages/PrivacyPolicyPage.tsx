import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteFooter } from "@/components/common/SiteFooter";
import { Eyebrow } from "@/components/home/InstitutionSections";
import { site } from "@/config/site";
import { paths } from "@/routes/paths";

const UPDATED = "14 November 2026";

type Section = { id: string; title: string; body: React.ReactNode };

const sections: Section[] = [
  {
    id: "who-we-are",
    title: "1. Who we are",
    body: (
      <p>
        This website and its online services are operated by the {site.name} ({site.short}), {site.location}.
        This policy explains how we collect, use, store and protect personal information when you use our
        bookshop, hospitality bookings, student programmes, donations, resources, live chat and support services.
      </p>
    ),
  },
  {
    id: "what-we-collect",
    title: "2. Information we collect",
    body: (
      <>
        <p>We collect only the information needed to provide our services:</p>
        <ul>
          <li><strong>Account details:</strong> your name, email address, phone number, password (stored only in encrypted, hashed form) and an optional profile photo.</li>
          <li><strong>Bookings and orders:</strong> the facilities, dates, guest numbers and notes you submit, the books you order, the branch you choose and your order history.</li>
          <li><strong>Payments, tickets and donations:</strong> amount, payment method, phone number used for M-Pesa, payment references, receipt and ticket numbers, and donor details you provide. We do not receive or store your card number or M-Pesa PIN.</li>
          <li><strong>Messages and submissions:</strong> contact enquiries, support tickets, live chat messages, reviews and ratings, and student contributions such as devotionals or reflections.</li>
          <li><strong>Learning activity:</strong> which programme materials you open while signed in, so you can see your reading history.</li>
          <li><strong>Basic usage information:</strong> the pages visited, with record identifiers removed, plus your device type (desktop, mobile or tablet) and operating system, linked only to a random session code. We do not record IP addresses, form contents, search terms or your identity for this purpose.</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "3. How we use your information",
    body: (
      <ul>
        <li>To create and secure your account, including email confirmation and password resets.</li>
        <li>To process bookings, orders, event tickets and donations, and to issue receipts and tickets.</li>
        <li>To respond to enquiries, support tickets and live chat conversations.</li>
        <li>To moderate and publish reviews and student contributions, with author attribution where you agree to it.</li>
        <li>To send service notifications about your bookings, orders and requests.</li>
        <li>To keep an internal audit trail of administrative actions, so staff changes to records can be reviewed.</li>
        <li>To understand overall site usage and improve our services.</li>
        <li>To meet legal, accounting and safeguarding obligations.</li>
      </ul>
    ),
  },
  {
    id: "storage",
    title: "4. Where your information is stored",
    body: (
      <>
        <p>
          Our platform's backend is provided by <strong>Supabase</strong>. Supabase hosts our database, user
          authentication, file storage (such as profile photos, facility images and uploaded documents) and the
          secure server functions that verify payments. Your information is stored in Supabase's cloud
          infrastructure, which may be located outside Kenya. Supabase processes this data on our behalf and
          under its own security and privacy commitments.
        </p>
        <p>
          The website itself is delivered by a web hosting provider, which may process technical connection
          information needed to deliver pages to your browser.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "5. Who we share information with",
    body: (
      <>
        <p>We do not sell your personal information. We share it only where needed to provide our services:</p>
        <ul>
          <li><strong>Supabase</strong> — database, authentication, file storage and server functions.</li>
          <li><strong>Paystack</strong> — card and online payments; Paystack receives the details you enter on its checkout page.</li>
          <li><strong>Safaricom (M-Pesa)</strong> — mobile money payments; Safaricom receives your phone number and the payment amount.</li>
          <li><strong>Our email delivery provider</strong> — to send account confirmation and password reset emails.</li>
          <li><strong>OpenStreetMap</strong> — the map on our Contact page is loaded from OpenStreetMap, which receives standard connection information from your browser.</li>
          <li><strong>Google Fonts</strong> — some typefaces are loaded from Google, which receives standard connection information from your browser.</li>
          <li>Authorities, where required by law.</li>
        </ul>
      </>
    ),
  },
  {
    id: "browser",
    title: "6. Information stored in your browser",
    body: (
      <>
        <p>We do not use advertising or tracking cookies. To make the site work, your browser stores:</p>
        <ul>
          <li>your sign-in session, so you stay signed in;</li>
          <li>your bookshop cart (branch, book and quantity only);</li>
          <li>a private code that reconnects you to your live chat conversation;</li>
          <li>display preferences such as light/dark theme and dashboard sidebar layout;</li>
          <li>short-lived items for the current visit, such as a random usage session code, an in-progress payment reference and an unsaved donation form.</li>
        </ul>
        <p>If you install the site as an app, your device may also keep copies of site files for faster loading. You can clear all of this at any time from your browser settings.</p>
      </>
    ),
  },
  {
    id: "protection",
    title: "7. How we protect your information",
    body: (
      <ul>
        <li>All data is sent over encrypted (HTTPS) connections.</li>
        <li>Database access rules ensure customers can only see their own records, and only authorised staff can view or manage records for their role.</li>
        <li>Prices, payment status, receipts and tickets are set by secure server functions, never by your browser.</li>
        <li>Payment provider secret keys are kept on the server and never exposed on the website.</li>
        <li>Staff actions on records are logged with the user, action and time for accountability.</li>
      </ul>
    ),
  },
  {
    id: "retention",
    title: "8. How long we keep information",
    body: (
      <p>
        We keep account information while your account is active. Booking, order, payment, receipt and donation
        records are kept for as long as needed for accounting, legal and audit purposes. Messages and support
        requests are kept for as long as needed to resolve them and maintain service records. When information is
        no longer needed, we delete or anonymise it.
      </p>
    ),
  },
  {
    id: "rights",
    title: "9. Your rights and choices",
    body: (
      <>
        <p>
          Depending on applicable law, including Kenya's Data Protection Act, 2019, you may have the right to
          access, correct or delete your personal information, object to or restrict certain processing, and
          withdraw consent you previously gave.
        </p>
        <p>You can update your name, phone and photo from your account dashboard. For other requests, contact us using the details below.</p>
      </>
    ),
  },
  {
    id: "children",
    title: "10. Children",
    body: <p>Our online services are intended for adults and university students. We do not knowingly create accounts for children without the involvement of a parent or guardian.</p>,
  },
  {
    id: "changes",
    title: "11. Changes to this policy",
    body: <p>We may update this policy from time to time. The latest version will always be available on this page, with the date it was last updated.</p>,
  },
  {
    id: "contact",
    title: "12. Contact us",
    body: (
      <p>
        For privacy questions or requests, email <a href={`mailto:${site.email}`}>{site.email}</a>, call {site.phones.join(" or ")},
        visit us at {site.location}, or use our <Link to={paths.contact}>contact page</Link>.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b bg-secondary">
          <div className="container py-12 text-center sm:py-16">
            <nav aria-label="Breadcrumb" className="text-xs font-semibold text-muted-foreground">
              <Link to={paths.home} className="hover:text-primary">Home</Link> / Privacy Policy
            </nav>
            <ShieldCheck className="mx-auto mt-5 h-10 w-10 text-primary" />
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Privacy Policy</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              How {site.short} collects, uses, stores and protects your information.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">Last updated: {UPDATED}</p>
          </div>
        </section>
        <div className="container grid gap-10 py-12 lg:grid-cols-[15rem_1fr]">
          <aside className="hidden lg:block">
            <nav aria-label="Policy sections" className="sticky top-24">
              <Eyebrow>On this page</Eyebrow>
              <ul className="mt-4 space-y-2 border-l text-sm">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="-ml-px block border-l-2 border-transparent pl-3 text-muted-foreground transition hover:border-primary hover:text-primary">
                      {s.title.replace(/^\d+\.\s/, "")}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
          <article className="max-w-3xl space-y-10 text-sm leading-7 text-muted-foreground sm:text-base [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:pl-1 [&_p+p]:mt-3 [&_strong]:text-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="mb-3 text-xl font-bold text-foreground sm:text-2xl">{s.title}</h2>
                {s.body}
              </section>
            ))}
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
