CREATE TYPE public.app_role AS ENUM ('super_admin','admin','customer');
CREATE TYPE public.booking_status AS ENUM ('pending','confirmed','rejected','cancelled','completed');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text, email text, phone text, avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
-- Only one super admin can ever exist (atomic guarantee).
CREATE UNIQUE INDEX one_super_admin ON public.user_roles (role) WHERE role = 'super_admin';

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, slug text NOT NULL UNIQUE, category text NOT NULL DEFAULT 'General',
  description text, image_url text, is_published boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.sub_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  name text NOT NULL, description text, image_url text,
  amenities text[] NOT NULL DEFAULT '{}', capacity int CHECK (capacity IS NULL OR capacity >= 0),
  price numeric(12,2) CHECK (price IS NULL OR price >= 0), price_unit text NOT NULL DEFAULT 'per day',
  is_available boolean NOT NULL DEFAULT true, min_notice_days int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.sub_services(service_id);
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  sub_service_id uuid NOT NULL REFERENCES public.sub_services(id) ON DELETE RESTRICT,
  start_date date NOT NULL, end_date date NOT NULL, guests int NOT NULL DEFAULT 1 CHECK (guests > 0),
  notes text, status public.booking_status NOT NULL DEFAULT 'pending', admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
CREATE INDEX ON public.bookings(user_id); CREATE INDEX ON public.bookings(status);
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid, action text NOT NULL, entity text NOT NULL, entity_id uuid, summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.activity_logs(created_at DESC);
CREATE TABLE public.app_settings (
  key text PRIMARY KEY, value jsonb NOT NULL DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT SELECT ON public.services, public.sub_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services, public.sub_services TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.profiles, public.user_roles, public.services, public.sub_services, public.bookings, public.activity_logs, public.app_settings TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','super_admin'))
$$;
CREATE OR REPLACE FUNCTION public.super_admin_exists()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin')
$$;
GRANT EXECUTE ON FUNCTION public.super_admin_exists() TO anon, authenticated;

-- Trusted bootstrap: only callable by the backend (service role).
CREATE OR REPLACE FUNCTION public.bootstrap_super_admin(_user_id uuid, _full_name text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('cslc_bootstrap_super_admin'));
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
    RETURN false;
  END IF;
  UPDATE public.profiles SET full_name = _full_name WHERE id = _user_id;
  INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, 'super_admin');
  INSERT INTO public.activity_logs(actor_id, action, entity, entity_id, summary)
    VALUES (_user_id, 'bootstrap', 'user', _user_id, 'Initial super administrator created');
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.bootstrap_super_admin(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_super_admin(uuid, text) TO service_role;

-- New signups: profile + customer role only.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, email)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER t_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_services BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_sub BEFORE UPDATE ON public.sub_services FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_bookings BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Booking guard: customers create pending bookings and may only cancel their own.
CREATE OR REPLACE FUNCTION public.guard_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.user_id := auth.uid(); NEW.status := 'pending'; NEW.admin_notes := NULL;
    IF NOT EXISTS (SELECT 1 FROM public.sub_services s JOIN public.services p ON p.id = s.service_id
      WHERE s.id = NEW.sub_service_id AND s.is_published AND s.is_available AND p.is_published) THEN
      RAISE EXCEPTION 'This facility is not available for booking';
    END IF;
  ELSE
    IF NEW.status <> 'cancelled' OR OLD.status NOT IN ('pending','confirmed')
       OR NEW.user_id <> OLD.user_id OR NEW.sub_service_id <> OLD.sub_service_id
       OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
      RAISE EXCEPTION 'You can only cancel your own pending or confirmed booking';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER g_bookings BEFORE INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.guard_booking();

-- Activity log writer.
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; s text;
BEGIN
  r := COALESCE(NEW, OLD);
  s := CASE TG_TABLE_NAME
    WHEN 'services' THEN r.name WHEN 'sub_services' THEN r.name
    WHEN 'bookings' THEN 'Booking ' || COALESCE(NEW.status::text, OLD.status::text)
    WHEN 'user_roles' THEN 'Role ' || r.role::text
    ELSE NULL END;
  INSERT INTO public.activity_logs(actor_id, action, entity, entity_id, summary)
    VALUES (auth.uid(), lower(TG_OP), TG_TABLE_NAME, r.id, s);
  RETURN r;
END $$;
CREATE TRIGGER l_services AFTER INSERT OR UPDATE OR DELETE ON public.services FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER l_sub AFTER INSERT OR UPDATE OR DELETE ON public.sub_services FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER l_bookings AFTER INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER l_roles AFTER INSERT OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.log_activity();

-- Policies
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "super admin grants admin" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'super_admin') AND role = 'admin');
CREATE POLICY "super admin revokes admin" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') AND role = 'admin');

CREATE POLICY "public services" ON public.services FOR SELECT TO anon, authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "staff services ins" ON public.services FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff services upd" ON public.services FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff services del" ON public.services FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "public subs" ON public.sub_services FOR SELECT TO anon, authenticated USING (
  public.is_staff(auth.uid()) OR (is_published AND EXISTS (SELECT 1 FROM public.services p WHERE p.id = service_id AND p.is_published)));
CREATE POLICY "staff subs ins" ON public.sub_services FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff subs upd" ON public.sub_services FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff subs del" ON public.sub_services FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "bookings read" ON public.bookings FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "bookings create" ON public.bookings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "bookings update" ON public.bookings FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid())) WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "logs staff read" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "settings read" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings write" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "settings update" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- Storage policies for service images (bucket created separately).
CREATE POLICY "service images public read" ON storage.objects FOR SELECT USING (bucket_id = 'service-images');
CREATE POLICY "service images staff ins" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'service-images' AND public.is_staff(auth.uid()));
CREATE POLICY "service images staff upd" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'service-images' AND public.is_staff(auth.uid()));
CREATE POLICY "service images staff del" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'service-images' AND public.is_staff(auth.uid()));