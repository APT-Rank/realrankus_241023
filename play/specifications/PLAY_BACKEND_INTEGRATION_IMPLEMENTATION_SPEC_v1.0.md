# PLAY Backend Integration — Implementation Spec v1.0

## 1. Status and Purpose

- Workstream: `PLAY-BACKEND-INTEGRATION`
- Phase: integration foundation following the PLAY Backend Integration Audit
- Status: execution specification with explicit decision/approval gates
- Goal: make `/play` use the existing PLAY backend safely, without creating a second economy or silently changing product rules.
- This phase is a prerequisite to enabling the first real BUY. It is **not authorization to deploy** or silently open real BUY to users.

The repository already contains Cloud Functions, Firestore economic state, market functions, and a primary purchase callable. The work is to establish a correct, secure connection contract and close the identified gaps. Do not describe the backend as absent.

## 2. Read First

Read the current repository versions of:

1. `PLAY_IA-03C_ACTUAL_BUY_TRANSACTION_IMPLEMENTATION_SPEC_v1.0.md`
2. `PLAY_IA-03C_ACTUAL_BUY_TRANSACTION_AG_EXECUTION_PROMPT.md`
3. `PLAY_IA-03B.1_BUY_DECISION_DATA_INTEGRITY_AND_TRANSACTION_COST_SPEC_v1.1.md`
4. `PLAY-IA-03C_HARD_STOP_REPORT.md`
5. `PLAY-06_IMPLEMENTATION_REPORT.md`, `PLAY-06.1_SECURITY_E2E_VERIFICATION_REPORT.md`, `PLAY-07.2_IMPLEMENTATION_REPORT.md`, and `PLAY-07.5_RESEARCH_LOGGING_DECISION_RECORD.md`
6. `PLAY_AG_WORK_CONTROL_PROTOCOL.md`
7. Current Functions source, `firebase.json`, `firestore.rules`, indexes, `/play` source, and Firebase login source.

The repository audit performed 2026-09-27 is summarized in this specification. If a fact conflicts with the live source, trust the source, record the discrepancy, and update the implementation plan before changing code.

## 3. Scope

### In scope

- Define and implement a narrow `/play` integration to existing Firebase Auth and existing PLAY callable infrastructure, where the current contracts safely support it.
- Provide an authenticated server-side read path for the current participant's authoritative asset summary and owned assets, if no safe existing read endpoint exists.
- Establish a server-side resolution path from the frontend's selected property/listing identity to the season's authoritative primary supply. Verify the underlying property identifiers and snapshot before implementing the mapping.
- Align the server purchase calculation with the already user-approved IA-03B.1 fee schedule.
- Harden authorization and Firestore rules so participants can access only their permitted data and clients cannot write economic/research state directly.
- Connect `/play` research hooks to the existing server logging contract, preserving the existing PLAY-07.5 decision that research write failures do not roll back a committed economic transaction and are routed to DLQ/logging.
- Provide safe result handling so a success state is shown only after the callable confirms its committed result.
- Add/update verification artifacts for the changed integration contract. Run only the targeted checks approved in the AG prompt; do not use production economic data for fixtures.

### Explicitly out of scope

- Creating a new transaction engine or a parallel purchase path.
- Replacing Firestore, Cloud Functions, Cloud Tasks, the current PLAY state model, or property market architecture.
- Implementing SELL, rankings, rewards, notifications, or a new secondary-market UX.
- Deploying Functions/rules/Hosting, creating/deleting queues, modifying IAM, changing Firebase project settings, or mutating a real season.
- Presenting mock data or a local simulation as proof of a real purchase.
- Browser visual QA or unrelated UI redesign.

## 4. Product Rules Already Decided

These are prior explicit user decisions and must not be reopened as new questions:

### Authoritative purchase fee

The server must apply the user's existing IA-03B.1 schedule using the authoritative price and exclusive area:

| Price | Area | Total rate |
|---|---|---:|
| `price <= ₩600,000,000` | `area <= 85㎡` | 1.1% |
| `price <= ₩600,000,000` | `area > 85㎡` | 1.3% |
| `₩600,000,000 < price <= ₩900,000,000` | any | linearly interpolate 2.2% to 2.4% |
| `price > ₩900,000,000` | `area <= 85㎡` | 3.3% |
| `price > ₩900,000,000` | `area > 85㎡` | 3.5% |

For the middle interval:

```text
rate = 0.022 + ((price - 600,000,000) / 300,000,000) * 0.002
```

No extra area surcharge applies in that interval. Preserve the defined discontinuities at the boundaries. Do not retain the current backend's fixed 2% fee.

### Server authority and transaction truth

