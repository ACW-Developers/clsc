import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const Body = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(10).max(72),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: exists, error: exErr } = await admin.rpc("super_admin_exists");
  if (exErr) return json({ error: "Setup status unavailable" }, 500);
  if (req.method === "GET") return json({ initialized: !!exists });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (exists) return json({ error: "Setup has already been completed" }, 409);

  let parsed;
  try { parsed = Body.safeParse(await req.json()); } catch { return json({ error: "Invalid request" }, 400); }
  if (!parsed.success) return json({ error: "Enter a valid name, email and a password of at least 10 characters" }, 400);
  const { fullName, email, password } = parsed.data;

  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: fullName },
  });
  if (cErr || !created.user) return json({ error: cErr?.message ?? "Could not create account" }, 400);

  // Atomic check-and-assign (advisory lock + unique index) inside the database.
  const { data: ok, error: bErr } = await admin.rpc("bootstrap_super_admin", { _user_id: created.user.id, _full_name: fullName });
  if (bErr || !ok) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: "Setup has already been completed" }, 409);
  }
  return json({ success: true });
});
