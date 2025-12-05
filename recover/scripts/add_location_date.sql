-- Migration: add location (text) and date (timestamptz) to items table
-- Run this in Supabase SQL editor or psql connected to your database

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ;

-- If your table is named differently (e.g., publications), change `items` accordingly.
