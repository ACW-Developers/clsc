CREATE TABLE public.reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 kind text NOT NULL CHECK (kind IN ('book','facility')),
 book_id uuid REFERENCES public.books(id) ON DELETE CASCADE,
 sub_service_id uuid REFERENCES public.sub_services(id) ON DELETE CASCADE,
 rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
 comment text NOT NULL DEFAULT '' CHECK (length(comment) <= 2000),
 author_name text NOT NULL DEFAULT 'CSLC guest',
 status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((kind='book' AND book_id IS NOT NULL AND sub_service_id IS NULL) OR (kind='facility' AND sub_service_id IS NOT NULL AND book_id IS NULL))
);
CREATE UNIQUE INDEX reviews_user_book ON public.reviews(user_id, book_id) WHERE book_id IS NOT NULL;
CREATE UNIQUE INDEX reviews_user_fac ON public.reviews(user_id, sub_service_id) WHERE sub_service_id IS NOT NULL;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published reviews" ON public.reviews FOR SELECT USING (status='published' OR user_id=auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Eligible users add reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "Owners or super admins update reviews" ON public.reviews FOR UPDATE TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Owners or super admins delete reviews" ON public.reviews FOR DELETE TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'super_admin'));

CREATE OR REPLACE FUNCTION public.review_eligible(_kind text, _target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
 SELECT auth.uid() IS NOT NULL AND CASE
  WHEN _kind='book' THEN EXISTS (SELECT 1 FROM bookshop_order_items i JOIN orders o ON o.id=i.order_id WHERE i.book_id=_target AND o.user_id=auth.uid() AND o.payment_status='paid')
  WHEN _kind='facility' THEN EXISTS (SELECT 1 FROM bookings b WHERE b.sub_service_id=_target AND b.user_id=auth.uid() AND b.payment_status='paid' AND b.status IN ('confirmed','completed') AND b.start_date<=current_date)
  ELSE false END
$$;

CREATE OR REPLACE FUNCTION public.guard_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n text;
BEGIN
 IF auth.uid() IS NULL THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' THEN
  NEW.user_id := auth.uid(); NEW.status := 'published';
  IF NOT public.review_eligible(NEW.kind, COALESCE(NEW.book_id, NEW.sub_service_id)) THEN
   RAISE EXCEPTION 'Only verified customers can review this item';
  END IF;
  SELECT COALESCE(NULLIF(trim(full_name),''),'CSLC guest') INTO n FROM profiles WHERE id=auth.uid();
  NEW.author_name := COALESCE(n,'CSLC guest');
  PERFORM public.notify('staff',NULL,'New review',NEW.rating || '★ review submitted','/admin?view=reviews');
  RETURN NEW;
 END IF;
 IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.kind IS DISTINCT FROM OLD.kind OR NEW.book_id IS DISTINCT FROM OLD.book_id OR NEW.sub_service_id IS DISTINCT FROM OLD.sub_service_id OR NEW.author_name IS DISTINCT FROM OLD.author_name THEN
  RAISE EXCEPTION 'Review target cannot change';
 END IF;
 IF NOT public.has_role(auth.uid(),'super_admin') THEN NEW.status := OLD.status; END IF;
 NEW.updated_at := now();
 RETURN NEW;
END $$;
CREATE TRIGGER guard_review BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.guard_review();

-- Live chat
CREATE TABLE public.chat_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 token uuid NOT NULL DEFAULT gen_random_uuid(),
 name text NOT NULL, phone text NOT NULL, email text NOT NULL,
 status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
 last_message_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.chat_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
 sender text NOT NULL CHECK (sender IN ('visitor','staff')),
 body text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_session ON public.chat_messages(session_id, created_at);
GRANT SELECT, UPDATE ON public.chat_sessions TO authenticated;
GRANT SELECT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_sessions, public.chat_messages TO service_role;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read chats" ON public.chat_sessions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update chats" ON public.chat_sessions FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff read chat messages" ON public.chat_messages FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.chat_start(_name text, _phone text, _email text, _message text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s chat_sessions;
BEGIN
 IF length(trim(coalesce(_name,''))) NOT BETWEEN 2 AND 120 THEN RAISE EXCEPTION 'Enter your name'; END IF;
 IF coalesce(_phone,'') !~ '^(\+?254|0)[17][0-9]{8}$' THEN RAISE EXCEPTION 'Enter a valid Kenyan phone number'; END IF;
 IF coalesce(_email,'') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(_email)>200 THEN RAISE EXCEPTION 'Enter a valid email address'; END IF;
 IF length(trim(coalesce(_message,''))) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Enter a message'; END IF;
 IF (SELECT count(*) FROM chat_sessions WHERE lower(email)=lower(trim(_email)) AND created_at>now()-interval '10 minutes')>=3 THEN RAISE EXCEPTION 'Too many chats started. Please wait a few minutes.'; END IF;
 INSERT INTO chat_sessions(name,phone,email) VALUES(left(trim(_name),120),_phone,lower(trim(_email))) RETURNING * INTO s;
 INSERT INTO chat_messages(session_id,sender,body) VALUES(s.id,'visitor',trim(_message));
 PERFORM public.notify('staff',NULL,'New live chat',left(trim(_name),60) || ': ' || left(trim(_message),80),'/admin?view=support');
 RETURN jsonb_build_object('id',s.id,'token',s.token);
END $$;

CREATE OR REPLACE FUNCTION public.chat_send(_id uuid, _token uuid, _body text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM chat_sessions WHERE id=_id AND token=_token) THEN RAISE EXCEPTION 'Chat not found'; END IF;
 IF length(trim(coalesce(_body,''))) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Enter a message'; END IF;
 IF (SELECT count(*) FROM chat_messages WHERE session_id=_id AND created_at>now()-interval '1 minute')>=20 THEN RAISE EXCEPTION 'Slow down a little'; END IF;
 INSERT INTO chat_messages(session_id,sender,body) VALUES(_id,'visitor',trim(_body));
 UPDATE chat_sessions SET last_message_at=now(), status=CASE WHEN status='resolved' THEN 'open' ELSE status END WHERE id=_id;
END $$;

CREATE OR REPLACE FUNCTION public.chat_thread(_id uuid, _token uuid)
RETURNS TABLE(id uuid, sender text, body text, created_at timestamptz, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
 SELECT m.id, m.sender, m.body, m.created_at, s.status FROM chat_messages m JOIN chat_sessions s ON s.id=m.session_id
 WHERE s.id=_id AND s.token=_token ORDER BY m.created_at
$$;

CREATE OR REPLACE FUNCTION public.chat_reply(_id uuid, _body text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff only'; END IF;
 IF length(trim(coalesce(_body,''))) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Enter a reply'; END IF;
 INSERT INTO chat_messages(session_id,sender,body) VALUES(_id,'staff',trim(_body));
 UPDATE chat_sessions SET last_message_at=now(), status=CASE WHEN status='open' THEN 'in_progress' ELSE status END WHERE id=_id;
END $$;

-- Data-free doorbell on a topic named by the secret session token
CREATE OR REPLACE FUNCTION public.chat_doorbell()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE t uuid;
BEGIN
 SELECT token INTO t FROM chat_sessions WHERE id=NEW.session_id;
 PERFORM realtime.send('{}'::jsonb, 'new', 'chat-' || t::text, false);
 RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END $$;
CREATE TRIGGER chat_doorbell AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.chat_doorbell();

REVOKE EXECUTE ON FUNCTION public.chat_reply(uuid,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.chat_start(text,text,text,text), public.chat_send(uuid,uuid,text), public.chat_thread(uuid,uuid) TO anon, authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages, public.chat_sessions;