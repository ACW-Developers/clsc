CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE j jsonb; s text;
BEGIN
  j := to_jsonb(COALESCE(NEW, OLD));
  s := CASE TG_TABLE_NAME
    WHEN 'bookings' THEN 'Booking ' || (j->>'status')
    WHEN 'user_roles' THEN 'Role ' || (j->>'role')
    ELSE j->>'name' END;
  INSERT INTO public.activity_logs(actor_id, action, entity, entity_id, summary)
    VALUES (auth.uid(), lower(TG_OP), TG_TABLE_NAME, (j->>'id')::uuid, s);
  RETURN COALESCE(NEW, OLD);
END $$;