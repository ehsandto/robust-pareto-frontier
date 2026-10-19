# Security policy

Experimental and unaudited. Report vulnerabilities privately to the repository
owner without posting keys, passwords, provider configuration or raw RPC receipts.

Enforced: native creator nonce/domain binding; immutable full inventory and input
root; 32-panel per-creator cap; safe full-commit raw-GitHub paths; full body/status/
UTF-8/hash/schema validation; strict nonnegative integer measurement ranges;
complete matrix classification; exact independent report comparison; post-consensus
revalidation; source-index write-once observations; all-slot finalization barrier;
source-root binding; strict Pareto dominance; separate certain/possible sets;
HELD on source failure; exact-root certain-membership consumer gate.

There is no privileged finalizer, upgrade, arbitrary code evaluation, asset
custody, transfer, external execution approval, certificate or consumption path.
Do not send funds. Native gasless test signing stays inside an encrypted CLI
keystore; repository scripts must never export a signer key or raw provider receipt.

Not solved: source honesty, real measurements, publisher independence, temporal
freshness, plagiarism, scope manipulation, model mistakes, prompt injection,
validator correlation, physical correlations between measurement ranges, Sybil
limits or external network availability. Fixture reports are fictional authored
documents, never proof of service delivery or observed agent behavior.

Failure semantics: distributed disagreement/malformed model leaves the slot
unobserved, so anyone may retry. An agreed source failure is a terminal observation;
the full barrier must still complete before HELD finalization. A corrected source
requires a new panel, not history rewriting. No funds are locked while waiting.
