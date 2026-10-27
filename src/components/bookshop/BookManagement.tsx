import { useState } from "react";
import { Plus, Pencil, Search, Upload, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCatalog } from "@/hooks/bookshop/useCatalog";
import { useAction, useRoles } from "@/hooks/useHospitality";
import {
  catalogService,
  branches,
  type Book,
  type Branch,
} from "@/services/bookshop/catalog";
import { kes } from "@/lib/booking";
import { stockFor } from "@/lib/bookshop";
const initial = {
  title: "",
  author: "",
  description: "",
  category: "Christian Living",
  isbn: "",
  price: 0,
  image_url: "",
  rating: null as number | null,
  rating_count: 0,
  is_published: false,
  is_sample: false,
};
type StockInput = {
  branch: Branch;
  quantity: number;
  low_stock_threshold: number;
  is_available: boolean;
};
export function BookManagement() {
  const q = useCatalog(),
    roles = useRoles(),
    [search, setSearch] = useState(""),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const [form, setForm] = useState<{ id?: string } & typeof initial>(initial);
  const [stock, setStock] = useState<StockInput[]>(
    branches.map((b) => ({
      branch: b.id,
      quantity: 0,
      low_stock_threshold: 5,
      is_available: true,
    })),
  );
  const save = useAction(
    catalogService.save,
    ["books"],
    "Book and branch stock saved",
  );
  const upload = useAction(catalogService.upload, [], "Cover uploaded");
  const edit = (b?: Book) => {
    setError("");
    setForm(
      b
        ? {
            id: b.id,
            title: b.title,
            author: b.author,
            description: b.description,
            category: b.category,
            isbn: b.isbn,
            price: b.price,
            image_url: b.image_url,
            rating: b.rating,
            rating_count: b.rating_count,
            is_published: b.is_published,
            is_sample: b.is_sample,
          }
        : initial,
    );
    setStock(
      branches.map((branch) => {
        const s = b ? stockFor(b, branch.id) : null;
        return {
          branch: branch.id,
          quantity: s?.quantity ?? 0,
          low_stock_threshold: s?.low_stock_threshold ?? 5,
          is_available: s?.is_available ?? true,
        };
      }),
    );
    setOpen(true);
  };
  if (!roles.isSuperAdmin)
    return <p>Book management is restricted to the super administrator.</p>;
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search managed books"
            placeholder="Search books…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => edit()}>
          <Plus className="h-4 w-4" />
          Add book
        </Button>
      </div>
      {q.isLoading ? (
        <p>Loading books…</p>
      ) : q.error ? (
        <p className="text-destructive">{q.error.message}</p>
      ) : !q.data?.length ? (
        <div className="border-y py-12 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8" />
          <p>No books yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {q.data
            .filter((b) =>
              `${b.title} ${b.author} ${b.category}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((b) => (
              <article
                key={b.id}
                className="flex gap-4 rounded-lg border bg-card p-4"
              >
                <img
                  src={b.image_url || "/placeholder.svg"}
                  alt={b.title}
                  loading="lazy"
                  width={60}
                  height={85}
                  className="h-24 w-16 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{b.title}</h2>
                  <p className="text-xs text-muted-foreground">{b.author}</p>
                  <p className="my-2 font-semibold text-primary">
                    {kes(b.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Yaya: {stockFor(b, "yaya")?.quantity ?? 0} · Kisumu:{" "}
                    {stockFor(b, "kisumu")?.quantity ?? 0}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Badge variant={b.is_published ? "secondary" : "outline"}>
                      {b.is_published ? "Published" : "Draft"}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Edit ${b.title}`}
                      title="Edit book"
                      onClick={() => edit(b)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit book & inventory" : "Add book"}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              try {
                await save.mutateAsync({ book: form, stock });
                setOpen(false);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Unable to save book",
                );
              }
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["title", "Title"],
                  ["author", "Author"],
                  ["category", "Category"],
                  ["isbn", "ISBN"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={`book-${key}`}>{label}</Label>
                  <Input
                    id={`book-${key}`}
                    value={form[key]}
                    maxLength={
                      key === "isbn" ? 20 : key === "category" ? 80 : 200
                    }
                    required={key === "title" || key === "category"}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Label htmlFor="book-description">Description</Label>
              <Textarea
                id="book-description"
                maxLength={5000}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="book-price">Price (KES)</Label>
                <Input
                  id="book-price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="book-rating">Verified rating (optional)</Label>
                <Input
                  id="book-rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      rating: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="book-rating-count">Verified rating count</Label>
                <Input
                  id="book-rating-count"
                  type="number"
                  min="0"
                  value={form.rating_count}
                  onChange={(e) =>
                    setForm({ ...form, rating_count: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-image">Cover image URL</Label>
              <Input
                id="book-image"
                value={form.image_url}
                maxLength={2048}
                onChange={(e) =>
                  setForm({ ...form, image_url: e.target.value })
                }
              />
              <Label className="flex cursor-pointer items-center gap-2 text-primary">
                <Upload className="h-4 w-4" />
                {upload.isPending ? "Uploading…" : "Upload real book cover"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={upload.isPending}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await upload.mutateAsync(file);
                      setForm((old) => ({ ...old, image_url: url }));
                    } catch {
                      /* mutation displays error */
                    }
                  }}
                />
              </Label>
            </div>
            <h3 className="border-t pt-4 font-semibold">Branch inventory</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {stock.map((s, i) => (
                <fieldset key={s.branch} className="space-y-3">
                  <legend className="mb-2 font-medium">
                    {branches.find((b) => b.id === s.branch)?.name}
                  </legend>
                  <Label htmlFor={`stock-${s.branch}`}>Stock quantity</Label>
                  <Input
                    id={`stock-${s.branch}`}
                    type="number"
                    min="0"
                    required
                    value={s.quantity}
                    onChange={(e) =>
                      setStock((old) =>
                        old.map((v, j) =>
                          j === i
                            ? { ...v, quantity: Number(e.target.value) }
                            : v,
                        ),
                      )
                    }
                  />
                  <Label htmlFor={`low-${s.branch}`}>
                    Low-stock alert threshold
                  </Label>
                  <Input
                    id={`low-${s.branch}`}
                    type="number"
                    min="0"
                    required
                    value={s.low_stock_threshold}
                    onChange={(e) =>
                      setStock((old) =>
                        old.map((v, j) =>
                          j === i
                            ? {
                                ...v,
                                low_stock_threshold: Number(e.target.value),
                              }
                            : v,
                        ),
                      )
                    }
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={s.is_available}
                      onCheckedChange={(v) =>
                        setStock((old) =>
                          old.map((x, j) =>
                            j === i ? { ...x, is_available: v === true } : x,
                          ),
                        )
                      }
                    />
                    Available for sale
                  </label>
                </fieldset>
              ))}
            </div>
            <div className="flex flex-wrap gap-5 border-t pt-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.is_published}
                  onCheckedChange={(v) =>
                    setForm({ ...form, is_published: v === true })
                  }
                />
                Published
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.is_sample}
                  onCheckedChange={(v) =>
                    setForm({ ...form, is_sample: v === true })
                  }
                />
                Demonstration stock
              </label>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={save.isPending || upload.isPending}>
              {save.isPending ? "Saving…" : "Save book & stock"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
