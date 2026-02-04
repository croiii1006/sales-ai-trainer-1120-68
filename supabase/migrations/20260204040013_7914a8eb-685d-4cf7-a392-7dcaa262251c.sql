-- Add classification fields to training_materials table
ALTER TABLE public.training_materials 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '通用',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT '初级',
ADD COLUMN IF NOT EXISTS position TEXT DEFAULT '通用';

-- Add an index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_training_materials_category ON public.training_materials(category);
CREATE INDEX IF NOT EXISTS idx_training_materials_difficulty ON public.training_materials(difficulty);
CREATE INDEX IF NOT EXISTS idx_training_materials_position ON public.training_materials(position);
CREATE INDEX IF NOT EXISTS idx_training_materials_tags ON public.training_materials USING GIN(tags);