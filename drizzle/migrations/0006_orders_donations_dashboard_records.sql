CREATE TABLE public.orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 reference text NOT NULL UNIQUE,
 description text NOT NULL DEFAULT '',
 amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'fulfilled', 'cancelled')),
 admin_notes text,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.orders TO authenticated;
GRANT UPDATE (status, admin_notes) ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders owner or staff read" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "orders staff update" ON public.orders FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX orders_user_created_idx ON public.orders(user_id, created_at DESC);
CREATE TABLE public.donations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 reference text NOT NULL UNIQUE,
 description text NOT NULL DEFAULT '',
 amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
 admin_notes text,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.donations TO authenticated;
GRANT UPDATE (admin_notes) ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations owner or staff read" ON public.donations FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "donations staff notes" ON public.donations FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX donations_user_created_idx ON public.donations(user_id, created_at DESC);