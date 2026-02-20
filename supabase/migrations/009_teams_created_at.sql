-- Migration 009: Add explicit created_at to teams table
-- Code sorts by created_at — make it explicit instead of relying on Supabase default

ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
