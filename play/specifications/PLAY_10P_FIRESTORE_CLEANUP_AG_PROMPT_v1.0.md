# AG EXECUTION PROMPT
# PLAY 10P FIRESTORE CLEANUP v1.0

## ROLE

You are executing an operational Firestore cleanup for the PLAY system.

The purpose is to prepare a clean baseline for the upcoming **10-Participant Property-Scale Simulation**.

This is a destructive database operation.

Proceed conservatively.

---

# 1. PRIMARY OBJECTIVE

Clean existing PLAY Simulation runtime/test data from Firestore while preserving:

- RealRankers data
- Property Master
- Firebase Auth
- PLAY source code
- PLAY configuration
- Firebase Security Rules
- Economic Engine
- Property Market Engine
- Research Schema
- Research Logger
- Reliability infrastructure

Do NOT start the 10-participant simulation during this task.

---

# 2. FIRST: DISCOVERY ONLY

Before deleting anything:

1. Identify the Firebase project.
2. Identify the active Firestore environment.
3. Enumerate actual Firestore collections.
4. Search the repository for actual PLAY/Research collection names.
5. Count documents in candidate cleanup collections.
6. Identify protected collections.
7. Build a cleanup target plan.

Do not delete data during Discovery.

Output:

```text
=== CLEANUP DISCOVERY ===

PROJECT:
ENVIRONMENT:

PLAY COLLECTIONS:
...

RESEARCH COLLECTIONS:
...

PROTECTED COLLECTIONS:
...

DOCUMENT COUNTS:
...

PROPOSED DELETE ORDER:
...

STATUS: DISCOVERY COMPLETE
```

---

# 3. COLLECTION SCOPE

Look for actual implementation references to:

```text
PLAY_
RESEARCH_
```

Candidate runtime collections include:

```text
PLAY_SEASON
PLAY_PLAYER
PLAY_PLAYER_STATE
PLAY_PLAYER_ASSET
PLAY_PROPERTY_STATE
PLAY_PROPERTY_OWNERSHIP
PLAY_PRIMARY_SUPPLY
PLAY_SECONDARY_LISTING
PLAY_PROPERTY_TRANSACTION
PLAY_TRANSACTION
PLAY_DECISION_LOG
PLAY_BATCH
PLAY_BATCH_CHUNKS
PLAY_BATCH_CHECKPOINT
PLAY_SEASON_CLOCK
PLAY_IDEMPOTENCY_LOGS
RESEARCH_EVENTS
RESEARCH_EVENTS_DLQ
```

Important:

These are candidate names only.

Use actual repository code and actual Firestore state to determine the real collections.

Do NOT invent collections.

Do NOT delete a collection merely because its name resembles PLAY data.

---

# 4. PROTECTED DATA

Never delete or modify:

- RealRankers Property Master
- RealRankers production data
- Firebase Authentication users
- non-PLAY application data
- PLAY source code
- configuration files
- Security Rules
- deployed functions
- Research schema definitions
- static property source files

The Property Master must remain intact.

Current expected Property Master baseline:

```text
Total: 209
NORMAL: 200
INCOMPLETE: 9
```

If the actual current values differ, STOP and report the difference.

Do not modify the Property Master to make the numbers match.

---

# 5. STOP BEFORE DELETE

After discovery, produce:

```text
=== DESTRUCTIVE ACTION PLAN ===

TARGET:
...

PROTECTED:
...

TOTAL DOCUMENTS TO DELETE:
...

DELETE ORDER:
...

PROPERTY MASTER:
UNCHANGED

REALRANKERS:
UNCHANGED

AUTH:
UNCHANGED
```

At this point:

STOP.

Do not execute deletion until the target scope is explicit and internally consistent.

---

# 6. EXECUTE CLEANUP

Once scope is confirmed:

- Use Admin SDK/server-side execution.
- Do not use browser client writes.
- Use pagination.
- Use batched deletes.
- Record progress.
- Retry safely.
- Record failures.

Each deletion operation should be attributable to:

```text
cleanup_execution_id
collection
document_id
timestamp
result
```

Do not modify application source code unless absolutely necessary for the one-time cleanup execution.

Prefer a temporary/standalone cleanup script over permanent product code.

