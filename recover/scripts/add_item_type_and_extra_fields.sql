-- Migration: add item_type and extra_fields to items table
-- Run this in Supabase SQL editor or psql connected to your database

-- Add item_type column (to store the type: animal, document, object, electronics, jewelry, clothing)
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS item_type VARCHAR(50);

-- Add extra_fields column (JSONB to store additional fields based on item type)
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS extra_fields JSONB DEFAULT '{}';

-- Example queries to view the new structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name='items' ORDER BY ordinal_position;

-- Optional: Add index for better query performance on item_type
CREATE INDEX IF NOT EXISTS idx_items_item_type ON items(item_type);
