
TRUNCATE TABLE public.incidents;

DROP TRIGGER IF EXISTS incidents_set_updated_at ON public.incidents;
CREATE TRIGGER incidents_set_updated_at
BEFORE UPDATE ON public.incidents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "Anyone can delete incidents" ON public.incidents;
CREATE POLICY "Anyone can delete incidents" ON public.incidents FOR DELETE USING (true);
