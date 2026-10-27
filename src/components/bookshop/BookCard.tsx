import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/bookshop/useCart";
import { availableStock } from "@/lib/bookshop";
import { bookUrl } from "@/routes/paths";
import { kes } from "@/lib/booking";
import type { Book, Branch } from "@/services/bookshop/catalog";
export function BookCard({ book, branch }: { book: Book; branch: Branch }) {
  const cart = useCart(),
    stock = availableStock(book, branch);
  return (
    <article className="group flex min-w-0 flex-col rounded-lg border bg-card transition hover:shadow-card">
      <Link
        to={bookUrl(book.id, branch)}
        className="relative flex aspect-[5/5] items-center justify-center overflow-hidden bg-muted p-0"
      >
        <img
          src={book.image_url || "/placeholder.svg"}
          alt={`${book.title} book cover`}
          loading="lazy"
          width={240}
          height={320}
          className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
        {book.is_sample && (
          <Badge
            variant="secondary"
            className="absolute left-2 top-2 text-[10px]"
          >
            Demo stock
          </Badge>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <p className="text-[11px] uppercase text-muted-foreground">
          {book.category}
        </p>
        <Link
          to={bookUrl(book.id, branch)}
          className="font-semibold leading-snug hover:text-primary"
        >
          {book.title}
        </Link>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {book.description.split("Demonstration listing")[0]}
        </p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {book.rating != null && book.rating_count > 0 ? (
            <>
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              {book.rating} ({book.rating_count})
            </>
          ) : (
            "Not yet rated"
          )}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <strong className="text-sm text-primary">{kes(book.price)}</strong>
          <Button
            size="icon"
            variant="outline"
            aria-label={`Add ${book.title} to cart`}
            title="Add to cart"
            disabled={!stock}
            onClick={() => {
              if (
                cart.lines.length &&
                cart.branch !== branch &&
                !confirm("Switch branch and replace the current cart?")
              )
                return;
              cart.add(book.id, branch, stock);
              toast.success("Book added to cart");
            }}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {stock ? `${stock} in stock` : "Out of stock"}
        </p>
      </div>
    </article>
  );
}
