# Realtime Sync

Multi-device sync via Supabase Realtime (Postgres changes). Code in `src/lib/sync.ts`.

---

## Tables in Realtime Publication
- `tournaments`
- `players`
- `teams`
- `games`
- `player_stats`
- `game_results`
- `titles`
- `leader_votes`

All have `REPLICA IDENTITY FULL` for complete row data on UPDATE/DELETE.

---

## Subscription Channels

### `subscribeTournament(tournamentId)`
Used during lobby, picking, and general tournament flow.

| Table | Filter | Events | Action |
|-------|--------|--------|--------|
| players | `tournament_id=eq.{id}` | INSERT/UPDATE/DELETE | Add/update/remove player in store |
| teams | `tournament_id=eq.{id}` | INSERT/UPDATE/DELETE | Add/update/remove team in store |
| tournaments | `id=eq.{id}` | UPDATE | Update tournament state, trigger navigation on status change |
| leader_votes | *(none — filtered client-side)* | INSERT/UPDATE/DELETE | Add/update/remove vote; checked against current team IDs |
| games | `tournament_id=eq.{id}` | INSERT | Add picked game to store |

**Navigation triggers:**
- Tournament status → `picking`: redirect to `/game/{code}/pick`
- Tournament status → `completed`: redirect to `/ceremony/{code}`

### `subscribeGame(gameId, tournamentId)`
Used during active gameplay.

| Table | Filter | Events | Action |
|-------|--------|--------|--------|
| player_stats | `game_id=eq.{id}` | INSERT/UPDATE | Add stat to store + live feed |
| game_results | `game_id=eq.{id}` | INSERT/UPDATE | Set game result in store |
| games | `id=eq.{id}` | UPDATE | Update game state; navigate to title reveal on status=titles |
| titles | `tournament_id=eq.{id}` | INSERT | Add title to gameTitles if matching game_id |
| teams | `tournament_id=eq.{id}` | UPDATE | Update team points in store |

---

## Connection Status
Tracked in store as `connected | disconnected | reconnecting`.
- `SUBSCRIBED` → connected
- `CLOSED` → disconnected
- `CHANNEL_ERROR` → reconnecting

---

## Reconnection
On page refresh: `reconnectPlayer(deviceId)` looks up active tournament by device_id stored in localStorage. If found, re-subscribes to the appropriate channel.
