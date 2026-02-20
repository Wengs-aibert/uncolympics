-- Migration 008: Add ON DELETE CASCADE to all foreign keys
-- Prevents orphaned data when a tournament is deleted

-- Drop existing FK constraints and re-add with CASCADE

-- tournaments
ALTER TABLE tournaments DROP CONSTRAINT fk_tournaments_referee;
ALTER TABLE tournaments ADD CONSTRAINT fk_tournaments_referee
    FOREIGN KEY (referee_id) REFERENCES players(id) ON DELETE SET NULL;

ALTER TABLE tournaments DROP CONSTRAINT fk_tournaments_current_pick_team;
ALTER TABLE tournaments ADD CONSTRAINT fk_tournaments_current_pick_team
    FOREIGN KEY (current_pick_team) REFERENCES teams(id) ON DELETE SET NULL;

-- players
ALTER TABLE players DROP CONSTRAINT fk_players_tournament;
ALTER TABLE players ADD CONSTRAINT fk_players_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

ALTER TABLE players DROP CONSTRAINT fk_players_team;
ALTER TABLE players ADD CONSTRAINT fk_players_team
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- teams
ALTER TABLE teams DROP CONSTRAINT fk_teams_tournament;
ALTER TABLE teams ADD CONSTRAINT fk_teams_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

-- game_types
ALTER TABLE game_types DROP CONSTRAINT fk_game_types_tournament;
ALTER TABLE game_types ADD CONSTRAINT fk_game_types_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

-- games
ALTER TABLE games DROP CONSTRAINT fk_games_tournament;
ALTER TABLE games ADD CONSTRAINT fk_games_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

ALTER TABLE games DROP CONSTRAINT fk_games_game_type;
ALTER TABLE games ADD CONSTRAINT fk_games_game_type
    FOREIGN KEY (game_type_id) REFERENCES game_types(id) ON DELETE CASCADE;

ALTER TABLE games DROP CONSTRAINT fk_games_picked_by_team;
ALTER TABLE games ADD CONSTRAINT fk_games_picked_by_team
    FOREIGN KEY (picked_by_team) REFERENCES teams(id) ON DELETE SET NULL;

-- player_stats
ALTER TABLE player_stats DROP CONSTRAINT fk_player_stats_game;
ALTER TABLE player_stats ADD CONSTRAINT fk_player_stats_game
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;

ALTER TABLE player_stats DROP CONSTRAINT fk_player_stats_player;
ALTER TABLE player_stats ADD CONSTRAINT fk_player_stats_player
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;

-- game_results
ALTER TABLE game_results DROP CONSTRAINT fk_game_results_game;
ALTER TABLE game_results ADD CONSTRAINT fk_game_results_game
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;

ALTER TABLE game_results DROP CONSTRAINT fk_game_results_winning_team;
ALTER TABLE game_results ADD CONSTRAINT fk_game_results_winning_team
    FOREIGN KEY (winning_team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- titles
ALTER TABLE titles DROP CONSTRAINT fk_titles_tournament;
ALTER TABLE titles ADD CONSTRAINT fk_titles_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

ALTER TABLE titles DROP CONSTRAINT fk_titles_game;
ALTER TABLE titles ADD CONSTRAINT fk_titles_game
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;

ALTER TABLE titles DROP CONSTRAINT fk_titles_player;
ALTER TABLE titles ADD CONSTRAINT fk_titles_player
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;

-- leader_votes (check if constraint exists first)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'leader_votes_team_id_fkey') THEN
    ALTER TABLE leader_votes DROP CONSTRAINT leader_votes_team_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'leader_votes_voter_id_fkey') THEN
    ALTER TABLE leader_votes DROP CONSTRAINT leader_votes_voter_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'leader_votes_candidate_id_fkey') THEN
    ALTER TABLE leader_votes DROP CONSTRAINT leader_votes_candidate_id_fkey;
  END IF;
END $$;

ALTER TABLE leader_votes ADD CONSTRAINT fk_leader_votes_team
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE leader_votes ADD CONSTRAINT fk_leader_votes_voter
    FOREIGN KEY (voter_id) REFERENCES players(id) ON DELETE CASCADE;
ALTER TABLE leader_votes ADD CONSTRAINT fk_leader_votes_candidate
    FOREIGN KEY (candidate_id) REFERENCES players(id) ON DELETE CASCADE;
