-- Drop the existing foreign key constraint
ALTER TABLE public.smart_alerts 
DROP CONSTRAINT IF EXISTS smart_alerts_category_id_fkey;

-- Add the foreign key constraint with ON DELETE CASCADE
ALTER TABLE public.smart_alerts 
ADD CONSTRAINT smart_alerts_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES public.sfm_categories(id) 
ON DELETE CASCADE;