-- Migration 009: Fix game_types INSERT RLS (BUG-017)
-- Problem: INSERT policy was (c): true — any device could create custom game types
-- Fix: Only referees of the tournament can create custom game types

DROP POLICY IF EXISTS "Anyone can create custom game types" ON game_types;

CREATE POLICY "Referee can create custom game types" ON game_types
  FOR INSERT WITH CHECK (
    tournament_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM players
      WHERE players.tournament_id = game_types.tournament_id
        AND players.device_id = current_setting('request.headers', true)::json->>'x-device-id'
        AND players.role = 'referee'
    )
  );

-- Also fix SELECT to scope custom games to tournament participants
DROP POLICY IF EXISTS "Anyone can read built-in game types" ON game_types;
CREATE POLICY "Anyone can read game types" ON game_types
  FOR SELECT USING (
    tournament_id IS NULL 
    OR tournament_id IN (
      SELECT tournament_id FROM players 
      WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
    )
  );
