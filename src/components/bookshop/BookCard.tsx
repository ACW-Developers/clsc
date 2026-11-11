import { useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Stars } from "@/components/common/Reviews";
import { useCart } from "@/hooks/bookshop/useCart";
import { availableStock } from "@/lib/bookshop";
import { cn } from "@/lib/utils";
import { bookUrl, paths } from "@/routes/paths";
import { kes } from "@/lib/booking";
import type { Book, Branch } from "@/services/bookshop/catalog";

export const LOW_STOCK = 5;

/** Shared add-to-cart behaviour: confirms branch switches and offers a quick route to the cart. */
export function useAddToCart() {
  const cart = useCart(), nav = useNavigate();
  return (book: Book, branch: Branch, qty = 1) => {
    const stock = availableStock(book, branch);
    if (!stock) return false;
    if (cart.lines.length && cart.branch !== branch && !confirm("Switch branch and replace your current cart?")) return false;
    cart.add(book.id, branch, stock, qty);
    toast.success(`${book.title} added to cart`, { action: { label: "View cart", onClick: () => nav(paths.cart) } });
    return true;
  };
}

export const coverFallback = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = "/placeholder.svg";
};

export function BookCard({ book, branch, style }: { book: Book; branch: Branch; style?: CSSProperties }) {
  const add = useAddToCart(), stock = availableStock(book, branch);
  const [added, setAdded] = useState(false);
  const url = bookUrl(book.id, branch);
  return (
    <article style={style}
      className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 fill-mode-both hover:-translate-y-1 hover:border-primary/20 hover:shadow-lift motion-reduce:animate-none motion-reduce:hover:translate-y-0">
      <div className="relative aspect-[4/5] overflow-hidden bg-cover p-5 sm:p-6">
        <img src={book.image_url || "/placeholder.svg"} alt="" loading="lazy" width={240} height={320} onError={coverFallback}
          className="h-full w-full object-contain drop-shadow-xl transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:group-hover:scale-100" />
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
          {!stock ? <span className="rounded-full bg-foreground/80 px-2 py-0.5 text-[10px] font-semibold text-background">Out of stock</span>
            : stock <= LOW_STOCK && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Only {stock} left</span>}
          {book.is_sample && <span className="rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Demo stock</span>}
        </div>
        {stock > 0 && (
          <button type="button" aria-label={`Add ${book.title} to cart`} title="Add to cart"
            onClick={() => { if (add(book, branch)) { setAdded(true); setTimeout(() => setAdded(false), 1500); } }}
            className={cn("absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full shadow-card transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100",
              added ? "bg-success text-primary-foreground md:translate-y-0 md:opacity-100" : "bg-card text-primary hover:bg-primary hover:text-primary-foreground")}>
            {added ? <Check className="h-4 w-4 animate-pop-in" /> : <ShoppingBag className="h-4 w-4" />}
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/80">{book.category}</p>
        <Link to={url} className="line-clamp-2 font-semibold leading-snug transition-colors after:absolute after:inset-0 after:content-[''] hover:text-primary focus-visible:outline-none focus-visible:after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring">
          {book.title}
        </Link>
        <p className="truncate text-xs text-muted-foreground">{book.author}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {book.rating != null && book.rating_count > 0 ? <><Stars value={Math.round(book.rating)} size="h-3 w-3" /><span>({book.rating_count})</span></> : <span>Not yet rated</span>}
        </div>
        <p className="mt-auto pt-2 text-base font-bold text-foreground">{kes(book.price)}</p>
      </div>
    </article>
  );
}
