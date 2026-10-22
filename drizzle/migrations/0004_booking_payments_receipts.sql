ALTER TABLE public.sub_services ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}';
UPDATE public.sub_services SET images = ARRAY[image_url] WHERE image_url IS NOT NULL AND images = '{}';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_amount numeric;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS start_time time;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS end_time time;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_status_chk CHECK (payment_status IN ('unpaid','failed','paid'));

CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text NOT NULL UNIQUE,
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  method text NOT NULL DEFAULT 'Simulated M-Pesa (test only)',
  phone text,
  reference text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.receipts TO authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receipts read" ON public.receipts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_booking()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE s record; days int;
BEGIN
  IF current_setting('cslc.payment', true) = '1' THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;

  IF public.is_staff(auth.uid()) AND TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.sub_service_id IS DISTINCT FROM OLD.sub_service_id
      OR NEW.start_date IS DISTINCT FROM OLD.start_date OR NEW.end_date IS DISTINCT FROM OLD.end_date
      OR NEW.start_time IS DISTINCT FROM OLD.start_time OR NEW.end_time IS DISTINCT FROM OLD.end_time
      OR NEW.guests IS DISTINCT FROM OLD.guests OR NEW.notes IS DISTINCT FROM OLD.notes
      OR NEW.total_amount IS DISTINCT FROM OLD.total_amount OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
      OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Staff may only change booking status and admin notes';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT public.is_staff(auth.uid()) THEN NEW.user_id := auth.uid(); END IF;
    NEW.status := 'pending';
    NEW.payment_status := 'unpaid';
    NEW.admin_notes := NULL;
    IF NEW.end_date < NEW.start_date THEN RAISE EXCEPTION 'End date must be on or after start date'; END IF;
    SELECT sub.* INTO s FROM public.sub_services sub JOIN public.services p ON p.id = sub.service_id
      WHERE sub.id = NEW.sub_service_id AND sub.is_published AND sub.is_available AND p.is_published;
    IF NOT FOUND THEN RAISE EXCEPTION 'This facility is not available for booking'; END IF;
    IF NEW.start_date < current_date + s.min_notice_days THEN
      RAISE EXCEPTION 'This facility needs at least % day(s) notice', s.min_notice_days;
    END IF;
    IF s.capacity IS NOT NULL AND NEW.guests > s.capacity THEN
      RAISE EXCEPTION 'This facility holds at most % guests', s.capacity;
    END IF;
    IF EXISTS (SELECT 1 FROM public.bookings b WHERE b.sub_service_id = NEW.sub_service_id
       AND b.status = 'confirmed' AND b.payment_status = 'paid'
       AND b.start_date <= NEW.end_date AND b.end_date >= NEW.start_date) THEN
      RAISE EXCEPTION 'Those dates are already reserved for this facility';
    END IF;
    days := NEW.end_date - NEW.start_date + 1;
    NEW.total_amount := CASE WHEN s.price IS NULL THEN NULL
      WHEN s.price_unit ILIKE '%person%' OR s.price_unit ILIKE '%guest%' THEN s.price * NEW.guests * days
      ELSE s.price * days END;
    RETURN NEW;
  END IF;

  IF NEW.status <> 'cancelled' OR OLD.status <> 'pending' OR OLD.payment_status = 'paid'
     OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.sub_service_id IS DISTINCT FROM OLD.sub_service_id
     OR NEW.start_date IS DISTINCT FROM OLD.start_date OR NEW.end_date IS DISTINCT FROM OLD.end_date
     OR NEW.start_time IS DISTINCT FROM OLD.start_time OR NEW.end_time IS DISTINCT FROM OLD.end_time
     OR NEW.guests IS DISTINCT FROM OLD.guests OR NEW.notes IS DISTINCT FROM OLD.notes
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'You can only cancel your own unpaid pending booking';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.simulate_payment(_booking_id uuid, _phone text, _success boolean)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE b public.bookings; rid uuid;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id = _booking_id FOR UPDATE;
  IF NOT FOUND OR b.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Booking not found'; END IF;
  IF b.status <> 'pending' OR b.payment_status = 'paid' THEN RAISE EXCEPTION 'This booking cannot be paid'; END IF;
  IF b.total_amount IS NULL OR b.total_amount <= 0 THEN RAISE EXCEPTION 'This facility has no price yet; CSLC will contact you'; END IF;
  IF _phone !~ '^(\+?254|0)[17][0-9]{8}$' THEN RAISE EXCEPTION 'Enter a valid Kenyan phone number'; END IF;
  PERFORM set_config('cslc.payment', '1', true);
  PERFORM pg_advisory_xact_lock(hashtext(b.sub_service_id::text));
  IF NOT _success THEN
    UPDATE public.bookings SET payment_status = 'failed' WHERE id = b.id;
    RETURN NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM public.bookings o WHERE o.sub_service_id = b.sub_service_id AND o.id <> b.id
     AND o.status = 'confirmed' AND o.payment_status = 'paid'
     AND o.start_date <= b.end_date AND o.end_date >= b.start_date) THEN
    UPDATE public.bookings SET payment_status = 'failed' WHERE id = b.id;
    RAISE EXCEPTION 'Sorry, these dates were just reserved by another guest';
  END IF;
  UPDATE public.bookings SET payment_status = 'paid', status = 'confirmed' WHERE id = b.id;
  INSERT INTO public.receipts(receipt_number, booking_id, user_id, amount, phone, reference)
    VALUES ('CSLC-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)),
            b.id, b.user_id, b.total_amount, _phone, 'SIM' || upper(substr(md5(gen_random_uuid()::text), 1, 8)))
    RETURNING id INTO rid;
  PERFORM set_config('cslc.payment', '0', true);
  RETURN rid;
END $function$;
REVOKE ALL ON FUNCTION public.simulate_payment(uuid, text, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.simulate_payment(uuid, text, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.facility_booked_ranges(_sub_service_id uuid)
 RETURNS TABLE(start_date date, end_date date) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT b.start_date, b.end_date FROM public.bookings b
  WHERE b.sub_service_id = _sub_service_id AND b.status = 'confirmed' AND b.payment_status = 'paid' AND b.end_date >= current_date
  ORDER BY b.start_date
$function$;

CREATE POLICY "avatars read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "avatars own ins" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars own upd" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars own del" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);