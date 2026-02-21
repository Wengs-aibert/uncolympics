-- BUG-036: Referee can't assign random leaders (RLS blocks updating other players' is_leader)
-- The "Players can update themselves" policy only allows device_id match.
-- Referee needs to update is_leader on ALL players in their tournament.

-- Replace the player update policy to also allow referee updates
DROP POLICY IF EXISTS "Players can update themselves" ON players;

CREATE POLICY "Players can update themselves or referee can update" ON players
    FOR UPDATE USING (
        -- Player can update their own row
        device_id = current_setting('request.headers', true)::json->>'x-device-id'
        OR
        -- Referee can update any player in their tournament
        tournament_id IN (
            SELECT t.id FROM tournaments t
            JOIN players p ON t.referee_id = p.id
            WHERE p.device_id = current_setting('request.headers', true)::json->>'x-device-id'
        )
    );
