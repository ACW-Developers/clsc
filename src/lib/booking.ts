/** Pure booking helpers (mirrors the server-side rules in guard_booking). */
export const nights = (start: string, end: string) =>
  Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;

export function estimateTotal(
  price: number | null,
  unit: string,
  start: string,
  end: string,
  guests: number,
) {
  if (price == null || !start || !end || end < start) return null;
  const d = nights(start, end);
  return /person|guest/i.test(unit) ? price * guests * d : price * d;
}

export const overlaps = (
  ranges: { start_date: string; end_date: string }[],
  start: string,
  end: string,
) => ranges.some((r) => r.start_date <= end && r.end_date >= start);

/** First date on/after `from` that is not inside any reserved range. */
export function nextAvailable(
  ranges: { start_date: string; end_date: string }[],
  from: string,
) {
  let d = from;
  const sorted = [...ranges].sort((a, b) =>
    a.start_date.localeCompare(b.start_date),
  );
  for (const r of sorted)
    if (r.start_date <= d && r.end_date >= d) {
      const n = new Date(r.end_date);
      n.setUTCDate(n.getUTCDate() + 1);
      d = n.toISOString().slice(0, 10);
    }
  return d;
}

export type PayLabel =
  | "Fully paid"
  | "Payment failed"
  | "Cancelled"
  | "Awaiting payment"
  | "Rejected"
  | "Completed";
export function bookingLabel(b: {
  status: string;
  payment_status: string;
}): PayLabel {
  if (b.status === "cancelled") return "Cancelled";
  if (b.status === "rejected") return "Rejected";
  if (b.status === "completed") return "Completed";
  if (b.payment_status === "paid") return "Fully paid";
  if (b.payment_status === "failed") return "Payment failed";
  return "Awaiting payment";
}
export const labelVariant = (l: PayLabel) =>
  (l === "Fully paid" || l === "Completed"
    ? "default"
    : l === "Awaiting payment"
      ? "secondary"
      : "destructive") as "default" | "secondary" | "destructive";

export const kes = (n: number | null | undefined) =>
  n == null
    ? "Price on request"
    : `KES ${Number(n).toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;
