import { useState } from "react";
import { z } from "zod";
import { Mail, MapPin, Phone, Loader2, Send } from "lucide-react";
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
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSending(true);
    try {
      await supportService.submitEnquiry({ name: parsed.data.name!, email: parsed.data.email!, subject: parsed.data.subject!, message: parsed.data.message! });
      toast.success("Thank you — your message has been sent. We will get back to you soon.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <section className="relative flex h-56 items-center justify-center overflow-hidden sm:h-72">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero-dark" />
        <div className="relative z-10 text-center text-primary-foreground">
          <p className="text-xs uppercase tracking-widest opacity-80">Home / Contact</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Contact Us</h1>
        </div>
      </section>

      <PageContainer className="flex-1 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Get in touch</h2>
              <p className="mt-2 text-muted-foreground">
                Questions about bookings, facilities or programmes? Send us a message and the CSLC team will respond.
              </p>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>{site.location}</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <a href={`mailto:${site.email}`} className="hover:underline">{site.email}</a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:underline">{site.phone}</a>
              </li>
            </ul>
            <div className="overflow-hidden rounded-2xl border shadow-card">
              <iframe
                title="CSLC location map — Ufungamano House, Nairobi"
                src="https://www.openstreetmap.org/export/embed.html?bbox=36.8050%2C-1.2950%2C36.8250%2C-1.2790&layer=mapnik&marker=-1.2870%2C36.8150"
                className="h-64 w-full sm:h-72"
                loading="lazy"
              />
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-card sm:p-8">
            <h2 className="text-xl font-semibold">Send a message</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-name">Name</Label>
                <Input id="c-name" value={form.name} onChange={set("name")} maxLength={100} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-email">Email</Label>
                <Input id="c-email" type="email" value={form.email} onChange={set("email")} maxLength={255} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-subject">Subject</Label>
              <Input id="c-subject" value={form.subject} onChange={set("subject")} maxLength={150} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-message">Message</Label>
              <Textarea id="c-message" value={form.message} onChange={set("message")} rows={6} maxLength={2000} required />
            </div>
            <Button type="submit" disabled={sending} className="w-full sm:w-auto">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send message
            </Button>
          </form>
        </div>
      </PageContainer>
      <SiteFooter />
    </div>
  );
};
export default ContactPage;
