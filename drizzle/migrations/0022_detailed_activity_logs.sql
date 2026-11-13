ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS module text NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS operation text NOT NULL DEFAULT 'update',
  ADD COLUMN IF NOT EXISTS actor_name text,
  ADD COLUMN IF NOT EXISTS changes jsonb;

CREATE INDEX IF NOT EXISTS activity_logs_module_created_idx ON public.activity_logs (module, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_operation_created_idx ON public.activity_logs (operation, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_module(_entity text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _entity IN ('services','sub_services','bookings','receipts') THEN 'Hospitality'
    WHEN _entity IN ('books','bookshop_stock','orders','bookshop_receipts') THEN 'Bookshop'
    WHEN _entity IN ('events','event_tickets','materials','donations','resources','contributions','programme_activities') THEN 'Student Programmes'
    WHEN _entity IN ('support_tickets','contact_enquiries','chat_sessions') THEN 'Support'
    WHEN _entity IN ('user_roles','profiles') THEN 'Users & Access'
    WHEN _entity = 'reviews' THEN 'Reviews'
    WHEN _entity = 'leadership_team' THEN 'About & Content'
    WHEN _entity = 'app_settings' THEN 'Settings'
    ELSE 'General' END
$$;

CREATE OR REPLACE FUNCTION public.log_noun(_entity text, _row jsonb DEFAULT NULL) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _entity
    WHEN 'services' THEN 'service category'
    WHEN 'sub_services' THEN 'facility'
    WHEN 'bookings' THEN 'booking'
    WHEN 'receipts' THEN 'booking receipt'
    WHEN 'books' THEN 'book'
    WHEN 'bookshop_stock' THEN 'book stock'
    WHEN 'orders' THEN CASE WHEN _row->>'branch' IS NOT NULL THEN 'bookshop order' ELSE 'order' END
    WHEN 'bookshop_receipts' THEN 'bookshop receipt'
    WHEN 'events' THEN 'event'
    WHEN 'event_tickets' THEN 'event ticket'
    WHEN 'materials' THEN 'programme material'
    WHEN 'donations' THEN 'donation'
    WHEN 'resources' THEN CASE _row->>'kind' WHEN 'devotional' THEN 'devotional' WHEN 'bible_study' THEN 'Bible study' ELSE 'resource' END
    WHEN 'contributions' THEN 'student contribution'
    WHEN 'programme_activities' THEN 'programme activity'
    WHEN 'support_tickets' THEN 'support ticket'
    WHEN 'contact_enquiries' THEN 'contact enquiry'
    WHEN 'chat_sessions' THEN 'live chat'
    WHEN 'user_roles' THEN 'role'
    WHEN 'profiles' THEN 'profile'
    WHEN 'reviews' THEN 'review'
    WHEN 'leadership_team' THEN 'leadership profile'
    WHEN 'app_settings' THEN 'setting'
    ELSE replace(_entity, '_', ' ') END
$$;

CREATE OR REPLACE FUNCTION public.log_value(_v jsonb) RETURNS jsonb
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE jsonb_typeof(_v)
    WHEN 'array' THEN to_jsonb(jsonb_array_length(_v)::text || ' item(s)')
    WHEN 'object' THEN to_jsonb('details'::text)
    WHEN 'string' THEN CASE WHEN length(_v #>> '{}') > 120 THEN to_jsonb(left(_v #>> '{}', 117) || '…') ELSE _v END
    ELSE _v END
$$;

CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t text := TG_TABLE_NAME;
  j jsonb;
  o jsonb;
  noun text;
  diff jsonb;
  keys text[];
  act text;
  label text;
  uid uuid := auth.uid();
  who text;
BEGIN
  BEGIN
    j := to_jsonb(COALESCE(NEW, OLD));
    IF TG_OP = 'UPDATE' THEN o := to_jsonb(OLD); END IF;
    noun := public.log_noun(t, j);

    -- Stock movements caused by customer checkouts are covered by the order entry.
    IF t = 'bookshop_stock' AND NOT COALESCE(public.is_staff(uid), false) THEN
      RETURN COALESCE(NEW, OLD);
    END IF;

    IF TG_OP = 'UPDATE' THEN
      SELECT jsonb_object_agg(n.key, jsonb_build_object('from', public.log_value(x.value), 'to', public.log_value(n.value))),
             array_agg(n.key ORDER BY n.key)
        INTO diff, keys
      FROM jsonb_each(j) n JOIN jsonb_each(o) x ON x.key = n.key
      WHERE n.value IS DISTINCT FROM x.value
        AND n.key NOT IN ('updated_at','created_at','last_message_at','id','token','callback_token');
      IF diff IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
    END IF;

    IF uid IS NULL THEN
      uid := CASE
        WHEN t = 'profiles' THEN NULLIF(j->>'id','')::uuid
        WHEN j ? 'user_id' THEN NULLIF(j->>'user_id','')::uuid
      END;
    END IF;

    SELECT COALESCE(NULLIF(p.full_name,''), p.email) INTO who FROM public.profiles p WHERE p.id = uid;
    IF who IS NULL THEN
      who := CASE t WHEN 'donations' THEN j->>'donor_name' WHEN 'contact_enquiries' THEN j->>'name' WHEN 'chat_sessions' THEN j->>'name' END;
    END IF;

    label := CASE t
      WHEN 'bookings' THEN concat_ws(' · ',
        COALESCE((SELECT s.name FROM public.sub_services s WHERE s.id = NULLIF(j->>'sub_service_id','')::uuid), 'Facility'),
        to_char((j->>'start_date')::date, 'DD Mon YYYY') ||
          CASE WHEN j->>'end_date' IS DISTINCT FROM j->>'start_date' THEN ' – ' || to_char((j->>'end_date')::date, 'DD Mon YYYY') ELSE '' END)
      WHEN 'user_roles' THEN COALESCE((SELECT COALESCE(NULLIF(p.full_name,''), p.email) FROM public.profiles p WHERE p.id = NULLIF(j->>'user_id','')::uuid), 'User')
      WHEN 'bookshop_stock' THEN concat_ws(' · ',
        COALESCE((SELECT b.title FROM public.books b WHERE b.id = NULLIF(j->>'book_id','')::uuid), 'Book'),
        initcap(j->>'branch') || ' branch')
      WHEN 'orders' THEN concat_ws(' · ', j->>'reference', j->>'description')
      WHEN 'donations' THEN concat_ws(' · ', COALESCE(j->>'donor_name', 'Anonymous donor'), 'KES ' || to_char((j->>'amount')::numeric, 'FM999,999,990'))
      WHEN 'event_tickets' THEN concat_ws(' · ', j->>'ticket_number', j->>'attendee_name',
        (SELECT e.title FROM public.events e WHERE e.id = NULLIF(j->>'event_id','')::uuid))
      WHEN 'reviews' THEN concat_ws(' · ', j->>'author_name', (j->>'rating') || '/5 stars')
      WHEN 'contact_enquiries' THEN concat_ws(' · ', j->>'name', j->>'subject')
      WHEN 'app_settings' THEN initcap(replace(j->>'key', '_', ' '))
      ELSE COALESCE(j->>'name', j->>'title', j->>'full_name', j->>'subject', j->>'reference')
    END;

    act := CASE
      WHEN TG_OP = 'INSERT' THEN CASE t
        WHEN 'bookings' THEN 'Requested a booking'
        WHEN 'orders' THEN CASE WHEN noun = 'order' THEN 'Placed an order' ELSE 'Placed a bookshop order' END
        WHEN 'event_tickets' THEN 'Purchased an event ticket'
        WHEN 'donations' THEN 'Made a donation'
        WHEN 'contributions' THEN 'Submitted a student contribution'
        WHEN 'reviews' THEN 'Submitted a review'
        WHEN 'support_tickets' THEN 'Opened a support ticket'
        WHEN 'contact_enquiries' THEN 'Sent a contact enquiry'
        WHEN 'chat_sessions' THEN 'Started a live chat'
        WHEN 'profiles' THEN 'Registered an account'
        WHEN 'user_roles' THEN 'Assigned ' || replace(j->>'role', '_', ' ') || ' role'
        ELSE 'Added ' || noun END
      WHEN TG_OP = 'DELETE' THEN CASE t
        WHEN 'user_roles' THEN 'Removed ' || replace(j->>'role', '_', ' ') || ' role'
        ELSE 'Deleted ' || noun END
      WHEN 'payment_status' = ANY(keys) AND j->>'payment_status' = 'paid' THEN 'Paid for ' || noun
      WHEN 'payment_status' = ANY(keys) THEN 'Marked ' || noun || ' payment as ' || replace(j->>'payment_status', '_', ' ')
      WHEN 'status' = ANY(keys) THEN CASE
        WHEN j->>'status' IN ('confirmed','approved','rejected','cancelled','completed','resolved','closed')
          THEN initcap(j->>'status') || ' ' || noun
        ELSE 'Marked ' || noun || ' as ' || replace(j->>'status', '_', ' ') END
      WHEN 'admin_reply' = ANY(keys) THEN 'Replied to ' || noun
      WHEN 'is_published' = ANY(keys) THEN
        CASE WHEN (j->>'is_published')::boolean THEN 'Published ' ELSE 'Unpublished ' END || noun
      WHEN 'is_available' = ANY(keys) THEN
        'Marked ' || noun || CASE WHEN (j->>'is_available')::boolean THEN ' as available' ELSE ' as unavailable' END
      WHEN keys = ARRAY['admin_notes'] THEN 'Updated internal notes on ' || noun
      WHEN t = 'bookshop_stock' AND 'quantity' = ANY(keys) THEN 'Adjusted book stock'
      WHEN t IN ('sub_services','books') AND 'price' = ANY(keys) THEN 'Changed ' || noun || ' price'
      WHEN t = 'profiles' AND keys = ARRAY['avatar_url'] THEN 'Changed profile photo'
      ELSE 'Updated ' || noun
    END;

    INSERT INTO public.activity_logs(actor_id, actor_name, action, operation, module, entity, entity_id, summary, changes)
    VALUES (
      uid, who, act, lower(TG_OP), public.log_module(t), t,
      CASE WHEN t = 'bookshop_stock' THEN NULLIF(j->>'book_id','')::uuid
           WHEN t = 'app_settings' THEN NULL
           ELSE NULLIF(j->>'id','')::uuid END,
      label, diff);
  EXCEPTION WHEN OTHERS THEN
    -- Logging must never block the underlying business operation.
    RAISE WARNING 'log_activity skipped on %: %', t, SQLERRM;
  END;
  RETURN COALESCE(NEW, OLD);
END $$;

REVOKE EXECUTE ON FUNCTION public.log_activity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS l_services ON public.services;
DROP TRIGGER IF EXISTS l_sub ON public.sub_services;
DROP TRIGGER IF EXISTS l_bookings ON public.bookings;
DROP TRIGGER IF EXISTS l_roles ON public.user_roles;

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['services','sub_services','bookings','user_roles','books','bookshop_stock','orders','events','event_tickets','materials','donations','resources','contributions','programme_activities','leadership_team','reviews','support_tickets','contact_enquiries','chat_sessions','profiles','app_settings'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS l_activity ON public.%I', tbl);
    EXECUTE format('CREATE TRIGGER l_activity AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_activity()', tbl);
  END LOOP;
END $$;

-- Backfill earlier generic entries into the new descriptive format.
UPDATE public.activity_logs SET
  operation = action,
  module = public.log_module(entity),
  action = CASE
    WHEN entity = 'user_roles' AND action = 'insert' AND summary LIKE 'Role %' THEN 'Assigned ' || replace(substr(summary, 6), '_', ' ') || ' role'
    WHEN entity = 'user_roles' AND action = 'delete' AND summary LIKE 'Role %' THEN 'Removed ' || replace(substr(summary, 6), '_', ' ') || ' role'
    WHEN entity = 'bookings' AND action = 'insert' THEN 'Requested a booking'
    WHEN entity = 'bookings' AND action = 'update' AND summary LIKE 'Booking %' THEN 'Marked booking as ' || substr(summary, 9)
    WHEN action = 'insert' THEN 'Added ' || public.log_noun(entity)
    WHEN action = 'delete' THEN 'Deleted ' || public.log_noun(entity)
    ELSE 'Updated ' || public.log_noun(entity)
  END
WHERE action IN ('insert','update','delete');

UPDATE public.activity_logs l SET actor_name = COALESCE(NULLIF(p.full_name,''), p.email)
FROM public.profiles p WHERE p.id = l.actor_id AND l.actor_name IS NULL;