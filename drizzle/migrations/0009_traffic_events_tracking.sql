CREATE TABLE public.traffic_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 session_id uuid NOT NULL,
 event_type text NOT NULL CHECK (event_type IN ('visit','click')),
 path text NOT NULL CHECK (length(path) BETWEEN 1 AND 200 AND path LIKE '/%'),
 device text NOT NULL CHECK (device IN ('Desktop','Mobile','Tablet')),
 os text NOT NULL CHECK (os IN ('Windows','macOS','iOS','Android','Linux','Other')),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.traffic_events TO authenticated;
GRANT ALL ON public.traffic_events TO service_role;
ALTER TABLE public.traffic_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff reads traffic" ON public.traffic_events FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE INDEX traffic_events_created_idx ON public.traffic_events(created_at DESC);
CREATE INDEX traffic_events_session_idx ON public.traffic_events(session_id,created_at DESC);
CREATE OR REPLACE FUNCTION public.track_traffic(_session_id uuid, _event_type text, _path text, _device text, _os text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF _session_id IS NULL OR _event_type NOT IN ('visit','click') OR _event_type IS NULL OR _path IS NULL OR length(_path) NOT BETWEEN 1 AND 200 OR _path NOT LIKE '/%' OR _path LIKE '%?%' OR _path LIKE '%#%' OR _device IS NULL OR _device NOT IN ('Desktop','Mobile','Tablet') OR _os IS NULL OR _os NOT IN ('Windows','macOS','iOS','Android','Linux','Other') THEN RAISE EXCEPTION 'Invalid traffic event'; END IF;
 IF (SELECT count(*) FROM public.traffic_events WHERE session_id=_session_id AND created_at>now()-interval '1 minute') >= 60 THEN RETURN; END IF;
 INSERT INTO public.traffic_events(session_id,event_type,path,device,os) VALUES(_session_id,_event_type,_path,_device,_os);
END $$;
REVOKE ALL ON FUNCTION public.track_traffic(uuid,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_traffic(uuid,text,text,text,text) TO anon,authenticated;