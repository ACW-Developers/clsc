-- Donation receipts: only the donor or staff can open a receipt.
CREATE OR REPLACE FUNCTION public.donation_receipt(_id uuid)
 RETURNS TABLE(receipt_number text, donor_name text, amount numeric, phone text, reference text, method text, description text, created_at timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT d.receipt_number, d.donor_name, d.amount, d.donor_phone, d.reference, d.method, d.description, d.created_at
  FROM public.donations d
  WHERE d.id = _id AND d.receipt_number IS NOT NULL
    AND auth.uid() IS NOT NULL AND (d.user_id = auth.uid() OR public.is_staff(auth.uid()))
$$;
REVOKE EXECUTE ON FUNCTION public.donation_receipt(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.donation_receipt(uuid) TO authenticated, service_role;

-- Donations: payment fields are server-owned; staff may only edit internal notes.
REVOKE ALL ON public.donations FROM anon, authenticated;
GRANT SELECT ON public.donations TO authenticated;
GRANT UPDATE (admin_notes) ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;

-- Payment sessions: never expose the M-Pesa callback secret to browsers.
REVOKE ALL ON public.payment_sessions FROM anon, authenticated;
GRANT SELECT (id, user_id, kind, reference, amount_minor, currency, status, result_id, created_at, provider, failure_reason) ON public.payment_sessions TO authenticated;
GRANT ALL ON public.payment_sessions TO service_role;

-- App settings: the public may only read branding; staff read everything.
DROP POLICY IF EXISTS "settings read" ON public.app_settings;
CREATE POLICY "settings public branding read" ON public.app_settings FOR SELECT TO anon, authenticated USING (key = 'branding');
CREATE POLICY "settings staff read" ON public.app_settings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- Contact enquiries: validate public submissions and stop visitors setting status or notes.
DROP POLICY IF EXISTS "anyone submits enquiry" ON public.contact_enquiries;
CREATE POLICY "anyone submits valid enquiry" ON public.contact_enquiries FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'new' AND admin_notes IS NULL
  AND length(trim(name)) BETWEEN 1 AND 100
  AND length(trim(email)) BETWEEN 3 AND 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(trim(subject)) BETWEEN 1 AND 150
  AND length(trim(message)) BETWEEN 1 AND 2000
);