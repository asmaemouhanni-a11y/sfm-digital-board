-- Add DELETE policy for profiles table so admins can delete users
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add DELETE policy for user_roles table
CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for smart_alerts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.smart_alerts;