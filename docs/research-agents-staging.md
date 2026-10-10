# GIC provider-backed research assistants

This feature is staged on `feature/gic-research-agent-routing`, not deployed.

## Server API
- `GET /api/research-agents`: lists research assistants for a signed-in, actively subscribed Paid or Enhanced user.
- `POST /api/research-agents`: accepts `{ "agent": "intent_r" | "bitvision" | "plm", "messages": [{"role":"user","content":"..."}] }` with a Supabase access token in `Authorization: Bearer ...`.
- INTENT-R and BitVision assistants use Gemini; PLM assistant uses Groq. These are provider-backed personas, **not GIC proprietary checkpoint inference**.
- Access is verified against `loosemouth_billing_entitlements` via the existing `entitlement()` helper. The existing Supabase RPC `consume_inference_quota` is used through `consumeWorkbenchQuota()`, currently **8 shared workbench actions per hour** per authenticated user, not a separate 100-message monthly quota.
- Provider keys are server-side: `GEMINI_API_KEY`, `GROQ_API`. Optional model overrides: `GIC_GEMINI_AGENT_MODEL`, `GIC_GROQ_AGENT_MODEL`. Never expose these keys to the browser.
- JSON-only, same-origin, bounded history and generation, 30-second timeout, no direct model tools or unsafe side effects.
- Failed upstream requests may still consume quota because the atomic reservation occurs before provider invocation.

## Not yet complete
- LooseMouth interface wiring and model selector
- Actual provider integration tests, authenticated end-to-end tests and a production build
- Monthly cost-based quota, token accounting, Gemini multimodal uploads, streaming, and fallback policies
- Verify that environment variables are configured before any deployment

Do not merge or deploy until these items are reviewed and verified. Keep the proprietary model checkpoints offline.