---

# 7. DELETE ORDER

Respect dependency relationships.

Preferred logical order:

```text
Research runtime data
        ↓
Decision / transaction / idempotency data
        ↓
Secondary listings
        ↓
Property ownership/state
        ↓
Player state/assets
        ↓
Players
        ↓
Batch/chunk/checkpoint runtime state
        ↓
Season runtime state
```

However, use the actual repository schema/reference relationships if they differ.

Do not blindly follow this order if implementation evidence indicates another safe order.

---

# 8. FAILURE RULE

If any protected data is touched:

STOP IMMEDIATELY.

If deletion fails:

Do not report PASS.

If a collection contains unexpected data:

STOP and report it.

If a reference/orphan problem is discovered:

Do not automatically delete the referenced document.

Report it for analysis.

---

# 9. POST-CLEANUP VERIFICATION

After deletion:

### V01

Verify all intended runtime collections are empty or absent.

### V02

Verify Property Master integrity.

Expected:

```text
209 total
200 NORMAL
9 INCOMPLETE
```

### V03

Verify RealRankers data was not modified.

### V04

Verify Firebase Auth was not modified.

### V05

Verify no PLAY orphan state remains.

Examples:

```text
PLAYER without SEASON
OWNERSHIP without PLAYER
TRANSACTION without PLAYER
TRANSACTION without PROPERTY
LISTING without OWNER
IDEMPOTENCY without TRANSACTION
RESEARCH_EVENT without PARTICIPANT
```

### V06

Verify no previous idempotency state remains.

### V07

Verify no previous Research Event/DLQ runtime data remains.

---

# 10. BASELINE GENERATION

If and only if all cleanup checks PASS, generate:

```text
baseline_10p.json
```

Include:

```text
baseline_id
cleanup_execution_id
project_id
timestamp
property_master_version
property_count
normal_count
incomplete_count
season_supply_policy
code_version
function_version
```

Season 1 supply policy:

```text
FIXED_ONE
```

Do not modify it.

---

# 11. REQUIRED EVIDENCE

Generate:

```text
cleanup_plan.json
cleanup_execution.json
cleanup_summary.json
collection_inventory.json
protected_data_verification.json
property_master_integrity.json
orphan_check.json
baseline_10p.json
```

Store them in an appropriate artifact directory.

Do not fabricate evidence.

Every reported PASS must be backed by actual runtime output.

---

# 12. FINAL REPORT

Create:

```text
PLAY_10P_FIRESTORE_CLEANUP_REPORT.md
```

The report must contain:

1. Objective
2. Firebase Project / Environment
3. Discovery Result
4. Actual Cleanup Collections
5. Before Counts
6. Deleted Counts
7. Failed Counts
8. Protected Data Verification
9. Property Master Integrity
10. Orphan Check
11. Idempotency Cleanup
12. Research Runtime Cleanup
13. Baseline Information
14. Evidence Locations
15. Final Verdict

Use exactly one of:

```text
STATUS: READY FOR 10-PARTICIPANT SIMULATION
```

or

```text
STATUS: BLOCKED
```

---

# 13. IMPORTANT NON-GOALS

Do NOT:

- run 10-participant simulation
- run 100-participant simulation
- change Property Master
- change household_count
- change supply_policy
- change economic engine
- change property market engine
- change Secondary Market logic
- change Research Logger
- change Security Rules
- change UI
- create a new permanent Cleanup API
- silently fix unrelated bugs

This task is strictly:

```text
DISCOVER → PLAN → CLEAN → VERIFY → BASELINE
```

Nothing more.

---

# 14. FINAL SUCCESS CONDITION

The task is successful only when:

```text
Previous PLAY runtime data
        = CLEAN

Protected data
        = UNCHANGED

Property Master
        = INTACT

Idempotency state
        = CLEAN

Research runtime state
        = CLEAN

Orphan state
        = NONE

Baseline
        = CREATED

10P Simulation
        = NOT YET EXECUTED
```

Then:

```text
STATUS: READY FOR 10-PARTICIPANT SIMULATION
```

Otherwise:

```text
STATUS: BLOCKED
```

Do not proceed to the 10-participant simulation automatically.
