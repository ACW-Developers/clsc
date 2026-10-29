import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { compressImage } from "@/lib/image";

export type EventRow = Tables<"events">;
export type TicketRow = Tables<"event_tickets"> & {
  events?: Pick<
    EventRow,
    "title" | "venue" | "event_date" | "start_time" | "end_time"
  > | null;
};
export type MaterialRow = Tables<"materials">;
export const materialKinds = [
  "document",
  "image",
  "link",
  "video",
  "audio",
] as const;

function must<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

/** Student programmes: events, tickets, materials and donations. Payments stay server-owned. */
export const programmesService = {
  listEvents: async (all = false): Promise<EventRow[]> => {
    let q = supabase.from("events").select("*").order("event_date");
    if (!all) q = q.eq("is_published", true);
    return must(await q);
  },
  getEvent: async (id: string): Promise<EventRow | null> =>
    must(await supabase.from("events").select("*").eq("id", id).maybeSingle()),
  seatsSold: async (id: string): Promise<number> =>
    must(await supabase.rpc("event_seats_sold", { _event_id: id })) ?? 0,
  saveEvent: async (e: TablesInsert<"events">) =>
    must(await supabase.from("events").upsert(e).select().single()),
  deleteEvent: async (id: string) =>
    must(await supabase.from("events").delete().eq("id", id)),
  buyTicket: async (a: {
    id: string;
    quantity: number;
    attendee: string;
    phone: string;
    success: boolean;
  }): Promise<string | null> =>
    must(
      await supabase.rpc("buy_event_ticket", {
        _event_id: a.id,
        _quantity: a.quantity,
        _attendee: a.attendee,
        _phone: a.phone,
        _success: a.success,
      }),
    ),
  listTickets: async (userId?: string): Promise<TicketRow[]> => {
    let q = supabase
      .from("event_tickets")
      .select("*, events(title, venue, event_date, start_time, end_time)")
      .order("created_at", { ascending: false });
    if (userId) q = q.eq("user_id", userId);
    return must(await q) as TicketRow[];
  },
  getTicket: async (id: string): Promise<TicketRow | null> =>
    must(
      await supabase
        .from("event_tickets")
        .select("*, events(title, venue, event_date, start_time, end_time)")
        .eq("id", id)
        .maybeSingle(),
    ) as TicketRow | null,

  listMaterials: async (all = false): Promise<MaterialRow[]> => {
    let q = supabase
      .from("materials")
      .select("*")
      .order("created_at", { ascending: false });
    if (!all) q = q.eq("is_published", true);
    return must(await q);
  },
  saveMaterial: async (m: TablesInsert<"materials">) =>
    must(await supabase.from("materials").upsert(m).select().single()),
  deleteMaterial: async (id: string) =>
    must(await supabase.from("materials").delete().eq("id", id)),
  logView: async (material_id: string) => {
    await supabase.from("material_views").insert({ material_id });
  },
  history: async (userId: string) =>
    must(
      await supabase
        .from("material_views")
        .select(
          "id, viewed_at, materials(id, title, category, topic, kind, url)",
        )
        .eq("user_id", userId)
        .order("viewed_at", { ascending: false })
        .limit(50),
    ),
  uploadFile: async (file: File) => {
    if (file.size > 20 * 1024 * 1024)
      throw new Error("Files must be 20 MB or smaller");
    if (/^image\/(jpeg|png|webp)$/.test(file.type))
      file = await compressImage(file);
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage
      .from("programme-files")
      .upload(path, file, { contentType: file.type });
    if (up.error) throw new Error(up.error.message);
    const signed = await supabase.storage
      .from("programme-files")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signed.error) throw new Error(signed.error.message);
    return signed.data.signedUrl;
  },

  donate: async (a: {
    name: string;
    email: string;
    phone: string;
    amount: number;
    message: string;
    success: boolean;
  }): Promise<string | null> =>
    must(
      await supabase.rpc("simulate_donation", {
        _name: a.name,
        _email: a.email,
        _phone: a.phone,
        _amount: a.amount,
        _message: a.message,
        _success: a.success,
      }),
    ),
  donationReceipt: async (id: string) =>
    (must(await supabase.rpc("donation_receipt", { _id: id })) ?? [])[0] ??
    null,
};

export const eventTime = (e: Pick<EventRow, "start_time" | "end_time">) =>
  e.start_time
    ? `${e.start_time.slice(0, 5)}${e.end_time ? ` – ${e.end_time.slice(0, 5)}` : ""}`
    : "Time to be announced";
export const eventDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
