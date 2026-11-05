import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ChatSession = Database["public"]["Tables"]["chat_sessions"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

const must = <D>(r: { data: D; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data;
};

export const chatService = {
  // Visitor side (secret token held only in this browser)
  start: async (i: { name: string; phone: string; email: string; message: string }) =>
    must(
      await supabase.rpc("chat_start", {
        _name: i.name, _phone: i.phone, _email: i.email, _message: i.message,
      }),
    ) as { id: string; token: string },
  send: async (id: string, token: string, body: string) =>
    must(await supabase.rpc("chat_send", { _id: id, _token: token, _body: body })),
  thread: async (id: string, token: string) =>
    must(await supabase.rpc("chat_thread", { _id: id, _token: token })),
  // Staff side
  sessions: async () =>
    must(
      await supabase.from("chat_sessions").select("id,name,phone,email,status,last_message_at,created_at").order("last_message_at", { ascending: false }),
    ),
  messages: async (id: string) =>
    must(
      await supabase.from("chat_messages").select("*").eq("session_id", id).order("created_at"),
    ),
  reply: async (id: string, body: string) =>
    must(await supabase.rpc("chat_reply", { _id: id, _body: body })),
  setStatus: async (id: string, status: string) =>
    must(await supabase.from("chat_sessions").update({ status }).eq("id", id)),
};
