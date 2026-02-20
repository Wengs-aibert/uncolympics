# BUG-008: game_types Missing created_at Column

**Sprint:** 3 | **Severity:** ⚠️ Medium | **Status:** ✅ Fixed

## Discovery
**How found:** Live test — `fetchAvailableGames()` calls `.order('created_at')` on game_types. Supabase returned error: "column game_types.created_at does not exist".

## Root Cause
Same pattern as BUG-006 (teams missing created_at). The TypeScript `GameType` interface didn't declare `created_at`, but the API code orders by it. The initial schema didn't include the column.

## Fix
`006_fix_sprint3_bugs.sql`: `ALTER TABLE game_types ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();`

## Lessons
1. **Third time same bug pattern.** Need a schema audit — check every `.order('created_at')` call against the actual DB columns.
2. **Consider adding created_at to ALL tables by default** in future schemas.
