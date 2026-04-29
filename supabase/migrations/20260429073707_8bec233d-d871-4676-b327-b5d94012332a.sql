CREATE TABLE public.saved_outfits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  outfit_data JSONB NOT NULL,
  worn_on DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_outfits ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_saved_outfits_user_id ON public.saved_outfits(user_id);
CREATE INDEX idx_saved_outfits_user_created ON public.saved_outfits(user_id, created_at DESC);

CREATE TRIGGER update_saved_outfits_updated_at
BEFORE UPDATE ON public.saved_outfits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view their own saved outfits"
ON public.saved_outfits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved outfits"
ON public.saved_outfits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved outfits"
ON public.saved_outfits
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved outfits"
ON public.saved_outfits
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);