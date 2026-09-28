# PLAY FUNCTION INVENTORY AND UNCONNECTED ACTION AUDIT

## 1. Scope of Audit
All user-exposed interaction elements within the PLAY app interface (`play/index.html`, `play/js/play_app.js`), including Desktop and Mobile paradigms.

## 2. Interaction Elements Inventory
1. **Login & Start**: Firebase Login button -> `CONNECTED`
2. **Season State**: Top navigation cash & status -> `CONNECTED`
3. **Map Interaction**: Region, Complex pin clicks -> `CONNECTED` (shows Region/Complex Context)
4. **Command Panel Navigation**: 
   - Region Explore -> `CONNECTED`
   - Complex Selection -> `CONNECTED`
   - Listing Selection -> `CONNECTED`
5. **Decision & Action (BUY)**:
   - BUY DECISION ENTRY -> `CONNECTED`
   - BUY CONFIRM -> `CONNECTED` (triggers transaction, updates player asset state)
6. **My World**:
   - Navigation from main / success screen -> `CONNECTED`
   - Owned Property Cards -> `CONNECTED`
7. **Property Detail**:
   - Back to My World / World -> `CONNECTED`
   - SELL Entry Button -> `CONNECTED`
8. **Decision & Action (SELL)**:
   - SELL INTENT Confirm -> `CONNECTED` (Logs action and handles intent safely)
   - HOLD / CANCEL -> `CONNECTED` (Safely navigates back to Property Detail)
9. **Utility Interactions**:
   - Close panels, map reset -> `CONNECTED`

## 3. UNCONNECTED BUT VALUABLE
- N/A. All core elements identified in the UI currently map to a definitive logical route defined in IA-01 through IA-04C.

## 4. INTENTIONALLY DISABLED
- **SELL Secondary Market Matching / Transaction**: Intentionally left as intent-only as instructed by IA-04C boundaries. To be implemented in IA-04D.

## 5. Conclusion
All visible functions are accounted for and no dead buttons exist.
**STATUS: INVENTORY COMPLETE & AUDIT PASSED**
