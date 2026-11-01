# VirtualLab Free adversarial hardening

This review branch addresses the reported request-buffering and verification-scope gaps. It does not deploy the changes or establish production throttling. The installed 0.1.1 plugin was independently exercised through its real connector and through a native Chrome ChatGPT conversation; that does not establish public directory publication.

## Implemented

- [x] Read the request stream with a 4,096-byte cap, including missing or inaccurate Content-Length and multibyte UTF-8. Reject an oversized declared length before reading. Cancel excess content without waiting for cancellation to settle.
- [x] Apply a five-second body deadline; reject aborted, failed, invalid UTF-8 and compressed bodies. Match the JSON media type exactly. Upstream/platform buffering and transport-layer defenses remain outside this application-level check.
- [x] Keep the three original numerical presets and their existing canonical trajectory digests unchanged.
- [x] Label `verify_public_reference` as canonical-preset digest comparison. It always returns `reportVerified: false`, even when `matches` is true, because no report content was submitted.
- [x] Add `reportSha256` to `run_public_reference`, covering all returned report fields except that digest itself: preset, model/source, simulated classification, protocol, numerical summaries, trajectory digest, Markdown report, limitations and scientific-validation label.
- [x] Add `verify_public_report(preset, artifact)` for the complete returned JSON object. It checks both the submitted content digest and equality to the independently recomputed fixed reference. A modified number, Markdown text, protocol or scientific label fails. Giving modified content a fresh checksum still fails the canonical comparison.
- [x] Validate a shallow fixed report structure before canonicalization. Unknown fields, wrong shapes and missing fields are rejected; private project IDs never grant access. Every complete fixed report fits within the original 4 KiB request budget.
- [x] Preserve adversarial server tests in the existing `npm run test:research` CI command, and provide `npm run test:public-mcp` for manual runs without hosted runners. Exercise raw HTTP independently of ChatGPT schema enforcement.
- [x] Prepare reviewable 0.1.2 plugin sources with explicit digest/report distinctions and altered-report review cases. The deployed endpoint must advertise the new tool before the package is connected or rescanned.

## Exact integrity scope

The existing `sha256` covers the canonical full simulation payload, including trajectories. The new `reportSha256` covers the returned public report object, using the project's existing sorted-key `canonicalJson` representation. It is not advertised as RFC 8785 canonicalization or a signature. Object key order and transport whitespace do not affect this content check; changes to report string content do.

Neither tool signs evidence or authenticates an instrument. The full-report check compares submitted content with this server's fixed reference and does not verify prose or screenshots outside that artifact, private experimental results, or biological truth. All outputs remain SIMULATED and scientific validation remains NOT ESTABLISHED. A client claiming a successful check must actually submit its complete artifact and inspect both `digestMatches` and `canonicalMatches`.

## Remaining release gates

- [ ] Review, merge and deploy the code changes. The changes are not present in the currently installed server merely because local tests pass.
- [ ] Initialize/inspect the Vercel firewall configuration and stage the narrow log-only rule in `integrations/public-mcp-firewall/log-only-rule.json`, preserving other protections. Active/draft reads and a targeted insert returned 404; automatic approval review rejected a full-config initialization PUT because it can replace project-wide settings. No firewall update succeeded. The user subsequently chose to keep it unapplied for now.
- [ ] Have the owner publish the log-only stage and review actual matching traffic. ChatGPT may share egress IPs across users. Logging does not establish throttling.
- [ ] Qualify a low-limit preview rule with a bounded limit+1 ping test and recovery after one window; then publish the reviewed production enforcement rule and verify legitimate ChatGPT use and isolated-IP 429/recovery evidence. Counters are per region, not a global quota. Follow the staged rollout in `integrations/public-mcp-firewall/README.md`.
- [ ] Run `scripts/qualify-public-mcp.py` against the deployed HTTPS endpoint. The script reports rate limiting separately as unverified; it is not a volume test.
- [ ] Upload/validate the revised plugin ZIP as appropriate, rescan the four tools, and repeat real ChatGPT acceptance. Complete publishing-identity, domain, review and directory-publication steps separately.

## Local validation

Recorded results are in `docs/evidence/public-mcp-hardening-local-validation.json`. Focused tests cover the original malformed-input cases, all cross-preset digest substitutions, uppercase digests, repeatability, a common baseline, changed numerical and report content, self-rehashed alterations, independent raw argument validation, streaming byte bounds, early cancellation, stalled/failed streams, media types and origins.

The synthetic SDK/raw-HTTP checks use a separately running built Next.js server and the real Python MCP SDK. They are distinct from actual ChatGPT acceptance of this revised server. The earlier installed plugin and Chrome recording used the production three-tool version; the advertisement accurately labels that Free preview and canonical-digest limitation.

Run locally:

```sh
npm run test:research
npx tsc --noEmit --incremental false
npm run build
# Separate terminal, synthetic fixed public service only:
VLAB_PUBLIC_MCP_ENABLED=true npm run start -- --hostname 127.0.0.1 --port 3216
# Python environment with MCP SDK and httpx installed:
python scripts/qualify-public-mcp.py --url http://127.0.0.1:3216/api/virtual-lab/mcp --output output/public-mcp-http.json
```

The anonymous Free endpoint has no custom experiment input or private research workspace. The full product requires the authenticated shared ResearchEngine, project authorization, controlled write/job operations, supported workflow adapters and appropriate tier enforcement; none is added to the public endpoint by this hardening change.
