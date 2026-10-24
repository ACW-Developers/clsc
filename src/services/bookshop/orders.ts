import { supabase } from "@/integrations/supabase/client";

export const orderStatuses = ["pending", "processing", "fulfilled", "cancelled"] as const;
export type OrderStatus = typeof orderStatuses[number];

export const ordersService = {
  async list(userId?: string) {
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (userId) query = query.eq("user_id", userId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  },
  async update(id: string, status: OrderStatus, admin_notes: string) {
    const { data, error } = await supabase.from("orders").update({ status, admin_notes }).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
};