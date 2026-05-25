
CREATE TYPE public.emergency_type AS ENUM ('Flood','Fire','Medical','Structural Damage','Other');
CREATE TYPE public.severity_level AS ENUM ('Critical','High','Medium','Low');
CREATE TYPE public.incident_status AS ENUM ('Active','Responding','Resolved');

CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_name text NOT NULL,
  emergency_type public.emergency_type NOT NULL,
  severity public.severity_level NOT NULL,
  status public.incident_status NOT NULL DEFAULT 'Active',
  description text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  photo_base64 text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incidents_created_at ON public.incidents(created_at DESC);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Public emergency reporting platform: anyone can submit and view incidents
CREATE POLICY "Anyone can view incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Anyone can submit incidents" ON public.incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update incident status" ON public.incidents FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status = 'Resolved' AND OLD.status IS DISTINCT FROM 'Resolved' THEN
    NEW.resolved_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_incidents_updated_at
BEFORE UPDATE ON public.incidents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;

-- Seed: 8 realistic incidents across San Francisco
INSERT INTO public.incidents (reporter_name, emergency_type, severity, status, description, latitude, longitude, created_at) VALUES
('Maria Chen','Fire','Critical','Active','Three-story apartment building fire on the corner. Heavy smoke visible from blocks away. Multiple residents trapped on upper floors.',37.7849,-122.4094,now() - interval '8 minutes'),
('James Rodriguez','Medical','High','Responding','Elderly man collapsed at bus stop. Unresponsive, weak pulse. Bystanders performing CPR.',37.7649,-122.4294,now() - interval '14 minutes'),
('Aisha Patel','Flood','High','Active','Burst water main flooding intersection. Water rising rapidly, two vehicles already stranded.',37.7949,-122.3994,now() - interval '22 minutes'),
('Tom Walker','Structural Damage','Critical','Active','Partial roof collapse at warehouse. Workers possibly inside. Structure looks unstable.',37.7549,-122.4194,now() - interval '31 minutes'),
('Sarah Kim','Medical','Medium','Responding','Cyclist struck by vehicle. Conscious but bleeding heavily from leg laceration.',37.7749,-122.4394,now() - interval '46 minutes'),
('Daniel Okafor','Fire','Medium','Resolved','Small kitchen fire contained by occupants before arrival. Smoke ventilation in progress.',37.7449,-122.4094,now() - interval '2 hours'),
('Elena Vasquez','Other','Low','Resolved','Suspicious package report. Bomb squad cleared scene. Item was abandoned luggage.',37.7849,-122.4294,now() - interval '3 hours'),
('Marcus Johnson','Flood','Medium','Active','Storm drain overflow flooding basement units in apartment complex. Residents evacuating.',37.7649,-122.4094,now() - interval '52 minutes');

UPDATE public.incidents SET resolved_at = updated_at WHERE status = 'Resolved';
