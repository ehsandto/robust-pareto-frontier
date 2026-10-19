import ast
import hashlib
import itertools
import json
import re
from pathlib import Path
from types import SimpleNamespace
import pytest

TREE = ast.parse(Path("contracts/RobustParetoFrontier.py").read_text())
NS = {"json": json, "hashlib": hashlib, "re": re, "LABELS": ("MATCH", "NO_MATCH", "UNKNOWN"), "LIMIT": 6000}
exec(compile(ast.Module(body=[x for x in TREE.body if isinstance(x, ast.FunctionDef)], type_ignores=[]), "actual-helpers", "exec"), NS)
CONTEXT = "Four workers with a 65536-byte request payload."
OBJECTIVES = "MIN|ms|95th percentile end-to-end request latency\nMAX|ops_s|Completed requests per second"
OBJS = NS["parse_objectives"](OBJECTIVES)
BODIES = [Path("examples/" + x + ".json").read_bytes() for x in ("a", "b", "c")]
SOURCES = "\n".join("ehsandto/robust-pareto-frontier/" + "a" * 40 + "/examples/" + name + ".json|" + hashlib.sha256(body).hexdigest()
                    for name, body in zip(("a", "b", "c"), BODIES))
MATRICES = [
    [["MATCH", "NO_MATCH", "NO_MATCH"], ["NO_MATCH", "MATCH", "NO_MATCH"]],
    [["MATCH", "NO_MATCH"], ["NO_MATCH", "MATCH"]],
    [["MATCH", "NO_MATCH"], ["NO_MATCH", "NO_MATCH"]],
]


def install(vm, i, body=None, matrix=None, http=200):
    vm.clear_mocks()
    spec = NS["parse_sources"](SOURCES)[i]
    vm.mock_web(re.escape(spec["url"]), {"response": {"status": http, "headers": {}, "body": BODIES[i] if body is None else body}, "method": "GET"})
    vm.mock_llm(r"(?s).*ROBUST PARETO MEASUREMENT MAPPING.*", json.dumps({"matrix": MATRICES[i] if matrix is None else matrix}))


@pytest.fixture
def contract(direct_vm, direct_deploy, direct_alice):
    direct_vm.sender = direct_alice
    return direct_deploy("contracts/RobustParetoFrontier.py")


def open_panel(c, nonce="demo", sources=SOURCES):
    key = c.open_panel(nonce, CONTEXT, OBJECTIVES, sources)
    return key, c.get_panel(key)["input_root"]


def test_out_of_order_permissionless_barrier_and_robust_frontier(contract, direct_vm, direct_bob):
    from genlayer import Address
    key, root = open_panel(contract)
    spec = contract.get_panel(key)["spec"]
    with direct_vm.expect_revert("Observation barrier incomplete"):
        contract.finalize(key, root)
    direct_vm.sender = Address(str(direct_bob))
    for i in (2, 0, 1):
        install(direct_vm, i)
        contract.observe(key, i, root)
        row = contract.get_observation(key, i)
        body = {k: v for k, v in row.items() if k != "root"}
        assert NS["digest"](body) == row["root"]
    assert contract.get_panel(key)["seen_mask"] == 7
    assert contract.get_panel(key)["spec"] == spec
    assert contract.get_observation(key, 2)["ranges"][1] == {
        "known": False, "low": 0, "high": None, "unit": "ops_s", "matched_rows": [], "reason": "MISSING"}
    contract.finalize(key, root)
    result = contract.get_result(key)
    assert result["output"]["status"] == "ANALYZED"
    assert result["output"]["certain_frontier"] == [2]
    assert result["output"]["possible_frontier"] == [0, 2]
    assert result["output"]["certainly_dominated"] == [{"index": 1, "witness": 0}]
    assert result["output"]["ambiguous_membership"] == [0]
    assert not result["output"]["membership_determined"]
    assert contract.certain_frontier(key, root)["indexes"] == [2]
    assert NS["digest"]({k: v for k, v in result.items() if k != "root"}) == result["root"]


def test_arithmetic_and_hull_never_cherry_pick():
    rows = [{"low": 2, "high": 5, "unit": "ms", "description": "First test measurement."},
            {"low": 9, "high": 12, "unit": "ms", "description": "Second test measurement."}]
    obj = OBJS[:1]
    result = NS["measurement_ranges"](obj, rows, [["MATCH", "MATCH"]])[0]
    assert (result["low"], result["high"], result["matched_rows"]) == (2, 12, [0, 1])
    result = NS["measurement_ranges"](obj, rows, [["MATCH", "UNKNOWN"]])[0]
    assert (result["known"], result["low"], result["high"], result["reason"]) == (False, 0, None, "AMBIGUOUS")


def point_frontier(points, directions):
    result = []
    for i, p in enumerate(points):
        dominated = False
        for j, q in enumerate(points):
            if i == j:
                continue
            comparisons = [(y - x) if d == "MIN" else (x - y) for x, y, d in zip(p, q, directions)]
            if all(v <= 0 for v in comparisons) and any(v < 0 for v in comparisons):
                dominated = True
        if not dominated:
            result.append(i)
    return set(result)


