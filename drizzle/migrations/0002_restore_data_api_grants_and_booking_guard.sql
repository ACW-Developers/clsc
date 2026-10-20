GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT SELECT ON public.services, public.sub_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services, public.sub_services TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.profiles, public.user_roles, public.services, public.sub_services, public.bookings, public.activity_logs, public.app_settings TO service_role;

CREATE OR REPLACE FUNCTION public.guard_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.is_staff(auth.uid()) THEN
    IF TG_OP = 'UPDATE' AND (
      NEW.user_id IS DISTINCT FROM OLD.user_id OR
      NEW.sub_service_id IS DISTINCT FROM OLD.sub_service_id OR
      NEW.start_date IS DISTINCT FROM OLD.start_date OR
      NEW.end_date IS DISTINCT FROM OLD.end_date OR
      NEW.guests IS DISTINCT FROM OLD.guests OR
      NEW.notes IS DISTINCT FROM OLD.notes OR
      NEW.created_at IS DISTINCT FROM OLD.created_at
    ) THEN
      RAISE EXCEPTION 'Staff may only change booking status and admin notes';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.user_id := auth.uid();
    NEW.status := 'pending';
    NEW.admin_notes := NULL;
    IF NOT EXISTS (
      SELECT 1
      FROM public.sub_services s
      JOIN public.services p ON p.id = s.service_id
      WHERE s.id = NEW.sub_service_id AND s.is_published AND s.is_available AND p.is_published
    ) THEN
      RAISE EXCEPTION 'This facility is not available for booking';
    END IF;
  ELSE
    IF NEW.status <> 'cancelled' OR OLD.status NOT IN ('pending','confirmed')
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.sub_service_id IS DISTINCT FROM OLD.sub_service_id
       OR NEW.start_date IS DISTINCT FROM OLD.start_date
       OR NEW.end_date IS DISTINCT FROM OLD.end_date
       OR NEW.guests IS DISTINCT FROM OLD.guests
       OR NEW.notes IS DISTINCT FROM OLD.notes
       OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'You can only cancel your own pending or confirmed booking';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;