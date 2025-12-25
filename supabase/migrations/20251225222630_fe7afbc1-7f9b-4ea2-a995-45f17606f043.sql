-- Add title and is_pinned columns to notes table
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- Add index for pinned notes
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON public.notes(is_pinned DESC, created_at DESC);