-- Add foreign key for notes.created_by to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notes_created_by_fkey'
  ) THEN
    ALTER TABLE public.notes 
    ADD CONSTRAINT notes_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Allow users to delete their own notes
CREATE POLICY "Users can delete own notes" 
ON public.notes 
FOR DELETE 
USING (auth.uid() = created_by);

-- Allow managers and admins to delete any notes
CREATE POLICY "Managers can delete any notes" 
ON public.notes 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));