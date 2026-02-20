# API Reference

All backend logic runs client-side via Supabase JS. Functions are in `src/lib/api.ts`.

---

## Tournament Lifecycle

### `createTournament(name, roomCode, numGames, refereeName, deviceId)`
Creates a tournament and registers the creator as referee.
- **Validates:** room code is 1-5 chars, alphanumeric, uppercase, unique among active tournaments
- **Creates:** tournament (status=lobby) + player (role=referee) + sets referee_id
- **Returns:** `{ tournament, player }`
- **Throws:** duplicate room code, invalid format

### `validateRoomCode(roomCode)`
Checks if a room code exists and is joinable.
- **Returns:** `{ valid, error?, tournament? }`
- **Errors:** "Room not found", "Invalid room code format"

### `joinTournament(roomCode, playerName, deviceId, role)`
Joins an existing tournament lobby.
- **Validates:** room exists, status=lobby
- **Reconnection:** if device_id already exists in tournament, returns existing player (no duplicate)
- **Returns:** `{ tournament, player }`

### `reconnectPlayer(deviceId)`
Auto-rejoin on page refresh — looks up player by device_id in active tournaments.
- **Returns:** `{ tournament, player } | null`

---

## Lobby & Teams

### `fetchLobbyState(tournamentId)`
One-call fetch of all lobby data.
- **Returns:** `{ tournament, players[], teams[], votes[] }`

### `createTeam(tournamentId, name)`
Creates a new team with 0 points.

### `updateTeamName(teamId, name)`
Renames a team.

### `joinTeam(playerId, teamId)`
Moves player to team. Resets is_leader, cleans up old team's leader votes.

### `leaveTeam(playerId)`
Removes player from team. Clears all their votes (cast and received).

### `voteForLeader(teamId, voterId, candidateId)`
Upserts a leader vote (changing vote replaces old one). After insert, checks majority (>50% of team members). If majority reached, sets is_leader=true on winner.
- **Returns:** `{ votes[], leaderId: string | null }`

### `startTournament(tournamentId)`
Validates ≥2 teams with ≥1 player + leader each. Sets status=picking, current_pick_team=first team.

---

## Game Pick

### `fetchAvailableGames(tournamentId)`
Gets built-in game types (tournament_id=null) + custom types for this tournament, minus already-picked ones.
- **Returns:** `{ available: GameType[], picked: Game[] }`

### `fetchPickState(tournamentId)`
Full pick phase context: whose turn, which leader, round number.
- **Returns:** `{ tournament, currentPickTeam, currentLeader, roundNumber, totalRounds, teams, gamesPlayed }`

### `pickGame(tournamentId, teamId, gameTypeId, playerId)`
Leader picks a game. Validates: status=picking, correct team's turn, player is leader, game not already picked.
Inserts game (status=active), flips current_pick_team, sets tournament status=playing.
- **Returns:** `{ game, tournament }`

---

## Scoring

### `fetchGameState(gameId)`
All data for an active game: game + game_type + stats + result + players.
- **Returns:** `{ game, gameType, stats[], result?, players[] }`

### `submitPlayerStats(gameId, playerId, stats[])`
Batch upsert player stats. Uses `ON CONFLICT (game_id, player_id, stat_key)` — resubmitting updates instead of duplicating.
- **Input:** `stats: { key: string, value: number }[]`

### `submitGameResult(gameId, winningTeamId?, resultData)`
Referee submits game result. Inserts into game_results.

### `endGame(tournamentId, gameId)`
Sets game status=titles, tournament status=scoring. Triggers title calculation phase.

---

## Titles

### `saveTitles(tournamentId, gameId, titles[])`
Batch insert calculated titles into the titles table.

### `updateTeamPoints(tournamentId)`
Recalculates: sums all title points per player → groups by team → updates teams.total_points.

### `fetchTitlesForGame(gameId)`
Gets all titles for a game with player names joined.

### `advanceToNextRound(tournamentId, gameId)`
Sets game status=completed. If more games needed: tournament→picking + flip pick team. If all done: tournament→completed.
- **Returns:** `{ tournament, isLastGame }`

---

## Scoreboard & History

### `fetchScoreboard(tournamentId)`
Comprehensive: tournament + teams + players + completed games (with game_type) + all titles + player_stats + titleLeaderboard.

### `fetchPlayerDetail(playerId, tournamentId)`
Player deep-dive: all stats grouped by game, all titles, points contributed.

### `fetchCeremonyData(tournamentId)`
End-of-tournament: teams ranked, global titles, winner determination, tie detection.

### `saveGlobalTitles(tournamentId, titles[])`
Saves global titles (game_id=null) + updates team points.

### `createCustomGameType(tournamentId, gameData)`
Creates a custom game type (tournament_id set = custom, not shared).

### `fetchTournamentHistory()`
All completed tournaments with teams and winners.

### `fetchTournamentDetail(tournamentId)`
Full recap of any completed tournament.
