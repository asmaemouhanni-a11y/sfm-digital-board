-- Add new columns to kpis table for thresholds and performance direction
ALTER TABLE public.kpis 
ADD COLUMN IF NOT EXISTS performance_direction text DEFAULT 'higher_is_better' CHECK (performance_direction IN ('higher_is_better', 'lower_is_better')),
ADD COLUMN IF NOT EXISTS warning_threshold numeric,
ADD COLUMN IF NOT EXISTS critical_threshold numeric,
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Add comment column to kpi_values table
ALTER TABLE public.kpi_values 
ADD COLUMN IF NOT EXISTS comment text;