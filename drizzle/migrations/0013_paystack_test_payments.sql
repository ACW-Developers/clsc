CREATE TABLE public.payment_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, kind text NOT NULL CHECK(kind IN ('booking','bookshop','event','donation')), reference text NOT NULL UNIQUE, payload jsonb NOT NULL, amount_minor bigint NOT NULL CHECK(amount_minor>0), currency text NOT NULL DEFAULT 'KES', status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed','review')), result_id uuid, authorization_url text, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_sessions TO authenticated;
GRANT ALL ON public.payment_sessions TO service_role;
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_owner_read ON public.payment_sessions FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.is_staff(auth.uid()));
CREATE INDEX payment_sessions_user ON public.payment_sessions(user_id,created_at);
REVOKE EXECUTE ON FUNCTION public.simulate_payment(uuid,text,boolean) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.bookshop_checkout(text,jsonb,text,boolean,uuid) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.buy_event_ticket(uuid,integer,text,text,boolean) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.simulate_donation(text,text,text,numeric,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.simulate_payment(uuid,text,boolean), public.bookshop_checkout(text,jsonb,text,boolean,uuid), public.buy_event_ticket(uuid,integer,text,text,boolean), public.simulate_donation(text,text,text,numeric,text,boolean) TO service_role;
CREATE OR REPLACE FUNCTION public.paystack_quote(_uid uuid,_kind text,_payload jsonb) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE total numeric; b record; item jsonb; qty integer; sold integer;
BEGIN
 IF _uid IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
 IF coalesce(_payload->>'phone','') !~ '^(\+?254|0)[17][0-9]{8}$' THEN RAISE EXCEPTION 'Enter a valid Kenyan phone number'; END IF;
 IF _kind='booking' THEN
  SELECT * INTO b FROM bookings WHERE id=(_payload->>'id')::uuid AND user_id=_uid;
  IF NOT FOUND OR b.status<>'pending' OR b.payment_status='paid' THEN RAISE EXCEPTION 'Booking cannot be paid'; END IF;
  IF EXISTS(SELECT 1 FROM bookings o WHERE o.sub_service_id=b.sub_service_id AND o.id<>b.id AND o.status='confirmed' AND o.payment_status='paid' AND o.start_date<=b.end_date AND o.end_date>=b.start_date) THEN RAISE EXCEPTION 'Dates are no longer available'; END IF;
  total:=b.total_amount;
 ELSIF _kind='bookshop' THEN
  IF coalesce(_payload->>'branch','') NOT IN ('yaya','kisumu') THEN RAISE EXCEPTION 'Choose a branch'; END IF;
  IF jsonb_typeof(_payload->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(_payload->'items') NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid cart'; END IF;
  IF (SELECT count(DISTINCT x->>'book_id') FROM jsonb_array_elements(_payload->'items') x)<>jsonb_array_length(_payload->'items') THEN RAISE EXCEPTION 'Duplicate books'; END IF;
  total:=0;
  FOR item IN SELECT x FROM jsonb_array_elements(_payload->'items') x LOOP
   qty:=(item->>'quantity')::integer;
   IF qty IS NULL OR qty NOT BETWEEN 1 AND 99 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
   SELECT bk.price,s.quantity,s.is_available INTO b FROM books bk JOIN bookshop_stock s ON s.book_id=bk.id WHERE bk.id=(item->>'book_id')::uuid AND bk.is_published AND s.branch=_payload->>'branch';
   IF NOT FOUND OR NOT b.is_available OR b.quantity<qty THEN RAISE EXCEPTION 'Stock has changed; review your cart'; END IF;
   total:=total+b.price*qty;
  END LOOP;
 ELSIF _kind='event' THEN
  SELECT * INTO b FROM events WHERE id=(_payload->>'id')::uuid AND is_published AND event_date>=current_date;
  IF NOT FOUND THEN RAISE EXCEPTION 'Event unavailable'; END IF;
  qty:=(_payload->>'quantity')::integer;
  IF qty IS NULL OR qty NOT BETWEEN 1 AND 10 OR length(trim(coalesce(_payload->>'attendee','')))<2 THEN RAISE EXCEPTION 'Invalid attendee or ticket quantity'; END IF;
  SELECT coalesce(sum(quantity),0) INTO sold FROM event_tickets WHERE event_id=b.id;
  IF b.capacity IS NOT NULL AND sold+qty>b.capacity THEN RAISE EXCEPTION 'Not enough tickets available'; END IF;
  total:=b.ticket_price*qty;
 ELSIF _kind='donation' THEN
  total:=(_payload->>'amount')::numeric;
  IF total IS NULL OR total NOT BETWEEN 10 AND 1000000 OR length(trim(coalesce(_payload->>'name','')))<2 OR coalesce(_payload->>'email','') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'Invalid donation details'; END IF;
 ELSE RAISE EXCEPTION 'Invalid payment type'; END IF;
 IF total IS NULL OR total<=0 THEN RAISE EXCEPTION 'A positive price is required for Paystack checkout'; END IF;
 RETURN round(total*100)::bigint;
END $$;
REVOKE ALL ON FUNCTION public.paystack_quote(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.paystack_quote(uuid,text,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.finalize_paystack(_reference text,_amount bigint,_currency text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.payment_sessions; rid uuid; current_amount bigint; orderid uuid;
BEGIN
 SELECT * INTO p FROM payment_sessions WHERE reference=_reference FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
 IF p.amount_minor<>_amount OR p.currency<>_currency THEN RAISE EXCEPTION 'Payment amount or currency mismatch'; END IF;
 IF p.status='completed' THEN RETURN jsonb_build_object('kind',p.kind,'id',p.result_id,'status',p.status); END IF;
 BEGIN
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',p.user_id,'role','service_role')::text,true);
  PERFORM set_config('request.jwt.claim.sub',p.user_id::text,true);
  current_amount:=public.paystack_quote(p.user_id,p.kind,p.payload);
  IF current_amount<>p.amount_minor THEN RAISE EXCEPTION 'Price changed'; END IF;
  IF p.kind='booking' THEN
   rid:=public.simulate_payment((p.payload->>'id')::uuid,p.payload->>'phone',true);
   UPDATE receipts SET reference=p.reference,method='Paystack (Test)' WHERE id=rid;
  ELSIF p.kind='bookshop' THEN
   rid:=public.bookshop_checkout(p.payload->>'branch',p.payload->'items',p.payload->>'phone',true,p.id);
   SELECT order_id INTO orderid FROM bookshop_receipts WHERE id=rid;
   UPDATE bookshop_receipts SET reference=p.reference,method='Paystack (Test)' WHERE id=rid;
  ELSIF p.kind='event' THEN
   rid:=public.buy_event_ticket((p.payload->>'id')::uuid,(p.payload->>'quantity')::integer,p.payload->>'attendee',p.payload->>'phone',true);
   UPDATE event_tickets SET reference=p.reference,method='Paystack (Test)' WHERE id=rid;
  ELSE
   rid:=public.simulate_donation(p.payload->>'name',p.payload->>'email',p.payload->>'phone',(p.payload->>'amount')::numeric,p.payload->>'message',true);
   UPDATE donations SET reference=p.reference,method='Paystack (Test)' WHERE id=rid;
  END IF;
  IF rid IS NULL THEN RAISE EXCEPTION 'Receipt not issued'; END IF;
  UPDATE payment_sessions SET status='completed',result_id=rid WHERE id=p.id;
 EXCEPTION WHEN OTHERS THEN
  UPDATE payment_sessions SET status='review' WHERE id=p.id;
  RETURN jsonb_build_object('kind',p.kind,'status','review');
 END;
 RETURN jsonb_build_object('kind',p.kind,'id',rid,'status','completed');
END $$;
REVOKE ALL ON FUNCTION public.finalize_paystack(text,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_paystack(text,bigint,text) TO service_role;