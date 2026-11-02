CREATE OR REPLACE FUNCTION public.paystack_quote(_uid uuid,_kind text,_payload jsonb) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE total numeric; b record; item jsonb; qty integer; sold integer;
BEGIN
 IF _uid IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
 IF coalesce(_payload->>'phone','') !~ '^(\+?254|0)[17][0-9]{8}$' THEN RAISE EXCEPTION 'Enter a valid Kenyan phone number'; END IF;
 IF _kind='booking' THEN
  SELECT * INTO b FROM bookings WHERE id=(_payload->>'id')::uuid AND user_id=_uid FOR UPDATE;
  IF NOT FOUND OR b.status<>'pending' OR b.payment_status='paid' THEN RAISE EXCEPTION 'Booking cannot be paid'; END IF;
  IF EXISTS(SELECT 1 FROM bookings o WHERE o.sub_service_id=b.sub_service_id AND o.id<>b.id AND o.status='confirmed' AND o.payment_status='paid' AND o.start_date<=b.end_date AND o.end_date>=b.start_date) THEN RAISE EXCEPTION 'Dates are no longer available'; END IF;
  total:=b.total_amount;
 ELSIF _kind='bookshop' THEN
  IF coalesce(_payload->>'branch','') NOT IN ('yaya','kisumu') THEN RAISE EXCEPTION 'Choose a branch'; END IF;
  IF jsonb_typeof(_payload->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(_payload->'items') NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid cart'; END IF;
  IF (SELECT count(DISTINCT x->>'book_id') FROM jsonb_array_elements(_payload->'items') x)<>jsonb_array_length(_payload->'items') THEN RAISE EXCEPTION 'Duplicate books'; END IF;
  total:=0;
  FOR item IN SELECT x FROM jsonb_array_elements(_payload->'items') x ORDER BY x->>'book_id' LOOP
   qty:=(item->>'quantity')::integer;
   IF qty IS NULL OR qty NOT BETWEEN 1 AND 99 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
   SELECT bk.price,s.quantity,s.is_available INTO b FROM books bk JOIN bookshop_stock s ON s.book_id=bk.id WHERE bk.id=(item->>'book_id')::uuid AND bk.is_published AND s.branch=_payload->>'branch' FOR UPDATE OF bk,s;
   IF NOT FOUND OR NOT b.is_available OR b.quantity<qty THEN RAISE EXCEPTION 'Stock has changed; review your cart'; END IF;
   total:=total+b.price*qty;
  END LOOP;
 ELSIF _kind='event' THEN
  SELECT * INTO b FROM events WHERE id=(_payload->>'id')::uuid AND is_published AND event_date>=current_date FOR UPDATE;
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