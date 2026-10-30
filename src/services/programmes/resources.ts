import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type ResourceRow = Tables<"resources">;
export type ContributionRow = Tables<"contributions">;
export type ResourceKind = "devotional" | "bible_study";
export const contributionKinds = [
  ["devotional", "Devotional"],
  ["reflection", "Reflection"],
  ["bible_study", "Bible study material"],
  ["resource", "Learning resource"],
] as const;

function must<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

/** Devotionals, Bible study and moderated student contributions. Approval publishing is server-owned. */
export const resourcesService = {
  list: async (kind: ResourceKind, all = false): Promise<ResourceRow[]> => {
    let q = supabase
      .from("resources")
      .select("*")
      .eq("kind", kind)
      .order("publish_date", { ascending: false });
    if (!all) q = q.eq("is_published", true);
    return must(await q);
  },
  save: async (r: TablesInsert<"resources">) =>
    must(await supabase.from("resources").upsert(r).select().single()),
  remove: async (id: string) =>
    must(await supabase.from("resources").delete().eq("id", id)),
  contributions: async (userId?: string): Promise<ContributionRow[]> => {
    let q = supabase
      .from("contributions")
      .select("*")
      .order("created_at", { ascending: false });
    if (userId) q = q.eq("user_id", userId);
    return must(await q);
  },
  submit: async (c: TablesInsert<"contributions">) =>
    must(await supabase.from("contributions").insert(c)),
  review: async (c: Partial<ContributionRow> & { id: string }) => {
    const { id, ...rest } = c;
    return must(await supabase.from("contributions").update(rest).eq("id", id));
  },
  withdraw: async (id: string) =>
    must(await supabase.from("contributions").delete().eq("id", id)),
};
