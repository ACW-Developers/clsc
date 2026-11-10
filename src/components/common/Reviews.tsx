import { useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useAction } from "@/hooks/useHospitality";
import { useReviewEligible, useReviews } from "@/hooks/useReviews";
import { reviewsService, type ReviewKind } from "@/services/reviews";
import { paths } from "@/routes/paths";
import { cn } from "@/lib/utils";

export function Stars({ value, onChange, size = "h-4 w-4" }: { value: number; onChange?: (n: number) => void; size?: string }) {
  return (
    <div className="flex gap-0.5" role={onChange ? "radiogroup" : "img"} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Star className={cn(size, n <= value ? "fill-accent text-primary/50" : "text-muted-foreground/40")} />;
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={n === value} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => onChange(n)} className="rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {icon}
          </button>
        ) : <span key={n}>{icon}</span>;
      })}
    </div>
  );
}

/** Reviews list + verified-customer form for a book or facility. */
export function Reviews({ kind, id }: { kind: ReviewKind; id: string }) {
  const { user } = useAuth();
  const list = useReviews(kind, id);
  const eligible = useReviewEligible(kind, id);
  const mine = list.data?.find((r) => r.user_id === user?.id);
  const published = (list.data ?? []).filter((r) => r.status === "published");
  const avg = published.length ? published.reduce((s, r) => s + r.rating, 0) / published.length : 0;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const save = useAction(reviewsService.save, ["reviews"], "Thank you for your review");
  const label = kind === "book" ? "bought this book" : "stayed or used this facility";

  const startEdit = () => { setRating(mine!.rating); setComment(mine!.comment); setEditing(true); };
  const showForm = eligible.data && (!mine || editing);

  return (
    <section className="mt-12 border-t pt-8" aria-labelledby="reviews-h">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="reviews-h" className="text-2xl font-bold">Reviews & Ratings</h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Stars value={Math.round(avg)} />
            {published.length ? `${avg.toFixed(1)} · ${published.length} review${published.length > 1 ? "s" : ""}` : "No reviews yet"}
          </div>
        </div>
      </div>

      {showForm ? (
        <form
          className="mb-6 rounded-xl border bg-card p-4 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            if (!rating) return;
            save.mutate({ kind, target: id, rating, comment, id: mine?.id }, { onSuccess: () => setEditing(false) });
          }}
        >
          <p className="mb-2 text-sm font-semibold">{mine ? "Edit your review" : "Share your experience"}</p>
          <Stars value={rating} onChange={setRating} size="h-6 w-6" />
          <Textarea className="mt-3" rows={3} maxLength={2000} placeholder="What did you think? (optional)" value={comment} onChange={(e) => setComment(e.target.value)} aria-label="Your review" />
          <div className="mt-3 flex gap-2">
            <Button type="submit" size="sm" disabled={!rating || save.isPending}>{mine ? "Update review" : "Submit review"}</Button>
            {editing && <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
          </div>
        </form>
      ) : (
        <p className="mb-6 rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">
          {!user ? (<><Link to={paths.auth} className="font-medium text-primary underline-offset-4 hover:underline">Sign in</Link> to review. Only customers who {label} can leave a rating.</>)
            : mine ? (<>You reviewed this{mine.status === "hidden" && " (hidden by CSLC)"}. <button className="font-medium text-primary hover:underline" onClick={startEdit}>Edit review</button></>)
            : `Only verified customers who ${label} can leave a rating.`}
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {published.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{r.author_name}</span>
              <Stars value={r.rating} />
            </div>
            {r.comment && <p className="mt-2 whitespace-pre-line break-words text-sm text-muted-foreground">{r.comment}</p>}
            <p className="mt-2 text-[11px] text-muted-foreground">Verified customer · {new Date(r.created_at).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
