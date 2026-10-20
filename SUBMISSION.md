# Contribution type

Builder → Intelligent Contracts

## Title

Rubust-Paretor — Consensus-Grounded Trade-off Envelopes

## Notes / Description (955/1000)

Rubust-Paretor compares published measurement ranges through RobustParetoFrontier. Validators independently fetch full commit-pinned reports, verify hashes/schema, and map every row to fixed objectives and exact experimental conditions. Consensus requires exact report equality. Matching rows form conservative interval hulls; missing metrics remain unknown. Certain and possible Pareto frontiers are separate. Failed sources yield HELD. All source slots are mandatory and write-once; nonce/index/root bindings prevent replay and substitution. Fresh StudioNet proofs show certain frontier [C], possible frontier [A,C], and B excluded. A bad commitment produces HELD; early finalization, replay and wrong-root calls reject. Matching source, 38 tests, seven SDK checks and lint verified. Fictional fixtures demonstrate documentary interval analysis, not actual service performance. This is a fresh instance of the existing mechanism, not a new architecture.

## Evidence

- https://github.com/ehsandto/rubust-paretor
- https://github.com/ehsandto/rubust-paretor/blob/main/contracts/RobustParetoFrontier.py
- https://github.com/ehsandto/rubust-paretor/blob/main/README.md
- https://github.com/ehsandto/rubust-paretor/blob/main/deployments/2026-10-20/LIVE_PROOFS.md
- https://github.com/ehsandto/rubust-paretor/blob/main/deployments/2026-10-20/PROOFS.json
- https://explorer-studio.genlayer.com/address/0x80C3E9880E823064b6566263b937bCed56E11A48
- https://explorer-studio.genlayer.com/tx/0x90e3997dc7e09cea47b127cb6da49766f7f8a8afe167034effe8e74cb9c208bf
- https://explorer-studio.genlayer.com/tx/0x346bc35ea50462ba5acd824e31612b6a9b65e542e85ab90066c93f1b9171af96
- https://explorer-studio.genlayer.com/tx/0x94d778b07bd98abea63bc44dc51c2a4da0acb66272bbcda1c97a566967eedd98
- https://explorer-studio.genlayer.com/tx/0xa18ff442f679d5387cc98549eb806a0083be900984dbb75ff123e394169381c4
- https://explorer-studio.genlayer.com/tx/0x4b57ea7e8ca718a8accc8065c3f33f934e6de0cd9fb9ca33e155a081ce73885d
- https://explorer-studio.genlayer.com/tx/0x4447ffc54f5a4f3fd8d8f019a2d2ba79baa5686bdb1ffc59f61c674b2b648494

## Review limitations

This is the same substantive mechanism with a renamed repository and a fresh matching-source deployment. Do not present it as another novel architecture or a parallel domain submission. Fictional documentary range analysis is not actual service-performance certification. Expected ERROR receipts prove guard rejection, not successful observations. No live distributed disagreement was induced. The original deployment proofs remain archived separately.
