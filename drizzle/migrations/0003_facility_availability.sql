CREATE OR REPLACE FUNCTION public.facility_booked_ranges(_sub_service_id uuid)
RETURNS TABLE(start_date date, end_date date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.start_date, b.end_date FROM public.bookings b
  WHERE b.sub_service_id = _sub_service_id AND b.status IN ('pending','confirmed') AND b.end_date >= current_date
  ORDER BY b.start_date
$$;
REVOKE ALL ON FUNCTION public.facility_booked_ranges(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.facility_booked_ranges(uuid) TO anon, authenticated;