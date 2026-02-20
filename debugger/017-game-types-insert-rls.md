# BUG-017: game_types INSERT Policy Too Permissive

## Discovery
- **Sprint:** 8 (Custom Games)
- **Test:** Non-referee custom game blocked (RLS)
- **Severity:** Medium — any player can create custom game types

## Symptoms
A player device (not referee) was able to INSERT into `game_types` with a `tournament_id`. Only referees should be able to create custom games.

## Root Cause
The INSERT policy on `game_types` was `WITH CHECK (true)` — completely open. No device/role check.

## Fix
**Migration 009:** Replace the permissive INSERT policy with one that:
1. Requires `tournament_id IS NOT NULL` (can't create fake built-in types)
2. Checks the `x-device-id` header matches a referee in that tournament

Also tightened SELECT policy so custom games are only visible to tournament participants.

## Pattern
**This is the 6th time we've found missing/too-permissive policies.** See also: BUG-003, BUG-005, BUG-007, BUG-010, BUG-013.

## Lessons
- Every INSERT policy needs to verify WHO is inserting, not just WHAT
- "Anyone can create" is almost never the right policy for user-generated content
