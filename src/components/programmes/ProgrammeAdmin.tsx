import { useState } from "react";
import {
  CalendarDays,
  FileText,
  HeartHandshake,
  Loader2,
  Pencil,
  Plus,
  Ticket,
  Trash2,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/common/StatCard";
import { PhaseRecords } from "@/components/common/PhaseRecords";
import { MyTickets } from "./ProgrammeViews";
import { useAction, useRoles } from "@/hooks/useHospitality";
import {
  useEvents,
  useMaterials,
  useTickets,
} from "@/hooks/programmes/useProgrammes";
import { useDonations } from "@/hooks/programmes/useDonations";
import {
  eventDate,
  materialKinds,
  programmesService as svc,
  type EventRow,
  type MaterialRow,
} from "@/services/programmes/programmes";
import { kes } from "@/lib/booking";
import { chartTooltipStyle } from "@/components/admin/analyticsPresentation";
import { toast } from "sonner";

function Upload1({
  onDone,
  accept,
}: {
  onDone: (url: string) => void;
  accept: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Upload className="h-4 w-4" />
      )}{" "}
      Upload file
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          try {
            onDone(await svc.uploadFile(f));
            toast.success("File uploaded");
          } catch (x) {
            toast.error((x as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </Label>
  );
}

const blankEvent = {
  title: "",
  description: "",
  poster_url: "",
  venue: "",
  event_date: "",
  start_time: "",
  end_time: "",
  ticket_price: 0,
  capacity: "",
  organizer: "CSLC Student Programmes",
  contact: "",
  is_published: true,
};

export function EventsAdmin() {
  const { isSuperAdmin } = useRoles();
  const q = useEvents(true);
  const tickets = useTickets(true);
  const [edit, setEdit] = useState<
    (typeof blankEvent & { id?: string }) | null
  >(null);
  const save = useAction(svc.saveEvent, ["events"], "Event saved");
  const del = useAction(svc.deleteEvent, ["events"], "Event deleted");
  const sold = (id: string) =>
    (tickets.data ?? [])
      .filter((t) => t.event_id === id)
      .reduce((s, t) => s + t.quantity, 0);
  const revenue = (tickets.data ?? []).reduce(
    (s, t) => s + Number(t.amount),
    0,
  );
  const open = (e?: EventRow) =>
    setEdit(
      e
        ? {
            ...blankEvent,
            ...e,
            poster_url: e.poster_url ?? "",
            start_time: e.start_time ?? "",
            end_time: e.end_time ?? "",
            capacity: e.capacity?.toString() ?? "",
            contact: e.contact ?? "",
          }
        : { ...blankEvent },
    );
  const submit = () => {
    if (!edit?.title || !edit.event_date)
      return toast.error("Title and date are required");
    save.mutate(
      {
        ...edit,
        poster_url: edit.poster_url || null,
        start_time: edit.start_time || null,
        end_time: edit.end_time || null,
        capacity: edit.capacity ? Number(edit.capacity) : null,
        contact: edit.contact || null,
        ticket_price: Number(edit.ticket_price),
      },
      { onSuccess: () => setEdit(null) },
    );
  };
  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      edit && setEdit({ ...edit, [k]: e.target.value });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Events"
          value={q.data?.length ?? "–"}
          icon={CalendarDays}
        />
        <StatCard
          label="Published"
          value={q.data?.filter((e) => e.is_published).length ?? "–"}
          icon={CalendarDays}
        />
        <StatCard
          label="Tickets sold"
          value={(tickets.data ?? []).reduce((s, t) => s + t.quantity, 0)}
          icon={Ticket}
        />
        <StatCard label="Ticket revenue" value={kes(revenue)} icon={Wallet} />
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Events</h2>
        {isSuperAdmin && (
          <Button onClick={() => open()}>
            <Plus className="h-4 w-4" />
            New event
          </Button>
        )}
      </div>
      {q.isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : !q.data?.length ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          No events yet.
        </p>
      ) : (
        <div className="grid gap-3">
          {q.data.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4"
            >
              {e.poster_url ? (
                <img
                  src={e.poster_url}
                  alt=""
                  className="h-14 w-20 rounded-md object-cover"
                />
              ) : (
                <CalendarDays className="h-8 w-8 text-primary" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {eventDate(e.event_date)} · {e.venue} · {kes(e.ticket_price)}{" "}
                  · {sold(e.id)}
                  {e.capacity ? `/${e.capacity}` : ""} sold
                </p>
              </div>
              <Badge variant={e.is_published ? "default" : "secondary"}>
                {e.is_published ? "Published" : "Draft"}
              </Badge>
              {isSuperAdmin && (
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Edit event"
                    onClick={() => open(e)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete event"
                    disabled={sold(e.id) > 0}
                    onClick={() =>
                      confirm("Delete this event?") && del.mutate(e.id)
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <h2 className="text-lg font-semibold">Ticket sales</h2>
      <MyTickets management />
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "Edit event" : "New event"}</DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Title</Label>
                <Input value={edit.title} onChange={set("title")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  value={edit.description}
                  onChange={set("description")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Venue</Label>
                <Input value={edit.venue} onChange={set("venue")} />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={edit.event_date}
                  onChange={set("event_date")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Start time</Label>
                <Input
                  type="time"
                  value={edit.start_time}
                  onChange={set("start_time")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End time</Label>
                <Input
                  type="time"
                  value={edit.end_time}
                  onChange={set("end_time")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ticket price (KES, 0 = free)</Label>
                <Input
                  type="number"
                  min={0}
                  value={edit.ticket_price}
                  onChange={set("ticket_price")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Capacity (blank = unlimited)</Label>
                <Input
                  type="number"
                  min={1}
                  value={edit.capacity}
                  onChange={set("capacity")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Organiser</Label>
                <Input value={edit.organizer} onChange={set("organizer")} />
              </div>
              <div className="space-y-1.5">
                <Label>Contact</Label>
                <Input value={edit.contact} onChange={set("contact")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Poster</Label>
                <div className="flex flex-wrap items-center gap-3">
                  {edit.poster_url && (
                    <img
                      src={edit.poster_url}
                      alt=""
                      className="h-16 w-24 rounded object-cover"
                    />
                  )}
                  <Upload1
                    accept="image/jpeg,image/png,image/webp"
                    onDone={(u) => setEdit({ ...edit, poster_url: u })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={edit.is_published}
                  onCheckedChange={(v) => setEdit({ ...edit, is_published: v })}
                />
                Published
              </label>
              <Button
                className="sm:col-span-2"
                disabled={save.isPending}
                onClick={submit}
              >
                Save event
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const blankMaterial = {
  title: "",
  description: "",
  category: "General",
  topic: "",
  kind: "document",
  url: "",
  is_published: true,
};

export function MaterialsAdmin() {
  const { isSuperAdmin } = useRoles();
  const q = useMaterials(true);
  const [edit, setEdit] = useState<
    (typeof blankMaterial & { id?: string }) | null
  >(null);
  const save = useAction(svc.saveMaterial, ["materials"], "Material saved");
  const del = useAction(svc.deleteMaterial, ["materials"], "Material deleted");
  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      edit && setEdit({ ...edit, [k]: e.target.value });
  const cats = new Set((q.data ?? []).map((m) => m.category));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Materials"
          value={q.data?.length ?? "–"}
          icon={FileText}
        />
        <StatCard
          label="Published"
          value={q.data?.filter((m) => m.is_published).length ?? "–"}
          icon={FileText}
        />
        <StatCard label="Categories" value={cats.size} icon={FileText} />
        <StatCard
          label="Topics"
          value={
            new Set((q.data ?? []).map((m) => m.topic).filter(Boolean)).size
          }
          icon={FileText}
        />
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Programme materials</h2>
        {isSuperAdmin && (
          <Button onClick={() => setEdit({ ...blankMaterial })}>
            <Plus className="h-4 w-4" />
            New material
          </Button>
        )}
      </div>
      {q.isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : !q.data?.length ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          No materials yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Category / topic</th>
                <th className="p-3">Type</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {q.data.map((m: MaterialRow) => (
                <tr key={m.id}>
                  <td className="p-3 font-medium">
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {m.title}
                    </a>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {m.category}
                    {m.topic ? ` · ${m.topic}` : ""}
                  </td>
                  <td className="p-3 capitalize">{m.kind}</td>
                  <td className="p-3">
                    <Badge variant={m.is_published ? "default" : "secondary"}>
                      {m.is_published ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    {isSuperAdmin && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Edit material"
                          onClick={() => setEdit({ ...blankMaterial, ...m })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Delete material"
                          onClick={() =>
                            confirm("Delete this material?") && del.mutate(m.id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {edit?.id ? "Edit material" : "New material"}
            </DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Title</Label>
                <Input value={edit.title} onChange={set("title")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={edit.description}
                  onChange={set("description")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input
                  list="mat-cats"
                  value={edit.category}
                  onChange={set("category")}
                />
                <datalist id="mat-cats">
                  {[...cats].map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label>Topic</Label>
                <Input value={edit.topic} onChange={set("topic")} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={edit.kind}
                  onValueChange={(v) => setEdit({ ...edit, kind: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {materialKinds.map((k) => (
                      <SelectItem key={k} value={k} className="capitalize">
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <Switch
                  checked={edit.is_published}
                  onCheckedChange={(v) => setEdit({ ...edit, is_published: v })}
                />
                Published
              </label>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Link or uploaded file</Label>
                <Input
                  placeholder="https://…"
                  value={edit.url}
                  onChange={set("url")}
                />
                {edit.kind !== "link" && (
                  <Upload1
                    accept="*/*"
                    onDone={(u) => setEdit({ ...edit, url: u })}
                  />
                )}
              </div>
              <Button
                className="sm:col-span-2"
                disabled={save.isPending}
                onClick={() => {
                  if (!edit.title || !/^https?:\/\//.test(edit.url))
                    return toast.error(
                      "Title and a valid link or upload are required",
                    );
                  save.mutate(edit, { onSuccess: () => setEdit(null) });
                }}
              >
                Save material
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function DonationsInsights() {
  const q = useDonations(true);
  const rows = (q.data ?? []).filter((d) => d.status !== "cancelled");
  const total = rows.reduce((s, d) => s + Number(d.amount), 0);
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 5 + i);
    const key = d.toISOString().slice(0, 7);
    return {
      month: d.toLocaleDateString("en-KE", { month: "short" }),
      amount: rows
        .filter((r) => r.created_at.startsWith(key))
        .reduce((s, r) => s + Number(r.amount), 0),
    };
  });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total raised" value={kes(total)} icon={Wallet} />
        <StatCard label="Donations" value={rows.length} icon={HeartHandshake} />
        <StatCard
          label="Average gift"
          value={kes(rows.length ? total / rows.length : 0)}
          icon={Wallet}
        />
        <StatCard
          label="Donors"
          value={new Set(rows.map((r) => r.donor_email ?? r.user_id)).size}
          icon={Users}
        />
      </div>
      <section className="rounded-lg border bg-card p-4 shadow-card">
        <h2 className="mb-4 font-semibold">Contributions — last 6 months</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={months}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} width={60} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(v: number) => kes(v)}
              />
              <Bar
                dataKey="amount"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <PhaseRecords kind="donations" management />
    </div>
  );
}
