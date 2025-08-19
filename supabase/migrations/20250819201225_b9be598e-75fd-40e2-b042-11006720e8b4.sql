-- Fix admin_settings table to handle duplicates properly
-- First delete any duplicates that might exist
DELETE FROM admin_settings 
WHERE id NOT IN (
    SELECT DISTINCT ON (setting_key) id 
    FROM admin_settings 
    ORDER BY setting_key, created_at DESC
);

-- Add url field to products table for product links
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;

-- Update existing products to have default values
UPDATE public.products 
SET is_free = false 
WHERE is_free IS NULL;