CREATE OR REPLACE FUNCTION public.payment_doorbell()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Data-free signal on a topic named after the secret per-session reference; clients re-verify through the payment function.
  PERFORM realtime.send('{}'::jsonb, 'status', 'pay-' || NEW.reference, false);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.payment_doorbell() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS payment_sessions_doorbell ON public.payment_sessions;
CREATE TRIGGER payment_sessions_doorbell
AFTER UPDATE OF status ON public.payment_sessions
FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.payment_doorbell();

CREATE INDEX IF NOT EXISTS payment_sessions_user_pending_idx ON public.payment_sessions (user_id, kind, created_at DESC) WHERE status = 'pending';