- The server derives user identity from verified Firebase Auth context.
- The server loads price, area, available supply, participant membership, cash and transaction status from authoritative records.
- Never trust client cash, price, fee, ownership, supply availability, final status, or net worth.
- A client displays a committed BUY result only after the callable returns confirmed committed/already-processed transaction identity and the authoritative state can be refreshed.
- Reuse `purchasePrimaryProperty` and its transaction boundary; refactor that implementation only as needed to meet this spec and preserve existing data contracts.

### Research logging

Preserve `PLAY-07.5_RESEARCH_LOGGING_DECISION_RECORD.md`: Exposure/Decision may be logged outside the economic transaction; log validation outcome; emit Transaction only after successful commit; research failure must not roll back BUY; preserve DLQ/failure logging. Do not change this policy without a separately approved change.

## 5. Current Backend Contract to Reconcile

Current callable: `purchasePrimaryProperty` in `functions/src/play/market/purchasePrimaryProperty.ts`.

Current payload is `{ season_id, supply_id, idempotency_key, research_context? }`; current result is `{ status, transaction_id }`. Current source charges fixed 2%, uses `PLAY_PRIMARY_SUPPLY`, `PLAY_PLAYER_ASSET`, `PLAY_PROPERTY_OWNERSHIP`, `PLAY_PROPERTY_TRANSACTION`, `PLAY_DECISION_LOG`, and `PLAY_IDEMPOTENCY_LOGS`, and performs mutations in a Firestore transaction.

The `/play` frontend currently reads `play/data/suji_properties.json`, uses `property_id`, and has no Firebase SDK/Auth/Functions integration. Its research hooks are console-only, and `doBuyTransaction()` only changes local UI state. `PLAY_PROPERTY_STATE` and an exact `PLAY_TRANSACTION` collection are not current code contracts; do not create them just to mirror old documents.

Before editing the contract, verify whether a `property_id` from the exact current frontend data resolves unambiguously to a single active season supply record and to the expected authoritative price/area. If not, stop at the Decision Gate in section 9; do not invent a mapping or create data.

## 6. Required Integration Behavior

### Authentication and participant context

- Determine whether the current RealRankers Firebase Auth instance can be reused without initializing a duplicate app or creating a second identity.
- Do not add a second sign-in system without approval.
- The browser may send `season_id` and listing/property identity. The backend derives `user_id` from Auth and resolves `player_id`; a client-supplied player ID is not authoritative.
- If `/play` has no valid signed-in user or no joined player in the selected season, fail closed with an understandable non-success state.

### Authoritative reads

- Return only the signed-in participant's permitted player state and owned-property summary.
- Do not expose the raw `PLAY_PLAYER_ASSET`, other participants' detailed records, or direct client writes as a workaround.
- A client-facing read endpoint must validate authentication, season/player membership, and the minimum required response fields.
- Keep the current display graceful when state is absent; do not fabricate cash or show the static starting capital as live balance.

### Listing/supply resolution

- Resolve the selected frontend identity server-side to a current, available supply in the active season.
- Use server price/area and tradability. Reject stale, missing, ambiguous, unavailable, or non-tradable mappings without mutation.
- Never accept a client-supplied `supply_id` as sufficient proof that the selected listing maps to it; validate the relationship server-side.
- Do not change the property master ingestion format or create a new listing collection without an approval gate.

### Purchase and idempotency

- Scope and validate idempotency so a key cannot leak another participant's prior result or be reused across a different season, user, operation, or supply.
- Keep cash, supply availability, ownership, transaction record, decision log, and idempotency result inside the existing Firestore transaction boundary.
- Concurrent attempts against the same remaining supply must result in at most one successful purchase.
- A retry after a committed request must return the same transaction identity without applying economic changes again.
- Preserve current response compatibility where possible; document any contract change and request approval if it crosses the work-control protocol's API/schema boundary.

### Firestore access and authorization

- Client writes to all economic collections remain denied.
- Restrict user reads to their own permitted records or route through a server endpoint. Do not leave broad authenticated reads of all PLAY collections.
- Explicitly deny client access to `RESEARCH_EVENTS` and `RESEARCH_EVENTS_DLQ` unless an approved, narrower policy requires an authorized read path.
- Add actual admin/role authorization to admin operations and restrict batch/operational callables to intended operators. Do not treat `request.auth != null` as an admin check.
- Never weaken rules to make frontend integration work.

### Research integration

- Replace console-only hooks with a server-mediated logging call using established event types and correlation fields.
- Do not let a browser directly write Research Events.
- Respect the existing event schema, deterministic ID behavior, and failure/DLQ policy. If current fire-and-forget behavior cannot meet the already approved “do not silently lose event” requirement, document a compatible fix and stop if it changes the approved architecture.

