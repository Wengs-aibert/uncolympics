# BUG-002: Tournament Status Update Blocked

**Sprint:** 1 | **Severity:** 🔴 Critical | **Status:** ✅ Fixed (cascading fix from BUG-001)

## Discovery

**How found:** Live test — attempted to update tournament status from `lobby` to `picking`. The update was silently dropped.

**Detection method:** Same automated test suite. Status remained `lobby` after update call.

## Root Cause

Same RLS policy as BUG-001. Since `referee_id` was never set (BUG-001), the policy `referee_id IN (...)` always evaluated to `NULL IN (...)` → false. No updates allowed on any tournament, ever.

## Impact

Tournament can never leave `lobby` state. The entire game flow (picking → playing → scoring → completed) is blocked.

## Fix

Fixed by the same policy replacement in BUG-001. Once `referee_id` is properly set, the referee's device_id matches and updates work.

## Verification

- ✅ Referee can update status to `picking`
- ✅ Non-referee update is silently blocked (status unchanged)
- ✅ Full status lifecycle works

## Lessons

1. **Cascading failures from a single RLS bug.** One bad policy broke two seemingly unrelated features.
2. **Test the negative case too.** Verified that non-referees CAN'T update — the security model still holds.
