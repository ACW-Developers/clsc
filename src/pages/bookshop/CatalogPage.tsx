import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BookOpen, Search, Smartphone, MapPin, Receipt, X } from "lucide-react";
import hero from "@/assets/bookshop-reading.jpg";
import { ShopFrame } from "@/components/bookshop/ShopFrame";
import { BookCard } from "@/components/bookshop/BookCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCatalog } from "@/hooks/bookshop/useCatalog";
import { useCart } from "@/hooks/bookshop/useCart";
import { availableStock } from "@/lib/bookshop";
import { cn } from "@/lib/utils";
import { branchName, type Branch } from "@/services/bookshop/catalog";
import { paths } from "@/routes/paths";

const perks = [
  { icon: BookOpen, title: "Faith & Christian living", text: "Bibles, devotionals and more" },
  { icon: MapPin, title: "Two branches", text: "Collect at Yaya Centre or Kisumu" },
  { icon: Smartphone, title: "M-Pesa or card", text: "Secure checkout in seconds" },
  { icon: Receipt, title: "Instant receipt", text: "Saved to your account" },
];

export default function CatalogPage() {
  const params = useParams(), cart = useCart(), q = useCatalog();
  const selected = params.branch === "kisumu" ? "kisumu" : params.branch === "yaya" ? "yaya" : null;
  const branch: Branch = selected ?? cart.branch;
  const [search, setSearch] = useState(""), [category, setCategory] = useState("all"), [sort, setSort] = useState("title");
  const all = (q.data ?? []).filter((b) => b.is_published && (!selected || availableStock(b, selected) > 0));
  const categories = [...new Set(all.map((b) => b.category))].sort();
  const books = all
    .filter((b) => (category === "all" || category === b.category) && `${b.title} ${b.author} ${b.description}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : sort === "rated" ? (b.rating ?? 0) - (a.rating ?? 0) : a.title.localeCompare(b.title));
  const filtered = category !== "all" || !!search.trim();
  return (
    <ShopFrame>
      <main>
        <section className="relative overflow-hidden">
          <img src={hero} alt="Books and an open volume in a welcoming reading room" width={1536} height={864} fetchPriority="high"
            className="absolute inset-0 h-full w-full animate-kenburns object-cover motion-reduce:animate-none" />
          <div className="absolute inset-0 bg-hero-dark" />
          <div className="container relative py-14 text-primary-foreground sm:py-24">
            <nav aria-label="Breadcrumb" className="mb-4 text-sm text-primary-foreground/80">
              <Link to={paths.home} className="hover:text-primary-foreground">Home</Link> <span aria-hidden>/</span> <span>Bookshop</span>
              {selected && <> <span aria-hidden>/</span> <span>{branchName(selected)}</span></>}
            </nav>
            <p className="mb-3 inline-flex rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
              {selected ? `${branchName(selected)} branch` : "Yaya Centre · Kisumu"}
            </p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 sm:text-6xl motion-reduce:animate-none">
              {selected ? `${branchName(selected)} Bookshop` : "CSLC Bookshop"}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-primary-foreground/90">Faith, knowledge and a new chapter. Find your next meaningful read.</p>
            <form role="search" onSubmit={(e) => { e.preventDefault(); document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }); }}
              className="mt-7 flex max-w-lg items-center gap-2 rounded-full bg-card p-1.5 pl-4 shadow-lift">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input aria-label="Search books" placeholder="Search by title or author" value={search} onChange={(e) => setSearch(e.target.value)}
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
              <Button type="submit" className="rounded-full px-5">Search</Button>
            </form>
          </div>
        </section>

        <div className="border-b bg-secondary/60">
          <div className="container grid grid-cols-2 gap-x-4 gap-y-4 py-5 lg:grid-cols-4">
            {perks.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-primary shadow-sm"><Icon className="h-5 w-5" /></span>
                <div className="min-w-0"><p className="text-sm font-semibold leading-tight">{title}</p><p className="hidden text-xs text-muted-foreground sm:block">{text}</p></div>
              </div>
            ))}
          </div>
        </div>

        <section id="catalog" className="container scroll-mt-40 py-10 sm:py-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Our collection</p>
              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{selected ? `Books at ${branchName(selected)}` : "Find your next read"}</h2>
              <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">{q.isLoading ? "Loading…" : `${books.length} book${books.length === 1 ? "" : "s"} · ${branchName(branch)} stock`}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!selected && (
                <Select value={cart.branch} onValueChange={(v) => {
                  if (v !== "yaya" && v !== "kisumu") return;
                  if (cart.lines.length && !confirm("Switch branch and clear your current cart?")) return;
                  cart.setBranch(v);
                }}>
                  <SelectTrigger aria-label="Shopping branch" className="w-40 rounded-full"><MapPin className="h-4 w-4 text-primary" /><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yaya">Yaya Centre</SelectItem><SelectItem value="kisumu">Kisumu</SelectItem></SelectContent>
                </Select>
              )}
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-44 rounded-full" aria-label="Sort books"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title A–Z</SelectItem>
                  <SelectItem value="rated">Top rated</SelectItem>
                  <SelectItem value="low">Price: low to high</SelectItem>
                  <SelectItem value="high">Price: high to low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="-mx-3 mb-8 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Shop by category">
            {["all", ...categories].map((c) => (
              <button key={c} type="button" aria-pressed={c === category} onClick={() => setCategory(c)}
                className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  c === category ? "border-primary bg-primary text-primary-foreground shadow-card" : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground")}>
                {c === "all" ? "All books" : c}
              </button>
            ))}
            {filtered && (
              <button type="button" onClick={() => { setCategory("all"); setSearch(""); }} className="inline-flex shrink-0 items-center gap-1 px-2 text-sm font-medium text-primary hover:underline">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>

          <div className="relative mb-6 sm:hidden">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input aria-label="Filter books" placeholder="Filter by title or author" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-full pl-9" />
          </div>

          {all.some((b) => b.is_sample) && (
            <p className="mb-5 border-l-2 border-primary/40 pl-3 text-xs text-muted-foreground">Demo stock uses real book covers with example prices and quantities, not confirmed CSLC inventory.</p>
          )}
          {q.isLoading ? (
            <div role="status" aria-label="Loading books" className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border"><Skeleton className="aspect-[4/5] rounded-none" /><div className="space-y-2 p-4"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-1/4" /></div></div>
              ))}
            </div>
          ) : q.error ? (
            <p className="text-destructive">{q.error.message}</p>
          ) : books.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
              {books.map((b, i) => <BookCard key={b.id} book={b} branch={branch} style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed py-16 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary"><BookOpen className="h-6 w-6" /></span>
              <h3 className="font-semibold">No books found</h3>
              <p className="mt-1 text-sm text-muted-foreground">{all.length ? "Try another category or search." : "Books will appear here when branch stock is available."}</p>
              {filtered && <Button variant="outline" className="mt-5 rounded-full" onClick={() => { setCategory("all"); setSearch(""); }}>Clear filters</Button>}
            </div>
          )}
        </section>
      </main>
    </ShopFrame>
  );
}
