-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Anyone can view app settings" ON public.app_settings;

-- Create a new policy that only allows authenticated users to view app settings
CREATE POLICY "Authenticated users can view app settings" 
ON public.app_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);