def enumerate_frontiers(boxes, directions):
    maximum = max([x["high"] or 0 for box in boxes for x in box] + [2]) + 1
    domains = [list(range(x["low"], (maximum if x["high"] is None else x["high"]) + 1)) for box in boxes for x in box]
    certain, possible = set(range(len(boxes))), set()
    for completion in itertools.product(*domains):
        points = [completion[i * len(directions):(i + 1) * len(directions)] for i in range(len(boxes))]
        front = point_frontier(points, directions)
        certain &= front
        possible |= front
    return certain, possible


def test_exhaustive_two_candidate_two_objective_envelopes():
    intervals = [{"low": 0, "high": 0}, {"low": 0, "high": 1}, {"low": 1, "high": 1}, {"low": 0, "high": None}]
    checked = 0
    for directions in itertools.product(("MIN", "MAX"), repeat=2):
        objectives = [{"direction": x} for x in directions]
        for flat in itertools.product(intervals, repeat=4):
            boxes = [flat[:2], flat[2:]]
            expected_certain, expected_possible = enumerate_frontiers(boxes, directions)
            result = NS["frontier"](boxes, objectives)
            assert set(result["certain_frontier"]) == expected_certain
            assert set(result["possible_frontier"]) == expected_possible
            checked += 1
    assert checked == 1024


def test_three_candidate_tradeoffs_unknowns_and_equal_points():
    examples = [
        [[{"low": 0, "high": None}, {"low": 0, "high": None}]] * 3,
        [[{"low": 0, "high": 0}, {"low": 1, "high": 1}], [{"low": 1, "high": 1}, {"low": 0, "high": 0}], [{"low": 1, "high": 2}, {"low": 0, "high": None}]],
        [[{"low": 1, "high": 1}, {"low": 1, "high": 1}]] * 3,
    ]
    for boxes in examples:
        c, p = enumerate_frontiers(boxes, ("MIN", "MAX"))
        result = NS["frontier"](boxes, OBJS)
        assert result["certain_frontier"] == sorted(c) and result["possible_frontier"] == sorted(p)


def test_observation_replay_root_and_panel_bindings(contract, direct_vm):
    key, root = open_panel(contract)
    other, other_root = open_panel(contract, "other")
    install(direct_vm, 0)
    with direct_vm.expect_revert("Input root mismatch"):
        contract.observe(other, 0, root)
    with direct_vm.expect_revert("Invalid source index"):
        contract.observe(key, 3, root)
    contract.observe(key, 0, root)
    before = contract.get_observation(key, 0)
    with direct_vm.expect_revert("Source already observed"):
        contract.observe(key, 0, root)
    assert before == contract.get_observation(key, 0)
    with direct_vm.expect_revert("Unobserved source"):
        contract.get_observation(other, 0)
    with direct_vm.expect_revert("Nonce used"):
        open_panel(contract)


@pytest.mark.parametrize("kind", ["HASH_MISMATCH", "HTTP_ERROR", "SIZE_ERROR", "ENCODING_ERROR", "INVALID_DOCUMENT"])
def test_failed_source_finalizes_held_without_frontier(contract, direct_vm, kind):
    body = {"HASH_MISMATCH": b"uncommitted body", "HTTP_ERROR": b"not found", "SIZE_ERROR": b"a" * 6001,
            "ENCODING_ERROR": b"\xff", "INVALID_DOCUMENT": b'{"not":"a report"}'}[kind]
    sources = SOURCES.splitlines()[:2]
    if kind == "INVALID_DOCUMENT":
        sources[0] = sources[0].split("|")[0] + "|" + hashlib.sha256(body).hexdigest()
    key, root = open_panel(contract, sources="\n".join(sources))
    install(direct_vm, 0, body=body, http=404 if kind == "HTTP_ERROR" else 200)
    contract.observe(key, 0, root)
    install(direct_vm, 1)
    contract.observe(key, 1, root)
    contract.finalize(key, root)
    assert contract.get_result(key)["output"] == {"status": "HELD", "failed_sources": [0], "certain_frontier": [], "possible_frontier": []}
    with direct_vm.expect_revert("No analyzed frontier"):
        contract.certain_frontier(key, root)


@pytest.mark.parametrize("raw", ["{}", '{"matrix":[]}', '{"matrix":[[true],[false]]}',
    '{"matrix":[["MATCH","MATCH","MATCH"],["MATCH","MATCH","MATCH"]]}',
    '{"matrix":[[],[]],"confidence":1}', '{"matrix":[],"matrix":[]}'])
