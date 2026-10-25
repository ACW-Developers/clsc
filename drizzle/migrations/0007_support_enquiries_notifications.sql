CREATE TABLE public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new','in_progress','resolved')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT INSERT ON public.contact_enquiries TO anon;
GRANT SELECT, INSERT, UPDATE ON public.contact_enquiries TO authenticated;
GRANT ALL ON public.contact_enquiries TO service_role;
ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone submits enquiry" ON public.contact_enquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "staff read enquiries" ON public.contact_enquiries FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "staff update enquiries" ON public.contact_enquiries FOR UPDATE TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

CREATE TABLE public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  admin_reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets create" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "tickets read" ON public.support_tickets FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_staff(auth.uid()));
CREATE POLICY "staff update tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

CREATE TABLE public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  audience text not null default 'user' check (audience in ('user','staff')),
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at desc);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications read" ON public.notifications FOR SELECT TO authenticated USING ((audience = 'user' AND user_id = auth.uid()) OR (audience = 'staff' AND is_staff(auth.uid())));
CREATE POLICY "notifications mark read" ON public.notifications FOR UPDATE TO authenticated USING ((audience = 'user' AND user_id = auth.uid()) OR (audience = 'staff' AND is_staff(auth.uid()))) WITH CHECK ((audience = 'user' AND user_id = auth.uid()) OR (audience = 'staff' AND is_staff(auth.uid())));

CREATE OR REPLACE FUNCTION public.notify(_audience text, _user_id uuid, _title text, _body text, _link text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (audience, user_id, title, body, link) VALUES (_audience, _user_id, _title, _body, _link);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_booking() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify('staff', null, 'New booking request', 'A customer submitted a new booking request.', '/admin?view=bookings');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_new_booking AFTER INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.notify_new_booking();

CREATE OR REPLACE FUNCTION public.notify_booking_update() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    PERFORM public.notify('user', NEW.user_id, 'Booking updated', 'Your booking status is now ' || NEW.status || ' (' || NEW.payment_status || ').', '/account?view=bookings');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_booking_update AFTER UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.notify_booking_update();

CREATE OR REPLACE FUNCTION public.notify_new_enquiry() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify('staff', null, 'New contact enquiry', NEW.name || ': ' || NEW.subject, '/admin?view=support');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_new_enquiry AFTER INSERT ON public.contact_enquiries FOR EACH ROW EXECUTE FUNCTION public.notify_new_enquiry();

CREATE OR REPLACE FUNCTION public.notify_ticket() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify('staff', null, 'New support ticket', NEW.subject, '/admin?view=support');
  ELSIF NEW.admin_reply IS DISTINCT FROM OLD.admin_reply AND NEW.admin_reply IS NOT NULL THEN
    PERFORM public.notify('user', NEW.user_id, 'Support ticket replied', 'CSLC replied to your ticket: ' || NEW.subject, '/account?view=support');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_ticket AFTER INSERT OR UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.notify_ticket();