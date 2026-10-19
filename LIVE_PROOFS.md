# Live proof ledger

No deployment or live consensus outcome is claimed yet.

| Scenario | Required behavior | Current evidence |
|---|---|---|
| Scope-aware range mapping | Wrong-condition measurements excluded; all MATCH ranges enter hull | Mocked tests |
| Out-of-order observations | Fixed slots collected; full barrier required | Mocked tests |
| Missing objective | Unknown range; certain and possible frontiers separated | Mocked tests |
| Failed source or hash | Terminal HELD; no frontier consumer output | Mocked tests |
| Replay/wrong root/early finalize | Revert; old records unchanged | Mocked tests |
| Semantic validator disagreement | No observation/mask update | Actual callback unit test, not distributed consensus |

Published fixtures are authored fictional reports; they prove no running-service
performance, independent source authority or measurement authenticity. Only
finalized receipts with verified execution, matching source and state readbacks
will be added as live proofs. Expected execution errors are not business successes.
