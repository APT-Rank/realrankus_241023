# AG EXECUTION PROMPT --- PLAY GLOBAL SHELL & FIRST SCREEN WIREFRAME

## Role

You are implementing the PLAY Independent Service.

The current task is strictly limited to:

**Global Shell + First Screen Layout + Global Navigation**

This is a functional wireframe stage.

Do not perform Visual Polish.

------------------------------------------------------------------------

## 1. Mandatory Documents

Before editing anything, read completely:

1.  `PLAY_GLOBAL_SHELL_FIRST_SCREEN_WIREFRAME_IMPLEMENTATION_SPEC_v1.0.md`
2.  `PLAY_INFORMATION_ARCHITECTURE_SPEC_v1.0.md`
3.  `PLAY-INDEPENDENT-SERVICE_IMPLEMENTATION_REPORT.md`
4.  Existing IA-01 implementation/report
5.  Existing IA-02 implementation/report

Treat the IA document and this execution spec as Product Owner approved
constraints.

Do not reinterpret or redesign them.

------------------------------------------------------------------------

## 2. Current Development Principle

Current priority:

``` text
FUNCTION
→ INTERACTION
→ STATE
→ DATA
→ EXCEPTION
→ E2E
→ VISUAL POLISH
```

Therefore:

### DO

-   Implement functional structure.
-   Implement navigation.
-   Implement responsive layout.
-   Implement state transitions.
-   Preserve existing IA-01/IA-02.
-   Use grayscale/black-white wireframe UI.

### DO NOT

-   Add final colors.
-   Add gradients.
-   Add complex animation.
-   Add final graphic design.
-   Add 3D visual polish.
-   Add fabricated business data.
-   Rebuild verified backend.
-   Refactor unrelated code.

------------------------------------------------------------------------

## 3. Reference Image

The user provided a reference screenshot showing the intended overall
PLAY screen.

Use it only for:

-   information hierarchy
-   global header placement
-   navigation density
-   map/command-panel composition
-   overall screen structure

Do NOT attempt pixel-perfect visual reproduction.

Current output must remain grayscale wireframe.

------------------------------------------------------------------------

## 4. Target Header

Implement:

### Brand

``` text
PLAY
REAL ECONOMY SIMULATION
```

### Primary Navigation

``` text
홈
지도보기
지역탐색
내 자산
다른 참가자
시즌랭킹
가이드
```

### Utility Navigation

``` text
검색
알림
설정
플레이어 정보
시즌
```

------------------------------------------------------------------------

## 5. Navigation Mapping

Use exactly:

  Menu            IA                  Behavior
  --------------- ------------------- -----------------------------------
  홈              WORLD               Navigate/show WORLD
  지도보기        WORLD               Navigate/show WORLD
  지역탐색        REGION              Connect to current WORLD → REGION
  내 자산         MY WORLD            Placeholder
  다른 참가자     PEOPLE              Placeholder
  시즌랭킹        SEASON              Placeholder
  가이드          SYSTEM / GUIDE      Placeholder
  검색            Discovery           Wireframe UI
  알림            NOTIFICATION        Placeholder
  설정            SYSTEM              Placeholder
  플레이어 정보   PLAYER / MY WORLD   Placeholder
  시즌            SEASON              Placeholder

Do not invent additional product behavior.

------------------------------------------------------------------------

## 6. Desktop Layout

Maintain:

``` text
Header
────────────────────────────────────────

Map / World             Command Panel
~60%                    ~40%
```

The existing IA-01 layout must remain intact.

The new header sits above the existing PLAY content.

------------------------------------------------------------------------

## 7. Mobile Layout

Maintain:

``` text
Mobile Header
────────────────
World / Map
────────────────
Command Panel
```

Primary navigation may collapse into a compact mobile navigation.

Utility actions may be represented by compact icons/buttons.

Do not remove access to required navigation.

------------------------------------------------------------------------

## 8. Existing IA Protection

Before editing, identify current IA-01/IA-02 entry points and state
functions.

Do not break:

``` text
WORLD
 ↓
REGION
 ↓
COMPLEX
 ↓
LISTING
 ↓
LISTING DETAIL
```

After implementation, explicitly regression-test this entire flow.

