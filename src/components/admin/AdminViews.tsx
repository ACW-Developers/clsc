import { useMemo, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { bookingLabel, kes, labelVariant } from "@/lib/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  useAction,
  useAllRoles,
  useBookings,
  useLogs,
  useProfiles,
  useRoles,
  useServices,
  useSettings,
  useSubServices,
} from "@/hooks/useHospitality";
import {
  BOOKING_STATUSES,
  hospitalityService as svc,
  type Service,
  type SubService,
  type BookingStatus,
} from "@/services/hospitality";

import { categoryConfig } from "@/config/facilityCategories";
import { OverviewCharts } from "./OverviewCharts";
import { StatCard } from "@/components/common/StatCard";
import { UserAnalytics } from "./UserAnalytics";
import { useOrders } from "@/hooks/bookshop/useOrders";
import { useDonations } from "@/hooks/programmes/useDonations";
import { useCatalog } from "@/hooks/bookshop/useCatalog";
import {
  ShoppingBag,
  Users as UsersIcon,
  BookOpen,
  BedDouble,
  CalendarCheck,
  HeartHandshake,
  TrendingUp,
} from "lucide-react";
import { TrafficAnalytics } from "./TrafficAnalytics";
import { Activity } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  chartColors,
  chartTooltipStyle,
  dailyActivity,
} from "./analyticsPresentation";

const PAGE = 10;

export function State({
  q,
  empty,
  children,
}: {
  q: { isLoading: boolean; error: unknown };
  empty: boolean;
  children: ReactNode;
}) {
  if (q.isLoading)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  if (q.error)
    return (
      <Alert variant="destructive">
        <AlertDescription>{(q.error as Error).message}</AlertDescription>
      </Alert>
    );
  if (empty)
    return (
      <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        Nothing here yet.
      </p>
    );
  return <>{children}</>;
}

