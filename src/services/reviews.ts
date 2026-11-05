import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewKind = "book" | "facility";

const must = <D>(r: { data: D; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data;
};
const col = (k: ReviewKind) => (k === "book" ? "book_id" : "sub_service_id");

export const reviewsService = {
  forTarget: async (kind: ReviewKind, id: string) =>
    must(
      await supabase
        .from("reviews")
        .select("*")
        .eq(col(kind), id)
        .order("created_at", { ascending: false }),
    ),
  eligible: async (kind: ReviewKind, id: string) =>
    must(await supabase.rpc("review_eligible", { _kind: kind, _target: id })) as boolean,
  save: async (input: {
    kind: ReviewKind;
    target: string;
    rating: number;
    comment: string;
    id?: string;
  }) => {
    const row = { rating: input.rating, comment: input.comment.trim().slice(0, 2000) };
    if (input.id)
      return must(await supabase.from("reviews").update(row).eq("id", input.id));
    return must(
      await supabase
        .from("reviews")
        .insert({ ...row, kind: input.kind, [col(input.kind)]: input.target, user_id: "00000000-0000-0000-0000-000000000000" }),
    );
  },
  all: async () =>
    must(
      await supabase
        .from("reviews")
        .select("*, books(title), sub_services(name)")
        .order("created_at", { ascending: false }),
    ),
  setStatus: async (id: string, status: "published" | "hidden") =>
    must(await supabase.from("reviews").update({ status }).eq("id", id)),
  remove: async (id: string) =>
    must(await supabase.from("reviews").delete().eq("id", id)),
};
