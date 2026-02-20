-- Migration 004: Fix RLS chicken-and-egg + room_code uniqueness
-- Fixes: BUG-001 (referee_id never set), BUG-002 (status update blocked), BUG-003 (room_code reuse)

-- ============================================================
-- FIX 1: Replace tournament update RLS policy
-- Old policy required referee_id to already be set, but it's NULL on creation.
-- New policy: allow update if referee_id IS NULL (first setup) OR device matches referee.
-- ============================================================

DROP POLICY IF EXISTS "Only referee can update tournament" ON tournaments;

CREATE POLICY "Referee or creator can update tournament" ON tournaments
    FOR UPDATE USING (
        -- Allow the initial referee_id setup (tournament just created, referee_id still NULL)
        referee_id IS NULL
        OR
        -- After referee_id is set, only the referee's device can update
        referee_id IN (
            SELECT id FROM players 
            WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
        )
    );

-- ============================================================
-- FIX 2: Replace global UNIQUE on room_code with partial unique index
-- Old: UNIQUE(room_code) — blocks reuse even for completed tournaments
-- New: unique only among non-completed tournaments
-- ============================================================

ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_room_code_key;

CREATE UNIQUE INDEX idx_unique_active_room_code 
    ON tournaments(room_code) 
    WHERE status != 'completed';
