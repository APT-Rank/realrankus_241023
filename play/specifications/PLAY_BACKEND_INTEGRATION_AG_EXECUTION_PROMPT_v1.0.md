# AG Execution Prompt — PLAY Backend Integration v1.0

## Objective

Resolve the integration gaps identified in the PLAY Backend Integration Audit by connecting `/play` to the existing PLAY backend safely. The repository does contain PLAY Functions and a transactional `purchasePrimaryProperty` callable; the task is to integrate and correct the existing path, not to create a backend from scratch.

Read and follow `PLAY_BACKEND_INTEGRATION_IMPLEMENTATION_SPEC_v1.0.md` as the task specification. Preserve the existing server-authoritative transaction engine and obey `PLAY_AG_WORK_CONTROL_PROTOCOL.md`.

## First: Establish the Actual Starting State

Before editing:

1. Read all “Read First” documents listed in the implementation spec.
2. Check the working tree and preserve all pre-existing user changes. Do not overwrite unrelated work.
3. Inspect the current implementation of `purchasePrimaryProperty`, `joinSeason`, property master ingestion, the `/play` data loader, Firebase Auth login module, Firestore rules, and relevant research logger.
4. Verify the real property-ID relationship among `play/data/suji_properties.json`, `PLAY_PROPERTY_MASTER`, and `PLAY_PRIMARY_SUPPLY`. Use repository data and isolated read-only checks only; do not write to a live database.
5. Create a concise current-state/contract map. Explicitly separate source-confirmed facts, report-only claims, and unknown live-cloud facts.

Do not assume past reports prove that Firebase Functions, Firestore rules, Hosting, or Cloud Tasks are currently deployed.

## Non-Negotiable Product Rules

- Use the already user-approved IA-03B.1 purchase cost formula exactly. Replace the backend's fixed 2% fee only through an authorized implementation path.
- Derive identity and economic facts on the server. Never trust client cash, price, area, fee, ownership, listing availability, or final status.
- Reuse `purchasePrimaryProperty` and its existing atomic transaction. No parallel economic engine, client Firestore writes, mock purchase, or fabricated balance.
- Maintain the existing research policy in `PLAY-07.5_RESEARCH_LOGGING_DECISION_RECORD.md`: research failure does not roll back committed BUY; events are emitted outside the economic transaction with the existing failure/DLQ path.
- Do not show “purchase successful” unless the backend confirms commit or idempotent replay of the committed transaction.
- Do not deploy or mutate a real season. Do not perform a production purchase. Do not run browser visual QA.

## Execution Order

### Phase 1 — Contract and Decision Review

Document the intended path:

```text
Firebase Auth user
  → selected /play property_id
  → server verifies season membership and resolves authoritative supply/price/area
  → purchasePrimaryProperty validates fee/cash/supply in Firestore transaction
  → transaction result + authoritative state refresh
  → server-mediated research log
```

Identify the unresolved Product Owner decisions from section 9 of the spec. The fee rule and research failure policy are already decided; do not ask about them again. If market semantics or any required policy remains ambiguous, do not guess. Finish independent source review and present the concrete A/B/C choices, consequences, and the exact implementation blocked by each choice; pause dependent code changes.

### Phase 2 — Approval Gate for Protected Architecture

Before modifying Firebase Auth architecture, Firestore rules/schema, callable contracts, idempotency semantics, transaction boundaries, Cloud Tasks, deployment configuration, or verified core infrastructure, follow the work-control protocol and stop for approval. The approval request must include:

- exact files/areas to change;
- proposed before/after contract or rule;
- why existing code cannot safely meet the requirement;
- compatibility and migration impact;
- risk and targeted verification plan.

Do not perform the gated change while waiting. Continue only with independent, clearly in-scope work that cannot affect the gated decision.

### Phase 3 — Implement Authorized Integration Work

Once all required PO decisions and protocol approvals exist:

1. Integrate `/play` with the intended existing Auth instance without creating duplicate Firebase apps or a second sign-in flow.
2. Add a least-privilege authenticated backend read path for the current participant's authoritative asset/ownership summary, reusing current collections and types where possible.
3. Resolve the selected frontend `property_id` to one authoritative, active, season-specific supply server-side. Reject missing, ambiguous, stale, unavailable, or non-tradable mappings.
4. Update the existing purchase callable to use authoritative supply price/area and the approved fee formula, with correctly scoped idempotency. Preserve a single Firestore transaction for all economic mutations.
5. Correct necessary authorization/rules only after the required approval gate. No blanket reads or client writes to make integration convenient.
6. Replace console-only research hooks with the already approved server-mediated research path; preserve the Research Events schema and DLQ/failure behavior.
7. Connect the UI to the callable and authoritative refresh. Pending, insufficient funds, stale listing, already processed, error, and committed success must be distinct states.
8. Keep purchase initiation disabled in any environment where the Auth, backend, data mapping, or server response is unavailable.

### Phase 4 — Targeted Verification

Use only isolated emulator/test fixtures, never production player balances or live season supply. Run the targeted checks in section 8 of the spec for the code that was authorized and changed. If the emulator or fixture does not represent deployed IAM/queues/rules, report that limit; do not call it a production verification.

If a test exposes a protected architecture gap, follow the work-control stop rule instead of creating a workaround. Do not relax assertions or change fixtures to force PASS.

## Hard Stop Conditions

Immediately stop dependent implementation and report when:

- the frontend property ID cannot be deterministically mapped to an authoritative season supply;
- any policy listed as unresolved in the spec lacks a PO decision;
- a protected architecture change lacks explicit approval;
- the existing transaction boundary cannot guarantee atomic cash/supply/ownership/transaction/idempotency updates;
- a secure participant-only read cannot be implemented without an unapproved rules/API/schema change;
- live deployment, queue provisioning, IAM changes, or production state mutation is required;
- a change would implement SELL, ranking, rewards, notifications, or unrelated feature work.

When stopping, preserve the working tree and provide evidence, exact blocker, options A/B/C, recommendation, and the approving decision needed. Do not mark a blocked case PASS or READY.

## Completion Report

Follow section 11 of the spec. Include a changed-file summary, final callable/read/auth contracts, property mapping evidence, fee tests, security matrix, atomicity/idempotency/concurrency results, research/DLQ results, UI state behavior, exact checks run, and limitations. State explicitly:

- whether this work stopped at an approval gate or completed;
- whether any deployment occurred (**expected: no**);
- whether any real economic mutation occurred (**must be no**);
- whether IA-03C is ready to enable, and what remains blocked.
