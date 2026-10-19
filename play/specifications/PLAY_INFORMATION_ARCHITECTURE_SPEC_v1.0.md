# PLAY INFORMATION ARCHITECTURE SPECIFICATION v1.0

## 0. Document Status

-   Status: FIXED / PRODUCT OWNER APPROVED
-   Scope: PLAY Human Product / UX Information Architecture
-   Purpose: Define the information hierarchy, primary gameplay flow,
    navigation structure, and screen-to-engine relationship for AG
    implementation.
-   This document does not authorize changes to verified PLAY economic
    engine, transaction engine, infrastructure, reliability, or Research
    Logging behavior.

## 1. Product Definition

PLAY is not a conventional real-estate dashboard. It is a living
economic simulation environment where users observe a changing world,
explore regions and properties, make decisions, execute actions,
experience consequences, and return to the changing world.

Core experience: **WORLD → DISCOVER → EXPLORE → JUDGE → ACT → RESULT →
NEW CURIOSITY → WORLD**

Primary real-estate gameplay path: **WORLD → REGION → COMPLEX → LISTING
→ INFORMATION → DECISION → ACTION → TRANSACTION → RESULT → MY WORLD →
WORLD CHANGE**

## 2. Fixed Layout Principle

### Web

**LEFT = WORLD MAP / LIVING WORLD** **RIGHT = CONTEXTUAL COMMAND PANEL**

The map is the primary discovery/selection space. The right panel is the
decision/action space and changes context according to the selected
object: WORLD → REGION → COMPLEX → LISTING → DECISION.

### Mobile

**TOP = WORLD MAP** **BOTTOM = CONTEXTUAL COMMAND PANEL**

The same IA and interaction model must be preserved; only spatial
composition changes.

## 3. Primary Hierarchy

``` text
PLAY
├─ 01 WORLD
│  ├─ World Map
│  ├─ Economic Environment
│  ├─ Market Events
│  ├─ World Activity
│  └─ Time Control
├─ 02 REGION
│  ├─ Region Overview
│  ├─ Region Market
│  ├─ Region Complexes
│  └─ Region Activity
├─ 03 COMPLEX
│  ├─ Complex Overview
│  ├─ Price & Market
│  ├─ Complex Information
│  └─ Complex Market
├─ 04 LISTING
│  ├─ Listing List
│  ├─ Listing Detail
│  ├─ Market Comparison
│  └─ Listing Action
├─ 05 DECISION / ACTION
│  ├─ Explore
│  ├─ Compare
│  ├─ Watch
│  ├─ Buy
│  ├─ Sell
│  └─ Hold
├─ 06 MY WORLD
│  ├─ Portfolio
│  ├─ My Properties
│  ├─ My Market
│  └─ My Performance
├─ 07 PEOPLE
│  ├─ Participants
│  ├─ Participant Activity
│  ├─ Market Behavior
│  └─ Participant Profile
├─ 08 SEASON
│  ├─ Season Status
│  ├─ Season Market
│  ├─ Season Ranking
│  └─ Season Result
├─ 09 NOTIFICATION / DISCOVERY
│  ├─ My Result
│  ├─ My Interest
│  ├─ World Flow
│  └─ Other People
└─ 10 SYSTEM / GUIDE
   ├─ Guide
   ├─ Notification Settings
   └─ Account
```

