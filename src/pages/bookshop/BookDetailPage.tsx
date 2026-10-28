import { Link, useParams, useSearchParams } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { ShopFrame } from "@/components/bookshop/ShopFrame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCatalog } from "@/hooks/bookshop/useCatalog";
import { useCart } from "@/hooks/bookshop/useCart";
import { availableStock } from "@/lib/bookshop";
import { branches } from "@/services/bookshop/catalog";
import { kes } from "@/lib/booking";
import { paths } from "@/routes/paths";
import { BookCard } from "@/components/bookshop/BookCard";
export default function BookDetailPage() {
  const { id } = useParams(),
    [params, setParams] = useSearchParams(),
    q = useCatalog(),
    cart = useCart();
  const book = q.data?.find((b) => b.id === id && b.is_published),
    branch =
      params.get("branch") === "kisumu"
        ? "kisumu"
        : params.get("branch") === "yaya"
          ? "yaya"
          : cart.branch;
  const stock = book ? availableStock(book, branch) : 0;
  const similar = book
    ? (q.data ?? [])
        .filter((b) => b.is_published && b.id !== book.id)
        .sort(
          (a, b) =>
            Number(b.category === book.category) -
              Number(a.category === book.category) ||
            Number(b.author === book.author) - Number(a.author === book.author),
        )
        .slice(0, 4)
    : [];
  return (
    <ShopFrame>
      <main className="container py-8 sm:py-12">
        <Link className="text-sm text-primary" to={paths.bookshop}>
          Bookshop / Books
        </Link>
        {q.isLoading ? (
          <p className="py-12">Loading book…</p>
        ) : q.error ? (
          <p className="py-12 text-destructive">{q.error.message}</p>
        ) : !book ? (
          <h1 className="py-12 text-2xl">Book not found</h1>
        ) : (
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <div className="flex aspect-square max-h-[560px] items-center justify-center bg-muted p-10">
              <img
                src={book.image_url || "/placeholder.svg"}
                alt={`${book.title} cover`}
                width={400}
                height={560}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="space-y-5">
              <p className="text-sm uppercase text-muted-foreground">
                {book.category}
              </p>
              <h1 className="font-serif text-3xl font-bold">{book.title}</h1>
              <p className="text-muted-foreground">By {book.author}</p>
              <p className="text-2xl font-bold text-primary">
                {kes(book.price)}
              </p>
              <p className="text-sm text-muted-foreground">
                {book.rating != null && book.rating_count > 0
                  ? `${book.rating} / 5 · ${book.rating_count} ratings`
                  : "Not yet rated"}
              </p>
              <p className="whitespace-pre-line leading-relaxed">
                {book.description}
              </p>
              {book.is_sample && (
                <Badge variant="secondary">
                  Demonstration listing · Example price & stock
                </Badge>
              )}
              <div>
                <h2 className="mb-2 font-semibold">Bookshop branch</h2>
                <div className="flex flex-wrap gap-2">
                  {branches.map((b) => (
                    <Button
                      key={b.id}
                      variant={branch === b.id ? "default" : "outline"}
                      onClick={() => setParams({ branch: b.id })}
                    >
                      {b.name} ({availableStock(book, b.id)})
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-sm">
                {stock
                  ? `${stock} copies available`
                  : "Out of stock at this branch"}
              </p>
              <Button
                disabled={!stock}
                onClick={() => {
                  if (
                    cart.lines.length &&
                    cart.branch !== branch &&
                    !confirm("Switch branch and replace your current cart?")
                  )
                    return;
                  cart.add(book.id, branch, stock);
                  toast.success("Book added to cart");
                }}
              >
                <ShoppingCart className="h-4 w-4" />
                Add to cart
              </Button>
              {book.isbn && (
                <p className="border-t pt-4 text-sm text-muted-foreground">
                  ISBN: {book.isbn}
                </p>
              )}
            </div>
          </div>
        )}
        {similar.length > 0 && (
          <section className="mt-12 border-t pt-8">
            <h2 className="mb-6 font-serif text-2xl font-bold">
              Similar Books
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {similar.map((b) => (
                <BookCard key={b.id} book={b} branch={branch} />
              ))}
            </div>
          </section>
        )}
      </main>
    </ShopFrame>
  );
}
