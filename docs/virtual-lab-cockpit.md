# Virtual Lab cockpit update

The two supplied HTML prototypes were identical. Their workspace layout and
interactions were adapted into native React components using the existing
Tailwind, Lucide and Three.js dependencies. No runtime CDN scripts, global
styles, or third-party inline HTML are injected.

## Workspaces

- Multi-scale world: tissue/cell schematics, the existing RCSB coordinate viewer,
  residue highlights, reset camera, and molecule-to-isotope-calculator navigation.
- RHO simulator: a four-state illustrative kinetic model based on the supplied
  prototype. Validated rate bounds, explicit approval, RK4 integration, charts,
  computed pool fractions, and hashed evidence exports.
- Reference & AI: the existing gene-expression workbench and bounded Gemini
  agent, with its existing proposal, approval, run, and report flow.
- Optical cockpit: deterministic synthetic frames with exposure, illumination,
  gain, bounded session history, pixel inspection, statistics and packet export.
- Virtual mass spec and Instrument analysis: existing isotope calculations and
  local numeric CSV/JSONL inspection retained.
- Evidence notebook: records RHO/optical activity in addition to existing runs,
  imports, and notes. Adds portable hash-linked ledger export/import and actual
  artifact/genesis/missing-artifact tamper checks.

The new `rho_run` API action uses the existing authenticated Paid/Enhanced gate,
same-origin validation and shared solver-run quota. Invalid rates are rejected
before consuming quota. It does not call Gemini. No database schema, secrets,
subscription configuration, or model-serving endpoints were changed.

## Scientific scope

All RHO parameters are assumptions. This model is not fitted to experimental
P23H kinetics and does not predict drug response or viability. Constants and
initial conditions are included in exports. Compared with the supplied HTML,
Euler integration was replaced by bounded RK4 and hard-coded viability and
calibration claims were omitted.

Tissue/cell diagrams are schematics. Existing PDB coordinates are experimental
bovine references, not a generated human mutant. Optical frames are synthetic,
not hardware telemetry or device acknowledgements. Ledger hashes verify bytes
and chain consistency; they do not authenticate a source, signature or .vlab
archive. Fixed claims of passed tests, GPU/Metal equivalence, cryptographic
signatures, or AI-approved biological interventions were not imported.

## Verification

- Production build, TypeScript and lint pass.
- 40 regression tests pass, covering existing solver/agent/access behavior and
  new RHO closed-form equivalence, input bounds, deterministic evidence, optical
  response and real hash-chain tampering checks.
- Browser UI checked in an isolated `/private/tmp` preview with fixture API
  responses. Production paid access was not bypassed and no test routes were
  added to this repository.
- Checked RHO approval/reset/previous-result behavior; optical capture, saturation
  and history; notebook recording; all four ledger verification cases; ledger
  export/import; molecule-to-spectrum handoff; original reference experiment.
- 390-pixel layout has no document-level horizontal overflow.
- Real paid-account Gemini calls and reference-coordinate retrieval were not
  exercised in the isolated preview. Their existing authenticated routes remain
  in place; reference retrieval failure is displayed gracefully.
