import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, MapPin, Lock } from "lucide-react";
import mpesaLogo from "@/assets/payments/mpesa.webp";
import paystackLogo from "@/assets/payments/paystack.webp";
import { ShopFrame } from "@/components/bookshop/ShopFrame";
import { coverFallback } from "@/components/bookshop/BookCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalog } from "@/hooks/bookshop/useCatalog";
import { useCart } from "@/hooks/bookshop/useCart";
import { availableStock, cartTotal } from "@/lib/bookshop";
import { branchName } from "@/services/bookshop/catalog";
import { kes } from "@/lib/booking";
import { bookUrl, paths } from "@/routes/paths";

export default function CartPage() {
  const cart = useCart(), q = useCatalog(), books = q.data ?? [];
  const invalid = cart.lines.some((l) => {
    const b = books.find((b) => b.id === l.book_id);
    return !b || availableStock(b, cart.branch) < l.quantity;
  });
  const total = cartTotal(cart.lines, books);
  return (
    <ShopFrame>
      <main className="container py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground"><Link to={paths.bookshop} className="hover:text-primary">Bookshop</Link> / Cart</nav>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-bold sm:text-4xl">Your cart</h1>
          {cart.lines.length > 0 && <p className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"><MapPin className="h-3.5 w-3.5" />Collect at {branchName(cart.branch)}</p>}
        </div>
        {q.isLoading ? (
          <div className="mt-8 space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
        ) : q.error ? (
          <p className="py-10 text-destructive">{q.error.message}</p>
        ) : !cart.lines.length ? (
          <div className="mx-auto mt-10 max-w-md rounded-3xl border border-dashed px-6 py-16 text-center animate-in fade-in duration-500">
            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary"><ShoppingBag className="h-7 w-7" /></span>
            <h2 className="text-xl font-semibold">Your cart is empty</h2>
            <p className="mt-2 text-sm text-muted-foreground">Discover Bibles, devotionals and Christian living titles at our Yaya Centre and Kisumu branches.</p>
            <Button asChild className="mt-6 rounded-full"><Link to={paths.bookshop}>Browse books <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
        ) : (
          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_360px] lg:gap-10">
            <ul className="space-y-3" aria-label="Cart items">
              {cart.lines.map((l, i) => {
                const b = books.find((b) => b.id === l.book_id), stock = b ? availableStock(b, cart.branch) : 0;
                return (
                  <li key={l.book_id} style={{ animationDelay: `${i * 50}ms` }}
                    className="flex gap-4 rounded-2xl border bg-card p-3 transition-shadow duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both hover:shadow-card sm:p-4 motion-reduce:animate-none">
                    <Link to={bookUrl(l.book_id, cart.branch)} className="flex h-28 w-20 shrink-0 items-center justify-center rounded-xl bg-cover p-2 sm:h-32 sm:w-24">
                      <img src={b?.image_url || "/placeholder.svg"} alt={b?.title ?? "Unavailable book"} width={80} height={110} onError={coverFallback} className="h-full w-full object-contain drop-shadow-md" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link to={bookUrl(l.book_id, cart.branch)} className="line-clamp-2 font-semibold leading-snug hover:text-primary">{b?.title ?? "Book unavailable"}</Link>
                          <p className="truncate text-sm text-muted-foreground">{b?.author}</p>
                        </div>
                        <Button size="icon" variant="ghost" className="-mr-1 -mt-1 shrink-0 rounded-full text-muted-foreground hover:text-destructive" aria-label={`Remove ${b?.title ?? "book"}`} title="Remove" onClick={() => cart.quantity(l.book_id, 0)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {l.quantity > stock && <p className="mt-1 text-xs text-destructive">Only {stock} available — adjust or remove this book.</p>}
                      <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
                        <div className="flex items-center rounded-full border bg-background">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" aria-label={`Reduce ${b?.title ?? "book"} quantity`} onClick={() => cart.quantity(l.book_id, l.quantity - 1)}><Minus className="h-3.5 w-3.5" /></Button>
                          <span className="w-7 text-center text-sm font-semibold" aria-label={`Quantity ${l.quantity}`}>{l.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" disabled={l.quantity >= stock || l.quantity >= 99} aria-label={`Increase ${b?.title ?? "book"} quantity`} onClick={() => cart.quantity(l.book_id, l.quantity + 1)}><Plus className="h-3.5 w-3.5" /></Button>
                        </div>
                        <div className="text-right">
                          {l.quantity > 1 && <p className="text-xs text-muted-foreground">{kes(b?.price ?? 0)} each</p>}
                          <p className="font-bold">{kes((b?.price ?? 0) * l.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <section aria-label="Order summary" className="space-y-4 rounded-2xl border bg-card p-5 shadow-card lg:sticky lg:top-40">
              <h2 className="text-lg font-semibold">Order summary</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Items ({cart.count})</dt><dd>{kes(total)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Collection</dt><dd>{branchName(cart.branch)} · Free</dd></div>
                <div className="flex justify-between border-t pt-3 text-lg font-bold"><dt>Total</dt><dd className="text-primary">{kes(total)}</dd></div>
              </dl>
              {invalid ? (
                <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Update unavailable quantities before checkout.</p>
              ) : (
                <Button asChild size="lg" className="w-full rounded-full"><Link to={paths.bookshopCheckout}>Checkout <ArrowRight className="h-4 w-4" /></Link></Button>
              )}
              <Button asChild variant="ghost" className="w-full rounded-full"><Link to={paths.bookshop}>Continue shopping</Link></Button>
              <div className="flex items-center justify-center gap-3 border-t pt-4">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <img src={mpesaLogo} alt="M-Pesa" className="h-5 w-14 object-contain" />
                <img src={paystackLogo} alt="Paystack" className="h-5 w-16 object-contain" />
              </div>
              <p className="text-center text-xs text-muted-foreground">Test mode · no real money is charged</p>
            </section>
          </div>
        )}
      </main>
    </ShopFrame>
  );
}
