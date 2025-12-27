-- Drop existing restrictive policies for categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.sfm_categories;

-- Create new policy allowing managers and admins to manage categories
CREATE POLICY "Managers and admins can manage categories" 
ON public.sfm_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));