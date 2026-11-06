import { useMemo, useState } from "react";
import { CalendarDays, Eye, EyeOff, Loader2, Newspaper, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatCard } from "@/components/common/StatCard";
import { Upload1 } from "@/components/programmes/ProgrammeAdmin";
import { useAction } from "@/hooks/useHospitality";
import { useActivitiesAdmin } from "@/hooks/programmes/useActivities";
import { activitiesService as svc, type ActivityRow } from "@/services/programmes/activities";
import { findProgrammeArea, programmeAreas } from "@/config/programmeAreas";
import { programmeAreaUrl } from "@/routes/paths";
import { toast } from "sonner";

const today = () => new Date().toISOString().slice(0, 10);
const blank = {
  area: programmeAreas[0].slug as string,
  title: "",
  summary: "",
  body: "",
  image_url: "",
  location: "",
  activity_date: today(),
  is_published: true,
};
type Draft = typeof blank & { id?: string };

export function ActivitiesAdmin() {
  const q = useActivitiesAdmin();
  const [edit, setEdit] = useState<Draft | null>(null);
  const [filter, setFilter] = useState("all");
  const [confirm, setConfirm] = useState<ActivityRow | null>(null);
  const save = useAction(svc.save, ["activities"], "Activity saved");
  const del = useAction(svc.remove, ["activities"], "Activity deleted");
  const all = q.data ?? [];
  const list = useMemo(() => (filter === "all" ? all : all.filter((a) => a.area === filter)), [all, filter]);

  const open = (a?: ActivityRow) =>
    setEdit(a ? { ...blank, ...a, image_url: a.image_url ?? "", location: a.location ?? "" } : { ...blank, area: filter === "all" ? blank.area : filter, activity_date: today() });

  const submit = () => {
    if (!edit?.title.trim()) return toast.error("Title is required");
    if (!edit.body.trim()) return toast.error("Please write the activity story");
    save.mutate(
      {
        ...edit,
        title: edit.title.trim(),
        summary: edit.summary.trim(),
        body: edit.body.trim(),
        image_url: edit.image_url || null,
        location: edit.location.trim() || null,
      },
      { onSuccess: () => setEdit(null) },
    );
  };
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    edit && setEdit({ ...edit, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Activities" value={all.length} icon={Newspaper} />
        <StatCard label="Published" value={all.filter((a) => a.is_published).length} icon={Eye} />
        <StatCard label="Drafts" value={all.filter((a) => !a.is_published).length} icon={EyeOff} />
        <StatCard label="Programme areas" value={new Set(all.map((a) => a.area)).size} icon={CalendarDays} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Programme activities</h2>
          <p className="text-sm text-muted-foreground">Published activities appear on each programme page linked from About.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-60" aria-label="Filter by programme"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programmes</SelectItem>
              {programmeAreas.map((a) => <SelectItem key={a.slug} value={a.slug}>{a.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => open()} className="gap-2"><Plus className="h-4 w-4" /> Add activity</Button>
        </div>
      </div>

      {q.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : q.isError ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-destructive">{(q.error as Error).message}</div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/40 p-10 text-center text-sm text-muted-foreground">No activities yet. Add one to show it on the programme page.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((a) => {
            const area = findProgrammeArea(a.area);
            return (
              <div key={a.id} className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card">
                <img src={a.image_url || area?.image} alt="" loading="lazy" className="h-36 w-full object-cover" />
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-primary">{area?.title ?? a.area}</p>
                    <Badge variant={a.is_published ? "default" : "secondary"}>{a.is_published ? "Published" : "Draft"}</Badge>
                  </div>
                  <p className="line-clamp-2 font-semibold">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(`${a.activity_date}T00:00:00`).toLocaleDateString("en-KE", { dateStyle: "medium" })}{a.location ? ` · ${a.location}` : ""}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => open(a)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                    <Button size="sm" variant="outline" className="gap-1" disabled={save.isPending}
                      onClick={() => save.mutate({ ...a, is_published: !a.is_published })}>
                      {a.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{a.is_published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => setConfirm(a)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit activity" : "Add activity"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Programme area</Label>
                <Select value={edit.area} onValueChange={(v) => setEdit({ ...edit, area: v })}>
                  <SelectTrigger aria-label="Programme area"><SelectValue /></SelectTrigger>
                  <SelectContent>{programmeAreas.map((a) => <SelectItem key={a.slug} value={a.slug}>{a.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ac-title">Title</Label>
                <Input id="ac-title" value={edit.title} onChange={set("title")} placeholder="Annual Student Leadership Conference" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ac-date">Date</Label>
                  <Input id="ac-date" type="date" value={edit.activity_date} onChange={set("activity_date")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ac-loc">Location (optional)</Label>
                  <Input id="ac-loc" value={edit.location} onChange={set("location")} placeholder="Ufungamano House" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ac-sum">Short summary</Label>
                <Textarea id="ac-sum" rows={2} value={edit.summary} onChange={set("summary")} placeholder="One or two sentences shown on the card" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ac-body">Full story</Label>
                <Textarea id="ac-body" rows={7} value={edit.body} onChange={set("body")} placeholder="What happened, who took part and the impact" />
              </div>
              <div className="space-y-2">
                <Label>Cover image</Label>
                <div className="flex items-center gap-4">
                  {edit.image_url && <img src={edit.image_url} alt="" className="h-16 w-24 rounded-lg object-cover" />}
                  <Upload1 accept="image/jpeg,image/png,image/webp" prefix="activities/" onDone={(url) => setEdit({ ...edit, image_url: url })} />
                  {edit.image_url && <Button size="sm" variant="ghost" onClick={() => setEdit({ ...edit, image_url: "" })}>Remove</Button>}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <Label htmlFor="ac-pub" className="text-sm">Publish on programme page</Label>
                <Switch id="ac-pub" checked={edit.is_published} onCheckedChange={(v) => setEdit({ ...edit, is_published: v })} />
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <Button variant="link" asChild className="px-0"><a href={programmeAreaUrl(edit.area)} target="_blank" rel="noreferrer">View programme page</a></Button>
                <Button onClick={submit} disabled={save.isPending}>{save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save activity</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this activity?</AlertDialogTitle>
            <AlertDialogDescription>“{confirm?.title}” will be removed from its programme page permanently.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirm && del.mutate(confirm.id, { onSuccess: () => setConfirm(null) })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
