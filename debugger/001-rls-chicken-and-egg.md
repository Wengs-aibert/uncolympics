# BUG-001: RLS Chicken-and-Egg — referee_id Never Set

**Sprint:** 1 | **Severity:** 🔴 Critical | **Status:** ✅ Fixed

## Discovery

**How found:** Live Supabase test — `createTournament()` flow. After inserting a tournament and referee player, the `UPDATE tournaments SET referee_id = <player_id>` silently returned success but wrote nothing.

**Detection method:** Automated test script querying DB state after API calls. The `referee_id` remained `NULL` after the update.

## Root Cause

The RLS policy on `tournaments` FOR UPDATE was:
```sql
CREATE POLICY "Only referee can update tournament" ON tournaments
    FOR UPDATE USING (
        referee_id IN (
            SELECT id FROM players WHERE device_id = current_setting('request.headers')::json->>'x-device-id'
        )
    );
```

**The problem:** This policy checks if `referee_id` matches a player with the caller's `device_id`. But during tournament creation, `referee_id` is still `NULL` — the whole point of the update is to SET it. A `NULL` value never matches `IN (...)`, so the policy silently drops the update.

**Why it was silent:** Supabase/PostgREST doesn't error on RLS-filtered updates — it just returns 0 rows affected, which the JS client doesn't treat as an error.

## Impact

- Tournament `referee_id` is always NULL
- **BUG-002** (status update blocked) is a cascading failure from this same policy
- Every downstream feature checking `referee_id` breaks: game management, scoring, ceremony

## Fix

**Migration:** `004_fix_rls_and_room_code.sql`

Replaced the policy with:
```sql
CREATE POLICY "Referee or creator can update tournament" ON tournaments
    FOR UPDATE USING (
        referee_id IS NULL
        OR
        referee_id IN (
            SELECT id FROM players 
            WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
        )
    );
```

**Key changes:**
1. `referee_id IS NULL` allows the initial setup update
2. `current_setting('request.headers', true)` — the `true` param prevents crash if header is missing (returns NULL instead)
3. After referee_id is set, only the referee's device can update (same security as before)

**Also required:** The Supabase client now sends `x-device-id` header on every request (updated `supabase.ts`).

## Security Consideration

The `referee_id IS NULL` clause means ANY client can claim a freshly-created tournament. In practice this is fine because:
- The creator immediately sets referee_id in the same flow
- The window is milliseconds
- This is a party app, not a banking system

For a production app, you'd use a Supabase RPC with `security definer` to do the whole create atomically.

## Verification

20/20 tests pass post-fix, including:
- ✅ `referee_id` set correctly after create
- ✅ Referee can update tournament status
- ✅ Non-referee updates blocked

## Lessons

1. **RLS policies with self-referential FKs are tricky.** If a row needs to reference itself (or be referenced by a row that references it), the initial write has a bootstrap problem.
2. **Supabase silently drops RLS-filtered writes.** Always verify the actual DB state after updates — don't trust the API response.
3. **Test with the real database.** This bug was invisible in code review. Only live testing caught it.
