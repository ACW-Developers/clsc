ALTER TABLE public.payment_sessions ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'paystack' CHECK (provider IN ('paystack','mpesa'));
ALTER TABLE public.payment_sessions ADD COLUMN IF NOT EXISTS checkout_request_id text UNIQUE;
ALTER TABLE public.payment_sessions ADD COLUMN IF NOT EXISTS callback_token text;
ALTER TABLE public.payment_sessions ADD COLUMN IF NOT EXISTS provider_receipt text;
ALTER TABLE public.payment_sessions ADD COLUMN IF NOT EXISTS failure_reason text;
ALTER TABLE public.payment_sessions DROP CONSTRAINT payment_sessions_status_check;
ALTER TABLE public.payment_sessions ADD CONSTRAINT payment_sessions_status_check CHECK (status IN ('pending','completed','review','failed'));

CREATE OR REPLACE FUNCTION public.finalize_paystack(_reference text, _amount bigint, _currency text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE p public.payment_sessions; rid uuid; current_amount bigint; orderid uuid; m text; ref text;
BEGIN
 SELECT * INTO p FROM payment_sessions WHERE reference=_reference FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
 IF p.amount_minor<>_amount OR p.currency<>_currency THEN RAISE EXCEPTION 'Payment amount or currency mismatch'; END IF;
 IF p.status='completed' THEN RETURN jsonb_build_object('kind',p.kind,'id',p.result_id,'status',p.status); END IF;
 m := CASE WHEN p.provider='mpesa' THEN 'M-Pesa (Sandbox)' ELSE 'Paystack (Test)' END;
 ref := COALESCE(p.provider_receipt, p.reference);
 BEGIN
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',p.user_id,'role','service_role')::text,true);
  PERFORM set_config('request.jwt.claim.sub',p.user_id::text,true);
  current_amount:=public.paystack_quote(p.user_id,p.kind,p.payload);
  IF current_amount<>p.amount_minor THEN RAISE EXCEPTION 'Price changed'; END IF;
  IF p.kind='booking' THEN
   rid:=public.simulate_payment((p.payload->>'id')::uuid,p.payload->>'phone',true);
   UPDATE receipts SET reference=ref,method=m WHERE id=rid;
  ELSIF p.kind='bookshop' THEN
   rid:=public.bookshop_checkout(p.payload->>'branch',p.payload->'items',p.payload->>'phone',true,p.id);
   UPDATE bookshop_receipts SET reference=ref,method=m WHERE id=rid;
  ELSIF p.kind='event' THEN
   rid:=public.buy_event_ticket((p.payload->>'id')::uuid,(p.payload->>'quantity')::integer,p.payload->>'attendee',p.payload->>'phone',true);
   UPDATE event_tickets SET reference=ref,method=m WHERE id=rid;
  ELSE
   rid:=public.simulate_donation(p.payload->>'name',p.payload->>'email',p.payload->>'phone',(p.payload->>'amount')::numeric,p.payload->>'message',true);
   UPDATE donations SET reference=ref,method=m WHERE id=rid;
  END IF;
  IF rid IS NULL THEN RAISE EXCEPTION 'Receipt not issued'; END IF;
  UPDATE payment_sessions SET status='completed',result_id=rid WHERE id=p.id;
 EXCEPTION WHEN OTHERS THEN
  UPDATE payment_sessions SET status='review' WHERE id=p.id;
  RETURN jsonb_build_object('kind',p.kind,'status','review');
 END;
 RETURN jsonb_build_object('kind',p.kind,'id',rid,'status','completed');
END $function$;
REVOKE EXECUTE ON FUNCTION public.finalize_paystack(text,bigint,text) FROM PUBLIC, anon, authenticated;