def test_malformed_mapping_commits_no_observation(contract, direct_vm, raw):
    key, root = open_panel(contract)
    direct_vm.clear_mocks()
    spec = NS["parse_sources"](SOURCES)[0]
    direct_vm.mock_web(re.escape(spec["url"]), {"response": {"status": 200, "headers": {}, "body": BODIES[0]}, "method": "GET"})
    direct_vm.mock_llm(r"(?s).*ROBUST PARETO MEASUREMENT MAPPING.*", raw)
    with direct_vm.expect_revert("Malformed measurement mapping"):
        contract.observe(key, 0, root)
    assert contract.get_panel(key)["seen_mask"] == 0
    with direct_vm.expect_revert("Unobserved source"):
        contract.get_observation(key, 0)


@pytest.mark.parametrize("change", ["reverse", "boolean", "float", "missing", "duplicate-key"])
def test_invalid_measurements_rejected(change):
    doc = json.loads(BODIES[0])
    if change == "reverse":
        doc["measurements"][0]["low"] = 100
    elif change == "boolean":
        doc["measurements"][0]["low"] = True
    elif change == "float":
        doc["measurements"][0]["high"] = 1.5
    elif change == "missing":
        del doc["notes"]
    body = json.dumps(doc)
    if change == "duplicate-key":
        body = body[:-1] + ',"schema":"measurement-ranges-v1"}'
    with pytest.raises(ValueError):
        NS["parse_document"](body)


def test_actual_validator_refetches_and_rejects_substitution():
    cls = next(x for x in TREE.body if isinstance(x, ast.ClassDef))
    method = next(x for x in cls.body if isinstance(x, ast.FunctionDef) and x.name == "observe")
    callback = next(x for x in method.body if isinstance(x, ast.FunctionDef) and x.name == "validator")
    source_spec = NS["parse_sources"](SOURCES)[0]
    binding = {"panel": "a", "index": 0, "input_root": "root"}
    report = {"binding": binding, "source": {"url": source_spec["url"], "http": 200, "status": "OK", "body": BODIES[0].decode(), "hash": source_spec["sha256"]},
              "document_status": "READY", "matrix": MATRICES[0]}
    class Return:
        def __init__(self, value):
            self.calldata = value
    calls = []
    def independent():
        calls.append(True)
        return json.loads(json.dumps(report))
    env = {**NS, "binding": binding, "source_spec": source_spec, "spec": {"objectives": OBJS}, "observe_source": independent,
           "gl": SimpleNamespace(vm=SimpleNamespace(Return=Return))}
    exec(compile(ast.Module(body=[callback], type_ignores=[]), "actual-validator", "exec"), env)
    validate = env["validator"]
    assert validate(Return(report)) and len(calls) == 1
    forged = json.loads(json.dumps(report));forged["matrix"][0][0] = "NO_MATCH"
    assert not validate(Return(forged)) and len(calls) == 2
    for field, value in (("panel", "b"), ("index", False), ("input_root", "other")):
        forged = json.loads(json.dumps(report));forged["binding"][field] = value
        assert not validate(Return(forged))
    forged = json.loads(json.dumps(report));forged["source"]["body"] = "substitution"
    assert not validate(Return(forged))
    assert not validate(object())


def test_post_consensus_binding_substitution_rejected(contract, direct_vm, monkeypatch):
    from genlayer import gl
    key, root = open_panel(contract)
    install(direct_vm, 0)
    def forged(leader, validator):
        report = json.loads(json.dumps(leader()))
        report["binding"]["index"] = 1
        return report
    monkeypatch.setattr(gl.vm, "run_nondet_unsafe", forged)
    with direct_vm.expect_revert("Invalid consensus observation"):
        contract.observe(key, 0, root)
    assert contract.get_panel(key)["seen_mask"] == 0


def test_finalization_and_consumer_fencing(contract, direct_vm):
    key, root = open_panel(contract, sources="\n".join(SOURCES.splitlines()[:2]))
    for i in (1, 0):
        install(direct_vm, i)
        contract.observe(key, i, root)
    contract.finalize(key, root)
    before = contract.get_result(key)
    assert before["output"]["certain_frontier"] == before["output"]["possible_frontier"] == [0]
    with direct_vm.expect_revert("Panel finalized"):
        contract.finalize(key, root)
    with direct_vm.expect_revert("Panel finalized"):
        contract.observe(key, 0, root)
    with direct_vm.expect_revert("No analyzed frontier"):
        contract.certain_frontier(key, "f" * 64)
    assert before == contract.get_result(key)


def test_creator_limit(contract, direct_vm):
    for i in range(32):
        open_panel(contract, str(i))
    with direct_vm.expect_revert("Creator limit"):
        open_panel(contract, "overflow")


def test_prompt_contains_full_document_notes_and_objectives():
    doc = json.loads(BODIES[0])
    prompt = NS["match_prompt"](CONTEXT, OBJS, doc)
    data = json.loads(prompt.split("DATA=", 1)[1])
    assert data == {"context": CONTEXT, "objectives": OBJS, "document": doc}
    assert "one worker" in data["document"]["measurements"][2]["description"]
