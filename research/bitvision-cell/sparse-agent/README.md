# BitVision-Cell continual sparse learner (research branch)

This research runner uses the **published BitVision-Cell v0.2 update-500 ONNX policy** as a frozen baseline. It learns a separate, sparsified model of observed synthetic tissue-state transitions, persists sufficient statistics between episodes, proposes short-horizon control residuals, and evaluates whether proposed changes are better than frozen PPO on separately seeded simulator episodes.

**This is not production website integration, biological validation, or demonstrated AGI.** It does not update ONNX neural weights. Promotion is deliberately conservative: if held-out reward advantage is not positive or host failures increase, the original PPO controller remains the champion.

## Files

- `benchmark.py` — original real ONNX one-step sparse residual evaluation, including the negative result on harder simulator episodes.
- `continual.py` — cross-episode experience memory, sparse transition model, three-step residual MPC, evaluation gate and JSON results.
- `.github/workflows/bitvision-continual.yml` — CI runner. Restores research-branch memory from the previous GitHub Actions cache, adds episodes, evaluates, publishes artifacts, saves next memory.
- `.github/workflows/bitvision-sparse-real.yml` — earlier comparison benchmark.
- The mathematical compendium is delivered separately in the chat archive.

## What was actually validated

GitHub Actions run 41313980751: baseline state absent; after learning 20 synthetic episodes, the memory contained 197 transitions. No controller promotion: evaluated reward delta 0.

GitHub Actions run 41314186998: successfully **restored the first run's cache** (20 episodes, 197 transitions), learned another 20 episodes, and saved 40 episodes / 388 transitions in a new cache. New sparsity threshold retained 94 of 742 model coefficients. The held-out one-step reward RMSE was about 1.309, and the candidate did not exceed PPO; the promotion gate preserved PPO.

Full logs: https://github.com/GI-Company/GiC/actions/runs/41314186998

## Safety and methodological limits

- Synthetic environment only. The published P28482 structure coordinates are used, but the standalone harness approximates an amino-acid feature; test outputs are *not* an exact browser-port comparison.
- The continual model learns from its own previous simulated observations, but current **policy improvement is not established**.
- The action proposal logic uses estimated three-step consequences and a hold-out error margin; a short horizon does not capture all long-run resistance dynamics.
- Replaying identical initial seeds does not ensure paired stochastic streams remain identical after diverging actions.
- The cached memory is scoped to the research branch and may expire under GitHub retention; production permanence needs a database or durable object store.
- The proof of the general G++ regret target remains open. No guarantee that accumulated memory makes the agent smarter.
- The code uses a small action perturbation and a conditional champion gate; default ONNX remains unmodified.

## Reproduction

From the repository root, on a local machine with NumPy 2.2.6, ONNX Runtime 1.22.1, internet access to the public ONNX URL:

```bash
python research/bitvision-cell/sparse-agent/continual.py \
  --memory research/bitvision-cell/sparse-agent/.state/memory.json \
  --report bitvision_continual_report.json \
  --train-episodes 20 --eval-seeds 10 --epoch 10
```

Run again with the same `--memory` path to accumulate additional observations. The script rejects memory files with different checkpoint SHA or schema version. The JSON report includes per-seed returns, host failures, champion selection and observed sample count.

The older one-step sparse agent's failed long-horizon comparison is a reference negative experiment, not something removed from the record.
