import { createClient } from "npm:@supabase/supabase-js@2";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";

// Temporary, operator-only removal of the exact account requested by the owner.
Deno.serve(async (req) => {
  const denied = authenticateCronRequest(req);
  if (denied) return denied;
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return new Response("Configuration unavailable", { status: 500 });
  const admin = createClient(url, key, { auth: { persistSession: false } });
  const id = "48b5b5a1-c64c-4231-b18d-5440fc1ac953";
  const { data, error } = await admin.auth.admin.getUserById(id);
  if (error || data.user?.email?.toLowerCase() !== "amosclinton196@gmail.com")
    return new Response("Target account not found", { status: 409 });
  const { count, error: bookingError } = await admin.from("bookings").select("id", { head: true, count: "exact" }).eq("user_id", id);
  if (bookingError || count !== 0) return new Response("Account has bookings or cannot be checked", { status: 409 });
  const { error: deleteError } = await admin.auth.admin.deleteUser(id);
  return Response.json({ deleted: !deleteError }, { status: deleteError ? 500 : 200 });
});