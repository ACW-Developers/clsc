import { supabase } from "@/integrations/supabase/client";

export const donationsService = {
  async list(userId?: string) {
    let query = supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false });
    if (userId) query = query.eq("user_id", userId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  },
  async updateNotes(id: string, admin_notes: string) {
    const { data, error } = await supabase
      .from("donations")
      .update({ admin_notes })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};
