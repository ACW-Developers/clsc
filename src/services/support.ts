import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];
export type Enquiry = T["contact_enquiries"]["Row"];
export type Ticket = T["support_tickets"]["Row"];
export type Notification = T["notifications"]["Row"];

const must = <D>(r: { data: D; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data;
};

export const supportService = {
  // Contact enquiries (public form)
  submitEnquiry: async (input: { name: string; email: string; subject: string; message: string }) =>
    must(await supabase.from("contact_enquiries").insert(input)),
  listEnquiries: async () =>
    must(await supabase.from("contact_enquiries").select("*").order("created_at", { ascending: false })),
  updateEnquiry: async (id: string, patch: { status?: string; admin_notes?: string }) =>
    must(await supabase.from("contact_enquiries").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id)),

  // Support tickets (signed-in users)
  submitTicket: async (input: { subject: string; message: string }) =>
    must(await supabase.from("support_tickets").insert(input).select().single()),
  myTickets: async () =>
    must(await supabase.from("support_tickets").select("*").order("created_at", { ascending: false })),
  updateTicket: async (id: string, patch: { status?: string; admin_reply?: string }) =>
    must(await supabase.from("support_tickets").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id)),

  // Notifications
  myNotifications: async () =>
    must(await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30)),
  markRead: async (id: string) =>
    must(await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id)),
  markAllRead: async (ids: string[]) =>
    must(await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids)),
};
