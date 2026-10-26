import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { hospitalityService } from "@/services/hospitality";

export const branches = [{ id: "yaya", name: "Yaya Centre" }, { id: "kisumu", name: "Kisumu" }] as const;
export type Branch = typeof branches[number]["id"];
export const branchName = (id: string) => branches.find(b => b.id === id)?.name ?? id;
type Tables = Database["public"]["Tables"];
export type Book = Tables["books"]["Row"] & { bookshop_stock: Tables["bookshop_stock"]["Row"][] };
export const bookSchema = z.object({
  id: z.string().uuid().optional(), title: z.string().trim().min(1).max(200), author: z.string().trim().max(200),
  description: z.string().trim().max(5000), category: z.string().trim().min(1).max(80), isbn: z.string().max(20),
  price: z.coerce.number().positive().max(999999999), image_url: z.string().max(2048).refine(v => !v || /^https:\/\//.test(v) || /^\/(?!\/)/.test(v), "Use a secure image URL or upload an image"),
  rating: z.number().min(0).max(5).nullable(), rating_count: z.coerce.number().int().nonnegative(), is_published: z.boolean(), is_sample: z.boolean(),
});
export const stockSchema = z.array(z.object({ branch: z.enum(["yaya", "kisumu"]), quantity: z.coerce.number().int().min(0).max(1000000), low_stock_threshold: z.coerce.number().int().min(0).max(1000000), is_available: z.boolean() })).length(2).refine(v => new Set(v.map(s => s.branch)).size === 2, "Both branches are required");
export const checkoutSchema = z.object({ branch: z.enum(["yaya", "kisumu"]), items: z.array(z.object({ book_id: z.string().uuid(), quantity: z.number().int().min(1).max(99) })).min(1).max(50).refine(v => new Set(v.map(i => i.book_id)).size === v.length, "Duplicate cart books"), phone: z.string().regex(/^(\+?254|0)[17][0-9]{8}$/, "Enter a valid Kenyan phone number"), success: z.boolean(), requestId: z.string().uuid() });
const result = <T>(r: { data: T; error: { message: string } | null }) => { if (r.error) throw new Error(r.error.message); return r.data; };
export const catalogService = {
  list: async (): Promise<Book[]> => result(await supabase.from("books").select("*,bookshop_stock(*)").order("title")) as Book[],
  save: async (input: { book: z.input<typeof bookSchema>; stock: z.input<typeof stockSchema> }) => {
    const book = bookSchema.parse(input.book), stock = stockSchema.parse(input.stock);
    return result(await supabase.rpc("save_bookshop_book", { _book: book as Json, _stock: stock as Json }));
  },
  upload: hospitalityService.uploadImage,
  checkout: async (input: z.input<typeof checkoutSchema>) => {
    const v = checkoutSchema.parse(input);
    return result(await supabase.rpc("bookshop_checkout", { _branch: v.branch, _items: v.items, _phone: v.phone, _success: v.success, _request_id: v.requestId }));
  },
  receipts: async () => result(await supabase.from("bookshop_receipts").select("*").order("created_at", { ascending: false })),
  receipt: async (id: string) => result(await supabase.from("bookshop_receipts").select("*").eq("id", id).maybeSingle()),
  items: async (id: string) => result(await supabase.from("bookshop_order_items").select("*").eq("order_id", id)),
};