# RobustParetoFrontier

Consensus-grounded **certain/possible Pareto frontiers over published measurement
ranges**. Experimental, unaudited infrastructure—not a performance oracle,
owner-controlled graph, source-contribution game or consumable certificate.

## Problem and why GenLayer

A benchmark shortlist can be wrong even when every number is authentic: the
measurement may describe the wrong workload, percentile, payload or worker count.
A single offchain parser can silently cherry-pick the fastest row, replace missing
data with zero, or collapse interval uncertainty into a fictional winner.

This contract independently acquires complete report bytes. Each validator
semantically maps every source measurement against every requested objective and
the exact experimental context. **Numeric ranges are read from the fetched source,
not invented by a model or supplied as caller scores.** The contract aggregates
all matching rows and computes a robust trade-off envelope.

An ordinary chain can compute dominance but cannot independently interpret prose
describing metric meaning and experimental scope. Here those consequential
semantic labels change the actual intervals and therefore which candidates may
be safely excluded or guaranteed non-dominated.

```text
immutable context + objectives + complete source inventory
                 |
anyone observes each registered source, in ANY order
                 |
each validator fetches full pinned report + independently maps ALL rows
                 |
exact source/binding/matrix report consensus
                 |
immutable source observation + commutative observed-bit mask
                 |
ALL-source barrier -> deterministic interval hulls and robust dominance
                 |
certain frontier / possible frontier / ambiguous membership, or HELD
```

## Different storage and workflow

Panels are immutable specifications; source-indexed observations are write-once
and may arrive out of order; one terminal result is computed only after the full
observation barrier. There is no graph head, parent-version proposal, owner veto,
consumable approval, sequential annotation audit cursor, coalition utility table,
point ranking, weighted reward allocation or threshold confidence score.

This is one reusable representative mechanism, not domain variants. It maps
documentary measurements into **partial-order envelopes**, not a renamed version
of a graph transition or attribution contract. Novelty and acceptance are not
guaranteed. See [architecture/review checklist](docs/architecture.md).

## Specification and acquisition

`open_panel(nonce, context, objectives_text, sources_text)` freezes:

- Authenticated creator, deployment, nonce and versioned mechanism policy.
- Exact natural-language experimental context (15–300 UTF-8 bytes).
- Two or three objectives: `MIN|unit|meaning` or `MAX|unit|meaning` per line.
- Two to four complete report coordinates and raw SHA-256 commitments.

Each source line is `OWNER/REPO/FULL_40_HEX_COMMIT/PATH.json|SHA256`.
The adapter constructs only `https://raw.githubusercontent.com/...`, with safe
paths, immutable full commits and distinct URLs. Each observation verifies HTTP
200, strict UTF-8, 1–6000 **full response bytes**, exact raw hash and strict JSON.
No truncated document is interpreted. Pinning proves version integrity, not
freshness or source honesty.

Report schema:

```json
{"schema":"measurement-ranges-v1","notes":"Complete scope and qualifications.",
 "measurements":[{"low":10,"high":12,"unit":"ms",
 "description":"95th-percentile request delay under the stated workload."}]}
```

Each report has 1–4 rows. Numeric bounds are nonnegative integers, ordered and
at most one billion; booleans, floats, duplicate keys and extra fields are rejected.
Units are literal identifiers: no implicit conversion. Only nonnegative metrics
are supported. Bounds describe reported ranges—not statistical confidence,
guaranteed real performance or estimates of missing data.

## Consequential consensus

`observe(panel, index, input_root)` is permissionless. The leader and validators
each fetch and decode the same source, then independently produce the complete
objective-by-measurement `MATCH / NO_MATCH / UNKNOWN` matrix using the full notes
and descriptions. Every row must be considered. A matching unit alone is not
sufficient; statistic and experimental conditions must match too.

Exact canonical equality is required across case/source-index/input-root bindings,
source statuses, full bodies, raw hashes, document status and all matrix labels.
Validators do not merely accept enum/JSON shape. The contract revalidates the
report after consensus and derives ranges itself. No tolerance can change a gate.
Malformed AI or network disagreement applies no observation or mask update; no
fictitious CONFLICTED state is recorded. Anyone can retry an unobserved source.

For each objective, all MATCH rows form a conservative hull:
`[min(all lower bounds), max(all upper bounds)]`. No best-row selection or averaging.
If any compatible-unit row is UNKNOWN, or no row matches, that metric becomes
`[0, +infinity)` with `known=false`. Zero here is a domain lower bound, **not an
observed measurement**. A failed acquisition or invalid source schema causes
the final panel to be HELD with no frontier at all, not a fabricated unknown score.

## Robust frontier semantics

MIN objectives prefer lower values; MAX prefer higher values. Candidate A dominates
B when A is no worse on every objective and strictly better on at least one.
Intervals are assumed independent Cartesian ranges, including between candidates.

