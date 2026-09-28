# PLAY-07.3 GATE 6 FINAL AUDIT ISSUES

## ISSUE 1: Duplicate `dispatchBatchChunks` Calls Cause Batch Lockup (Race Condition)

### Description
When multiple concurrent calls to `dispatchBatchChunks` are made for the same batch, a race condition causes the chunk `status` to be incorrectly overwritten back to `'DISPATCHED'`, effectively locking up the `aggregateBatch` worker indefinitely (`pending=1`).

### Trace
1. Worker 1 executes `dispatchBatchChunks`, creates a Cloud Task, updates chunk status to `DISPATCHED`.
2. `chunkWorker` Cloud Task executes almost immediately, completes the chunk, and updates chunk status to `COMPLETED`.
3. Concurrently, Worker 2 executes `dispatchBatchChunks`, attempts to create a Cloud Task with the same name, catches `ALREADY_EXISTS` (code 6).
4. Worker 2's catch block incorrectly updates the chunk status back to `DISPATCHED` (overwriting the `COMPLETED` state).
5. The `aggregateBatch` loop runs, sees `status: 'DISPATCHED'`, and polls indefinitely because the corresponding Cloud Task was already executed and completed.

### Impact
High. A network retry or accidental double-click by an admin client triggering `dispatchBatchChunks` multiple times concurrently could lock the batch, requiring manual database intervention to fix chunk states.

### Resolution (Future Scope)
In `dispatchBatchChunks.ts` error handler for `ALREADY_EXISTS`, instead of blindly updating to `DISPATCHED`, it should either read the current state and only update if `PENDING` or rely purely on task creation success.

---

## ISSUE 2: Security Endpoint Returns 404 Instead of 403 (Minor)

### Description
When an authenticated but unauthorized user attempts to trigger an economic batch, the API returns a 404 "Season not found" error instead of a 403 "Forbidden" error.

### Trace
The endpoint appears to validate the existence of the `season_id` before evaluating user role authorization. If a user is not authorized to read the season document, Firestore returns `undefined`, which the function interprets as the season not existing.

### Impact
Low. The endpoint is secure, but the 404 response behaves as a blind error rather than an explicit authorization failure. 

### Resolution (Future Scope)
Adjust authorization checks to fail with 403 early if a non-admin role is detected, before querying Firestore.
