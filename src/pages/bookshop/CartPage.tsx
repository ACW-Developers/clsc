import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowRight, ShoppingCart } from "lucide-react";
import { ShopFrame } from "@/components/bookshop/ShopFrame";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/hooks/bookshop/useCatalog";
import { useCart } from "@/hooks/bookshop/useCart";
import { availableStock, cartTotal } from "@/lib/bookshop";
import { branchName } from "@/services/bookshop/catalog";
import { kes } from "@/lib/booking";
import { bookUrl, paths } from "@/routes/paths";
export default function CartPage() {
  const cart = useCart(),
    q = useCatalog(),
    books = q.data ?? [];
  const invalid = cart.lines.some((l) => {
    const b = books.find((b) => b.id === l.book_id);
    return !b || availableStock(b, cart.branch) < l.quantity;
  });
  return (
    <ShopFrame>
      <main className="container py-10">
        <p className="text-sm text-muted-foreground">Bookshop / Cart</p>
        <h1 className="mt-2 font-serif text-3xl font-bold">
          Your shopping cart
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          CSLC Bookshop · {branchName(cart.branch)} · Collection at selected
          branch
        </p>
        {q.isLoading ? (
          <p className="py-10">Loading cart…</p>
        ) : q.error ? (
          <p className="py-10 text-destructive">{q.error.message}</p>
        ) : !cart.lines.length ? (
          <div className="py-16 text-center">
            <ShoppingCart className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="mb-5 text-xl font-semibold">Your cart is empty</h2>
            <Button asChild>
              <Link to={paths.bookshop}>
                Browse books <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_320px]">
            <div className="divide-y border-y">
              {cart.lines.map((l) => {
                const b = books.find((b) => b.id === l.book_id),
                  stock = b ? availableStock(b, cart.branch) : 0;
                return (
                  <div
                    key={l.book_id}
                    className="flex flex-wrap items-center gap-4 py-5"
                  >
                    <img
                      src={b?.image_url || "/placeholder.svg"}
                      alt={b?.title ?? "Unavailable book"}
                      width={70}
                      height={95}
                      className="h-24 w-16 object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={bookUrl(l.book_id, cart.branch)}
                        className="font-semibold"
                      >
                        {b?.title ?? "Book unavailable"}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {b?.author}
                      </p>
                      <p className="mt-1 font-semibold text-primary">
                        {kes(b?.price ?? 0)}
                      </p>
                      {l.quantity > stock && (
                        <p className="text-xs text-destructive">
                          Only {stock} available; adjust or remove this book.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label={`Reduce ${b?.title ?? "book"} quantity`}
                        onClick={() => cart.quantity(l.book_id, l.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center">{l.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={l.quantity >= stock || l.quantity >= 99}
                        aria-label={`Increase ${b?.title ?? "book"} quantity`}
                        onClick={() => cart.quantity(l.book_id, l.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remove ${b?.title ?? "book"}`}
                        title="Remove book"
                        onClick={() => cart.quantity(l.book_id, 0)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <section className="space-y-5 border-y py-5">
              <h2 className="text-lg font-semibold">Order summary</h2>
              <div className="flex justify-between">
                <span>{cart.count} book(s)</span>
                <strong>{kes(cartTotal(cart.lines, books))}</strong>
              </div>
              <p className="text-sm text-muted-foreground">
                Collection: {branchName(cart.branch)}
                <br />
                Simulated M-Pesa · No money charged
              </p>
              {invalid ? (
                <p className="text-sm text-destructive">
                  Update unavailable quantities before checkout.
                </p>
              ) : (
                <Button asChild className="w-full">
                  <Link to={paths.bookshopCheckout}>
                    Continue to checkout <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link to={paths.bookshop}>Continue shopping</Link>
              </Button>
            </section>
          </div>
        )}
      </main>
    </ShopFrame>
  );
}
