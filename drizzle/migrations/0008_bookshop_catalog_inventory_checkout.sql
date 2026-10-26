CREATE TABLE public.books (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200), author text NOT NULL DEFAULT '' CHECK(length(author)<=200), description text NOT NULL DEFAULT '' CHECK(length(description)<=5000), category text NOT NULL DEFAULT 'General' CHECK(length(category) BETWEEN 1 AND 80), isbn text NOT NULL DEFAULT '' CHECK(length(isbn)<=20), price numeric(12,2) NOT NULL DEFAULT 0 CHECK(price>0), image_url text NOT NULL DEFAULT '' CHECK(length(image_url)<=2048), rating numeric(2,1) CHECK(rating BETWEEN 0 AND 5), rating_count integer NOT NULL DEFAULT 0 CHECK(rating_count>=0), is_published boolean NOT NULL DEFAULT false, is_sample boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.books TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "books public read" ON public.books FOR SELECT TO anon, authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "books super manage" ON public.books FOR ALL TO authenticated USING(public.has_role(auth.uid(),'super_admin')) WITH CHECK(public.has_role(auth.uid(),'super_admin'));
CREATE TABLE public.bookshop_stock (
 book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE, branch text NOT NULL CHECK(branch IN ('yaya','kisumu')), quantity integer NOT NULL DEFAULT 0 CHECK(quantity>=0), low_stock_threshold integer NOT NULL DEFAULT 5 CHECK(low_stock_threshold>=0), is_available boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(book_id,branch)
);
GRANT SELECT ON public.bookshop_stock TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bookshop_stock TO authenticated;
GRANT ALL ON public.bookshop_stock TO service_role;
ALTER TABLE public.bookshop_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock public read" ON public.bookshop_stock FOR SELECT TO anon, authenticated USING(EXISTS(SELECT 1 FROM public.books b WHERE b.id=book_id AND (b.is_published OR public.is_staff(auth.uid()))));
CREATE POLICY "stock super manage" ON public.bookshop_stock FOR ALL TO authenticated USING(public.has_role(auth.uid(),'super_admin')) WITH CHECK(public.has_role(auth.uid(),'super_admin'));
ALTER TABLE public.orders ADD COLUMN branch text CHECK(branch IN ('yaya','kisumu')), ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','failed','paid')), ADD COLUMN request_id uuid UNIQUE;
CREATE TABLE public.bookshop_order_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES public.orders(id), book_id uuid NOT NULL REFERENCES public.books(id), title text NOT NULL, quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 99), unit_price numeric(12,2) NOT NULL CHECK(unit_price>0), UNIQUE(order_id,book_id)
);
GRANT SELECT ON public.bookshop_order_items TO authenticated;
GRANT ALL ON public.bookshop_order_items TO service_role;
ALTER TABLE public.bookshop_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items owner staff read" ON public.bookshop_order_items FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.orders o WHERE o.id=order_id AND (o.user_id=auth.uid() OR public.is_staff(auth.uid()))));
CREATE TABLE public.bookshop_receipts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id), user_id uuid NOT NULL, receipt_number text NOT NULL UNIQUE, branch text NOT NULL CHECK(branch IN ('yaya','kisumu')), amount numeric(12,2) NOT NULL CHECK(amount>0), phone text NOT NULL, reference text NOT NULL UNIQUE, method text NOT NULL DEFAULT 'Simulated M-Pesa (test only)', created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bookshop_receipts TO authenticated;
GRANT ALL ON public.bookshop_receipts TO service_role;
ALTER TABLE public.bookshop_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "book receipts owner staff read" ON public.bookshop_receipts FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.is_staff(auth.uid()));
CREATE INDEX bookshop_items_order ON public.bookshop_order_items(order_id);
CREATE INDEX bookshop_orders_branch ON public.orders(branch,created_at DESC);
CREATE FUNCTION public.guard_bookshop_order() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RETURN NEW; END IF;
 IF NOT public.is_staff(auth.uid()) OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.reference IS DISTINCT FROM OLD.reference OR NEW.description IS DISTINCT FROM OLD.description OR NEW.amount IS DISTINCT FROM OLD.amount OR NEW.branch IS DISTINCT FROM OLD.branch OR NEW.payment_status IS DISTINCT FROM OLD.payment_status OR NEW.request_id IS DISTINCT FROM OLD.request_id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'Only fulfilment status and internal notes can be changed'; END IF;
 IF OLD.branch IS NOT NULL AND OLD.payment_status='paid' AND NEW.status NOT IN ('processing','fulfilled') THEN RAISE EXCEPTION 'Paid bookshop orders can only be processing or fulfilled'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_bookshop_order BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.guard_bookshop_order();