## 7. Safety and No-Deployment Rules

- Do not deploy, create queues, change IAM, choose a Firebase project, or write to real Firestore during this task.
- Do not create a real season or perform an actual purchase.
- Use emulators or isolated test fixtures only, and clearly label the environment.
- Do not treat prior test reports as proof of current live deployment.
- Never commit secrets or service-account keys. Do not read or print private key contents.
- Keep production UI in a non-purchasable/disabled state until all required decisions, security gates, and release approval are satisfied.

## 8. Verification Expectations

After implementation is authorized and completed, run targeted local checks for:

1. unauthenticated calls rejected;
2. a participant cannot read another participant's assets/ownership;
3. non-admin users cannot invoke admin/operational actions;
4. fee schedule boundaries and middle-band interpolation;
5. missing, stale, ambiguous, unavailable, and non-tradable supply mappings reject without mutation;
6. insufficient cash rejects without mutation;
7. successful purchase atomically updates the existing records;
8. idempotent retry returns the original transaction without a second deduction;
9. competing requests for the same one-unit supply commit at most once;
10. research failure does not reverse a committed BUY and leaves the expected DLQ/failure evidence;
11. UI success appears only after a confirmed backend result; refresh shows server state.

No test against production data. If an existing harness cannot safely test a case, report it as NOT VERIFIED instead of simulating a pass.

## 9. Decision / Approval Gates

The following are not to be silently decided by AG:

### Product Owner decisions

1. **Starting capital:** keep the current ₩700M fixed for every season, make it season/scenario configuration, or use another rule. Until decided, do not change the established initial cash behavior as part of this integration.
2. **Market semantics:** confirm that `/play`'s selected property/listing is intended to purchase the season-specific primary supply generated from `PLAY_PROPERTY_MASTER`. The existing IA-03C spec says BUY targets a listing, while the current backend accepts a primary `supply_id`; the mapping must be confirmed against the actual data.
3. **Research data notice/retention:** document user notice/consent and retention period for behavioral research events before enabling new collection from `/play`.

The fee policy and best-effort research failure behavior are already established above; do not ask the PO to decide them again.

### Existing PLAY work-control approval gates

Follow `PLAY_AG_WORK_CONTROL_PROTOCOL.md`. Stop and request approval before changing any protected architecture area, including Firebase Auth architecture, Firestore collection/schema shape, callable API contracts, idempotency semantics, transaction boundary, Cloud Tasks configuration, deployment model, or any previously verified core infrastructure. Present the exact files, concrete diff proposal, risk, and compatibility plan. Do not make the change while awaiting approval.

### Stop conditions

Stop and report if:

- listing-to-supply mapping is not deterministic or data consistency is not proven;
- the approved fee rule cannot be implemented using authoritative backend data;
- a safe read path cannot be added without changing protected schema/API/security architecture;
- permission/security requirements conflict with the existing model;
- a live Firebase project, queue, IAM, or deployment action would be required to proceed;
- a real economic state mutation would be required for verification;
- any requested step would make the UI claim a purchase before backend commit.

## 10. Definition of Done

- `/play` integration contract is documented and uses the existing PLAY backend; no parallel transaction engine exists.
- Participant Auth and authoritative state path are explicit, server-validated, and least-privilege.
- Listing identity mapping is proven or explicitly blocked as NOT VERIFIED; no guessed mapping remains.
- Server fee calculation matches the previously approved IA-03B.1 rule.
- Rules and callable authorization do not expose other users' private economic data or permit client economic/research writes.
- Purchase response and UI state distinguish pending, rejection, already processed, and committed success.
- Research hook has a defined server-mediated path consistent with the existing decision record.
- Targeted verification results and limitations are reported accurately.
- No deployment or real economic transaction occurred.
- All unapproved architecture changes remain untouched and are listed for approval.

## 11. Required Final Report

1. Changed files and purpose.
2. Final Auth/read/purchase/research contracts.
3. Property-to-supply mapping evidence and unresolved data mismatch.
4. Fee implementation and boundary verification.
5. Security/rules changes and authorization matrix.
6. Atomicity/idempotency/concurrency verification.
7. Research event failure/DLQ behavior.
8. UI behavior for success/rejection/stale state.
9. Tests run and exact results; unrun items as NOT VERIFIED.
10. Deployment/live-cloud status explicitly NOT DEPLOYED / NOT VERIFIED.
11. Approval gates encountered, with concrete proposed diffs; do not imply approval.
12. Confirmation that no real purchase or production mutation occurred.
