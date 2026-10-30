import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResourcesBrowser, StudentContributions } from "@/components/programmes/ResourceViews";
import { PosReceipt } from "@/components/common/PosReceipt";
import {
  DonateForm,
  EventDetail,
  EventsGrid,
  MaterialsBrowser,
  ProgrammeFrame,
} from "@/components/programmes/ProgrammeViews";
import {
  eventDate,
  eventTime,
  programmesService as svc,
} from "@/services/programmes/programmes";
import { accountView, paths } from "@/routes/paths";

export function EventsPage() {
  const { id } = useParams();
  const q = useQuery({
    queryKey: ["events", "one", id],
    queryFn: () => svc.getEvent(id!),
    enabled: !!id,
  });
  if (!id)
    return (
      <ProgrammeFrame
        title="Events"
        intro="Upcoming CSLC student programme events. "
      >
        <EventsGrid />
      </ProgrammeFrame>
    );
  return (
    <ProgrammeFrame
      title={q.data?.title ?? "Event"}
      intro={
        q.data ? `${eventDate(q.data.event_date)} · ${eventTime(q.data)}` : ""
      }
    >
      {q.isLoading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      ) : !q.data ? (
        <div className="text-center">
          <p className="mb-4">Event not found.</p>
          <Button asChild>
            <Link to={paths.events}>All events</Link>
          </Button>
        </div>
      ) : (
        <EventDetail e={q.data} />
      )}
    </ProgrammeFrame>
  );
}

export const MaterialsPage = () => (
  <ProgrammeFrame
    title="Programme Materials"
    intro="Organised programme materials by category and topic."
  >
    <MaterialsBrowser />
  </ProgrammeFrame>
);

export const DevotionalsPage = () => (
  <ProgrammeFrame title="Daily Devotionals" intro="Scripture, reflection and prayer for every day.">
    <ResourcesBrowser kind="devotional" />
  </ProgrammeFrame>
);
export const BibleStudyPage = () => (
  <ProgrammeFrame title="Bible Study" intro="Study guides, reading plans and teaching resources.">
    <ResourcesBrowser kind="bible_study" />
  </ProgrammeFrame>
);
export const ContributionsPage = () => (
  <ProgrammeFrame title="Student Contributions" intro="Share original devotionals, reflections and study materials.">
    <StudentContributions />
  </ProgrammeFrame>
);

export const DonatePage = () => (
  <ProgrammeFrame title="Donate" intro="Contribute to CSLC student programmes.">
    <DonateForm />
  </ProgrammeFrame>
);

export function TicketPage() {
  const { id = "" } = useParams();
  const q = useQuery({
    queryKey: ["tickets", "one", id],
    queryFn: () => svc.getTicket(id),
  });
  const t = q.data;
  return (
    <PosReceipt
      loading={q.isLoading}
      error={q.error?.message}
      title="EVENT TICKET"
      subtitle="CSLC Student Programmes"
      number={t?.ticket_number}
      date={t?.created_at}
      rows={[
        ["Event", t?.events?.title],
        ["Date", t?.events ? eventDate(t.events.event_date) : ""],
        ["Time", t?.events ? eventTime(t.events) : ""],
        ["Venue", t?.events?.venue],
        ["Attendee", t?.attendee_name],
        ["Admits", `${t?.quantity ?? ""} person(s)`],
        ["Payment method", t?.method],
        ["Phone", t?.phone],
        ["Simulation reference", t?.reference],
      ]}
      amount={t?.amount}
      thanks="Present this ticket number at the entrance."
      backTo={accountView("events")}
      backLabel="My tickets"
    />
  );
}

export function DonationReceiptPage() {
  const { id = "" } = useParams();
  const q = useQuery({
    queryKey: ["donationReceipt", id],
    queryFn: () => svc.donationReceipt(id),
  });
  const r = q.data;
  return (
    <PosReceipt
      loading={q.isLoading}
      error={q.error?.message}
      title="DONATION RECEIPT"
      subtitle="CSLC Student Programmes"
      number={r?.receipt_number}
      date={r?.created_at}
      rows={[
        ["Donor", r?.donor_name],
        ["Purpose", r?.description],
        ["Payment method", r?.method],
        ["Phone", r?.phone],
        ["Simulation reference", r?.reference],
      ]}
      totalLabel="Amount donated"
      amount={r?.amount}
      thanks="Thank you for supporting CSLC student programmes."
      backTo={paths.donate}
      backLabel="Back to donations"
    />
  );
}
