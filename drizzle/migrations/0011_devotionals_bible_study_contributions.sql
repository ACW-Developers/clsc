CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('devotional','bible_study')),
  title text NOT NULL CHECK (length(title) BETWEEN 2 AND 200),
  scripture text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  prayer text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  image_url text,
  attachment_url text,
  publish_date date NOT NULL DEFAULT current_date,
  author_name text,
  contribution_id uuid,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources public read" ON public.resources FOR SELECT USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "resources super manage" ON public.resources FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER resources_touch BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX resources_kind_date ON public.resources(kind, publish_date DESC);

CREATE TABLE public.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL CHECK (kind IN ('devotional','reflection','bible_study','resource')),
  title text NOT NULL CHECK (length(title) BETWEEN 2 AND 200),
  scripture text NOT NULL DEFAULT '',
  body text NOT NULL CHECK (length(body) BETWEEN 20 AND 20000),
  attachment_url text,
  author_name text NOT NULL CHECK (length(author_name) BETWEEN 2 AND 120),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes text,
  resource_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contributions TO authenticated;
GRANT ALL ON public.contributions TO service_role;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contrib own read" ON public.contributions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "contrib own insert" ON public.contributions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending' AND resource_id IS NULL AND admin_notes IS NULL);
CREATE POLICY "contrib own delete pending" ON public.contributions FOR DELETE TO authenticated USING ((user_id = auth.uid() AND status = 'pending') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "contrib super update" ON public.contributions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER contributions_touch BEFORE UPDATE ON public.contributions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_contribution() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rid uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify('staff', null, 'New student contribution', NEW.author_name || ': ' || NEW.title, '/admin?view=contributions');
    RETURN NEW;
  END IF;
  IF NEW.status = 'approved' AND OLD.status <> 'approved' AND NEW.resource_id IS NULL THEN
    INSERT INTO public.resources(kind, title, scripture, body, category, attachment_url, author_name, contribution_id, is_published, description)
    VALUES (CASE WHEN NEW.kind IN ('devotional','reflection') THEN 'devotional' ELSE 'bible_study' END,
      NEW.title, NEW.scripture, NEW.body, 'Student Contributions', NEW.attachment_url, NEW.author_name, NEW.id, true, left(NEW.body, 180))
    RETURNING id INTO rid;
    NEW.resource_id := rid;
  END IF;
  IF NEW.status <> OLD.status THEN
    PERFORM public.notify('user', NEW.user_id, 'Contribution ' || NEW.status, NEW.title, '/account?view=contributions');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER contributions_after_insert AFTER INSERT ON public.contributions FOR EACH ROW EXECUTE FUNCTION public.handle_contribution();
CREATE TRIGGER contributions_before_update BEFORE UPDATE ON public.contributions FOR EACH ROW EXECUTE FUNCTION public.handle_contribution();

CREATE POLICY "programme files user contrib ins" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'programme-files' AND (storage.foldername(name))[1] = 'contributions' AND (storage.foldername(name))[2] = auth.uid()::text);