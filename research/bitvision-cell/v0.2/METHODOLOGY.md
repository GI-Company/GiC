# BitVision-Cell v0.2 — Methodology

BitVision-Cell v0.2 is a research simulator for studying whether a compact reinforcement-learning policy can learn intervention behavior inside a fixed synthetic tissue/pathogen environment.

> **Research-only scope:** the tissue, pathogen, intervention, toxicity, resistance, and reward rules are hand-written simulator rules. They do not model real disease, predict biological treatment efficacy, or design real treatments.

## Public artifact

- Live demo: https://www.globalintentcompany.space/virtual-lab/bitvision-cell
- Training source: https://github.com/GI-Company/GiC/blob/main/research/bitvision-cell/v0.2/bitvision_cell_v02.py
- Browser inference source: https://github.com/GI-Company/GiC/blob/main/public/bitvision-cell-live.html
- Deployed checkpoint: update 500, FP16 ONNX
- Model SHA-256: `a4ede7825b0ae77c366c5a335ab518d2acbc2270add51f3766611e5e6bb15247`
- Model size: 17,649,139 bytes (16.83 MiB)
- Trainable parameters: 8,751,415

## Training configuration

The public checkpoint was taken at **PPO update 500** from a run configured for **600 updates**.

Core rollout settings:

- 32 parallel environments
- 50 rollout steps per update
- 1,600 environment transitions collected per PPO update
- 800,000 environment transitions collected through update 500
- 3 PPO epochs per update
- minibatch size 256
- discount `gamma = 0.985`
- GAE `lambda = 0.95`
- PPO clip `0.20`
- entropy coefficient `0.003`
- value coefficient `0.50`
- learning rate `2e-4`
- maximum episode length 100 simulator steps

The checkpoint is evaluated deterministically in the browser: the focus action uses the maximum focus logit and the six continuous actions use the policy mean before the simulator's squashing/dose transform.

## Policy architecture

The policy consumes up to 256 structure-conditioned cell/residue tokens with 10 features per token plus an 18-dimensional global context vector.

Published v0.2 configuration:

- model width: 256
- attention heads: 4
- depth: 4 dual-stream stages
- raw-feature encoder plus geometry encoder
- learned positional embedding
- context encoder
- paired attention streams with cross-fusion
- pointer-style focus head over cells
- six continuous intervention outputs
- scalar critic/value head

The browser artifact exposes the deterministic policy outputs but does not claim that the visualization is microscope footage. The coordinates are structure-conditioned normalized coordinates used as a spatial substrate for the simulator.

## Policy outputs

Each inference produces:

1. a **focus-cell distribution** over the active cells; the browser selects the argmax cell,
2. six continuous intervention means.

For browser inference, each continuous mean is transformed as:

[
a_k = \tanh(\mu_k)
]

and then converted to a normalized synthetic dose:

[
dose_k = \left(\frac{a_k + 1}{2}\right)^2
]

Therefore the displayed intervention values are **dimensionless synthetic doses in [0, 1]**. They are not concentrations, clinical dosages, or biological units.

### Six intervention channels

| Output | Scope | Simulator meaning |
|---|---|---|
| `entry_block` | Global | Reduces the new-infection hazard throughout the simulated tissue. |
| `replication_inhibit` | Global | Reduces virion production from infected cell fraction. |
| `immune_boost` | Global | Raises effective immune activation and therefore infected-cell immune killing. |
| `cell_shield` | Local | Deposits around the selected focus cell and locally reduces infection hazard. |
| `virion_clearance` | Local | Deposits around the focus cell and locally increases removal/suppression of virion activity. |
| `infected_cull` | Local | Deposits around the focus cell and directly removes infected-cell fraction, with simulator-defined tissue cost. |

Local operators use a Gaussian focus kernel in normalized coordinate space. Global operators are deposited across all active cells.

## Synthetic environment

The environment tracks per-cell fractions of:

- healthy tissue,
- infected tissue,
- dead tissue,
- virion activity.

It also tracks:

- immune activation,
- cumulative intervention levels,
- six mechanism-specific resistance variables,
- systemic toxicity.

The contact graph is constructed from structure coordinates using a 6-nearest-neighbor graph. Infection and virion activity spread across this graph according to hand-set dynamics.

Training structure accessions are defined in the source. The public browser demo currently uses **P28482** as a held-out structure for the visible live run.

## Reward objective

The policy is optimized against a synthetic scalar reward that penalizes tissue/pathogen burden, total intervention dose, and toxicity above a threshold. It adds a terminal eradication bonus scaled by remaining healthy tissue and subtracts a host-failure penalty.

Because this is a hand-written objective, strong reward does not imply biological efficacy. Reward behavior should be interpreted only as performance against this simulator.

## Public measurements shown in the demo

The live page reports:

- checkpoint/version,
- parameter count,
- model size,
- PPO update count,
- sampled environment transitions through that checkpoint,
- ONNX Runtime execution backend,
- inference latency,
- rolling inference throughput in inferences/second,
- focus cell,
- critic/value estimate,
- all six normalized intervention values.

**Inference FPS** is computed from the rolling average model-inference latency only:

[
inference\_fps = 1000 / mean\_latency\_ms
]

It is not the browser render frame rate and does not include the intentional policy-step pacing used for visualization.

## Reproducibility boundary

The training source and browser inference source are published so visitors can inspect the simulator, policy interface, action semantics, and deployed inference path. The ONNX model is served separately to keep the web page small and is identified by the SHA-256 above.

The artifact demonstrates learned control inside the published synthetic rules. It should not be represented as evidence of a medical treatment, a biological digital twin, or validated therapeutic discovery.
