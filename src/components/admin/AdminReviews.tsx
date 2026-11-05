import { useState } from "react";
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/common/StatCard";
import { Stars } from "@/components/common/Reviews";
import { useAllReviews } from "@/hooks/useReviews";
import { useAction } from "@/hooks/useHospitality";
import { reviewsService } from "@/services/reviews";

/** Super-admin moderation of book and facility reviews. */
export function AdminReviews() {
  const q = useAllReviews();
  const [filter, setFilter] = useState<"all" | "book" | "facility" | "hidden">("all");
  const status = useAction(({ id, s }: { id: string; s: "published" | "hidden" }) => reviewsService.setStatus(id, s), ["reviews"], "Review updated");
  const del = useAction(reviewsService.remove, ["reviews"], "Review deleted");
  const all = q.data ?? [];
  const rows = all.filter((r) => filter === "all" || (filter === "hidden" ? r.status === "hidden" : r.kind === filter));
  const avg = all.length ? (all.reduce((s, r) => s + r.rating, 0) / all.length).toFixed(1) : "—";

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total reviews" value={all.length} />
        <StatCard label="Average rating" value={avg} />
        <StatCard label="Book reviews" value={all.filter((r) => r.kind === "book").length} />
        <StatCard label="Hidden" value={all.filter((r) => r.status === "hidden").length} />
      </div>
      <div className="flex flex-wrap gap-2">
        {(["all", "book", "facility", "hidden"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">{f === "facility" ? "Hospitality" : f}</Button>
        ))}
      </div>
      {q.isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      {q.error && <p className="text-sm text-destructive">{(q.error as Error).message}</p>}
      {!q.isLoading && rows.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">No reviews here yet.</div>}
      {rows.map((r) => {
        const target = r.kind === "book" ? (r as { books?: { title: string } | null }).books?.title : (r as { sub_services?: { name: string } | null }).sub_services?.name;
        return (
          <div key={r.id} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{target ?? "Removed item"}</p>
                <p className="text-xs text-muted-foreground">{r.author_name} · {r.kind === "book" ? "Bookshop" : "Hospitality"} · {new Date(r.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Stars value={r.rating} />
                <Badge variant={r.status === "published" ? "default" : "outline"}>{r.status}</Badge>
                <Button size="icon" variant="ghost" aria-label={r.status === "published" ? "Hide review" : "Publish review"} title={r.status === "published" ? "Hide" : "Publish"}
                  onClick={() => status.mutate({ id: r.id, s: r.status === "published" ? "hidden" : "published" })}>
                  {r.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" aria-label="Delete review" title="Delete" onClick={() => confirm("Delete this review?") && del.mutate(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            {r.comment && <p className="mt-2 whitespace-pre-line break-words text-sm text-muted-foreground">{r.comment}</p>}
          </div>
        );
      })}
    </div>
  );
}
