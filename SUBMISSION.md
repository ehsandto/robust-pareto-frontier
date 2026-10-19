# Builder submission

Contribution type: Builder → Intelligent Contracts

Title: RobustParetoFrontier — Consensus-Grounded Trade-off Envelopes

## Notes / Description

RobustParetoFrontier compares published measurement ranges. Validators independently fetch commit-pinned reports, verify full hashes/schema and map every row to fixed objectives and exact test conditions. Consensus requires exact full-report equality.

All matching rows enter a conservative range hull. Missing/ambiguous metrics remain nonnegative-unbounded. The contract computes certain/possible Pareto frontiers; failed sources yield HELD. Every source slot is mandatory, permissionless and write-once. Nonce/index/root bindings prevent replay and substitution.

StudioNet observed C→A→B, retained C as certain and A as possible, and excluded B. A bad commitment finalized HELD; early finalization, replay and wrong-root requests reverted. 38 tests, seven SDK roundtrips and lint pass; deployed source matches GitHub. This is documentary range analysis under an independent-interval model, not actual service-performance certification. No graph head or consumable certificate exists.

## Evidence

- https://github.com/ehsandto/robust-pareto-frontier
- https://github.com/ehsandto/robust-pareto-frontier/blob/main/contracts/RobustParetoFrontier.py
- https://github.com/ehsandto/robust-pareto-frontier/blob/main/README.md
- https://github.com/ehsandto/robust-pareto-frontier/blob/main/LIVE_PROOFS.md
- https://github.com/ehsandto/robust-pareto-frontier/blob/main/PROOFS.json
- https://explorer-studio.genlayer.com/address/0x3F7Dd00F48f937046a3AEF0d4b468f90d5A4C817
- https://explorer-studio.genlayer.com/tx/0xedac8fdabf21aa97be97e7d78112b6e1fef45c60b2df18088d8c6e669eb8d878
- https://explorer-studio.genlayer.com/tx/0x77c83cb4235bcc1346119c3e1e4ee1ddcd925a7b3d50aebfaab9e464a422401b
- https://explorer-studio.genlayer.com/tx/0x95333d77cd5ab848093ee555ab413a7ae4c76756848ee140a98178d29186969a
- https://explorer-studio.genlayer.com/tx/0xad909d543b923aa4e65ebf87907459e4bba790262275aa4b3add12b4fb247542 — expected premature-finalization ERROR
- https://explorer-studio.genlayer.com/tx/0x1d42c44395501cb4845b38f78a89f148d643c2b6b00d4ded820b30157b33f0ae — expected replay ERROR
- https://explorer-studio.genlayer.com/tx/0xc59eca2a44dad8d9a4498845863be2fff563a595e4252592ae40a2bcbe5dae71 — expected wrong-root ERROR

The fixtures are authored fictional benchmark references, not actual performance
measurements or independent-authority evidence. Frontier guarantees are conditional
on the recorded interpretation and independent nonnegative interval model, not
physical correlation, universal truth or suitability for deployment. Refer to
LIVE_PROOFS.md for verified lifecycle outcomes; expected ERRORs are negative
security proofs, not successful observations or finalizations.
