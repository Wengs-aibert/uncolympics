-- Migration 007: Add unique constraint for player stats upserts
-- Sprint 4: Game Play functionality requires upsert capability for player stats

ALTER TABLE player_stats ADD CONSTRAINT unique_player_stat UNIQUE (game_id, player_id, stat_key);