## 4. IA Hierarchy Table

  ---------------------------------------------------------------------------
  Depth 1           Depth 2           Depth 3           Function
  ----------------- ----------------- ----------------- ---------------------
  WORLD             World Map         Map               Observe and explore
                                                        the living economic
                                                        world

  WORLD             World Map         Price Change      Regional price
                                                        movement

  WORLD             World Map         Transaction       Regional market
                                      Volume            activity

  WORLD             World Map         Supply / Demand   Market conditions

  WORLD             Economic          Interest Rate     Current simulated
                    Environment                         rate

  WORLD             Economic          Inflation         Current inflation
                    Environment                         

  WORLD             Economic          Housing Market    Current
                    Environment                         housing-market
                                                        condition

  WORLD             Market Events     Economic / Policy Major world changes
                                      / Supply Events   

  WORLD             World Activity    Recent Changes    Discover recent
                                                        changes

  WORLD             World Activity    Other Participant Observe participant
                                      Activity          actions

  WORLD             Time Control      Current Period /  Season, year, month
                                      Advance Time      and simulation time

  REGION            Region Overview   Basic Status      Current state of
                                                        selected region

  REGION            Region Overview   Price / Volume /  Regional market
                                      Jeonse / Supply   indicators

  REGION            Region Overview   Development       Development and
                                                        infrastructure

  REGION            Region Complexes  Major Complexes   Complexes in selected
                                                        region

  REGION            Region Complexes  Price / Change /  Explore alternatives
                                      Volume / Interest 
                                      Sort              

  REGION            Region Activity   Participant       Behavior in selected
                                      Activity          region

  REGION            Region Activity   New Listings      Newly registered
                                                        listings

  COMPLEX           Complex Overview  Basic Information Name, location,
                                                        households, age,
                                                        representative area

  COMPLEX           Complex Overview  Current Price /   Current market status
                                      Price Change /    
                                      Volume            

  COMPLEX           Price & Market    Price Trend       Historical trend

  COMPLEX           Price & Market    Recent            Completed
                                      Transactions      transactions

  COMPLEX           Price & Market    Market Price /    Market context
                                      Average Listing / 
                                      Jeonse            

  COMPLEX           Complex           Surrounding       Decision-supporting
                    Information       Complexes /       context
                                      Transit / School  
                                      / Environment /   
                                      Development       

  COMPLEX           Complex Market    Current Listings  Active supply

  COMPLEX           Complex Market    Buy Orders / Sell Current demand and
                                      Orders            supply

  COMPLEX           Complex Market    Transaction       Completed trades
                                      History           

  LISTING           Listing List      All / Sale /      Active listings
                                      Jeonse / Monthly  
                                      Rent              

  LISTING           Listing List      Price / Area /    Listing exploration
                                      Recent Sort       

  LISTING           Listing Detail    Price / Area /    Concrete property
                                      Floor / Direction details

  LISTING           Listing Detail    Registration Date Market state
                                      / Seller / Status 

  LISTING           Market Comparison Market / Recent   Price context
                                      Transaction /     
                                      Average Listing   

  LISTING           Listing Action    Explore / Compare Direct actions
                                      / Watch / Buy     

  DECISION          Explore           Explore           Browse region,
                                                        complex, listing

  DECISION          Compare           Compare           Compare alternatives

  DECISION          Watch             Watch             Track future changes

  DECISION          Buy               Funding / Cost /  Purchase decision
                                      Expected Result / 
                                      Submit            

  DECISION          Sell              Select Property / Sale decision
                                      Market Context /  
                                      Asking Price /    
                                      Expected Result / 
                                      Register          

  DECISION          Hold              Hold              Do not transact;
                                                        observe world

  MY WORLD          Portfolio         Cash / Debt /     Personal economic
                                      Properties / Net  state
                                      Worth / Cash Flow 

  MY WORLD          My Properties     Detail /          Owned assets
                                      Acquisition /     
                                      Current Value /   
                                      P&L / Sell        

  MY WORLD          My Market         Watched Listings  Personal market
                                      / My Sell         activity
                                      Listings / My Buy 
                                      Orders / Order    
                                      Status            

  MY WORLD          My Performance    Asset Change /    Personal outcome and
                                      Economic Freedom  behavior
                                      / Decision Record 
                                      / Expected vs     
                                      Actual            

  PEOPLE            Participants      All / Participant Other participants
                                      Detail            

  PEOPLE            Participant       Buy / Sell /      Observable activity
                    Activity          Explore           

  PEOPLE            Market Behavior   Popular Regions / Collective behavior
                                      Complexes /       
                                      Transaction Flow  

  SEASON            Season Status     Progress /        Season context
                                      Participants /    
                                      Economic          
                                      Environment       

  SEASON            Season Market     Market Status /   Season outcomes
                                      Regional Results  
                                      / Transaction     
                                      Results           

  SEASON            Season Ranking    Asset Growth /    Multidimensional
                                      Cash Flow /       outcomes
                                      Economic Freedom  
                                      / Decision Result 

  SEASON            Season Result     Personal Result / Season-level feedback
                                      Behavior Analysis 
                                      / Comparison /    
                                      Report            

  NOTIFICATION      My Result         Transaction       Re-engagement
                                      Result / Asset    
                                      Change            

  NOTIFICATION      My Interest       Listing / Region  Re-engagement
                                      Change            

  NOTIFICATION      World Flow        Economic Change   Re-engagement

  NOTIFICATION      Other People      Significant       Re-engagement
                                      Participant       
                                      Activity          

  SYSTEM            Guide             PLAY / Economic / Learning
                                      Trading / Season  
                                      Guide             

  SYSTEM            Notification      Global / Category User notification
                    Settings          / Frequency       control

  SYSTEM            Account           Profile /         Account management
                                      Settings / Logout 
  ---------------------------------------------------------------------------