function Pager({
  page,
  total,
  set,
}: {
  page: number;
  total: number;
  set: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm">
      <Button
        size="sm"
        variant="outline"
        disabled={page <= 1}
        onClick={() => set(page - 1)}
      >
        Prev
      </Button>
      <span>
        {page} / {pages}
      </span>
      <Button
        size="sm"
        variant="outline"
        disabled={page >= pages}
        onClick={() => set(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

const statusVariant = (s: string) =>
  (s === "confirmed" || s === "completed"
    ? "default"
    : s === "pending"
      ? "secondary"
      : "destructive") as "default" | "secondary" | "destructive";

function Card({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border bg-card p-4 shadow-card">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-xl font-bold text-primary sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

export function Overview({ go }: { go: (v: string) => void }) {
  const b = useBookings(),
    s = useServices(),
    f = useSubServices(),
    p = useProfiles();
  const orders = useOrders(true),
    donations = useDonations(true),
    books = useCatalog();
  const count = (st: string) =>
    b.data?.filter((x) => x.status === st).length ?? 0;
  const hospitalitySales = (b.data ?? [])
    .filter((x) => x.payment_status === "paid")
    .reduce((n, x) => n + Number(x.total_amount ?? 0), 0);
  const bookSales = (orders.data ?? [])
    .filter((x) => x.payment_status === "paid")
    .reduce((n, x) => n + Number(x.amount), 0);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">CSLC at a glance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hospitality, bookshop and student programme records
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString("en-KE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
      {[b, orders, donations, books, p].some((q) => q.error) && (
        <Alert variant="destructive">
          <AlertDescription>
            Some records could not be loaded. Refresh to try again.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Bookings" value={b.data?.length ?? "–"} />
        <StatCard
          label="Bookshop orders"
          value={orders.data?.length ?? "–"}
          icon={ShoppingBag}
        />
        <StatCard
          label="Combined sales"
          value={
            b.data && orders.data ? kes(hospitalitySales + bookSales) : "–"
          }
        />
        <StatCard
          label="Registered users"
          value={p.data?.length ?? "–"}
          icon={UsersIcon}
        />
        <StatCard label="Facilities" value={f.data?.length ?? "–"} />
        <StatCard
          label="Book titles"
          value={books.data?.length ?? "–"}
          icon={BookOpen}
        />
        <StatCard
          label="Donations received"
          value={
            donations.data
              ? kes(
                  donations.data
                    .filter((d) => d.status === "received")
                    .reduce((n, d) => n + Number(d.amount), 0),
                )
              : "–"
          }
        />
        <StatCard label="Student programmes" value="Coming Soon" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => go("bookings")}>Review bookings</Button>
        <Button variant="outline" onClick={() => go("facilities")}>
          <Plus className="h-4 w-4" /> Add facility
        </Button>
        <Button variant="outline" onClick={() => go("services")}>
          Manage services
        </Button>
      </div>
      <State q={b} empty={false}>
        <OverviewCharts
          bookings={b.data ?? []}
          orders={orders.data ?? []}
          donations={donations.data ?? []}
        />
      </State>
    </div>
  );
}

export function Bookings() {
  const q = useBookings();
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const services = useServices();
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const upd = useAction(
    ({ id, s, n }: { id: string; s: BookingStatus; n?: string }) =>
      svc.updateBookingStatus(id, s, n),
    ["bookings"],
    "Booking updated",
  );
  const rows = useMemo(
    () =>
      (q.data ?? []).filter(
        (b) =>
          (status === "all" || b.status === status) &&
          (category === "all" || b.sub_services?.service_id === category) &&
          `${b.sub_services?.name} ${b.sub_services?.services?.name} ${b.notes ?? ""}`
            .toLowerCase()
            .includes(term.toLowerCase()),
      ),
    [q.data, term, status, category],
  );
  return (
    <div>
      <Toolbar
        term={term}
        setTerm={(t) => {
          setTerm(t);
          setPage(1);
        }}
      >
        <select
          aria-label="Status filter"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All statuses</option>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="Category filter"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="h-10 max-w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All categories</option>
          {services.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Toolbar>
      <State q={q} empty={!rows.length}>
        <div className="grid gap-4 xl:grid-cols-2">
          {rows.slice((page - 1) * PAGE, page * PAGE).map((b) => (
            <div
              key={b.id}
              className="min-w-0 rounded-lg border bg-card p-5 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {b.sub_services?.services?.name} — {b.sub_services?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {b.start_date} → {b.end_date} · {b.guests} guest(s)
                  </p>
                  {b.start_time && (
                    <p className="text-xs text-muted-foreground">
                      {b.start_time.slice(0, 5)}
                      {b.end_time ? ` – ${b.end_time.slice(0, 5)}` : ""}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    #{b.id.slice(0, 8).toUpperCase()}
                  </p>
                  {b.notes && (
                    <p className="mt-2 whitespace-pre-line break-words text-sm">
                      {b.notes}
                    </p>
                  )}
                </div>
                <Badge variant={statusVariant(b.status)} className="capitalize">
                  {b.status}
                </Badge>
                <Badge variant={labelVariant(bookingLabel(b))}>
                  {bookingLabel(b)} · {kes(b.total_amount)}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Input
                  className="min-w-0 flex-1"
                  placeholder="Note to customer"
                  defaultValue={b.admin_notes ?? ""}
                  onChange={(e) =>
                    setNotes({ ...notes, [b.id]: e.target.value })
                  }
                />
                <select
                  aria-label="Set status"
                  value={b.status}
                  disabled={upd.isPending}
                  onChange={(e) =>
                    upd.mutate({
                      id: b.id,
                      s: e.target.value as BookingStatus,
                      n: notes[b.id],
                    })
                  }
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                  {BOOKING_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
        <Pager page={page} total={rows.length} set={setPage} />
      </State>
    </div>
  );
}

function Toolbar({
  term,
  setTerm,
  children,
}: {
  term: string;
  setTerm: (t: string) => void;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search"
          className="pl-9"
          placeholder="Search…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>
      {children}
    </div>
  );
}

function ImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (u: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label>Image</Label>
      <div className="flex items-center gap-3">
        {value && (
          <img src={value} alt="" className="h-14 w-20 rounded object-cover" />
        )}
        <Button asChild type="button" variant="outline" size="sm">
          <label className="cursor-pointer">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}{" "}
            Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                try {
                  onChange(await svc.uploadImage(file));
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
        </Button>
      </div>
    </div>
  );
}

function GalleryField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const move = (i: number, d: number) => {
    const n = [...value];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    onChange(n);
  };
  return (
    <div className="space-y-1.5">
      <Label>Photos ({value.length}/12) — first photo is the cover</Label>
      <div className="grid grid-cols-3 gap-2">
        {value.map((u, i) => (
          <div
            key={u}
            className="group relative overflow-hidden rounded-lg border"
          >
            <img
              src={u}
              alt={`Photo ${i + 1}`}
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-card/90 p-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                aria-label="Move left"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label="Remove photo"
              >
                <X className="h-3 w-3 text-destructive" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                disabled={i === value.length - 1}
                onClick={() => move(i, 1)}
                aria-label="Move right"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        {value.length < 12 && (
          <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground hover:bg-secondary">
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
            Add photos
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []).slice(
                  0,
                  12 - value.length,
                );
                if (!files.length) return;
                setBusy(true);
                try {
                  const urls = await Promise.all(
                    files.map((f) => svc.uploadImage(f)),
                  );
                  onChange([...value, ...urls]);
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setBusy(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function Services() {
  const q = useServices();
  const [edit, setEdit] = useState<Partial<Service> | null>(null);
  const save = useAction(svc.saveService, ["services"], "Service saved");
  const del = useAction(svc.deleteService, ["services"], "Service deleted");
  return (
    <div>
      <Button
        className="mb-4"
        onClick={() =>
          setEdit({ is_published: false, category: "General", sort_order: 0 })
        }
      >
        <Plus className="h-4 w-4" /> New service
      </Button>
      <State q={q} empty={!q.data?.length}>
        <div className="grid gap-3 md:grid-cols-2">
          {q.data?.map((s) => (
            <div
              key={s.id}
              className="flex gap-3 rounded-xl border bg-card p-3"
            >
              {s.image_url ? (
                <img
                  src={s.image_url}
                  alt=""
                  className="h-16 w-20 rounded object-cover"
                />
              ) : (
                <div className="h-16 w-20 rounded bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.category}</p>
                <Badge
                  variant={s.is_published ? "default" : "secondary"}
                  className="mt-1"
                >
                  {s.is_published ? "Published" : "Draft"}
                </Badge>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Edit"
                  onClick={() => setEdit(s)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete"
                  onClick={() =>
                    confirm(`Delete ${s.name}?`) && del.mutate(s.id)
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </State>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "Edit" : "New"} service</DialogTitle>
          </DialogHeader>
          {edit && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!edit.name?.trim()) return toast.error("Name is required");
                save.mutate(
                  {
                    id: edit.id,
                    name: edit.name.trim(),
                    slug: edit.slug || slugify(edit.name),
                    category: edit.category || "General",
                    description: edit.description ?? null,
                    image_url: edit.image_url ?? null,
                    is_published: !!edit.is_published,
                    sort_order: Number(edit.sort_order) || 0,
                  },
                  { onSuccess: () => setEdit(null) },
                );
              }}
            >
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={edit.name ?? ""}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input
                  value={edit.category ?? ""}
                  onChange={(e) =>
                    setEdit({ ...edit, category: e.target.value })
                  }
                  maxLength={60}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={edit.description ?? ""}
                  onChange={(e) =>
                    setEdit({ ...edit, description: e.target.value })
                  }
                  maxLength={1000}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={edit.sort_order ?? 0}
                  onChange={(e) =>
                    setEdit({ ...edit, sort_order: Number(e.target.value) })
                  }
                />
              </div>
              <ImageField
                value={edit.image_url ?? ""}
                onChange={(u) => setEdit({ ...edit, image_url: u })}
              />
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={!!edit.is_published}
                  onCheckedChange={(v) => setEdit({ ...edit, is_published: v })}
                />{" "}
                Published
              </label>
              <Button
                type="submit"
                disabled={save.isPending}
                className="w-full"
              >
                Save
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function Facilities() {
  const q = useSubServices();
  const parents = useServices();
  const [edit, setEdit] = useState<
    (Partial<SubService> & { amenitiesText?: string }) | null
  >(null);
  const [term, setTerm] = useState("");
  const [parent, setParent] = useState("all");
  const [page, setPage] = useState(1);
  const save = useAction(
    svc.saveSubService,
    ["sub_services"],
    "Facility saved",
  );
  const del = useAction(
    svc.deleteSubService,
    ["sub_services"],
    "Facility deleted",
  );
  const selectedCategory = categoryConfig(
    parents.data?.find((p) => p.id === edit?.service_id)?.slug ?? "",
  );
  const details =
    edit?.details &&
    typeof edit.details === "object" &&
    !Array.isArray(edit.details)
      ? edit.details
      : {};
  const pname = (id?: string) =>
    parents.data?.find((p) => p.id === id)?.name ?? "";
  const rows = (q.data ?? []).filter(
    (s) =>
      (parent === "all" || s.service_id === parent) &&
      s.name.toLowerCase().includes(term.toLowerCase()),
  );
  return (
    <div>
      <Toolbar
        term={term}
        setTerm={(t) => {
          setTerm(t);
          setPage(1);
        }}
      >
        <select
          aria-label="Service filter"
          value={parent}
          onChange={(e) => {
            setParent(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All services</option>
          {parents.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button
          onClick={() =>
            setEdit({
              service_id: parents.data?.[0]?.id,
              is_available: true,
              is_published: false,
              images: [],
              price_unit: categoryConfig(parents.data?.[0]?.slug ?? "").unit,
              min_notice_days: 0,
              amenitiesText: "",
            })
          }
        >
          <Plus className="h-4 w-4" /> New facility
        </Button>
      </Toolbar>
      <State q={q} empty={!rows.length}>
        <div className="grid gap-3 md:grid-cols-2">
          {rows.slice((page - 1) * PAGE, page * PAGE).map((s) => (
            <div
              key={s.id}
              className="flex gap-3 rounded-xl border bg-card p-3"
            >
              {(s.images[0] ?? s.image_url) ? (
                <img
                  src={s.images[0] ?? s.image_url ?? undefined}
                  alt=""
                  className="h-16 w-20 rounded object-cover"
                />
              ) : (
                <div className="h-16 w-20 rounded bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pname(s.service_id)} ·{" "}
                  {s.capacity ? `${s.capacity} people` : "capacity not set"} ·{" "}
                  {s.price != null
                    ? `KES ${s.price} ${s.price_unit}`
                    : "price not set"}
                </p>
                <div className="mt-1 flex gap-1">
                  <Badge variant={s.is_published ? "default" : "secondary"}>
                    {s.is_published ? "Published" : "Draft"}
                  </Badge>
                  <Badge variant={s.is_available ? "outline" : "destructive"}>
                    {s.is_available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Edit"
                  onClick={() =>
                    setEdit({ ...s, amenitiesText: s.amenities.join(", ") })
                  }
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete"
                  onClick={() =>
                    confirm(`Delete ${s.name}?`) && del.mutate(s.id)
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Pager page={page} total={rows.length} set={setPage} />
      </State>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "Edit" : "New"} facility</DialogTitle>
          </DialogHeader>
          {edit && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!edit.name?.trim() || !edit.service_id)
                  return toast.error("Name and parent service are required");
                save.mutate(
                  {
                    id: edit.id,
                    service_id: edit.service_id,
                    name: edit.name.trim(),
                    description: edit.description ?? null,
                    details: edit.details ?? {},
                    images: edit.images ?? [],
                    image_url: edit.images?.[0] ?? null,
                    amenities: (edit.amenitiesText ?? "")
                      .split(",")
                      .map((a) => a.trim())
                      .filter(Boolean)
                      .slice(0, 30),
                    capacity: edit.capacity ? Number(edit.capacity) : null,
                    price:
                      edit.price != null && String(edit.price) !== ""
                        ? Number(edit.price)
                        : null,
                    price_unit: edit.price_unit || "per day",
                    min_notice_days: Number(edit.min_notice_days) || 0,
                    is_available: !!edit.is_available,
                    is_published: !!edit.is_published,
                  },
                  { onSuccess: () => setEdit(null) },
                );
              }}
            >
              <div className="space-y-1.5">
                <Label>Parent service</Label>
                <select
                  value={edit.service_id ?? ""}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      service_id: e.target.value,
                      details: {},
                      price_unit: categoryConfig(
                        parents.data?.find((p) => p.id === e.target.value)
                          ?.slug ?? "",
                      ).unit,
                    })
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {parents.data?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={edit.name ?? ""}
                  maxLength={100}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={edit.description ?? ""}
                  maxLength={1000}
                  onChange={(e) =>
                    setEdit({ ...edit, description: e.target.value })
                  }
                />
              </div>
              {selectedCategory.information.map((key) => (
                <div className="space-y-1.5" key={key}>
                  <Label htmlFor={`detail-${key}`}>{key}</Label>
                  <Input
                    id={`detail-${key}`}
                    maxLength={300}
                    value={
                      typeof details[key] === "string"
                        ? (details[key] as string)
                        : ""
                    }
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        details: { ...details, [key]: e.target.value },
                      })
                    }
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>Amenities (comma separated)</Label>
                <Input
                  value={edit.amenitiesText ?? ""}
                  onChange={(e) =>
                    setEdit({ ...edit, amenitiesText: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{selectedCategory.capacity}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={edit.capacity ?? ""}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        capacity:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Min notice (days)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={edit.min_notice_days ?? 0}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        min_notice_days: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Price (KES)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={edit.price ?? ""}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        price:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Price unit</Label>
                  <Input
                    value={edit.price_unit ?? ""}
                    maxLength={30}
                    onChange={(e) =>
                      setEdit({ ...edit, price_unit: e.target.value })
                    }
                  />
                </div>
              </div>
              <GalleryField
                value={edit.images ?? []}
                onChange={(images) => setEdit({ ...edit, images })}
              />
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={!!edit.is_available}
                  onCheckedChange={(v) => setEdit({ ...edit, is_available: v })}
                />{" "}
                Available for booking
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={!!edit.is_published}
                  onCheckedChange={(v) => setEdit({ ...edit, is_published: v })}
                />{" "}
                Published
              </label>
              <Button
                type="submit"
                disabled={save.isPending}
                className="w-full"
              >
                Save
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function Users() {
  const q = useProfiles();
  const roles = useAllRoles();
  const { isSuperAdmin } = useRoles();
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("all");
  const grant = useAction(svc.grantAdmin, ["roles"], "Admin access granted");
  const revoke = useAction(svc.revokeAdmin, ["roles"], "Admin access removed");
  const rolesOf = (id: string) =>
    roles.data?.filter((r) => r.user_id === id).map((r) => r.role) ?? [];
  const rows = (q.data ?? []).filter((p) => {
    const r = rolesOf(p.id);
    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "regular"
        ? !r.includes("admin") && !r.includes("super_admin")
        : r.includes(roleFilter as "admin" | "super_admin"));
    return (
      matchesRole &&
      `${p.full_name} ${p.email}`.toLowerCase().includes(term.toLowerCase())
    );
  });
  return (
    <div>
      <UserAnalytics />
      <Toolbar
        term={term}
        setTerm={(t) => {
          setTerm(t);
          setPage(1);
        }}
      >
        <select
          aria-label="Filter users by role"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All roles</option>
          <option value="regular">Regular users</option>
          <option value="admin">Administrators</option>
          <option value="super_admin">Super administrators</option>
        </select>
      </Toolbar>
      <State q={q} empty={!rows.length}>
        <div className="grid gap-2">
          {rows.slice((page - 1) * PAGE, page * PAGE).map((p) => {
            const r = rolesOf(p.id);
            return (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.full_name || "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.email}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {r.map((x) => (
                    <Badge
                      key={x}
                      variant={x === "customer" ? "secondary" : "default"}
                    >
                      {x.replace("_", " ")}
                    </Badge>
                  ))}
                  {isSuperAdmin &&
                    !r.includes("super_admin") &&
                    (r.includes("admin") ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revoke.mutate(p.id)}
                      >
                        Remove admin
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => grant.mutate(p.id)}>
                        Make admin
                      </Button>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
        <Pager page={page} total={rows.length} set={setPage} />
      </State>
    </div>
  );
}

export function Logs() {
  const q = useLogs();
  const profiles = useProfiles();
  const actor = (id: string | null) =>
    id
      ? profiles.data?.find((p) => p.id === id)?.full_name ||
        profiles.data?.find((p) => p.id === id)?.email ||
        "Unknown user"
      : "System";
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("all");
  const [period, setPeriod] = useState("all");
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - Number(period) + 1);
  const actions = [...new Set((q.data ?? []).map((log) => log.action))].sort();
  const activity = dailyActivity(q.data ?? [], 7);
  const rows = (q.data ?? []).filter(
    (l) =>
      (action === "all" || l.action === action) &&
      (period === "all" || new Date(l.created_at) >= since) &&
      `${actor(l.actor_id)} ${l.action} ${l.entity} ${l.summary ?? ""}`
        .toLowerCase()
        .includes(term.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <span className="border-b-2 border-primary pb-3 text-sm font-medium text-primary">
          All activity
        </span>
      </div>
      <State q={q} empty={false}>
        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <h3 className="mb-5 flex items-center gap-2 font-semibold">
            <Activity className="h-5 w-5 text-primary" />
            Activity (Last 7 Days)
          </h3>
          <div
            className="h-52"
            role="img"
            aria-label={activity
              .map((day) => `${day.day}: ${day.count} events`)
              .join("; ")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity} margin={{ right: 16 }}>
                <CartesianGrid
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="day"
                  fontSize={11}
                  minTickGap={15}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis allowDecimals={false} width={30} fontSize={11} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar
                  name="Events"
                  dataKey="count"
                  fill={chartColors[0]}
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </State>
      <Toolbar
        term={term}
        setTerm={(t) => {
          setTerm(t);
          setPage(1);
        }}
      >
        <select
          aria-label="Filter logs by action"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-md border bg-card px-3 text-sm"
        >
          <option value="all">All actions</option>
          {actions.map((item) => (
            <option key={item} value={item}>
              {item.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter logs by date"
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-md border bg-card px-3 text-sm"
        >
          <option value="all">All time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </Toolbar>
      <p className="text-xs text-muted-foreground">
        {rows.length} matching events · most recent 500 recorded changes · local
        timestamps. Anonymous visits and clicks are reported separately in
        Settings.
      </p>
      <State q={q} empty={!rows.length}>
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-4">Action</th>
                <th className="p-4">User</th>
                <th className="p-4">Details</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice((page - 1) * PAGE, page * PAGE).map((l) => (
                <tr
                  key={l.id}
                  className="border-t transition-colors hover:bg-muted/50"
                >
                  <td className="p-4">
                    <span className="flex items-center gap-2 capitalize">
                      <Activity className="h-4 w-4 shrink-0 text-primary" />
                      {l.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 font-medium">{actor(l.actor_id)}</td>
                  <td className="p-4">
                    <p className="capitalize">{l.entity.replace(/_/g, " ")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {l.summary}
                    </p>
                  </td>
                  <td className="whitespace-nowrap p-4">
                    <p>
                      {new Date(l.created_at).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleTimeString("en-KE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={page} total={rows.length} set={setPage} />
      </State>
    </div>
  );
}

export function Profile() {
  const { user } = useAuth();
  const q = useProfiles();
  const me = q.data?.find((p) => p.id === user?.id);
  const [f, setF] = useState<{ full_name?: string; phone?: string }>({});
  const save = useAction(
    (p: { full_name?: string; phone?: string }) =>
      svc.updateProfile(user!.id, p),
    ["profiles"],
    "Profile saved",
  );
  return (
    <State q={q} empty={!me}>
      <form
        className="max-w-md space-y-3 rounded-2xl border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({
            full_name: (f.full_name ?? me?.full_name ?? "")
              .trim()
              .slice(0, 100),
            phone: (f.phone ?? me?.phone ?? "").trim().slice(0, 30),
          });
        }}
      >
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={me?.email ?? ""} disabled />
        </div>
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input
            defaultValue={me?.full_name ?? ""}
            onChange={(e) => setF({ ...f, full_name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input
            defaultValue={me?.phone ?? ""}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
          />
        </div>
        <Button type="submit" disabled={save.isPending}>
          Save profile
        </Button>
      </form>
    </State>
  );
}

export function Settings() {
  const q = useSettings();
  const get = (k: string) =>
    (q.data?.find((s) => s.key === k)?.value ?? {}) as Record<string, string>;
  const [contact, setContact] = useState<Record<string, string> | null>(null);
  const c = contact ?? get("contact");
  const save = useAction(
    ({ k, v }: { k: string; v: Record<string, unknown> }) =>
      svc.saveSetting(k, v),
    ["settings"],
    "Settings saved",
  );
  const branding = get("branding");
  return (
    <State q={q} empty={false}>
      <div className="space-y-8">
        <TrafficAnalytics />
        <div>
          <h2 className="text-xl font-semibold">Admin Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Contact information and CSLC branding
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            className="space-y-4 rounded-lg border bg-card p-5 shadow-card"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate({
                k: "contact",
                v: {
                  phone: (c.phone ?? "").slice(0, 40),
                  email: (c.email ?? "").slice(0, 255),
                  address: (c.address ?? "").slice(0, 200),
                },
              });
            }}
          >
            <h3 className="font-semibold">Contact details</h3>
            {(["phone", "email", "address"] as const).map((k) => (
              <div key={k} className="space-y-1.5">
                <Label className="capitalize">{k}</Label>
                <Input
                  value={c[k] ?? ""}
                  onChange={(e) => setContact({ ...c, [k]: e.target.value })}
                />
              </div>
            ))}
            <Button type="submit" disabled={save.isPending}>
              Save contact details
            </Button>
          </form>
          <div className="space-y-4 rounded-lg border bg-card p-5 shadow-card">
            <h3 className="font-semibold">Branding images</h3>
            <p className="text-xs text-muted-foreground">
              Images are stored as files; only their links are saved.
            </p>
            {(["logo", "banner"] as const).map((k) => (
              <ImageField
                key={k}
                value={branding[k] ?? ""}
                onChange={(u) =>
                  save.mutate({ k: "branding", v: { ...branding, [k]: u } })
                }
              />
            ))}
          </div>
        </div>
      </div>
    </State>
  );
}
