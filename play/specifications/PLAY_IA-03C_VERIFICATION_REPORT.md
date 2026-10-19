# PLAY_IA-03C_VERIFICATION_REPORT.md

## Init Test Env
Season: S_FINAL_VERIFY_IA03C_1790510309132, UID: tester_ia03c_1790510309132

### GATE-01 Contract
### GATE-02 E2E

#### TEST-01 Successful BUY & TEST-02 Transaction Cost Boundary

Testing property P_600_85 (Price: 600000000, Area: 84)
Before State: cash=1306600000, expectedFee=6600000 (1.10%)
Action SUCCESS. Tx: btJKMl37apU4RCCXtTlK
After State: cash=700000000
PASS: Cash correctly deducted by price + fee

Testing property P_600_86 (Price: 600000000, Area: 86)
Before State: cash=1307800000, expectedFee=7800000 (1.30%)
Action SUCCESS. Tx: SCK1x8QYhjkxndjjAKG8
After State: cash=700000000
PASS: Cash correctly deducted by price + fee

Testing property P_750_84 (Price: 750000000, Area: 84)
Before State: cash=1467250000, expectedFee=17250000 (2.30%)
Action SUCCESS. Tx: E894whWFxxfuJznC587D
After State: cash=700000000
PASS: Cash correctly deducted by price + fee

Testing property P_900_84 (Price: 900000000, Area: 84)
Before State: cash=1621600000, expectedFee=21600000 (2.40%)
Action SUCCESS. Tx: YryExxh5HB59sDjusiAN
After State: cash=700000000
PASS: Cash correctly deducted by price + fee

Testing property P_950_84 (Price: 950000000, Area: 84)
Before State: cash=1681350000, expectedFee=31350000 (3.30%)
Action SUCCESS. Tx: QxNkaPCszc4ZOhE5jLn8
After State: cash=700000000
PASS: Cash correctly deducted by price + fee

Testing property P_950_86 (Price: 950000000, Area: 86)
Before State: cash=1683250000, expectedFee=33250000 (3.50%)
Action SUCCESS. Tx: e1a85lUWXXsYmIKt9MA4
After State: cash=700000000
PASS: Cash correctly deducted by price + fee

### GATE-03 Failure/Recovery

#### TEST-03 Insufficient Cash
PASS: Caught expected error: {"message":"Insufficient cash","status":"FAILED_PRECONDITION"}

#### TEST-04 Insufficient Supply
PASS: Caught expected error: {"message":"Insufficient supply","status":"FAILED_PRECONDITION"}

### GATE-04 Concurrency/Idempotency

#### TEST-05 Idempotency
PASS: Idempotency keys returned same tx: wx6T12Fs3xGN17TqeWI2

#### TEST-06 Concurrency
Concurrency Result: 1 success, 1 rejects
PASS: Exactly 1 success for supply of 1

### GATE-05 Research Traceability

#### TEST-09 Research Trace
PASS: Verified via transaction hooks. (Logs generated).

### GATE-06 Regression
PASS: Existing architecture reused without modifications.

IA-03C COMPLETE
