# PLAY-07.3 PHASE 3 ACCEPTANCE REVIEW: ISSUES FOUND

During the independent Acceptance Review of Phase 3, two critical vulnerabilities were identified in the current implementation. As per instructions, I am reporting the Reproduction, Root Cause, Impact, Minimal Fix Proposal, and Regression Plan before proceeding with any large-scale modifications.

---

## Issue 1: Player Resolution Stability (Offset Pagination Bug)

### Reproduction
1. 201 Players created (`p1` to `p201`).
2. Chunk 0 (`chunk_index=0`, `CHUNK_SIZE=100`) executes and processes `p1` through `p189` (first 100 elements in string sort order).
3. Player `p1` (which was in Chunk 0) changes status to `INACTIVE`.
4. Chunk 1 (`chunk_index=1`, `offset=100`) executes.
5. **Result**: Player `p19` is completely omitted from the economic simulation. 

### Root Cause
The query relies on `offset(chunk_index * CHUNK_SIZE)` against a dynamic dataset (`status == 'ACTIVE'`). 
When `p1` became `INACTIVE` between chunks, the entire sorted list of active players shifted left by 1. 
Player `p19` (which was at index 100, the 101st element) shifted to index 99. Chunk 1 starting at offset 100 completely skipped `p19` and started at `p190`.

### Impact
**CRITICAL**. If a player drops out (e.g., bankruptcy, ban, or manual status change) while a batch is currently processing chunks, adjacent players in the sequence will be permanently skipped for that simulation period, corrupting the economy.

### Minimal Fix Proposal
Instead of re-querying `PLAY_PLAYER` with dynamic offsets at the **Worker (Phase 3)** level, we should lock the `player_id` list at the **Batch/Chunk Creation (Phase 1/2)** level. 
* **Fix**: When `createEconomicBatch` creates `PLAY_BATCH_CHUNKS`, it should explicitly store the array of `player_ids` assigned to that chunk (e.g., `chunk.target_players = ['p1', 'p10', ...]`). 
* The worker simply iterates over `chunk.target_players` array.
* This guarantees 100% stability regardless of mid-batch status changes.

### Regression Plan
This fix alters **Phase 1 (Batch Creation)** and **Phase 3 (Worker)**.
We must re-run:
1. `verify_batch_phase1.ts`
2. `verify_batch_phase2.ts`
3. Phase 3 Golden Scenarios & Crash Tests.

---

## Issue 2: Idempotency Identity (Batch Type Collision)

### Reproduction
1. `MONTHLY` batch dispatched for `simulation_period = 1`.
2. Worker processes and updates player's `last_processed_period` to `1`.
3. `WEEKLY` batch dispatched for `simulation_period = 1`.
4. Worker checks `if (asset.last_processed_period >= simulation_period)` -> Evaluates to `true`.
5. **Result**: The `WEEKLY` batch triggers a NO-OP and is completely ignored.

### Root Cause
The canonical identity of an economic execution is `season_id + simulation_period + batch_type + player_id`. However, the current code only tracks `last_processed_period` on the player asset, completely ignoring `batch_type`.

### Impact
**HIGH**. If multiple batch types (e.g., DAILY, WEEKLY, MONTHLY) can run in the same Simulation Period, they will overwrite and block each other idempotently.

### Minimal Fix Proposal
Update `PLAY_PLAYER_ASSET` to track an array of processed batches for the current period.
* **Fix**: Add `processed_batches: string[]` to `PLAY_PLAYER_ASSET`. Reset this array when `simulation_period` increases. Add `batch_id` to this array when processed. The NO-OP check becomes: `if (asset.processed_batches.includes(batch_id))`.

### Regression Plan
This fix alters **Phase 3 (Worker Idempotency)**.
We must re-run:
1. Phase 3 Golden Scenarios.
2. Phase 3 Duplicate/Retry Idempotency Tests.

---

I await your approval on these minimal fix proposals before applying the changes and generating the final Acceptance Review Report.
