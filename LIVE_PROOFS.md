# Live proof ledger

## Deployment — 2026-10-19

[StudioNet contract](https://explorer-studio.genlayer.com/address/0x3F7Dd00F48f937046a3AEF0d4b468f90d5A4C817),
chain 61999. Dedicated encrypted signer: `0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42`.
The native CLI signs without key export. No tokens are transferred.

Deployed source matches `contracts/RobustParetoFrontier.py` from implementation
and fixture commit `aba2c068c9c56ca36c63b9b4fe572b14e7cd9abe`.
Normalized source SHA-256: `80b2a1c222d2615db409780f3451f2eda84daaefa5115815492da501975a9f1d`.
Contract source has not changed after deployment.

Preflight independently fetched all three committed report files over HTTPS,
confirmed HTTP 200 and checked the complete raw response hashes:

| Fixture | Raw SHA-256 |
|---|---|
| a.json | `836e2e623a0280d6e9d2e121ca979f250ca12b7f8cbbd716e50dfcd7befad2b8` |
| b.json | `d2c45382451c89e114a2b58848f09466a9fc9acf947d5b63e53f7d7d40678279` |
| c.json | `fe4b7e4f91e9d630ec4b88905d43363df75d3ffc3e8f6eeec8e1e96321d2b5d4` |

The first receipt lookup failed transiently after a hash was recorded. Read-only
inspection confirmed FINALIZED/SUCCESS/MAJORITY_AGREE for that same deployment.
The workflow resumed from its journal without deploying again.

## Finalized transaction ledger

| Step | Transaction | Execution / consensus |
|---|---|---|
| Deploy | [edac8fda](https://explorer-studio.genlayer.com/tx/0xedac8fdabf21aa97be97e7d78112b6e1fef45c60b2df18088d8c6e669eb8d878) | SUCCESS / MAJORITY_AGREE |
| Open fixed inventory | [8787c264](https://explorer-studio.genlayer.com/tx/0x8787c264c5c82837ae13338fab9e4dd50c0f82036a4b3e38b83c9c173664820a) | SUCCESS / MAJORITY_AGREE |
| Premature finalize | [ad909d54](https://explorer-studio.genlayer.com/tx/0xad909d543b923aa4e65ebf87907459e4bba790262275aa4b3add12b4fb247542) | Expected ERROR / MAJORITY_AGREE; `Observation barrier incomplete` |
| Observe C first | [0f16092b](https://explorer-studio.genlayer.com/tx/0x0f16092beda2081a769915a5dce4b3d266fad974bd5c3cc21827e890fa4d4957) | SUCCESS / MAJORITY_AGREE |
| Replay C observation | [1d42c443](https://explorer-studio.genlayer.com/tx/0x1d42c44395501cb4845b38f78a89f148d643c2b6b00d4ded820b30157b33f0ae) | Expected ERROR / MAJORITY_AGREE; `Source already observed` |
| Observe A second | [0fd66e32](https://explorer-studio.genlayer.com/tx/0x0fd66e32d7430c0f256ff4e0281a9b2d7e60fdd2d46e6e5dff71c37ab53fbab6) | SUCCESS / MAJORITY_AGREE |
| Observe B third | [7ed7e3a1](https://explorer-studio.genlayer.com/tx/0x7ed7e3a1014a5398c2bf88073972ee876550b12f6ec15a7e06973bc77073f2b9) | SUCCESS / MAJORITY_AGREE |
| Finalize robust envelope | [77c83cb4](https://explorer-studio.genlayer.com/tx/0x77c83cb4235bcc1346119c3e1e4ee1ddcd925a7b3d50aebfaab9e464a422401b) | SUCCESS / MAJORITY_AGREE |
| Open bad-commitment panel | [5b6d1790](https://explorer-studio.genlayer.com/tx/0x5b6d1790a608ed3482fb8b131c6e90e2dd5240867ef321202ddc5c7fcec12900) | SUCCESS / MAJORITY_AGREE |
| Observe incorrect A commitment | [d2680d2a](https://explorer-studio.genlayer.com/tx/0xd2680d2ab7f12d97eb8f668658ce7457512d6e516301fa1553c08cdb2b11adcf) | SUCCESS / MAJORITY_AGREE; records HASH_MISMATCH, not valid measurement evidence |
| Observe valid B in failed panel | [b749662d](https://explorer-studio.genlayer.com/tx/0xb749662df462cad0b73dc5a418e7b8d719bfa5ea89b97075b720b3710603cdc6) | SUCCESS / MAJORITY_AGREE |
| Finalize HELD | [95333d77](https://explorer-studio.genlayer.com/tx/0x95333d77cd5ab848093ee555ab413a7ae4c76756848ee140a98178d29186969a) | SUCCESS / MAJORITY_AGREE; no frontier |
| Wrong input root | [c59eca2a](https://explorer-studio.genlayer.com/tx/0xc59eca2a44dad8d9a4498845863be2fff563a595e4252592ae40a2bcbe5dae71) | Expected ERROR / MAJORITY_AGREE; `Input root mismatch` |

All **13** transactions are FINALIZED: ten successful executions and three
expected execution errors. The failed-evidence observation successfully records
a failure; it is not a successful measurement verification. No distributed
disagreement was induced or claimed in this live run.

## Independently verified main-panel result

Panel ID: `8bee8120ec9e9f7790700b09057cc1f4351ec76b1636c2e260d34aa7e02a44cd`.
Input root: `7567269e56a47852f328da560b81eee333139b7bc0dd7057ea7d10da0eda1d0f`.
Final result root: `0215a83ab93636edd425787e2ab5f3a8f5909d1cb771a7e58ce9145c9d97d53a`.

| Candidate / source index | p95 request latency (MIN, ms) | Request throughput (MAX, ops_s) | Scope mapping |
|---|---|---|---|
| A / 0 | [10,12] | [100,110] | One-worker latency row excluded |
| B / 1 | [20,25] | [70,80] | Both rows match requested context |
| C / 2 | [5,8] | [0,+infinity), `known=false` | Eight-worker throughput row excluded; no four-worker throughput reported |

The recorded matrices exactly match the expected per-row scope classification.
The observed-bit mask reached 7 only after indexes **2 → 0 → 1** were recorded.
Finalization produced ANALYZED with:

- certain frontier `[2]` (C);
- possible frontier `[0,2]` (A and C);
- certainly dominated `[{index:1,witness:0}]` (A dominates B in every allowed completion);
- ambiguous membership `[0]`, `membership_determined=false`.

The certain-frontier consumer returned only `[2]` bound to the exact input/result
roots. An independent checker rehashed the input and every observation, rederived
all hulls from complete source rows/matrices, and enumerated endpoint worlds to
reproduce the sets instead of trusting the stored output or interval solver.
**C is guaranteed non-dominated under the stated interval model, not an overall
winner, verified real service or universal recommendation.**

## Bad commitment and final readback

Panel: `d5188ef7127772c7ce94ece6a1e9568bffef5d06d7e28993d003124f0b637659`.
Input root: `f93b42c46edea935a2757495064231fc12c9d4d0def36b5181299f85833f3946`.
Result root: `d2f92e5930a5fa8df57672a5e1d43fcd0ad01cf572f77dc38ff0678f2e73bd47`.

An intentionally incorrect all-`f` expected SHA-256 did not match A's full fetched
body. Source status became HASH_MISMATCH, document status ACQUISITION_FAILED and
no semantic matrix was issued. B was still observed to satisfy the mandatory
inventory barrier. Final output was HELD with failed source `[0]` and **both
frontiers empty**. The certain-frontier consumer reverted.

After the wrong-root transaction, both panels were read again: the input,
observation and result roots still matched independently computed hashes, and
the main envelope was unchanged. A separate wrong-root consumer read also
reverted. Deployed source equality was rechecked after the entire workflow.
`PROOFS.json` records the sanitized receipts and exact observed matrices/ranges.

## Proof matrix

| Scenario | Required behavior | Current evidence |
|---|---|---|
| Scope-aware range mapping | Wrong-condition measurements excluded; all MATCH ranges enter hull | Live: one-worker and eight-worker decoys excluded; source-derived hulls independently verified |
| Out-of-order observations | Fixed slots collected; full barrier required | Live order 2→0→1; premature finalization and source replay rejected |
| Missing objective | Unknown range; certain and possible frontiers separated | Live: C throughput remains [0,+infinity), certain [C], possible [A,C] |
| Failed source or hash | Terminal HELD; no frontier consumer output | Live HASH_MISMATCH → HELD; no frontier; consumer denied |
| Replay/wrong root/early finalize | Revert; old records unchanged | Three finalized expected ERRORs; subsequent roots/state and wrong-root consumer checked |
| Semantic validator disagreement | No observation/mask update | Actual callback unit test, not distributed consensus |

Published fixtures are authored fictional reports; they prove no running-service
performance, independent source authority or measurement authenticity. The live
proofs above have finalized receipts with verified execution, matching source and
state readbacks. Expected execution errors are not business successes.

## Local test scope

34 Python tests, four independent Node checker tests, seven SDK calldata
roundtrips and GenVM lint/SDK validation pass. Python exhaustively checks 1,024
two-candidate/two-objective interval configurations against a separate point-world
enumerator, including all MIN/MAX direction combinations. Callback tests execute
the actual validator to check independent refetch/recomparison and substitution
rejection. These mocked/callback tests are not live distributed disagreement.

`node scripts/complete-proofs.mjs` resumes the known journal rather than blindly
resending. Any entry without a known hash blocks resumption until sender history
is inspected. The initial lookup failure above resulted in no duplicate deployment.
