# VirtualLab Free — Browser demo and public MCP prototype

**Status: staged and disabled by default.** This does not establish ChatGPT connectivity, plugin approval, verified scientific performance, or authenticated laboratory access.

## Product access

1. `/virtual-lab/free` is a public, no-login, no-payment browser experiment that runs the existing uncalibrated gene-expression RK4 model in JavaScript. It includes assumptions, plots, software SHA-256 verification, JSON export and a Markdown report. This is not an instrument measurement or a Genesis Ledger scientific record.
2. `/virtual-lab/plans` displays Free, Researcher and Laboratory tiers. Launch price hypotheses: $9.99 and $29.99 monthly respectively, each with a conditional **7-day free trial**; a payment method is collected at checkout and billing recurs unless cancelled. Stripe price IDs remain unconfigured in this branch.
3. `/api/virtual-lab/mcp` is a separate **anonymous, read-only, fixed-reference** Streamable HTTP MCP prototype. It cannot see a project datastore, user accounts, BSA files, private observations, model weights, instruments, or arbitrary input code.

## MCP transport and launch

The MCP prototype currently targets **2025-11-25** JSON-RPC Streamable HTTP, accepts JSON responses, and exposes:

- `describe_free_virtual_lab`: describes the public demo and scientific limits.
- `run_public_reference`: returns a bounded deterministic report for one preset (`stimulus`, `mrna_decay`, `protein_decay`).
- `verify_public_reference`: recomputes the SHA-256 of a selected fixed payload and compares it with a caller-supplied digest.

There is no billing or subscription sales action inside the MCP endpoint. **Anonymous means public**: never add customer-specific tools to this endpoint.

Launch flag: set `VLAB_PUBLIC_MCP_ENABLED=true` only in a controlled preview environment after security review, transport testing, quota/rate-limit review and external connection testing. Without it, the endpoint returns HTTP 503 and exposes no tools. Do not enable the flag in production solely because the web free demo works.

## MCP Inspector smoke test

For local tests use:

```bash
npm run dev
npx @modelcontextprotocol/inspector@latest
```

Choose Streamable HTTP and target `http://127.0.0.1:3000/api/virtual-lab/mcp`. Enable `VLAB_PUBLIC_MCP_ENABLED=true` in the local server process first. Use `No authentication` only for these **public simulation** tools; paid/private operations require OAuth 2.1 and a separate authenticated MCP resource server.

Test `initialize`, `tools/list`, all three tools, invalid preset, malformed JSON, wrong protocol version, disabled flag, origin validation, repeated calls and concurrent requests. Verify response size and computation cost. Repeat in ChatGPT Plugins with a hosted HTTPS preview endpoint **only after** those checks. OpenAI's custom MCP server setup requires an HTTPS address for a remote connection.

Use the conversation prompt: "Use VirtualLab Free to describe the reference model, run the stimulus comparison, and verify its reported checksum." Never confuse these simulation outputs with the separate BSA pilot experimental reference.

## Release gates

- TypeScript/Next.js build passes, and a test environment reproduces deterministic results.
- MCP Inspector successfully negotiates the transport and uses all three tools.
- ChatGPT plugin connects to a reviewed preview URL and runs a complete tool chain.
- Public endpoint is rate-limited (for example via Vercel Firewall). No private data/tool escapes, no credential leaks.
- Stripe two-tier 7-day trials tested in sandbox: first-time trial, subsequent paid attempt, cancellation, billing failure, duplicate/out-of-order webhook, entitlement revocation, customer portal.
- Supabase migration applied in staging and cross-user RLS tested.
- DMG download is enabled only after independent macOS validation and SHA-256 release verification.

**No public plugin, production MCP connection, customer trial or desktop DMG is released merely by merging this branch.**
