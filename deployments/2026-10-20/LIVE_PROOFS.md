# Fresh StudioNet deployment — 2026-10-20

[Contract](https://explorer-studio.genlayer.com/address/0x80C3E9880E823064b6566263b937bCed56E11A48) · [Matching source](https://github.com/ehsandto/rubust-paretor/blob/main/contracts/RobustParetoFrontier.py) · [Machine-readable journal](PROOFS.json).

Chain: 61999. Source SHA-256: `80b2a1c222d2615db409780f3451f2eda84daaefa5115815492da501975a9f1d`. Fixture revision: `7b38dfca1af7eae8b54a52ecd484e279b78b5ef1`; sources use the renamed `ehsandto/rubust-paretor` coordinates. The contract remains `RobustParetoFrontier`; source and mechanism are unchanged. Renaming a repository and deploying another instance do not constitute a new architecture or separate substantive mechanism.

## Proof matrix

| Requirement | Evidence | Observed behavior |
|---|---|---|
| Independent semantic acquisition | Observe C, A, B | Every source fetched and mapped; incompatible worker-count rows excluded |
| Mandatory inventory barrier | early-finalize | Expected ERROR; no premature result |
| Replay protection | replay-c | Expected ERROR; immutable observation unchanged |
| Certain versus possible membership | finalize-frontier | Certain [C], possible [A,C], B certainly dominated |
| Failed source commitment | observe-bad-a; finalize-held | HASH_MISMATCH, no semantic matrix; HELD with no frontier |
| Root binding | wrong-input-root; consumer read | Expected ERROR; incorrect-root consumer denied |
| Independent verification | verify-deployment.mjs | Rehashed source, observations, results and enumerated endpoint frontiers |
| Validator disagreement | Callback tests only | No live distributed-disagreement proof claimed |

## Finalized receipts

13 finalized transactions: 10 successful executions and 3 expected execution errors, all MAJORITY_AGREE. Recording HASH_MISMATCH successfully is not successful verification of a measurement. FINALIZED alone is not sufficient.

| Step | Execution / consensus | Explorer |
|---|---|---|
| deploy | SUCCESS; MAJORITY_AGREE | [transaction](https://explorer-studio.genlayer.com/tx/0x90e3997dc7e09cea47b127cb6da49766f7f8a8afe167034effe8e74cb9c208bf) |
| open-scope-panel-v1 | SUCCESS; MAJORITY_AGREE | [transaction](https://explorer-studio.genlayer.com/tx/0xbee354db4346dd0a808c3df40a95c9497a249d7f864c0c087e482fa5663eee8b) |
| early-finalize | ERROR; MAJORITY_AGREE (expected rejection) | [transaction](https://explorer-studio.genlayer.com/tx/0x346bc35ea50462ba5acd824e31612b6a9b65e542e85ab90066c93f1b9171af96) |
| observe-c-first | SUCCESS; MAJORITY_AGREE | [transaction](https://explorer-studio.genlayer.com/tx/0xba12e4b3806fc21ea7dd28abdf62430bb4822a07d6d16816450a2c4e69ebc8f2) |
| replay-c | ERROR; MAJORITY_AGREE (expected rejection) | [transaction](https://explorer-studio.genlayer.com/tx/0x94d778b07bd98abea63bc44dc51c2a4da0acb66272bbcda1c97a566967eedd98) |
| observe-a-second | SUCCESS; MAJORITY_AGREE | [transaction](https://explorer-studio.genlayer.com/tx/0x7173743d90353b2e57739521c20cc665b46eb0661e3f545c609783176965b56a) |
| observe-b-third | SUCCESS; MAJORITY_AGREE | [transaction](https://explorer-studio.genlayer.com/tx/0x8dc4369986e5ce11c14b4b311e5c524a088ef4c7898c31a36d873ee215c5d7aa) |
| finalize-frontier | SUCCESS; MAJORITY_AGREE | [transaction](https://explorer-studio.genlayer.com/tx/0xa18ff442f679d5387cc98549eb806a0083be900984dbb75ff123e394169381c4) |
| open-bad-commitment-v1 | SUCCESS; MAJORITY_AGREE | [transaction](https://explorer-studio.genlayer.com/tx/0x955485aa3f8b37ee0abbbdd4d56cd7406bd2e8d4b728f3d779638c7daeda44e6) |
| observe-bad-a | SUCCESS; MAJORITY_AGREE | [transaction](https://explorer-studio.genlayer.com/tx/0x42e985e43f17b6f85c88cfa43978daed3efeb62ef67277d93d287b756c4bfde4) |
| observe-good-b | SUCCESS; MAJORITY_AGREE | [transaction](https://explorer-studio.genlayer.com/tx/0x1401eb20f853641c47bd299fb0d378d02aae3a4202438a2102fe1308ae2876ad) |
| finalize-held | SUCCESS; MAJORITY_AGREE | [transaction](https://explorer-studio.genlayer.com/tx/0x4b57ea7e8ca718a8accc8065c3f33f934e6de0cd9fb9ca33e155a081ce73885d) |
| wrong-input-root | ERROR; MAJORITY_AGREE (expected rejection) | [transaction](https://explorer-studio.genlayer.com/tx/0x4447ffc54f5a4f3fd8d8f019a2d2ba79baa5686bdb1ffc59f61c674b2b648494) |

## Bound results

Main panel: `bd1a979cfcc03a584a8d878a82323404aaf2a46a78cf5ac8e855e6118add362b`

Input root: `4746cff77523c93f3051dfbd909f479029a13df76d287b1da5c90fae93b16671`

Result root: `bdbc482a304387fe35ae5136adef6af520fa742e23b55e94f931bc9910b49613`

Certain frontier: `[2]` (C); possible: `[0,2]` (A,C); certainly dominated: B with A as witness. C's four-worker throughput stays unknown; no missing measurement is invented. Guarantees apply only to the declared independent nonnegative interval model, not physical performance or an overall winner.

Bad-commitment panel: `1a07ebd02953e794e2133bd67bfe0635383bc9a249d75a952b1654d38b15eb29`

Result root: `59e454b4566fc3e36c78fa61de123f81053186a6d09dd6656f9538b0e4f28725`; status HELD, both frontiers empty and consumer access denied. Source observations were collected in order 2 → 0 → 1 in the main panel. All roots and both terminal states were read again after the rejection tests.

## Transport and history safety

An initial preflight stopped without sending. A later CLI attempt returned no hash. Complete native sender-history inspection showed only the previous fanout transaction at nonce 336; latest and pending nonce were both 337. That resolved attempt is retained separately in `unbroadcast_attempts`, not counted among onchain proofs. The successful fresh deployment then used the Windows-native HTTPS adapter; signing remained in the encrypted native test keystore. No keys were exported, no funds transferred, and no uncertain transaction was blindly resent. Known hashes resume through receipt checks.

The previous deployment and original 13 receipts remain in the repository's root LIVE_PROOFS.md and PROOFS.json; they are not presented as transactions of this address.

## Recheck (read-only)

`node --require ./scripts/native-http.cjs scripts/verify-deployment.mjs deployments/2026-10-20/PROOFS.json`

The native adapter is limited to the Studio API and this repository's exact commit-pinned demo fixture paths; it does not change global account/network settings. Requests and responses remain on pipes, never public logs. The verifier signs and sends nothing. It independently checks every finalized receipt, source equality, all observation/result roots, endpoint-enumerated frontiers and wrong-root consumer rejection.

Local validation: 34 Python tests, four independent JavaScript checker tests, seven SDK calldata roundtrips and GenVM lint pass. Callback/direct tests are not live distributed disagreement tests. Fixtures are authored fictional benchmark references, not independent real-world authorities or proof of real measurements, service delivery or agent behavior. Experimental and unaudited.
