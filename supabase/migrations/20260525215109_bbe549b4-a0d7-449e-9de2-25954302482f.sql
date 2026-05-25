
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status = 'Resolved' AND OLD.status IS DISTINCT FROM 'Resolved' THEN
    NEW.resolved_at = now();
  END IF;
  RETURN NEW;
END;
$$;
