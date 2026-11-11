import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronRight, MapPin, Minus, Plus, Receipt, ShieldCheck, ShoppingBag, Zap } from "lucide-react";
import { ShopFrame } from "@/components/bookshop/ShopFrame";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalog } from "@/hooks/bookshop/useCatalog";
import { availableStock } from "@/lib/bookshop";
import { cn } from "@/lib/utils";
import { branches, type Branch } from "@/services/bookshop/catalog";
import { kes } from "@/lib/booking";
import { paths } from "@/routes/paths";
import { Reviews, Stars } from "@/components/common/Reviews";
import { BookCard, LOW_STOCK, coverFallback, useAddToCart } from "@/components/bookshop/BookCard";
import { useCart } from "@/hooks/bookshop/useCart";

export default function BookDetailPage() {
  const { id } = useParams(), [params, setParams] = useSearchParams(), q = useCatalog(), cart = useCart(), nav = useNavigate();
  const add = useAddToCart();
  const [qty, setQty] = useState(1);
  const book = q.data?.find((b) => b.id === id && b.is_published);
  const branch: Branch = params.get("branch") === "kisumu" ? "kisumu" : params.get("branch") === "yaya" ? "yaya" : cart.branch;
  const stock = book ? availableStock(book, branch) : 0;
  const inCart = book && cart.branch === branch ? cart.lines.find((l) => l.book_id === book.id)?.quantity ?? 0 : 0;
  const max = Math.max(0, Math.min(99, stock) - inCart), amount = Math.min(qty, Math.max(1, max));
  const similar = book
    ? (q.data ?? []).filter((b) => b.is_published && b.id !== book.id)
        .sort((a, b) => Number(b.category === book.category) - Number(a.category === book.category) || Number(b.author === book.author) - Number(a.author === book.author))
        .slice(0, 4)
    : [];
  const pickBranch = (b: Branch) => { setParams({ branch: b }, { replace: true }); setQty(1); };
  return (
    <ShopFrame>
      <main className="container py-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          <Link className="hover:text-primary" to={paths.bookshop}>Bookshop</Link>
          {book && <><ChevronRight className="h-3.5 w-3.5 shrink-0" /><span className="shrink-0">{book.category}</span><ChevronRight className="h-3.5 w-3.5 shrink-0" /><span className="truncate text-foreground">{book.title}</span></>}
        </nav>
        {q.isLoading ? (
          <div className="mt-6 grid gap-8 md:grid-cols-2"><Skeleton className="aspect-square rounded-3xl" /><div className="space-y-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-3/4" /><Skeleton className="h-6 w-32" /><Skeleton className="h-24 w-full" /></div></div>
        ) : q.error ? (
          <p className="py-12 text-destructive">{q.error.message}</p>
        ) : !book ? (
          <div className="py-16 text-center"><h1 className="text-2xl font-bold">Book not found</h1><Button asChild className="mt-5 rounded-full"><Link to={paths.bookshop}>Back to the bookshop</Link></Button></div>
        ) : (
          <div className="mt-6 grid gap-8 md:grid-cols-2 lg:gap-14">
            <div className="md:sticky md:top-40 md:self-start">
              <div className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-cover p-10 animate-in fade-in zoom-in-95 duration-500 sm:p-14 motion-reduce:animate-none">
                <img src={book.image_url || "/placeholder.svg"} alt={`${book.title} cover`} width={400} height={560} onError={coverFallback}
                  className="h-full w-full object-contain drop-shadow-2xl transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100" />
                {book.is_sample && <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-muted-foreground">Demonstration listing · Example price & stock</span>}
              </div>
            </div>
            <div className="min-w-0 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 motion-reduce:animate-none">
              <div className="space-y-3">
                <p className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{book.category}</p>
                <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{book.title}</h1>
                <p className="text-muted-foreground">By <span className="font-medium text-foreground">{book.author}</span></p>
                <a href="#reviews" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  {book.rating != null && book.rating_count > 0 ? <><Stars value={Math.round(book.rating)} /> {book.rating} · {book.rating_count} ratings</> : "Not yet rated · be the first to review"}
                </a>
              </div>
              <p className="text-3xl font-bold text-primary">{kes(book.price)}</p>
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{book.description}</p>

              <div className="space-y-3 rounded-2xl border bg-card p-4 sm:p-5">
                <h2 className="text-sm font-semibold">Collect from</h2>
                <div role="radiogroup" aria-label="Bookshop branch" className="grid grid-cols-2 gap-2">
                  {branches.map((b) => {
                    const n = availableStock(book, b.id), on = branch === b.id;
                    return (
                      <button key={b.id} type="button" role="radio" aria-checked={on} onClick={() => pickBranch(b.id)}
                        className={cn("rounded-xl border-2 p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", on ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                        <span className="flex items-center gap-1.5 text-sm font-semibold"><MapPin className={cn("h-3.5 w-3.5", on ? "text-primary" : "text-muted-foreground")} />{b.name}</span>
                        <span className={cn("mt-1 block text-xs", !n ? "text-destructive" : n <= LOW_STOCK ? "text-primary" : "text-success")}>{n ? (n <= LOW_STOCK ? `Only ${n} left` : `${n} in stock`) : "Out of stock"}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center rounded-full border bg-background">
                    <Button size="icon" variant="ghost" className="rounded-full" aria-label="Decrease quantity" disabled={amount <= 1} onClick={() => setQty(amount - 1)}><Minus className="h-4 w-4" /></Button>
                    <span className="w-8 text-center font-semibold" aria-live="polite" aria-label={`Quantity ${amount}`}>{amount}</span>
                    <Button size="icon" variant="ghost" className="rounded-full" aria-label="Increase quantity" disabled={amount >= max} onClick={() => setQty(amount + 1)}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <Button className="flex-1 rounded-full" variant="outline" disabled={!max} onClick={() => { if (add(book, branch, amount)) setQty(1); }}>
                    <ShoppingBag className="h-4 w-4" /> Add to cart
                  </Button>
                  <Button className="w-full rounded-full sm:w-auto sm:flex-1" disabled={!max && !inCart} onClick={() => { if (!max || add(book, branch, amount)) nav(paths.cart); }}>
                    <Zap className="h-4 w-4" /> Buy now
                  </Button>
                </div>
                {inCart > 0 && <p className="text-xs text-muted-foreground">{inCart} already in your cart{!max && " · that's all available stock"}.</p>}
              </div>

              <ul className="grid gap-3 text-sm sm:grid-cols-3">
                {[{ icon: ShieldCheck, label: "Secure M-Pesa or card" }, { icon: Receipt, label: "Instant receipt" }, { icon: MapPin, label: "Branch collection" }].map(({ icon: I, label }) => (
                  <li key={label} className="flex items-center gap-2 text-muted-foreground"><I className="h-4 w-4 shrink-0 text-primary" />{label}</li>
                ))}
              </ul>
              {book.isbn && <dl className="flex justify-between border-t pt-4 text-sm"><dt className="text-muted-foreground">ISBN</dt><dd className="font-medium">{book.isbn}</dd></dl>}
            </div>
          </div>
        )}
        {book && <div id="reviews" className="scroll-mt-40"><Reviews kind="book" id={book.id} /></div>}
        {similar.length > 0 && (
          <section className="mt-14 border-t pt-10">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold">Similar Books</h2>
              <Link to={paths.bookshop} className="text-sm font-medium text-primary hover:underline">View all</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {similar.map((b, i) => <BookCard key={b.id} book={b} branch={branch} style={{ animationDelay: `${i * 60}ms` }} />)}
            </div>
          </section>
        )}
      </main>
    </ShopFrame>
  );
}
