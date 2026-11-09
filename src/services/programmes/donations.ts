import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const donationFrequencies = [
  { id: "once", label: "One-time" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "annually", label: "Yearly" },
] as const;
export const donationFunds = [
  "general",
  "leadership-development",
  "spiritual-formation",
  "mentorship-life-skills",
  "student-church-engagement",
  "student-wellbeing",
] as const;

/** Mirrors the payment function's server-side donation rules. */
export const donationSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(200),
  phone: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .pipe(z.string().regex(/^(\+?254|0)[17][0-9]{8}$/, "Enter a valid Kenyan phone number, e.g. 0712 345 678")),
  amount: z
    .number({ invalid_type_error: "Enter an amount" })
    .int("Use a whole-shilling amount")
    .min(10, "The minimum gift is KSh 10")
    .max(1_000_000, "The maximum single gift is KSh 1,000,000"),
  message: z.string().trim().max(400, "Keep your message under 400 characters"),
  fund: z.enum(donationFunds),
  frequency: z.enum(donationFrequencies.map((f) => f.id) as ["once", "monthly", "quarterly", "annually"]),
});
export type DonationInput = z.infer<typeof donationSchema>;

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
