-- Migration 010: Add dice_roll_data to tournaments for first-pick determination
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS dice_roll_data jsonb DEFAULT null;
COMMENT ON COLUMN tournaments.dice_roll_data IS 'Stores dice roll state: {picks: {teamId: number}, target: number, winnerId: string, round: number}';
