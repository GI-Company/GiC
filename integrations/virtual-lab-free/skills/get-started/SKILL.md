---
name: get-started
description: Run a fixed public VirtualLab simulation, compare canonical preset digests, and verify supplied public report content without accessing private research data.
---

# VirtualLab Free reference workflows

Use only the tools advertised by the installed server. The presets are `stimulus`, `mrna_decay`, and `protein_decay`. All outputs are SIMULATED and the model is uncalibrated.

1. Call `describe_free_virtual_lab` for capabilities and limitations.
2. Use `run_public_reference` with a supported preset. Preserve the complete returned JSON artifact if report verification is requested.
3. To compare a known preset's digest, call `verify_public_reference` with its exact preset and sha256. Report its actual `matches` value and explicitly say this checks only the canonical preset digest. It does not inspect displayed text or supplied results; `reportVerified` is false.
4. To check returned numerical results and report text, call `verify_public_report` with `preset` and the complete returned JSON object as `artifact`, including `reportSha256`. Report `matches`, `digestMatches`, and `canonicalMatches`. Never substitute a digest-only call for this content check. A changed report must fail even if it has been given a newly calculated checksum.
5. If the installed server does not advertise `verify_public_report`, say complete-report verification is unavailable on that version; do not claim that it passed.

These are software integrity checks against fixed reference content. Neither tool provides a digital signature, verification of prose outside the supplied artifact, experimental evidence, or biological/clinical validation. Do not claim a successful check without the actual tool response.

No tools provide private projects, accounts, laboratory spectra, local files, hardware, INTENT weights, training, or purchases. Do not fabricate such access. Browser demo: https://www.globalintentcompany.space/virtual-lab/free . If the server fails, report that failure without inventing results.
