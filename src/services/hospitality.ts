import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];
export type Service = T["services"]["Row"];
export type ServiceInput = T["services"]["Insert"];
export type SubService = T["sub_services"]["Row"];
export type SubServiceInput = T["sub_services"]["Insert"];
export type Booking = T["bookings"]["Row"];
export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type AppRole = Database["public"]["Enums"]["app_role"];
export type Profile = T["profiles"]["Row"];
export type ActivityLog = T["activity_logs"]["Row"];

export const BOOKING_STATUSES: BookingStatus[] = ["pending", "confirmed", "rejected", "cancelled", "completed"];

const must = <D>(r: { data: D; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data;
};

export type BookingRow = Booking & {
  sub_services: { name: string; service_id: string; services: { name: string } | null } | null;
};

export const hospitalityService = {
  // Services
  listServices: async () => must(await supabase.from("services").select("*").order("sort_order").order("name")),
  saveService: async (s: ServiceInput & { id?: string }) =>
    must(s.id ? await supabase.from("services").update(s).eq("id", s.id).select().single() : await supabase.from("services").insert(s).select().single()),
  deleteService: async (id: string) => must(await supabase.from("services").delete().eq("id", id)),

  // Sub-services
  listSubServices: async () => must(await supabase.from("sub_services").select("*").order("name")),
  saveSubService: async (s: SubServiceInput & { id?: string }) =>
    must(s.id ? await supabase.from("sub_services").update(s).eq("id", s.id).select().single() : await supabase.from("sub_services").insert(s).select().single()),
  deleteSubService: async (id: string) => must(await supabase.from("sub_services").delete().eq("id", id)),

  uploadImage: async (file: File) => {
    if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
    if (file.size > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller");
    const path = `${crypto.randomUUID()}.${file.name.split(".").pop() ?? "jpg"}`;
    const up = await supabase.storage.from("service-images").upload(path, file, { contentType: file.type });
    if (up.error) throw new Error(up.error.message);
    const signed = await supabase.storage.from("service-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signed.error) throw new Error(signed.error.message);
    return signed.data.signedUrl;
  },

  // Bookings
  listBookings: async (): Promise<BookingRow[]> =>
    must(await supabase.from("bookings").select("*, sub_services(name, service_id, services(name))").order("created_at", { ascending: false })) as BookingRow[],
  createBooking: async (b: { sub_service_id: string; start_date: string; end_date: string; guests: number; notes?: string }) =>
    must(await supabase.from("bookings").insert(b).select().single()),
  updateBookingStatus: async (id: string, status: BookingStatus, admin_notes?: string | null) =>
    must(await supabase.from("bookings").update({ status, ...(admin_notes !== undefined ? { admin_notes } : {}) }).eq("id", id)),

  // Users
  listProfiles: async () => must(await supabase.from("profiles").select("*").order("created_at", { ascending: false })),
  listRoles: async () => must(await supabase.from("user_roles").select("user_id, role")),
  myRoles: async (userId: string) => must(await supabase.from("user_roles").select("role").eq("user_id", userId)).map((r) => r.role),
  grantAdmin: async (user_id: string) => must(await supabase.from("user_roles").insert({ user_id, role: "admin" })),
  revokeAdmin: async (user_id: string) => must(await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", "admin")),
  updateProfile: async (id: string, p: { full_name?: string; phone?: string }) => must(await supabase.from("profiles").update(p).eq("id", id)),

  // Logs & settings
  listLogs: async () => must(await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(500)),
  getSettings: async () => must(await supabase.from("app_settings").select("*")),
  saveSetting: async (key: string, value: Record<string, unknown>) =>
    must(await supabase.from("app_settings").upsert({ key, value: value as never })),

  // Setup
  setupStatus: async () => {
    const { data, error } = await supabase.rpc("super_admin_exists");
    if (error) throw new Error(error.message);
    return !!data;
  },
  setupAdmin: async (body: { fullName: string; email: string; password: string }) => {
    const { data, error } = await supabase.functions.invoke("setup-admin", { body });
    if (error) {
      const ctx = (error as { context?: Response }).context;
      const msg = ctx ? (await ctx.json().catch(() => null))?.error : null;
      throw new Error(msg ?? error.message);
    }
    return data;
  },
};
