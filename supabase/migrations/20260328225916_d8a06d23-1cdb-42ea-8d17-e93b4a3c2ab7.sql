CREATE TABLE public.paintings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  date TEXT,
  painting_overview TEXT,
  figures JSONB,
  image_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.paintings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read paintings" ON public.paintings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert paintings" ON public.paintings FOR INSERT WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('paintings', 'paintings', true);

CREATE POLICY "Anyone can upload paintings" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'paintings');
CREATE POLICY "Anyone can read paintings storage" ON storage.objects FOR SELECT USING (bucket_id = 'paintings');