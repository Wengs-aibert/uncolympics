-- BUG-035: Add 'team_select' to tournaments.status CHECK constraint
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;
ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check
  CHECK (status IN ('lobby', 'team_select', 'picking', 'playing', 'scoring', 'completed'));