------------------------------------------------------------------------

## 9. Protected Areas

DO NOT MODIFY:

-   Economic Engine
-   Economic Batch Processing
-   Season Clock
-   Property Market Engine
-   Primary Transaction
-   Secondary Transaction
-   Security Rules
-   Research Logging Infrastructure
-   Research Event DLQ
-   Property Master schema
-   Existing RealRankers `app_main_lang.js`
-   Existing RealRankers CSS
-   unrelated Firebase Functions

If modification is required in any protected area:

**STOP.**

Do not work around it silently.

Report:

``` text
CONFLICT
Affected Area
Why Change Appears Necessary
Potential Risk
Suggested Alternatives
```

Then wait for approval.

------------------------------------------------------------------------

## 10. Independent Service

Keep the existing independent structure:

``` text
/play/index.html
/play/css/play.css
/play/js/play_app.js
/play/data/
```

Do not reconnect PLAY to RealRankers global JS/CSS.

------------------------------------------------------------------------

## 11. Wireframe Rules

Use only:

-   black
-   white
-   grayscale
-   borders
-   simple typography
-   simple icons/placeholders

Avoid:

-   final blue brand color
-   red/green market colors
-   gradients
-   shadows that simulate final design
-   decorative imagery
-   polished cards
-   animation

The purpose is to verify:

> "Does the user understand where they are and what they can do?"

------------------------------------------------------------------------

## 12. Implementation Sequence

Follow exactly:

### Step 1

Audit current `/play` files and existing IA-01/IA-02 implementation.

### Step 2

Implement Global Header.

### Step 3

Implement Primary Navigation.

### Step 4

Implement Utility Navigation.

### Step 5

Connect:

``` text
홈 → WORLD
지도보기 → WORLD
지역탐색 → REGION
```

### Step 6

Add placeholders for:

``` text
내 자산
다른 참가자
시즌랭킹
가이드
알림
설정
플레이어 정보
시즌
```

### Step 7

Verify desktop.

### Step 8

Verify mobile.

### Step 9

Run IA-01 regression.

### Step 10

Run IA-02 regression.

### Step 11

STOP.

Do not begin IA-03.

------------------------------------------------------------------------

## 13. Acceptance Tests

### GS-01

PLAY header appears on the first screen.

### GS-02

Seven primary navigation items appear.

### GS-03

Utility navigation appears.

### GS-04

Home returns to WORLD.

### GS-05

Map View returns to WORLD.

### GS-06

Region Explore connects to REGION.

### GS-07

Unimplemented menus show explicit placeholder state.

### GS-08

WORLD → REGION → COMPLEX works.

### GS-09

COMPLEX → LISTING → LISTING DETAIL works.

### GS-10

Back navigation works.

### GS-11

Desktop layout preserves Map \~60% / Command Panel \~40%.

### GS-12

Mobile layout preserves Map top / Command Panel bottom.

### GS-13

No protected backend changes.

### GS-14

No fabricated business data.

### GS-15

UI remains grayscale wireframe.

------------------------------------------------------------------------

## 14. Required Final Report

After implementation, report:

### A. Files Changed

List exact files.

### B. Global Shell

Describe header and navigation implementation.

### C. IA Mapping

Show:

``` text
홈 → WORLD
지도보기 → WORLD
지역탐색 → REGION
```

and placeholders.

### D. Desktop Verification

State result.

### E. Mobile Verification

State result.

### F. IA-01 Regression

State result.

### G. IA-02 Regression

State result.

### H. Protected Areas

Explicitly confirm whether any protected area changed.

### I. Visual Scope

Confirm that implementation remains grayscale wireframe.

### J. Remaining Work

State that IA-03 is next.

------------------------------------------------------------------------

## 15. STOP CONDITION

After the Global Shell / First Screen implementation and verification
are complete:

**STOP.**

Do not implement:

-   IA-03
-   Buy
-   Sell
-   Hold
-   Result
-   My World
-   People
-   Season Ranking
-   Notification system
-   Final Visual Design

Those are separate stages.

The goal of this task is:

> **A stable, functional, grayscale PLAY Global Shell that becomes the
> foundation for every subsequent IA implementation.**
