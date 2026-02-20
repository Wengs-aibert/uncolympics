# Data Model

All tables live in Supabase Postgres. UUIDs everywhere. Realtime enabled on key tables.

---

## Tables

### `tournaments`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| room_code | text UNIQUE | 1-5 chars, alphanumeric, uppercase |
| name | text | Display name |
| status | text | lobby → picking → playing → scoring → completed |
| num_games | int | Total games to play |
| time_est_min | int | Estimated duration (num_games × 20) |
| referee_id | uuid FK→players | SET NULL on delete |
| current_pick_team | uuid FK→teams | SET NULL on delete |
| created_at | timestamptz | |

### `players`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tournament_id | uuid FK→tournaments | CASCADE delete |
| name | text | Display name |
| device_id | text | For reconnection |
| team_id | uuid FK→teams | SET NULL on delete |
| role | text | referee / player / spectator |
| is_leader | boolean | One per team |
| created_at | timestamptz | |

### `teams`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tournament_id | uuid FK→tournaments | CASCADE delete |
| name | text | |
| total_points | decimal | Sum of all title points |
| created_at | timestamptz | |

### `game_types`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tournament_id | uuid FK→tournaments | NULL = built-in, set = custom |
| name | text | e.g. "Beer Pong" |
| emoji | text | e.g. "🍺" |
| description | text | |
| player_inputs | jsonb | What players submit (stat definitions) |
| referee_inputs | jsonb | What referee submits |
| title_definitions | jsonb | Array of title conditions |

### `games`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tournament_id | uuid FK→tournaments | CASCADE delete |
| game_type_id | uuid FK→game_types | CASCADE delete |
| status | text | pending → active → scoring → titles → completed |
| picked_by_team | uuid FK→teams | SET NULL on delete |
| game_order | int | 1-indexed sequence |
| created_at | timestamptz | |

### `player_stats`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| game_id | uuid FK→games | CASCADE delete |
| player_id | uuid FK→players | CASCADE delete |
| stat_key | text | e.g. "cups_made" |
| stat_value | decimal | |
| submitted_at | timestamptz | |
| | UNIQUE | (game_id, player_id, stat_key) — enables upsert |

### `game_results`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| game_id | uuid FK→games | CASCADE delete |
| winning_team_id | uuid FK→teams | SET NULL on delete |
| result_data | jsonb | Flexible per-game data |

### `titles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tournament_id | uuid FK→tournaments | CASCADE delete |
| game_id | uuid FK→games | NULL = global title, CASCADE delete |
| player_id | uuid FK→players | CASCADE delete |
| title_name | text | e.g. "Sniper" |
| title_desc | text | e.g. "Made the most cups" |
| is_funny | boolean | Funny title flag |
| points | decimal | Default 0.5 |

### `leader_votes`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| team_id | uuid FK→teams | CASCADE delete |
| voter_id | uuid FK→players | CASCADE delete |
| candidate_id | uuid FK→players | CASCADE delete |
| created_at | timestamptz | |
| | UNIQUE | (team_id, voter_id) — one vote per person |

---

## Cascade Behavior

Deleting a **tournament** cascades to: players, teams, games, game_types (custom), titles, player_stats, game_results, leader_votes.

References that use **SET NULL** instead: referee_id, current_pick_team, picked_by_team, winning_team_id — these are "soft" references where the parent might be removed without deleting the child.

---

## Indexes
- `room_code` on tournaments
- `tournament_id` on players, teams, game_types, games, titles
- `device_id` on players
- `game_id` on player_stats, game_results, titles
- `player_id` on player_stats, titles
