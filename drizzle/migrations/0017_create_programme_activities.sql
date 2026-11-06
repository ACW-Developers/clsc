CREATE TABLE public.programme_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area text NOT NULL CHECK (area IN ('leadership-development','spiritual-formation','mentorship-life-skills','student-wellbeing')),
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  image_url text,
  activity_date date NOT NULL DEFAULT current_date,
  location text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.programme_activities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programme_activities TO authenticated;
GRANT ALL ON public.programme_activities TO service_role;

ALTER TABLE public.programme_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published programme activities"
ON public.programme_activities FOR SELECT
USING (is_published);

CREATE POLICY "Staff can read all programme activities"
ON public.programme_activities FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Super admins can insert programme activities"
ON public.programme_activities FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update programme activities"
ON public.programme_activities FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete programme activities"
ON public.programme_activities FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX programme_activities_area_date_idx ON public.programme_activities (area, activity_date DESC);

CREATE TRIGGER programme_activities_updated_at
BEFORE UPDATE ON public.programme_activities
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();