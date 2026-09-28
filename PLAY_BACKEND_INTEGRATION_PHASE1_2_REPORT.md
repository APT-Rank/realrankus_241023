# PLAY Backend Integration - Phase 1 Contract Review and Phase 2 Approval Gate

## 1. Current Starting State (Contract Map)
- **Source-Confirmed Facts:**
  - `purchasePrimaryProperty.ts` exists and uses a secure Firestore transaction.
  - It currently charges a hardcoded fixed 2.0% purchase fee (`Math.floor(price * 0.02)`), ignoring the new IA-03B.1 rule (which requires area-based computation).
  - The callable expects `supply_id`, but the `/play` frontend only has `property_id` from `suji_properties.json` (which matches `PLAY_PROPERTY_MASTER.property_id`).
  - `PLAY_PRIMARY_SUPPLY` records are created with a random `supply_id` in `createSeason.ts`. A query (`season_id` + `property_id`) is needed to map them.
- **Report-only Claims:**
  - Past audit claims that `/play` lacks auth and backend integration. Confirmed: `/play` is currently a static UI.
- **Unknown Live-Cloud Facts:**
  - We do not assume any Firebase Functions, Firestore rules, or Cloud Tasks are actually deployed in a live environment.

## 2. Unresolved Product Owner Decisions (Phase 1)
As required by section 9 of the spec, I am pausing dependent code changes to present the concrete choices for the unresolved PO decisions:

### Decision 1: Starting Capital
Currently, the UI assumes ₩700M starting cash.
* **Option A (Fixed):** Keep the current ₩700M fixed for every season.
  * *Implementation:* We will hardcode ₩700M as the default cash when joining a season.
* **Option B (Configuration):** Make it season/scenario configuration.
  * *Implementation:* Read `season.config.starting_capital` during `joinSeason`.
* **Consequence/Blocked:** Without this decision, we cannot properly implement or verify the `joinSeason` cash initialization for new participants.

### Decision 2: Market Semantics
The frontend selects a `property_id`.
* **Option A (Primary Supply):** Confirm that the `property_id` maps directly to the season-specific `PLAY_PRIMARY_SUPPLY` generated from `PLAY_PROPERTY_MASTER`.
  * *Implementation:* The backend will query `PLAY_PRIMARY_SUPPLY` for the given `season_id` and `property_id` to resolve the `supply_id` and perform the primary purchase.
* **Option B (Secondary or Different):** The target is a different listing pool.
  * *Implementation:* We would need a different resolution logic.
* **Consequence/Blocked:** The supply resolution logic in `purchasePrimaryProperty` is blocked until we confirm the target is `PLAY_PRIMARY_SUPPLY`.

### Decision 3: Research Data Notice/Retention
* **Option A:** Approve a standard 90-day retention with basic notice.
  * *Implementation:* Add notice to the UI, log events with retention tag.
* **Option B:** Opt-out or different terms.
* **Consequence/Blocked:** Enabling real behavioral data collection from `/play` is blocked pending legal/consent coverage.

## 3. Approval Gate for Protected Architecture (Phase 2)
To implement the approved integration safely, the following changes to protected architecture require explicit approval before I proceed:

### Change Request 1: `purchasePrimaryProperty` Contract & Fee Update
* **Exact files to change:** `functions/src/play/market/purchasePrimaryProperty.ts`
* **Proposed before/after:**
  * *Before:* Callable accepts `supply_id`. Charges fixed 2% fee (`Math.floor(price * 0.02)`).
  * *After:* Callable accepts `property_id` instead of `supply_id`. Resolves `supply_id` via a server-side query. Fetches `PLAY_PROPERTY_MASTER` to get `representative_area_sqm`, and applies the IA-03B.1 fee schedule (1.1%, 1.3%, linear 2.2-2.4%, 3.3%, 3.5%).
* **Why existing code cannot safely meet the requirement:** The frontend does not know the randomly generated `supply_id`, and the hardcoded 2% fee violates the new approved transaction-cost formula.
* **Compatibility and migration impact:** Any existing scripts using `purchasePrimaryProperty` with `supply_id` will break. We will need to update test fixtures (e.g., `verify_market_e2e_final.ts`) to send `property_id`.
* **Risk and targeted verification plan:** High risk (modifies core transaction logic). Verified by running tests, specifically checking the new fee bounds and idempotency.

### Change Request 2: Authoritative Read Endpoint (Player State)
* **Exact files to change:** New function `functions/src/play/season/getPlayerState.ts` (or similar) and `firestore.rules`.
* **Proposed before/after:**
  * *Before:* No read endpoint. Client reads are denied.
  * *After:* Provide a least-privilege authenticated callable (or precise Firestore rule) for a user to read their own `PLAY_PLAYER_ASSET` and `PLAY_PROPERTY_OWNERSHIP`.
* **Why existing code cannot safely meet the requirement:** `/play` cannot display cash or ownership without fabricating it, violating "Server Authority".
* **Compatibility and migration impact:** Safe addition. No breaking changes to existing backend.
* **Risk and targeted verification plan:** Low risk. Verified by confirming unauthenticated and cross-user reads fail.

## 4. Conclusion
Execution is **STOPPED** at the Phase 2 Approval Gate and Phase 1 PO Decision Gate.
- **NOT DEPLOYED / NOT VERIFIED.**
- **No real economic mutation occurred.**
- **IA-03C Actual Buy is NOT ready** (blocked by decisions and approvals).

Awaiting your choices (A/B) for the PO Decisions and explicit Approval to proceed with the protected architecture changes.
