# BUG-010: Games Table Missing DELETE Policy

**Sprint:** 3 | **Severity:** ⚠️ Medium | **Status:** ✅ Fixed

## Discovery
**How found:** During test cleanup — attempted to delete a test game via referee client. Delete was silently dropped by RLS.

## Root Cause
Same pattern as BUG-005 (leader_votes missing DELETE). The `games` table had SELECT, INSERT, and UPDATE policies but no DELETE policy. With RLS enabled, all deletes were silently rejected.

## Fix
`006_fix_sprint3_bugs.sql`: Added referee-only DELETE policy.

## Lessons
1. **Fourth time a missing DELETE policy has caused issues.** Every table with RLS needs all 4 operations explicitly defined.
2. **Add a checklist item: "Does every RLS-enabled table have SELECT, INSERT, UPDATE, and DELETE policies?"**
