import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookMarked,
  BookOpenText,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
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
import { Upload1 } from "./ProgrammeAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useAction, useRoles } from "@/hooks/useHospitality";
import { useContributions, useResources } from "@/hooks/programmes/useResources";
import {
  contributionKinds,
  resourcesService as svc,
  type ContributionRow,
  type ResourceKind,
  type ResourceRow,
} from "@/services/programmes/resources";
import { paths } from "@/routes/paths";
import { toast } from "sonner";

const fmtDate = (d: string) =>
  new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const kindLabel = (k: string) =>
  contributionKinds.find(([v]) => v === k)?.[1] ?? k;
const Spinner = () => (
  <div role="status" className="flex justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);
const Empty = ({ text }: { text: string }) => (
  <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-14 text-center text-sm text-muted-foreground">
    <BookOpenText className="mx-auto mb-3 h-8 w-8 text-primary" />
    {text}
  </div>
);
const meta: Record<ResourceKind, { title: string; intro: string }> = {
  devotional: {
    title: "Daily Devotionals",
    intro: "Scripture, reflection and prayer for each day.",
  },
  bible_study: {
    title: "Bible Study",
    intro: "Study guides, reading plans and teaching materials.",
  },
};

/** Searchable, date-filterable archive shared by the website and user dashboards. */
export function ResourcesBrowser({ kind }: { kind: ResourceKind }) {
  const q = useResources(kind);
  const [term, setTerm] = useState("");
  const [cat, setCat] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState<ResourceRow | null>(null);
  const all = q.data ?? [];
  const cats = [...new Set(all.map((r) => r.category))].sort();
  const rows = useMemo(
    () =>
      all.filter(
        (r) =>
          (cat === "all" || r.category === cat) &&
          (!from || r.publish_date >= from) &&
          (!to || r.publish_date <= to) &&
          `${r.title} ${r.scripture} ${r.description} ${r.body} ${r.author_name ?? ""}`
            .toLowerCase()
            .includes(term.trim().toLowerCase()),
      ),
    [all, cat, from, to, term],
  );
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          {meta[kind].title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{meta[kind].intro}</p>
      </div>
      <div className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search"
            placeholder="Search title, scripture…"
            className="pl-9"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger aria-label="Category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {cats.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          aria-label="From date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          type="date"
          aria-label="To date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>
      {q.isLoading ? (
        <Spinner />
      ) : q.error ? (
        <Empty text="Content could not be loaded. Refresh to try again." />
      ) : !rows.length ? (
        <Empty
          text={all.length ? "No matches for these filters." : "Nothing published yet."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <button
              key={r.id}
              onClick={() => setOpen(r)}
              className="group flex flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
            >
              {r.image_url && (
                <img
                  src={r.image_url}
                  alt=""
                  loading="lazy"
                  className="aspect-[16/9] w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{r.category}</Badge>
                  <span>{fmtDate(r.publish_date)}</span>
                </div>
                <h3 className="font-semibold group-hover:text-primary">
                  {r.title}
                </h3>
                {r.scripture && (
                  <p className="mt-1 text-sm font-medium text-primary">
                    {r.scripture}
                  </p>
                )}
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {r.description || r.body}
                </p>
                {r.author_name && (
                  <p className="mt-auto pt-3 text-xs text-muted-foreground">
                    By {r.author_name}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{open.title}</DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground">
                {fmtDate(open.publish_date)} · {open.category}
                {open.author_name && ` · By ${open.author_name}`}
              </p>
              {open.image_url && (
                <img src={open.image_url} alt="" className="rounded-xl" />
              )}
              {open.scripture && (
                <blockquote className="border-l-4 border-primary bg-primary/5 px-4 py-3 font-medium text-primary">
                  {open.scripture}
                </blockquote>
              )}
              <div className="whitespace-pre-line text-sm leading-7">
                {open.body || open.description}
              </div>
              {open.prayer && (
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                    Prayer guide
                  </p>
                  <p className="whitespace-pre-line text-sm leading-7">
                    {open.prayer}
                  </p>
                </div>
              )}
              {open.attachment_url && (
                <Button asChild variant="outline" className="w-fit">
                  <a href={open.attachment_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" /> Open attachment
                  </a>
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const statusBadge = (s: string) => (
  <Badge
    variant={s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary"}
    className="capitalize"
  >
    {s === "approved" ? (
      <CheckCircle2 className="mr-1 h-3 w-3" />
    ) : s === "rejected" ? (
      <XCircle className="mr-1 h-3 w-3" />
    ) : (
      <Clock className="mr-1 h-3 w-3" />
    )}
    {s}
  </Badge>
);

/** Submission form plus the user's own status tracking. */
export function StudentContributions() {
  const { user } = useAuth();
  const mine = useContributions();
  const blank = { kind: "devotional", title: "", scripture: "", body: "", author_name: "", attachment_url: "" };
  const [f, setF] = useState(blank);
  const submit = useAction(svc.submit, ["contributions"], "Submitted for review");
  const withdraw = useAction(svc.withdraw, ["contributions"], "Submission withdrawn");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });
  if (!user)
    return (
      <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
        <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary" />
        <h2 className="text-lg font-semibold">Share your devotionals and studies</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to submit original content for review.
        </p>
        <Button asChild className="mt-5">
          <Link to={paths.auth}>Sign in to contribute</Link>
        </Button>
      </div>
    );
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <form
        className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (f.title.trim().length < 2 || f.author_name.trim().length < 2)
            return toast.error("Add a title and the name to credit");
          if (f.body.trim().length < 20)
            return toast.error("Content must be at least 20 characters");
          submit.mutate(
            { ...f, attachment_url: f.attachment_url || null },
            { onSuccess: () => setF(blank) },
          );
        }}
      >
        <div>
          <h2 className="text-lg font-semibold">New contribution</h2>
          <p className="text-sm text-muted-foreground">
            Reviewed by administrators before publishing, with credit to you.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contributionKinds.map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Credit as</Label>
            <Input maxLength={120} value={f.author_name} onChange={set("author_name")} placeholder="Your name" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Title</Label>
            <Input maxLength={200} value={f.title} onChange={set("title")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Scripture reference (optional)</Label>
            <Input value={f.scripture} onChange={set("scripture")} placeholder="e.g. Psalm 23:1-3" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Content</Label>
            <Textarea rows={8} maxLength={20000} value={f.body} onChange={set("body")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Attachment (optional)</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Upload1
                accept=".pdf,.doc,.docx,image/*"
                prefix={`contributions/${user.id}/`}
                onDone={(u) => setF({ ...f, attachment_url: u })}
              />
              {f.attachment_url && <Badge variant="secondary">File attached</Badge>}
            </div>
          </div>
        </div>
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit for review
        </Button>
      </form>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">My submissions</h2>
        {mine.isLoading ? (
          <Spinner />
        ) : !mine.data?.length ? (
          <Empty text="You haven't submitted anything yet." />
        ) : (
          mine.data.map((c) => (
            <article key={c.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-medium">{c.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {kindLabel(c.kind)} · {fmtDate(c.created_at)}
                  </p>
                </div>
                {statusBadge(c.status)}
              </div>
              {c.admin_notes && (
                <p className="mt-2 rounded-md bg-muted/40 p-2 text-xs">
                  Reviewer: {c.admin_notes}
                </p>
              )}
              {c.status === "pending" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  onClick={() => confirm("Withdraw this submission?") && withdraw.mutate(c.id)}
                >
                  <Trash2 className="h-4 w-4" /> Withdraw
                </Button>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}

const blankRes = {
  title: "",
  scripture: "",
  description: "",
  body: "",
  prayer: "",
  category: "General",
  image_url: "",
  attachment_url: "",
  publish_date: new Date().toISOString().slice(0, 10),
  is_published: true,
};

/** Super-admin management for devotionals or Bible study content. */
export function ResourcesAdmin({ kind }: { kind: ResourceKind }) {
  const { isSuperAdmin } = useRoles();
  const q = useResources(kind, true);
  const [edit, setEdit] = useState<(typeof blankRes & { id?: string }) | null>(null);
  const [term, setTerm] = useState("");
  const save = useAction(svc.save, ["resources"], "Saved");
  const del = useAction(svc.remove, ["resources"], "Deleted");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    edit && setEdit({ ...edit, [k]: e.target.value });
  const all = q.data ?? [];
  const rows = all.filter((r) =>
    `${r.title} ${r.scripture} ${r.category}`.toLowerCase().includes(term.toLowerCase()),
  );
  const isDev = kind === "devotional";
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total" value={q.data ? all.length : "–"} icon={BookMarked} />
        <StatCard label="Published" value={q.data ? all.filter((r) => r.is_published).length : "–"} icon={CheckCircle2} />
        <StatCard label="Drafts" value={q.data ? all.filter((r) => !r.is_published).length : "–"} icon={Clock} />
        <StatCard label="From students" value={q.data ? all.filter((r) => r.contribution_id).length : "–"} icon={Sparkles} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{meta[kind].title}</h2>
        <div className="flex gap-2">
          <Input placeholder="Search…" value={term} onChange={(e) => setTerm(e.target.value)} className="w-44" />
          {isSuperAdmin && (
            <Button onClick={() => setEdit({ ...blankRes })}>
              <Plus className="h-4 w-4" /> New
            </Button>
          )}
        </div>
      </div>
      {q.isLoading ? (
        <Spinner />
      ) : !rows.length ? (
        <Empty text="No entries yet." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="p-3">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.scripture}
                      {r.author_name && ` · By ${r.author_name}`}
                    </p>
                  </td>
                  <td className="p-3 text-muted-foreground">{r.category}</td>
                  <td className="whitespace-nowrap p-3">{fmtDate(r.publish_date)}</td>
                  <td className="p-3">
                    <Badge variant={r.is_published ? "default" : "secondary"}>
                      {r.is_published ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap p-3 text-right">
                    {isSuperAdmin && (
                      <>
                        <Button size="icon" variant="ghost" aria-label="Edit" onClick={() =>
                          setEdit({ ...blankRes, ...r, image_url: r.image_url ?? "", attachment_url: r.attachment_url ?? "" })
                        }>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => confirm("Delete this entry?") && del.mutate(r.id)}>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "Edit entry" : `New ${isDev ? "devotional" : "Bible study resource"}`}</DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Title</Label>
                <Input value={edit.title} onChange={set("title")} />
              </div>
              <div className="space-y-1.5">
                <Label>Scripture reference</Label>
                <Input value={edit.scripture} onChange={set("scripture")} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={edit.category} onChange={set("category")}
                  placeholder={isDev ? "Morning, Faith…" : "Study guide, Reading plan…"} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Summary</Label>
                <Textarea rows={2} value={edit.description} onChange={set("description")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{isDev ? "Reflection" : "Content"} (paragraphs and line breaks are kept)</Label>
                <Textarea rows={8} value={edit.body} onChange={set("body")} />
              </div>
              {isDev && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Prayer guide</Label>
                  <Textarea rows={3} value={edit.prayer} onChange={set("prayer")} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Publish date</Label>
                <Input type="date" value={edit.publish_date} onChange={set("publish_date")} />
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <Switch checked={edit.is_published} onCheckedChange={(v) => setEdit({ ...edit, is_published: v })} />
                Published
              </label>
              <div className="space-y-1.5">
                <Label>Image</Label>
                <Upload1 accept="image/*" onDone={(u) => setEdit({ ...edit, image_url: u })} />
                {edit.image_url && <img src={edit.image_url} alt="" className="h-16 rounded-md object-cover" />}
              </div>
              <div className="space-y-1.5">
                <Label>Attachment link or file</Label>
                <Input placeholder="https://…" value={edit.attachment_url} onChange={set("attachment_url")} />
                <Upload1 accept="*/*" onDone={(u) => setEdit({ ...edit, attachment_url: u })} />
              </div>
              <Button
                className="sm:col-span-2"
                disabled={save.isPending}
                onClick={() => {
                  if (edit.title.trim().length < 2) return toast.error("Title is required");
                  save.mutate(
                    { ...edit, kind, image_url: edit.image_url || null, attachment_url: edit.attachment_url || null },
                    { onSuccess: () => setEdit(null) },
                  );
                }}
              >
                Save
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Moderation queue: review, edit, approve or reject student submissions. */
export function ContributionsModeration() {
  const { isSuperAdmin } = useRoles();
  const q = useContributions(true);
  const [status, setStatus] = useState("pending");
  const [edit, setEdit] = useState<ContributionRow | null>(null);
  const review = useAction(svc.review, ["contributions", "resources"], "Review saved");
  const all = q.data ?? [];
  const rows = all.filter((c) => status === "all" || c.status === status);
  const n = (s: string) => all.filter((c) => c.status === s).length;
  const decide = (s: "approved" | "rejected") =>
    edit &&
    review.mutate(
      { id: edit.id, title: edit.title, scripture: edit.scripture, body: edit.body, admin_notes: edit.admin_notes, status: s },
      { onSuccess: () => setEdit(null) },
    );
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Submissions" value={q.data ? all.length : "–"} icon={Send} />
        <StatCard label="Pending review" value={q.data ? n("pending") : "–"} icon={Clock} />
        <StatCard label="Approved" value={q.data ? n("approved") : "–"} icon={CheckCircle2} />
        <StatCard label="Rejected" value={q.data ? n("rejected") : "–"} icon={XCircle} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Moderation queue</h2>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40" aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["pending", "approved", "rejected", "all"].map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {q.isLoading ? (
        <Spinner />
      ) : !rows.length ? (
        <Empty text="No submissions in this queue." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((c) => (
            <article key={c.id} className="flex flex-col rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium">{c.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {kindLabel(c.kind)} · {c.author_name} · {fmtDate(c.created_at)}
                  </p>
                </div>
                {statusBadge(c.status)}
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{c.body}</p>
              <Button size="sm" variant="outline" className="mt-3 w-fit" onClick={() => setEdit(c)}>
                {c.status === "pending" && isSuperAdmin ? "Review" : "View"}
              </Button>
            </article>
          ))}
        </div>
      )}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review contribution</DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {kindLabel(edit.kind)} by {edit.author_name} · {fmtDate(edit.created_at)}
                {edit.kind === "devotional" || edit.kind === "reflection"
                  ? " · publishes to Daily Devotionals"
                  : " · publishes to Bible Study"}
              </p>
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input disabled={!isSuperAdmin} value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Scripture</Label>
                <Input disabled={!isSuperAdmin} value={edit.scripture} onChange={(e) => setEdit({ ...edit, scripture: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Content</Label>
                <Textarea disabled={!isSuperAdmin} rows={8} value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} />
              </div>
              {edit.attachment_url && (
                <a href={edit.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  <ExternalLink className="h-4 w-4" /> Open attachment
                </a>
              )}
              <div className="space-y-1.5">
                <Label>Note to student</Label>
                <Textarea disabled={!isSuperAdmin} rows={2} value={edit.admin_notes ?? ""} onChange={(e) => setEdit({ ...edit, admin_notes: e.target.value })} />
              </div>
              {isSuperAdmin && edit.status === "pending" && (
                <div className="flex gap-2">
                  <Button disabled={review.isPending} onClick={() => decide("approved")}>
                    <CheckCircle2 className="h-4 w-4" /> Approve & publish
                  </Button>
                  <Button variant="destructive" disabled={review.isPending} onClick={() => decide("rejected")}>
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