CREATE FUNCTION public.save_bookshop_book(_book jsonb, _stock jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE bid uuid;
BEGIN
 IF NOT public.has_role(auth.uid(),'super_admin') THEN RAISE EXCEPTION 'Super administrator required'; END IF;
 IF jsonb_typeof(_stock)<>'array' OR jsonb_array_length(_stock)<>2 OR (SELECT count(DISTINCT x->>'branch') FROM jsonb_array_elements(_stock) x)<>2 THEN RAISE EXCEPTION 'Both branches are required'; END IF;
 bid := COALESCE(NULLIF(_book->>'id','')::uuid,gen_random_uuid());
 INSERT INTO public.books(id,title,author,description,category,isbn,price,image_url,rating,rating_count,is_published,is_sample) VALUES(bid,trim(_book->>'title'),trim(COALESCE(_book->>'author','')),COALESCE(_book->>'description',''),trim(_book->>'category'),COALESCE(_book->>'isbn',''),(_book->>'price')::numeric,COALESCE(_book->>'image_url',''),NULLIF(_book->>'rating','')::numeric,COALESCE((_book->>'rating_count')::integer,0),COALESCE((_book->>'is_published')::boolean,false),COALESCE((_book->>'is_sample')::boolean,false)) ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,author=EXCLUDED.author,description=EXCLUDED.description,category=EXCLUDED.category,isbn=EXCLUDED.isbn,price=EXCLUDED.price,image_url=EXCLUDED.image_url,rating=EXCLUDED.rating,rating_count=EXCLUDED.rating_count,is_published=EXCLUDED.is_published,is_sample=EXCLUDED.is_sample,updated_at=now();
 INSERT INTO public.bookshop_stock(book_id,branch,quantity,low_stock_threshold,is_available) SELECT bid,x->>'branch',(x->>'quantity')::integer,(x->>'low_stock_threshold')::integer,(x->>'is_available')::boolean FROM jsonb_array_elements(_stock) x ON CONFLICT(book_id,branch) DO UPDATE SET quantity=EXCLUDED.quantity,low_stock_threshold=EXCLUDED.low_stock_threshold,is_available=EXCLUDED.is_available,updated_at=now();
 RETURN bid;
END $$;
REVOKE ALL ON FUNCTION public.save_bookshop_book(jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_bookshop_book(jsonb,jsonb) TO authenticated;
CREATE FUNCTION public.bookshop_checkout(_branch text,_items jsonb,_phone text,_success boolean,_request_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); oid uuid; rid uuid; item jsonb; b record; qty integer; total numeric:=0; descr text:=''; existing record;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
 IF _branch NOT IN ('yaya','kisumu') OR _branch IS NULL THEN RAISE EXCEPTION 'Choose a bookshop branch'; END IF;
 IF _phone IS NULL OR _phone !~ '^(\+?254|0)[17][0-9]{8}$' THEN RAISE EXCEPTION 'Enter a valid Kenyan phone number'; END IF;
 IF _request_id IS NULL OR _success IS NULL THEN RAISE EXCEPTION 'Invalid checkout request'; END IF;
 IF jsonb_typeof(_items) IS DISTINCT FROM 'array' OR jsonb_array_length(_items) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Cart must contain 1 to 50 books'; END IF;
 IF (SELECT count(DISTINCT x->>'book_id') FROM jsonb_array_elements(_items) x)<>jsonb_array_length(_items) THEN RAISE EXCEPTION 'Duplicate cart books'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(_request_id::text));
 SELECT * INTO existing FROM public.orders WHERE request_id=_request_id;
 IF FOUND THEN
  IF existing.user_id<>uid THEN RAISE EXCEPTION 'Invalid checkout request'; END IF;
  SELECT id INTO rid FROM public.bookshop_receipts WHERE order_id=existing.id;
  RETURN rid;
 END IF;
 FOR item IN SELECT x FROM jsonb_array_elements(_items) x ORDER BY x->>'book_id' LOOP
  qty:=(item->>'quantity')::integer;
  IF qty IS NULL OR qty NOT BETWEEN 1 AND 99 THEN RAISE EXCEPTION 'Invalid book quantity'; END IF;
  SELECT bk.*,s.quantity AS stock,s.is_available INTO b FROM public.books bk JOIN public.bookshop_stock s ON s.book_id=bk.id AND s.branch=_branch WHERE bk.id=(item->>'book_id')::uuid AND bk.is_published FOR UPDATE OF bk,s;
  IF NOT FOUND OR NOT b.is_available OR b.stock<qty THEN RAISE EXCEPTION 'A book is no longer available in this quantity. Review your cart.'; END IF;
  total:=total+b.price*qty; descr:=descr || CASE WHEN descr='' THEN '' ELSE ', ' END || qty || ' × ' || b.title;
 END LOOP;
 INSERT INTO public.orders(user_id,reference,description,amount,status,branch,payment_status,request_id) VALUES(uid,'CSLC-B-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),descr,total,CASE WHEN _success THEN 'processing' ELSE 'pending' END,_branch,CASE WHEN _success THEN 'paid' ELSE 'failed' END,_request_id) RETURNING id INTO oid;
 FOR item IN SELECT x FROM jsonb_array_elements(_items) x LOOP
  qty:=(item->>'quantity')::integer;
  INSERT INTO public.bookshop_order_items(order_id,book_id,title,quantity,unit_price) SELECT oid,id,title,qty,price FROM public.books WHERE id=(item->>'book_id')::uuid;
  IF _success THEN UPDATE public.bookshop_stock SET quantity=quantity-qty,updated_at=now() WHERE book_id=(item->>'book_id')::uuid AND branch=_branch; END IF;
 END LOOP;
 IF _success THEN
  INSERT INTO public.bookshop_receipts(order_id,user_id,receipt_number,branch,amount,phone,reference) VALUES(oid,uid,'CSLC-BS-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),_branch,total,_phone,'SIM-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))) RETURNING id INTO rid;
  PERFORM public.notify('staff',NULL,'New bookshop order','A paid simulated bookshop order was placed.','/admin?view=orders');
  PERFORM public.notify('user',uid,'Bookshop receipt ready','Your simulated bookshop payment succeeded.','/account?view=receipts');
 END IF;
 RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.bookshop_checkout(text,jsonb,text,boolean,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bookshop_checkout(text,jsonb,text,boolean,uuid) TO authenticated;
CREATE TRIGGER books_updated BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();