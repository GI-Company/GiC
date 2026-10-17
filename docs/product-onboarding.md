# Product onboarding and developer adoption

The homepage leads with three public entry points (Gemini-backed LooseMouth,
INTENT Mini, and BitVision Cell) and labels Virtual Lab as Paid / Enhanced.
Existing pricing, subscription checks, checkout, and inference limits remain
unchanged. No new external service, paid hardware, marketing account, or campaign
is provisioned by this change.

## Prompt handoff

The homepage writes a model-scoped draft to same-tab sessionStorage for at most
10 minutes. The selected workspace consumes it once and fills the composer.
It does not execute it. Prompt content is not placed in URLs or conversion events.
Storage failures show a recovery link instead of claiming the draft transferred.

## Developer examples

`/developers` and the Mini panel expose cURL and standard-library Python examples
for the existing public `/api/intent/mini` endpoint. They contain no HF credential.
The request needs the documented Origin header. NDJSON text snapshots replace
prior output; clients must handle streamed errors and wait for `done: true`.
Inputs follow the same validation and quota as the UI. A short example is a
serving smoke test, not a model-quality evaluation. Direct HF usage can use the
caller's own token and account quota via the Space's API documentation.

Mini output can be copied as Markdown with the checkpoint, prompt, output,
settings captured at generation time and an experimental-output notice. Editing
settings after a run does not rewrite that run's export metadata.

## Shareable Lab settings

RHO and optical controls copy a versioned URL fragment containing only validated
numeric settings. The parser rejects extra fields, duplicate keys, oversized
fragments, unsupported versions, nonfinite values and values outside solver
bounds. Tokens, approval, results, imported files and notes are not serialized.

Guests still see the existing subscription gate. Same-tab login can preserve
validated settings in sessionStorage for 10 minutes. Only the authorized cockpit
restores the selected workspace. RHO approval starts unchecked and there is no
automatic solver request or optical frame capture. Existing JSON evidence and
packet exports remain available. Hash checks do not establish an immutable or
signed record.

## Measurement

The existing conversion helper adds content-free events:

- `gic_tool_opened` — homepage launch; `tool`, `placement`.
- `gic_run_completed` — successful Mini generation, RHO calculation or optical
  frame; `tool`.
- `gic_example_copied` — successful snippet copy; `tool`, `format`.
- `gic_settings_shared` — successful Lab settings copy; `tool`.
- `gic_result_exported` — successful model Markdown copy; `tool`, `format`.

Existing `gic_answer_received`, signup, checkout and subscription events are
retained. Analytics remains subject to the existing privacy decision, including
paid opt-out. Mini does not override an unresolved workspace policy, so its
completion events may intentionally remain unrecorded. Prompts, answers,
settings, credentials and identities are excluded from these events; prompt,
output and snippet panels are masked from replay/autocapture.

These are event hooks, not a claim of measured conversion improvement. No live
PostHog dashboard, experiment or external campaign is changed. Assess launch →
completed run → signup → subscription only where collection is permitted.

## Discovery and evidence

The public developer guide includes a factual engineering note on authenticated
streaming and the Gradio session-identifier compatibility fix. The research log
links to it. `llms.txt`, the sitemap, metadata and social image describe actual
products, access and compute location. Canonical discovery URLs use the verified
`www.globalintentcompany.space` production domain. This does not repair apex DNS
or guarantee search ranking / LLM discovery.

## Verification

Run:

```
node --test scripts/verify-product-onboarding.cjs scripts/verify-intent-hf.cjs scripts/verify-agents.cjs scripts/verify-conversion.cjs scripts/verify-intent-router.cjs scripts/verify-research-agents.cjs
npm run build
```

Tests cover draft routing/expiry, hostile shell-text and Python example
round-trips, shared-settings validation and authentication continuity, analytics
content stripping and opt-out, streaming authentication, and paid access gates.
Browser checks cover homepage handoff to both chat modes, snippet copy, the
public guide and guest Lab gate. An isolated `/private/tmp` fixture tests the
paid cockpit's settings restoration and approval controls; no fixture routes or
authentication bypasses ship in the application.
