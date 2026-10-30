import { Link, useSearchParams } from "react-router-dom";
import {
  CalendarCheck,
  History,
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  Receipt,
  Settings,
  ShoppingBag,
  User,
} from "lucide-react";
import { PhaseRecords } from "@/components/common/PhaseRecords";
import {
  DashboardShell,
  type DashView,
} from "@/components/common/DashboardShell";
import { ProfileForm } from "@/components/common/ProfileForm";
import { PasswordSettings } from "@/components/common/PasswordSettings";
import { ReceiptsTable } from "@/components/common/ReceiptsTable";
import { UserSupport } from "@/components/common/UserSupport";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAction, useMyBookings, useReceipts } from "@/hooks/useHospitality";
import { hospitalityService as svc } from "@/services/hospitality";
import { checkoutUrl, paths } from "@/routes/paths";
import { BookOpen, FileText, Ticket, Sun, BookMarked, Sparkles } from "lucide-react";
import { ResourcesBrowser, StudentContributions } from "@/components/programmes/ResourceViews";
import {
  EventsGrid,
  MaterialsBrowser,
  MyTickets,
} from "@/components/programmes/ProgrammeViews";
import { bookingLabel, kes, labelVariant } from "@/lib/booking";

const views: DashView[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "shop", label: "Browse Books", icon: BookOpen, group: "Bookshop" },
  { id: "orders", label: "My Orders", icon: ShoppingBag, group: "Bookshop" },
  { id: "bookings", label: "My Bookings", icon: History, group: "Hospitality" },
  {
    id: "events",
    label: "Events & Tickets",
    icon: Ticket,
    group: "Student Programmes",
  },
  {
    id: "materials",
    label: "Materials",
    icon: FileText,
    group: "Student Programmes",
  },
  {
    id: "devotionals",
    label: "Devotionals",
    icon: Sun,
    group: "Student Programmes",
  },
  {
    id: "biblestudy",
    label: "Bible Study",
    icon: BookMarked,
    group: "Student Programmes",
  },
  {
    id: "contributions",
    label: "My Contributions",
    icon: Sparkles,
    group: "Student Programmes",
  },
  {
    id: "donations",
    label: "My Donations",
    icon: HeartHandshake,
    group: "Student Programmes",
  },
  { id: "receipts", label: "Receipts", icon: Receipt },
  { id: "support", label: "Support", icon: LifeBuoy },
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: Settings },
];

function BookingList({ limit }: { limit?: number }) {
  const mine = useMyBookings();
  const cancel = useAction(
    (id: string) => svc.updateBookingStatus(id, "cancelled"),
    ["bookings", "ranges"],
    "Booking cancelled",
  );
  if (mine.isLoading)
    return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
  if (mine.error)
    return (
      <Alert variant="destructive">
        <AlertDescription>{(mine.error as Error).message}</AlertDescription>
      </Alert>
    );
  const rows = (mine.data ?? []).slice(0, limit);
  if (!rows.length)
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
        You have no bookings yet.{" "}
        <Link
          to={`${paths.home}#services`}
          className="text-primary hover:underline"
        >
          Browse facilities
        </Link>
      </div>
    );
  return (
    <div className="grid gap-3">
      {rows.map((b) => {
        const l = bookingLabel(b);
        return (
          <div
            key={b.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
          >
            <div className="min-w-0">
              <p className="font-semibold">
                {b.sub_services?.services?.name} — {b.sub_services?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {b.start_date} → {b.end_date} · {b.guests} guest(s) ·{" "}
                {kes(b.total_amount)}
              </p>
              {b.admin_notes && (
                <p className="text-xs text-muted-foreground">
                  Note from CSLC: {b.admin_notes}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={labelVariant(l)}>{l}</Badge>
              {b.status === "pending" && b.payment_status !== "paid" && (
                <>
                  {b.total_amount != null && (
                    <Button asChild size="sm">
                      <Link to={checkoutUrl(b.id)}>Pay now</Link>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={cancel.isPending}
                    onClick={() =>
                      confirm("Cancel this booking?") && cancel.mutate(b.id)
                    }
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Overview() {
  const mine = useMyBookings();
  const rc = useReceipts();
  const all = mine.data ?? [];
  const paid = all.filter((b) => b.payment_status === "paid");
  const stats = [
    ["Total bookings", all.length],
    [
      "Awaiting payment",
      all.filter((b) => b.status === "pending" && b.payment_status !== "paid")
        .length,
    ],
    ["Fully paid", paid.length],
    [
      "Total paid",
      kes(paid.reduce((s, b) => s + Number(b.total_amount ?? 0), 0)),
    ],
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-2xl border bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">{k}</p>
            <p className="mt-1 break-words text-xl font-bold text-primary">
              {mine.isLoading ? "–" : v}
            </p>
          </div>
        ))}
      </div>
      <Button asChild>
        <Link to={`${paths.home}#services`}>
          <CalendarCheck className="h-4 w-4" /> Make a new booking
        </Link>
      </Button>
      <section>
        <h2 className="mb-3 font-semibold">Recent bookings</h2>
        <BookingList limit={3} />
      </section>
      <p className="text-xs text-muted-foreground">
        {rc.data?.length ?? 0} receipt(s) on file.
      </p>
    </div>
  );
}

const AccountPage = () => {
  const [params, setParams] = useSearchParams();
  const view = views.find((v) => v.id === params.get("view"))?.id ?? "overview";
  return (
    <DashboardShell
      views={views}
      view={view}
      go={(v) => setParams({ view: v })}
      subtitle="My CSLC account"
    >
      {view === "overview" && <Overview />}
      {view === "orders" && <PhaseRecords kind="orders" />}
      {view === "shop" && (
        <section className="border-y py-8">
          <h2 className="mb-4 text-xl font-semibold">CSLC Bookshop</h2>
          <Button asChild>
            <Link to={paths.bookshop}>Browse books</Link>
          </Button>
        </section>
      )}
      {view === "events" && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-semibold">My tickets</h2>
            <MyTickets />
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold">Upcoming events</h2>
            <EventsGrid />
          </section>
        </div>
      )}
      {view === "materials" && <MaterialsBrowser />}
      {view === "devotionals" && <ResourcesBrowser kind="devotional" />}
      {view === "biblestudy" && <ResourcesBrowser kind="bible_study" />}
      {view === "contributions" && <StudentContributions />}
      {view === "donations" && (
        <div className="space-y-4">
          <Button asChild>
            <Link to={paths.donate}>Make a donation</Link>
          </Button>
          <PhaseRecords kind="donations" />
        </div>
      )}
      {view === "bookings" && <BookingList />}
      {view === "receipts" && <ReceiptsTable />}
      {view === "support" && <UserSupport />}
      {view === "profile" && <ProfileForm />}
      {view === "settings" && <PasswordSettings />}
    </DashboardShell>
  );
};
export default AccountPage;