## 5. Primary Gameplay Flow

``` text
WORLD
 ↓
DISCOVER CHANGE
 ↓
REGION
 ↓
COMPLEX
 ↓
LISTING
 ↓
INFORMATION
 ↓
DECISION
 ├─ EXPLORE
 ├─ COMPARE
 ├─ WATCH
 ├─ BUY
 ├─ SELL
 └─ HOLD
      ↓
ACTION
      ↓
VALIDATION
      ↓
TRANSACTION / NO TRANSACTION
      ↓
RESULT
      ↓
MY WORLD
      ↓
WORLD CHANGES
      ↓
NEXT DISCOVERY
```

## 6. Buy Flow

``` text
WORLD → REGION → COMPLEX → LISTING → LISTING DETAIL → BUY
→ FUNDING CHECK → TRANSACTION COST → EXPECTED RESULT
→ BUY ORDER → VALIDATION → TRANSACTION → RESULT → MY WORLD
```

## 7. Sell Flow

``` text
MY WORLD → MY PROPERTIES → PROPERTY → SELL
→ MARKET CONTEXT → ASKING PRICE → EXPECTED RESULT
→ LISTING REGISTRATION → MARKET
→ OTHER PARTICIPANT BUY DECISION → TRANSACTION → RESULT
```

A user's sell listing becomes another participant's potential buy
target.

## 8. Web Screen Structure

``` text
┌───────────────────────────────────────────────────────────┐
│ GLOBAL NAVIGATION                                         │
├────────────────────────────────┬──────────────────────────┤
│                                │ CONTEXTUAL COMMAND PANEL │
│                                │                          │
│            WORLD MAP            │ WORLD → REGION          │
│                                │ → COMPLEX → LISTING     │
│                                │ → DECISION              │
│                                │                          │
│                                │ EXPLORE / COMPARE / WATCH│
│                                │ BUY / SELL / HOLD       │
├────────────────────────────────┴──────────────────────────┤
│ DISCOVERY / ACTIVITY / RECOMMENDED REGIONS                │
└───────────────────────────────────────────────────────────┘
```

The right panel is contextual and must not show every function
simultaneously.

## 9. Mobile Screen Structure

``` text
┌──────────────────────┐
│ GLOBAL NAV           │
├──────────────────────┤
│      WORLD MAP       │
│                      │
├──────────────────────┤
│ SELECTED CONTEXT     │
│ REGION / COMPLEX     │
│ LISTING              │
├──────────────────────┤
│ COMMAND              │
│ 탐색 비교 관심       │
│ 매수 매도 관망       │
├──────────────────────┤
│ RESULT / ACTIVITY    │
└──────────────────────┘
```

## 10. First-Class Objects

``` text
SEASON → WORLD → REGION → COMPLEX → LISTING → DECISION → ACTION → TRANSACTION → OUTCOME
```

Additional first-class axes: PARTICIPANT, MY WORLD, TIME, ECONOMIC
ENVIRONMENT.

