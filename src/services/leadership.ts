import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { programmesService } from "@/services/programmes/programmes";

export type LeaderRow = Tables<"leadership_team">;

const must = <T>(r: { data: T | null; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
};

export const leadershipService = {
  /** Published members for the public About page. */
  list: async () =>
    must(
      await supabase
        .from("leadership_team")
        .select("*")
        .eq("is_published", true)
        .order("sort_order")
        .order("full_name"),
    ),
  /** All members for the admin module. */
  listAll: async () =>
    must(
      await supabase
        .from("leadership_team")
        .select("*")
        .order("sort_order")
        .order("full_name"),
    ),
  save: async (m: TablesInsert<"leadership_team">) =>
    must(await supabase.from("leadership_team").upsert(m).select().single()),
  remove: async (id: string) =>
    must(await supabase.from("leadership_team").delete().eq("id", id)),
  /** Photos reuse the programme-files bucket under a leadership/ prefix. */
  uploadPhoto: (file: File) =>
    programmesService.uploadFile(file, "leadership/"),
};
