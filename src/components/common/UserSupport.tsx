import { useState } from "react";
import { z } from "zod";
import { LifeBuoy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMyTickets } from "@/hooks/useSupport";
import { supportService } from "@/services/support";
import { useAction } from "@/hooks/useHospitality";

const schema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(150),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

const variant = (s: string) =>
  s === "resolved" ? "default" : s === "in_progress" ? "secondary" : "outline";

/** Customer support: submit a ticket and track replies. */
export function UserSupport() {
  const tickets = useMyTickets();
  const [form, setForm] = useState({ subject: "", message: "" });
  const submit = useAction(
    async (input: { subject: string; message: string }) => {
      const parsed = schema.parse(input);
      await supportService.submitTicket(parsed as z.infer<typeof schema>);
    },
    ["tickets", "notifications"],
    "Ticket submitted — we will get back to you soon.",
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="space-y-4 rounded-2xl border bg-card p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = schema.safeParse(form);
          if (!parsed.success) return;
          submit.mutate(parsed.data, { onSuccess: () => setForm({ subject: "", message: "" }) });
        }}
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <LifeBuoy className="h-5 w-5 text-primary" /> New support ticket
        </h2>
        <div className="space-y-1.5">
          <Label htmlFor="t-subject">Subject</Label>
          <Input id="t-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={150} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-message">How can we help?</Label>
          <Textarea id="t-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} maxLength={2000} required />
        </div>
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Submit ticket
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">My tickets</h2>
        {tickets.isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        {tickets.error && (
          <Alert variant="destructive"><AlertDescription>{(tickets.error as Error).message}</AlertDescription></Alert>
        )}
        {tickets.data?.length === 0 && (
          <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
            You have not submitted any support tickets yet.
          </div>
        )}
        {tickets.data?.map((t) => (
          <div key={t.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{t.subject}</p>
              <Badge variant={variant(t.status)}>{t.status.replace("_", " ")}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t.message}</p>
            {t.admin_reply && (
              <p className="mt-2 rounded-lg bg-secondary p-3 text-sm">
                <span className="font-medium">CSLC reply:</span> {t.admin_reply}
              </p>
            )}
            <p className="mt-2 text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