A Complex is not the final transaction object. A **Listing is the
concrete market object that can be purchased or sold.**

## 11. UX ↔ Engine Mapping

  UX Object     PLAY Engine / Data
  ------------- --------------------------------
  WORLD         Economic State
  REGION        Property Market / Region State
  COMPLEX       Property Master
  LISTING       Primary / Secondary Market
  DECISION      Decision Log
  ACTION        Action / Validation
  BUY           Purchase Transaction
  SELL          Sell Listing / Order
  HOLD          Decision Event
  TRANSACTION   Transaction
  RESULT        Player State / Outcome
  MY WORLD      Player Asset
  PEOPLE        Participant / Behavior Data
  SEASON        Season State

The UX layer must call the existing authoritative backend. Do not
reimplement economic authority in the client.

## 12. Research Logging Alignment

``` text
EXPOSURE → DECISION → ACTION → VALIDATION → TRANSACTION → OUTCOME
```

The UI must preserve this relationship. Example: listing opened =
Exposure; buy path selected = Decision; buy submitted = Action;
rules/funds check = Validation; successful trade = Transaction; state
change = Outcome.

## 13. Non-Negotiable Product Principles

1.  Living World
2.  User-driven exploration
3.  Concrete decision targets
4.  Action → consequence
5.  Other participant behavior
6.  Continuous discovery
7.  Return motivation
8.  Economic achievement through operation

Do not turn PLAY into a static real-estate dashboard, simple ranking
site, buy/sell-only interface, pure wealth leaderboard, prescriptive
investment system, or disconnected collection of screens.

## 14. Implementation Boundary

Authorized: - navigation structure - screen hierarchy - contextual panel
states - transitions - information grouping - responsive desktop/mobile
layout - frontend state binding to existing APIs - research exposure
mapping

Not authorized: - economic engine changes - transaction atomicity
changes - reliability architecture changes - Security Rules changes -
Research Logging schema/durability changes - Property Master rules
changes - Season Clock changes - batch-processing changes

If implementation requires a verified-area change: **STOP → REPORT
CONFLICT → DO NOT MODIFY.**

## 15. Implementation Order

### IA-01: World → Region → Complex

Acceptance: map selection, region context, complex context, web
left/right layout, mobile top/bottom layout.

### IA-02: Complex → Listing

Acceptance: listing list/detail, readable listing data, market
comparison, existing backend data.

### IA-03: Listing → Decision

Acceptance: Explore, Compare, Watch, Buy, Sell, Hold appear
contextually.

### IA-04: Decision → Action → Result

Acceptance: authoritative backend action, validation visibility,
understandable success/failure, state update, Research Logging intact.

### IA-05: My World / People / Season

Implement only after the primary gameplay flow is stable.

## 16. Change Control

If a proposal conflicts with this IA: 1. Identify conflicting IA rule.
2. Explain conflict. 3. Explain expected product benefit. 4. Propose
alternative. 5. STOP implementation. 6. Request Product Owner approval.

No silent reinterpretation.

## 17. Definition of Done

-   World → Region works.
-   Region → Complex works.
-   Complex → Listing works.
-   Listing → Decision works.
-   Buy flow reaches authoritative backend.
-   Sell flow reaches authoritative backend.
-   Hold flow works.
-   Result returns to My World.
-   World continues changing after action.
-   Web = Map LEFT / Command RIGHT.
-   Mobile = Map TOP / Command BOTTOM.
-   Contextual panel changes by selected object.
-   Listing is a first-class market object.
-   User listings can become other participants' buy targets.
-   Other participants' listings can become user buy targets.
-   Research Logging remains Exposure → Decision → Action → Validation →
    Transaction → Outcome.
-   No verified backend area modified without explicit approval.
-   No client-side economic authority introduced.

## 18. Final Product Model

The final PLAY experience should feel like:

> **A living economic world that the user can enter, observe, explore,
> operate, and influence.**

It must not feel like:

> **A real-estate dashboard that the user merely looks at.**

The central product distinction is the transition from **information
consumption** to **economic operation**.
