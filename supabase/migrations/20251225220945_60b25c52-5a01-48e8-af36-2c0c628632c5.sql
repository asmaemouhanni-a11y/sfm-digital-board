-- Add new columns to smart_alerts for better alert management
ALTER TABLE public.smart_alerts 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.sfm_categories(id),
ADD COLUMN IF NOT EXISTS related_type TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_smart_alerts_is_read ON public.smart_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_smart_alerts_created_at ON public.smart_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_alerts_severity ON public.smart_alerts(severity);

-- Allow managers to update alerts (mark as read)
DROP POLICY IF EXISTS "Managers can update alerts" ON public.smart_alerts;
CREATE POLICY "Managers can update alerts" 
ON public.smart_alerts 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Allow managers to delete alerts
DROP POLICY IF EXISTS "Managers can delete alerts" ON public.smart_alerts;
CREATE POLICY "Managers can delete alerts" 
ON public.smart_alerts 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));