import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllTickets, useEnquiries } from "@/hooks/useSupport";
import { supportService } from "@/services/support";
import { useAction } from "@/hooks/useHospitality";

const variant = (s: string) =>
  s === "resolved" ? "default" : s === "in_progress" ? "secondary" : "outline";

/** Admin support: manage contact enquiries and user tickets. */
export function AdminSupport() {
  const enquiries = useEnquiries();
  const tickets = useAllTickets();
  const updEnquiry = useAction(
    ({ id, ...patch }: { id: string; status?: string; admin_notes?: string }) =>
      supportService.updateEnquiry(id, patch),
    ["enquiries"],
    "Enquiry updated",
  );
  const updTicket = useAction(
    ({ id, ...patch }: { id: string; status?: string; admin_reply?: string }) =>
      supportService.updateTicket(id, patch),
    ["tickets", "notifications"],
    "Ticket updated",
  );
  const [reply, setReply] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});

  const loading = enquiries.isLoading || tickets.isLoading;
  const error = enquiries.error || tickets.error;

  return (
    <Tabs defaultValue="tickets">
      <TabsList>
        <TabsTrigger value="tickets">User Tickets ({tickets.data?.length ?? 0})</TabsTrigger>
        <TabsTrigger value="enquiries">Contact Enquiries ({enquiries.data?.length ?? 0})</TabsTrigger>
      </TabsList>
      {loading && <Loader2 className="mt-6 h-5 w-5 animate-spin text-primary" />}
      {error && (
        <Alert variant="destructive" className="mt-4"><AlertDescription>{(error as Error).message}</AlertDescription></Alert>
      )}

      <TabsContent value="tickets" className="mt-4 grid gap-3">
        {tickets.data?.length === 0 && (
          <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
            No support tickets yet.
          </div>
        )}
        {tickets.data?.map((t) => (
          <div key={t.id} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{t.subject}</p>
              <div className="flex items-center gap-2">
                <Badge variant={variant(t.status)}>{t.status.replace("_", " ")}</Badge>
                <Select value={t.status} onValueChange={(status) => updTicket.mutate({ id: t.id, status })}>
                  <SelectTrigger className="h-8 w-32 text-xs" aria-label="Ticket status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t.message}</p>
            {t.admin_reply && <p className="mt-2 rounded-lg bg-secondary p-3 text-sm"><span className="font-medium">Reply sent:</span> {t.admin_reply}</p>}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Textarea
                placeholder="Write a reply to the customer…"
                rows={2}
                maxLength={2000}
                value={reply[t.id] ?? ""}
                onChange={(e) => setReply({ ...reply, [t.id]: e.target.value })}
                aria-label={`Reply to ${t.subject}`}
              />
              <Button
                size="sm"
                className="shrink-0 self-end"
                disabled={updTicket.isPending || !(reply[t.id] ?? "").trim()}
                onClick={() => updTicket.mutate({ id: t.id, admin_reply: reply[t.id].trim() }, { onSuccess: () => setReply({ ...reply, [t.id]: "" }) })}
              >
                Send reply
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
          </div>
        ))}
      </TabsContent>

      <TabsContent value="enquiries" className="mt-4 grid gap-3">
        {enquiries.data?.length === 0 && (
          <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
            No contact enquiries yet.
          </div>
        )}
        {enquiries.data?.map((q) => (
          <div key={q.id} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{q.subject}</p>
                <p className="text-xs text-muted-foreground">{q.name} · {q.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={variant(q.status)}>{q.status.replace("_", " ")}</Badge>
                <Select value={q.status} onValueChange={(status) => updEnquiry.mutate({ id: q.id, status })}>
                  <SelectTrigger className="h-8 w-32 text-xs" aria-label="Enquiry status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{q.message}</p>
            {q.admin_notes && <p className="mt-2 rounded-lg bg-secondary p-3 text-sm"><span className="font-medium">Internal note:</span> {q.admin_notes}</p>}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Textarea
                placeholder="Internal note (not sent to the visitor)…"
                rows={2}
                maxLength={2000}
                value={note[q.id] ?? ""}
                onChange={(e) => setNote({ ...note, [q.id]: e.target.value })}
                aria-label={`Note for ${q.subject}`}
              />
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 self-end"
                disabled={updEnquiry.isPending || !(note[q.id] ?? "").trim()}
                onClick={() => updEnquiry.mutate({ id: q.id, admin_notes: note[q.id].trim() }, { onSuccess: () => setNote({ ...note, [q.id]: "" }) })}
              >
                Save note
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">{new Date(q.created_at).toLocaleString()}</p>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}