- **Certain frontier:** non-dominated under every allowed completion of the ranges.
- **Possible frontier:** non-dominated under at least one allowed completion.
- **Ambiguous membership:** possible but not certain.
- **Certainly dominated:** excluded under every completion, with a deterministic
  dominating-source witness.

For minimization-oriented intervals, certain dominance tests A's worst endpoints
against B's best endpoints; possible dominance tests A's best against B's worst.
Strictness is mandatory. Ties never strictly dominate each other. MAX is transformed
by exact integer sign inversion. Infinity is represented explicitly, never rounded
to a favorable finite score. No floats, caller weights or model-selected winners.

These envelopes are exact for the declared **independent interval** model,
conditional on correct source interpretation. They are not probability bounds,
confidence intervals or a joint physical feasibility claim. Real measurements may
be correlated; independent hulls can deliberately overstate uncertainty. A
non-dominated candidate is not universally best, recommended or safe.

## State, authorization and liveness

```text
COLLECTING --observe any unobserved index--> COLLECTING / READY
READY --permissionless finalize------------> ANALYZED or HELD
```

The observed-bit mask requires **all** registered alternatives before finalization;
unfavorable or failed sources cannot be dropped. Source observations and final
results are immutable. Index/case/root bindings reject cross-panel substitution.
Reobserving a source, reusing a creator nonce, finalizing twice or supplying a
different input root reverts. Observations commute under serialized contract
execution; the live demonstration does not claim concurrent-execution testing.

`certain_frontier(panel, input_root)` exposes only certain indexes after ANALYZED
with the exact root. It never promotes merely possible candidates. `get_result`
also exposes the uncertainty envelope. HELD cannot satisfy the certain-frontier
consumer. No owner-only finalizer, private trace, asset custody, transfer, locked
credit, permission token or execution authorization exists. Do not send funds.

Anyone can finish or retry an unobserved slot. A terminal failed observation
cannot be rewritten; correcting it requires a new panel/nonce. Per-creator limit
is 32 panels, not Sybil resistance. Network availability is not guaranteed, but no
funds or external permissions are locked by unfinished consensus.

## Demonstration

The committed fixtures are authored **fictional benchmark references**, not
measurements of a running service. Context is four workers and a 65536-byte payload.
Objectives minimize p95 latency and maximize completed requests per second.

- A reports latency 10–12 ms and throughput 100–110; a one-worker latency row is
  incompatible and must not be used.
- B reports latency 20–25 ms and throughput 70–80: A certainly dominates B.
- C reports latency 5–8 ms, but its throughput row is for eight workers. Throughput
  at the requested context remains unknown, not the reported 900–1000 value.

Expected envelope: certain `[C]`, possible `[A,C]`, certainly dominated `[B]`.
C is robustly non-dominated because of latency, **not a declared overall winner**.
A remains possibly non-dominated depending on C's unknown throughput.
Actual outcomes—not expectations—belong in [LIVE_PROOFS.md](LIVE_PROOFS.md).

## Install, test, deploy

```powershell
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt
.venv/Scripts/genvm-lint check contracts/RobustParetoFrontier.py --json
.venv/Scripts/python -m pytest tests -q
npm ci
npm run test:sdk
node --test tests/checker.test.mjs
npm install -g genlayer@0.39.2
genlayer network set studionet
genlayer account use YOUR_ENCRYPTED_TEST_ACCOUNT
genlayer account unlock
genlayer deploy --contract contracts/RobustParetoFrontier.py
genlayer write ADDRESS open_panel --args demo "Four workers with a 65536-byte request payload." $objectives $sources
genlayer call ADDRESS get_panel --args PANEL_KEY
genlayer write ADDRESS observe --args PANEL_KEY 2 INPUT_ROOT
genlayer write ADDRESS observe --args PANEL_KEY 0 INPUT_ROOT
genlayer write ADDRESS observe --args PANEL_KEY 1 INPUT_ROOT
genlayer write ADDRESS finalize --args PANEL_KEY INPUT_ROOT
genlayer call ADDRESS certain_frontier --args PANEL_KEY INPUT_ROOT
```

`$objectives` and `$sources` are newline-delimited strings as specified above.
StudioNet is gasless. Use native encrypted signing, never export wallet keys.
After uncertain broadcasts inspect the recorded transaction before retrying.
FINALIZED alone is insufficient: check execution and consensus, compare Explorer
source with this exact contract, then recompute observation/result roots and
frontier membership from state. Distributed disagreement and expected errors
must be listed separately from successful committed transactions.

## Limitations

Published measurements can be fabricated or share an author. This contract checks
**document interpretation and interval dominance**, not service delivery, benchmark
authorship, measurement authenticity, current operational performance, independent
authority, real-world compliance or agent alignment. Source selection and context
choice remain application assumptions. Prompt framing does not formally eliminate
injection or shared model errors. The full-body hashes prove integrity, not truth.
No production safety, novelty, points or review acceptance is guaranteed.
