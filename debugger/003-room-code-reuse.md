# BUG-003: Room Code Reuse Blocked by Global UNIQUE Constraint

**Sprint:** 1 | **Severity:** ⚠️ Medium | **Status:** ✅ Fixed

## Discovery

**How found:** Code review during Sprint 1 testing. The app-level code in `api.ts` checks `neq('status', 'completed')` to allow room code reuse for completed tournaments. But the DB has a hard `UNIQUE(room_code)` constraint that rejects it at the database level regardless.

**Detection method:** Schema inspection via `\d tournaments` in psql.

## Root Cause

```sql
-- In 001_initial.sql
CREATE TABLE tournaments (
    ...
    room_code text UNIQUE NOT NULL,
    ...
);
```

This creates a global unique constraint. The app logic was correct — it only checked for active tournaments — but the DB would throw `duplicate key value violates unique constraint "tournaments_room_code_key"` on any reuse attempt.

## Impact

Medium — room codes can never be recycled. For a party app with short codes (5 chars), this limits the pool over time. Not a Sunday blocker but wrong behavior.

## Fix

**Migration:** `004_fix_rls_and_room_code.sql`

```sql
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_room_code_key;

CREATE UNIQUE INDEX idx_unique_active_room_code 
    ON tournaments(room_code) 
    WHERE status != 'completed';
```

Partial unique index: enforces uniqueness only among non-completed tournaments. Completed tournaments can share codes with new ones.

## Verification

- ✅ Created completed tournament with code `TST99`
- ✅ Created NEW lobby tournament with same code `TST99` — succeeds
- ✅ Tried creating ANOTHER lobby tournament with `TST99` — correctly rejected

## Lessons

1. **App-level checks are not enough.** If the DB constraint disagrees, the DB wins. Always verify constraints match the intended behavior.
2. **Partial unique indexes in Postgres are powerful.** `WHERE status != 'completed'` is the exact semantic we need — uniqueness scoped to a business condition.
3. **Code review caught this, live testing confirmed.** The schema review in the Sprint 0 test report should have flagged this — adding schema-vs-logic consistency checks to the test matrix.
