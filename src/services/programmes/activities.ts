import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type ActivityRow = Tables<"programme_activities">;

const must = <T>(r: { data: T | null; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
};

export const activitiesService = {
  /** Published activities for one programme area, newest first. */
  listByArea: async (area: string) =>
    must(
      await supabase
        .from("programme_activities")
        .select("*")
        .eq("area", area)
        .eq("is_published", true)
        .order("activity_date", { ascending: false }),
    ),
  /** All activities for the admin module. */
  listAll: async () =>
    must(
      await supabase
        .from("programme_activities")
        .select("*")
        .order("activity_date", { ascending: false }),
    ),
  save: async (a: TablesInsert<"programme_activities">) =>
    must(await supabase.from("programme_activities").upsert(a).select().single()),
  remove: async (id: string) =>
    must(await supabase.from("programme_activities").delete().eq("id", id)),
};
