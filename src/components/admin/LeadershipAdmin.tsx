import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";
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
import { StatCard } from "@/components/common/StatCard";
import { Upload1 } from "@/components/programmes/ProgrammeAdmin";
import { useAction } from "@/hooks/useHospitality";
import { useLeadershipAdmin } from "@/hooks/useLeadership";
import { leadershipService as svc, type LeaderRow } from "@/services/leadership";
import { toast } from "sonner";

const blank = {
  full_name: "",
  title: "",
  role: "",
  bio: "",
  image_url: "",
  sort_order: 0,
  is_published: true,
};

export function LeadershipAdmin() {
  const q = useLeadershipAdmin();
  const [edit, setEdit] = useState<(typeof blank & { id?: string }) | null>(
    null,
  );
  const save = useAction(svc.save, ["leadership"], "Team member saved");
  const del = useAction(svc.remove, ["leadership"], "Team member removed");

  const open = (m?: LeaderRow) =>
    setEdit(
      m
        ? {
            ...blank,
            ...m,
            title: m.title ?? "",
            bio: m.bio ?? "",
            image_url: m.image_url ?? "",
          }
        : { ...blank, sort_order: (q.data?.length ?? 0) + 1 },
    );

  const submit = () => {
    if (!edit?.full_name.trim() || !edit.role.trim())
      return toast.error("Name and role are required");
    save.mutate(
      {
        ...edit,
        full_name: edit.full_name.trim(),
        role: edit.role.trim(),
        title: edit.title.trim() || null,
        bio: edit.bio.trim() || null,
        image_url: edit.image_url || null,
        sort_order: Number(edit.sort_order) || 0,
      },
      { onSuccess: () => setEdit(null) },
    );
  };

  const set =
    (k: keyof typeof blank) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      edit && setEdit({ ...edit, [k]: e.target.value });

  const members = q.data ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Team members" value={members.length} icon={Users} />
        <StatCard
          label="Published"
          value={members.filter((m) => m.is_published).length}
          icon={UserRound}
        />
        <StatCard
          label="Hidden"
          value={members.filter((m) => !m.is_published).length}
          icon={UserRound}
        />
        <StatCard
          label="With photos"
          value={members.filter((m) => m.image_url).length}
          icon={UserRound}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Leadership team</h2>
          <p className="text-sm text-muted-foreground">
            Published members appear on the About page.
          </p>
        </div>
        <Button onClick={() => open()} className="gap-2">
          <Plus className="h-4 w-4" /> Add member
        </Button>
      </div>

      {q.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/40 p-10 text-center text-sm text-muted-foreground">
          No team members yet. Add the first one to show it on the About page.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex gap-4 rounded-2xl border bg-card p-4 shadow-card"
            >
              {m.image_url ? (
                <img
                  src={m.image_url}
                  alt={m.full_name}
                  loading="lazy"
                  className="h-16 w-16 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                  <UserRound className="h-7 w-7" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{m.full_name}</p>
                    <p className="truncate text-sm text-primary">{m.role}</p>
                    {m.title && (
                      <p className="truncate text-xs text-muted-foreground">
                        {m.title}
                      </p>
                    )}
                  </div>
                  <Badge variant={m.is_published ? "default" : "secondary"}>
                    {m.is_published ? "Published" : "Hidden"}
                  </Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => open(m)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-destructive"
                    onClick={() => del.mutate(m.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {edit?.id ? "Edit team member" : "Add team member"}
            </DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {edit.image_url ? (
                  <img
                    src={edit.image_url}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary">
                    <UserRound className="h-7 w-7" />
                  </span>
                )}
                <Upload1
                  accept="image/jpeg,image/png,image/webp"
                  prefix="leadership/"
                  onDone={(url) => setEdit({ ...edit, image_url: url })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ld-name">Full name</Label>
                  <Input
                    id="ld-name"
                    value={edit.full_name}
                    onChange={set("full_name")}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ld-role">Role / position</Label>
                  <Input
                    id="ld-role"
                    value={edit.role}
                    onChange={set("role")}
                    placeholder="Centre Director"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ld-title">Professional title</Label>
                  <Input
                    id="ld-title"
                    value={edit.title}
                    onChange={set("title")}
                    placeholder="Rev. Dr. / Mrs. (optional)"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ld-order">Display order</Label>
                  <Input
                    id="ld-order"
                    type="number"
                    value={edit.sort_order}
                    onChange={(e) =>
                      setEdit({ ...edit, sort_order: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ld-bio">Biography (optional)</Label>
                <Textarea
                  id="ld-bio"
                  rows={4}
                  value={edit.bio}
                  onChange={set("bio")}
                  placeholder="Short biography shown on the About page"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <Label htmlFor="ld-pub" className="text-sm">
                  Show on About page
                </Label>
                <Switch
                  id="ld-pub"
                  checked={edit.is_published}
                  onCheckedChange={(v) => setEdit({ ...edit, is_published: v })}
                />
              </div>
              <Button
                className="w-full"
                onClick={submit}
                disabled={save.isPending}
              >
                {save.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save member
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
