import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { canClaim, isApprovedEmail } from "./policy.ts";

// Only this mailbox may claim the first super-admin role, and only after confirming it.

const Register = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(10).max(72),
  redirectTo: z.string().url().max(500).optional(),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceKey || !anonKey)
    return json({ error: "Setup configuration unavailable" }, 500);
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: exists, error: exErr } = await admin.rpc("super_admin_exists");
  if (exErr) return json({ error: "Setup status unavailable" }, 500);
  if (req.method === "GET") return json({ initialized: !!exists });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (exists) return json({ error: "Setup has already been completed" }, 409);

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    /* empty body allowed for claim */
  }

  // Claim: a signed-in (therefore email-confirmed) approved user takes the role.
  if (body.action === "claim") {
    const token =
      req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const { data: u, error } = await admin.auth.getUser(token);
    if (error || !u.user) return json({ error: "Sign in first" }, 401);
    if (!canClaim(u.user.email, u.user.email_confirmed_at))
      return json(
        { error: "This account is not approved for administrator setup" },
        403,
      );
    const name =
      (u.user.user_metadata?.full_name as string) ?? "Super Administrator";
    const { data: ok, error: bErr } = await admin.rpc("bootstrap_super_admin", {
      _user_id: u.user.id,
      _full_name: name,
    });
    if (bErr || !ok)
      return json({ error: "Setup has already been completed" }, 409);
    return json({ success: true });
  }

  // Register: create the approved account; Auth emails a confirmation link.
  const parsed = Register.safeParse(body);
  if (!parsed.success)
    return json(
      {
        error:
          "Enter a valid name, email and a password of at least 10 characters",
      },
      400,
    );
  const { fullName, email, password, redirectTo } = parsed.data;
  if (!isApprovedEmail(email))
    return json(
      { error: "This email is not approved for administrator setup" },
      403,
    );

  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: sErr } = await anon.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: redirectTo },
  });
  if (sErr) return json({ error: sErr.message }, 400);
  return json({ success: true, confirm: true });
});
