# BUG-009: No Unique Constraint on Duplicate Game Picks

**Sprint:** 3 | **Severity:** ⚠️ Medium | **Status:** ✅ Fixed

## Discovery
**How found:** Live test — inserted the same game_type_id twice for the same tournament. DB accepted both.

## Root Cause
No unique index on `(tournament_id, game_type_id)` in the `games` table. The app-level `pickGame()` function checks for duplicates before inserting, but the DB didn't enforce it.

## Fix
`006_fix_sprint3_bugs.sql`: `CREATE UNIQUE INDEX idx_unique_game_per_tournament ON games(tournament_id, game_type_id);`

## Lessons
1. **App-level validation is not a substitute for DB constraints.** Race conditions or bugs could bypass app checks.
2. **Every "must be unique" business rule should have a corresponding DB constraint.**
