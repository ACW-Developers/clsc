CREATE TABLE public.leadership_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  title text,
  role text NOT NULL,
  bio text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.leadership_team TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leadership_team TO authenticated;
GRANT ALL ON public.leadership_team TO service_role;

ALTER TABLE public.leadership_team ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published team members"
ON public.leadership_team FOR SELECT
USING (is_published);

CREATE POLICY "Staff can read all team members"
ON public.leadership_team FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Super admins can insert team members"
ON public.leadership_team FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update team members"
ON public.leadership_team FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete team members"
ON public.leadership_team FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER leadership_team_updated_at
BEFORE UPDATE ON public.leadership_team
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();