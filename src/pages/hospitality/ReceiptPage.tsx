import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PosReceipt, type ReceiptRow } from "@/components/common/PosReceipt";
import { hospitalityService as svc } from "@/services/hospitality";
import { accountView } from "@/routes/paths";

const ReceiptPage = () => {
  const { id = "" } = useParams();
  const r = useQuery({
    queryKey: ["receipts", "one", id],
    queryFn: () => svc.getReceipt(id),
  });
  const bookingId = r.data?.booking_id;
  const b = useQuery({
    queryKey: ["bookings", "one", bookingId],
    queryFn: () =>
      bookingId ? svc.getBooking(bookingId) : Promise.resolve(null),
    enabled: !!bookingId,
  });
  const rc = r.data;
  const bk = b.data;
  const rows: ReceiptRow[] = [
    [
      "Facility",
      `${bk?.sub_services?.services?.name ?? ""} — ${bk?.sub_services?.name ?? ""}`,
    ],
    ["Dates", `${bk?.start_date ?? ""} → ${bk?.end_date ?? ""}`],
    ["Guests", bk?.guests],
    ...(bk?.start_time
      ? ([
          [
            "Time",
            `${bk.start_time.slice(0, 5)}${bk.end_time ? ` – ${bk.end_time.slice(0, 5)}` : ""}`,
          ],
        ] as ReceiptRow[])
      : []),
    ["Payment method", rc?.method],
    ["Phone", rc?.phone],
    ["Simulation reference", rc?.reference],
  ];
  return (
    <PosReceipt
      loading={r.isLoading}
      title="PAYMENT RECEIPT"
      number={rc?.receipt_number}
      date={rc?.created_at}
      rows={rows}
      amount={rc?.amount}
      backTo={accountView("receipts")}
      backLabel="Back to receipts"
    >
      {bk?.notes && (
        <section className="mt-4 border-t border-dashed pt-3 text-xs">
          <h2 className="font-bold">Booking details</h2>
          <p className="mt-1 whitespace-pre-line break-words">{bk.notes}</p>
        </section>
      )}
    </PosReceipt>
  );
};
export default ReceiptPage;
