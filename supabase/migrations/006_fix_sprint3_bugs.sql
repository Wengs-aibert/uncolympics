-- Migration 006: Fix Sprint 3 bugs
-- BUG-008: game_types missing created_at column (ORDER BY fails)
-- BUG-009: No unique constraint on (tournament_id, game_type_id) in games
-- BUG-010: Realtime replica identity for games table

-- ============================================================
-- FIX 8: Add created_at to game_types
-- fetchAvailableGames() orders by created_at
-- ============================================================

ALTER TABLE game_types ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ============================================================
-- FIX 9: Add unique constraint to prevent duplicate game picks
-- App-level validates this, but DB should enforce it too
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_game_per_tournament
    ON games(tournament_id, game_type_id);

-- ============================================================
-- FIX 10: Set replica identity to FULL for games table
-- Ensures realtime change events include all columns
-- (default 'd' only sends primary key on UPDATE/DELETE)
-- ============================================================

ALTER TABLE games REPLICA IDENTITY FULL;

-- ============================================================
-- FIX 11: Add DELETE policy for games (referee only)
-- Needed for cleanup and game management
-- ============================================================

CREATE POLICY "Referee can delete games" ON games
    FOR DELETE USING (
        tournament_id IN (
            SELECT players.tournament_id FROM players
            WHERE players.device_id = current_setting('request.headers', true)::json->>'x-device-id'
            AND players.role = 'referee'
        )
    );
