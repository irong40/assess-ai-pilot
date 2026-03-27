# Deferred Items - Phase 04

## Pre-existing Test Flakiness

**File:** `src/lib/__tests__/agent-approvals.test.ts`
**Issue:** waitFor-based assertion in "renders approval actions for admin users" test times out intermittently when run in full suite (passes in isolation)
**Root cause:** Likely timing-sensitive React render cycle with multiple async mock layers
**Impact:** Low -- test passes in isolation, flaky only under full suite parallel execution
**Recommendation:** Increase waitFor timeout or refactor to use synchronous render assertions
