-- Add status column to profiles for pending user validation
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Update existing profiles to be approved
UPDATE public.profiles SET status = 'approved' WHERE status = 'pending';

-- Add requires_validation column to actions for team leader validation flow
ALTER TABLE public.actions 
ADD COLUMN IF NOT EXISTS requires_validation boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS validated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS validated_by uuid;

-- Update handle_new_user function to set status as pending
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, status)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Utilisateur'), NEW.email, 'pending');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'operator'));
  
  RETURN NEW;
END;
$$;

-- RLS policy for admins to see pending profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Allow admins to update any profile (for approval)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));