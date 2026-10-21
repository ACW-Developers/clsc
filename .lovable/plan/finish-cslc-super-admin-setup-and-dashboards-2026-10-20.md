# Finish CSLC super-admin setup and dashboards

## Build

1. Make the existing one-time super-admin bootstrap usable from a dedicated setup page. Show setup status, validate the first administrator's name/email/password, call the existing protected bootstrap function, and direct the new administrator to sign in. Once initialized, prevent another bootstrap and provide a sign-in path.
2. Add a protected CSLC administration area using the existing React Router, React Query hooks, Supabase services, and semantic tokens. Add an overview plus practical booking, services/facilities, customer, roles, activity, and settings views, reusing the existing data APIs and shared UI controls.
3. Ensure only staff can enter the administration area and only the super administrator can manage staff roles/settings; keep database policies authoritative.
4. Restore the explicit Data API permissions required by the existing table policies, and constrain staff booking edits to status and admin notes at the database layer.

## Technical details

- Keep React SPA + TypeScript + Vite + Tailwind + React Router unchanged; no new dependency.
- Use the existing `setup-admin` Edge Function and `super_admin_exists`/`bootstrap_super_admin` database functions.
- Apply database changes through the existing Lovable database migration workflow; do not weaken RLS or expose credentials.
- Verify setup status and function response, signed-out route protection, admin workflows as available, mobile overflow, and the preview build. Report any check that requires a signed-in admin if one cannot be provisioned safely.
