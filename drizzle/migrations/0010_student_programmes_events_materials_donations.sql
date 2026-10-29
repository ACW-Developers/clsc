CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  poster_url text,
  venue text NOT NULL DEFAULT '',
  event_date date NOT NULL,
  start_time time,
  end_time time,
  ticket_price numeric NOT NULL DEFAULT 0 CHECK (ticket_price >= 0),
  capacity integer CHECK (capacity IS NULL OR capacity > 0),
  organizer text NOT NULL DEFAULT 'CSLC Student Programmes',
  contact text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events public read" ON public.events FOR SELECT TO anon, authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "events super manage" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER events_touch BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.event_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE,
  event_id uuid NOT NULL REFERENCES public.events(id),
  user_id uuid NOT NULL,
  attendee_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  amount numeric NOT NULL,
  phone text NOT NULL,
  reference text NOT NULL,
  method text NOT NULL DEFAULT 'Simulated M-Pesa (test only)',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.event_tickets TO authenticated;
GRANT ALL ON public.event_tickets TO service_role;
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets owner staff read" ON public.event_tickets FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.event_seats_sold(_event_id uuid) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(quantity), 0)::int FROM public.event_tickets WHERE event_id = _event_id
$$;
GRANT EXECUTE ON FUNCTION public.event_seats_sold(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.buy_event_ticket(_event_id uuid, _quantity integer, _attendee text, _phone text, _success boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e public.events; sold int; tid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please sign in to buy tickets'; END IF;
  SELECT * INTO e FROM public.events WHERE id = _event_id FOR UPDATE;
  IF NOT FOUND OR NOT e.is_published THEN RAISE EXCEPTION 'Event not found'; END IF;
  IF e.event_date < current_date THEN RAISE EXCEPTION 'This event has already taken place'; END IF;
  IF _quantity IS NULL OR _quantity < 1 OR _quantity > 10 THEN RAISE EXCEPTION 'Choose between 1 and 10 tickets'; END IF;
  IF length(trim(coalesce(_attendee, ''))) < 2 THEN RAISE EXCEPTION 'Enter the attendee name'; END IF;
  IF _phone !~ '^(\+?254|0)[17][0-9]{8}$' THEN RAISE EXCEPTION 'Enter a valid Kenyan phone number'; END IF;
  IF NOT _success THEN RETURN NULL; END IF;
  SELECT COALESCE(SUM(quantity), 0) INTO sold FROM public.event_tickets WHERE event_id = e.id;
  IF e.capacity IS NOT NULL AND sold + _quantity > e.capacity THEN RAISE EXCEPTION 'Only % ticket(s) left', greatest(e.capacity - sold, 0); END IF;
  INSERT INTO public.event_tickets(ticket_number, event_id, user_id, attendee_name, quantity, amount, phone, reference)
  VALUES ('TKT-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 8)),
          e.id, auth.uid(), left(trim(_attendee), 120), _quantity, e.ticket_price * _quantity, _phone,
          'SIM' || upper(substr(md5(gen_random_uuid()::text), 1, 8)))
  RETURNING id INTO tid;
  PERFORM public.notify('staff', null, 'Event ticket sold', _quantity || ' ticket(s) for ' || e.title, '/admin?view=events');
  RETURN tid;
END $$;
REVOKE ALL ON FUNCTION public.buy_event_ticket(uuid, integer, text, text, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.buy_event_ticket(uuid, integer, text, text, boolean) TO authenticated;

CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  topic text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'document' CHECK (kind IN ('document', 'image', 'link', 'video', 'audio')),
  url text NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.materials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials public read" ON public.materials FOR SELECT TO anon, authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "materials super manage" ON public.materials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER materials_touch BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.material_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.material_views TO authenticated;
GRANT ALL ON public.material_views TO service_role;
ALTER TABLE public.material_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "views own insert" ON public.material_views FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "views own read" ON public.material_views FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE INDEX material_views_user_idx ON public.material_views(user_id, viewed_at DESC);

ALTER TABLE public.donations ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.donations ADD COLUMN donor_name text, ADD COLUMN donor_email text, ADD COLUMN donor_phone text,
  ADD COLUMN receipt_number text UNIQUE, ADD COLUMN method text NOT NULL DEFAULT 'Simulated M-Pesa (test only)';

CREATE OR REPLACE FUNCTION public.simulate_donation(_name text, _email text, _phone text, _amount numeric, _message text, _success boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE did uuid;
BEGIN
  IF length(trim(coalesce(_name, ''))) < 2 THEN RAISE EXCEPTION 'Enter your name'; END IF;
  IF coalesce(_email, '') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'Enter a valid email address'; END IF;
  IF _phone !~ '^(\+?254|0)[17][0-9]{8}$' THEN RAISE EXCEPTION 'Enter a valid Kenyan phone number'; END IF;
  IF _amount IS NULL OR _amount < 10 OR _amount > 1000000 THEN RAISE EXCEPTION 'Donation must be between KES 10 and KES 1,000,000'; END IF;
  IF NOT _success THEN RETURN NULL; END IF;
  INSERT INTO public.donations(user_id, reference, description, amount, status, donor_name, donor_email, donor_phone, receipt_number)
  VALUES (auth.uid(), 'SIM' || upper(substr(md5(gen_random_uuid()::text), 1, 8)),
          coalesce(nullif(left(trim(_message), 500), ''), 'Student programmes donation'), round(_amount, 2), 'received',
          left(trim(_name), 120), left(lower(trim(_email)), 200), _phone,
          'DON-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)))
  RETURNING id INTO did;
  PERFORM public.notify('staff', null, 'New donation', left(trim(_name), 60) || ' donated KES ' || round(_amount, 2), '/admin?view=donations');
  RETURN did;
END $$;
REVOKE ALL ON FUNCTION public.simulate_donation(text, text, text, numeric, text, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.simulate_donation(text, text, text, numeric, text, boolean) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.donation_receipt(_id uuid)
RETURNS TABLE(receipt_number text, donor_name text, amount numeric, phone text, reference text, method text, description text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.receipt_number, d.donor_name, d.amount, d.donor_phone, d.reference, d.method, d.description, d.created_at
  FROM public.donations d WHERE d.id = _id AND d.receipt_number IS NOT NULL
$$;
GRANT EXECUTE ON FUNCTION public.donation_receipt(uuid) TO anon, authenticated;

CREATE POLICY "programme files read" ON storage.objects FOR SELECT USING (bucket_id = 'programme-files');
CREATE POLICY "programme files super ins" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'programme-files' AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "programme files super del" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'programme-files' AND public.has_role(auth.uid(), 'super_admin'));