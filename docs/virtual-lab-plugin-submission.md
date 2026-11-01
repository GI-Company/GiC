# VirtualLab Free — OpenAI plugin submission runbook (draft)

The public website feature bundle was merged into `main` via #15 at `98d0cc1f48be024382f39882e697b08a0e3c6da6`. **This does not mean the plugin was submitted or published.**

## Prepared
- Public browser reference demo: `/virtual-lab/free`.
- Fixed-reference read-only MCP prototype: `/api/virtual-lab/mcp`, disabled by default unless `VLAB_PUBLIC_MCP_ENABLED=true`.
- Developer-controlled domain verification path: `/.well-known/openai-apps-challenge`, which returns the exact `VLAB_OPENAI_APPS_CHALLENGE_TOKEN` environment value as plain text. Missing token responds 404.
- Public support, privacy and free-demo terms pages. Owner should review their wording and legal suitability before submission.
- Portable Agent Plugins ZIP drafted independently: `virtual-lab-free-plugin-0.1.0.zip` containing root `plugin.json`, `mcp.json`, a `get-started` skill, SVG artwork and 5 positive / 3 negative cases. Only the ZIP submitted to OpenAI is authoritative for package metadata.
- The plugin must **not** expose imported BSA data, private experiments, arbitrary file access, training, user credentials, hardware control or checkout.

## OpenAI review prerequisites

1. Confirm HTTPS production domain `globalintentcompany.space` and that all four listing URLs work:
   - `https://globalintentcompany.space/virtual-lab/free`
   - `https://globalintentcompany.space/virtual-lab/support`
   - `https://globalintentcompany.space/virtual-lab/privacy`
   - `https://globalintentcompany.space/virtual-lab/terms`
2. Reauthorize Vercel connection for the owning team if required, to read/modify environment variable metadata. Without team permission, do not assume the production MCP enable flag is set correctly.
3. Run MCP Inspector against the **locally enabled** endpoint. Test protocol initialize, tools/list, describe, each fixed reference, checksum verification, malformed inputs, disallowed project paths, connection loss, GET behavior and repeated calls. Confirm annotation semantics and bounded response sizes. Add safe rate limiting before internet exposure.
4. Enable `VLAB_PUBLIC_MCP_ENABLED=true` only when public testing and rate limiting are complete, then verify the real HTTPS endpoint from outside the team network.
5. Connect the remote MCP URL through ChatGPT Plugins as a custom connection and run direct, indirect, negative, and follow-up prompts. Record a real walkthrough accessible to reviewers.
6. In the OpenAI Platform Plugin submission portal, use **With MCP**, upload the ZIP, select a verified Global Intent Company developer identity, and complete automated package scans.
7. Use the portal's **exact domain verification token** in `VLAB_OPENAI_APPS_CHALLENGE_TOKEN`, then verify the challenge and scan the live MCP tools. Avoid hardcoding the challenge or using a fake placeholder.
8. Include five tested positive cases, three tested negative cases, review video URL, release notes, truthful annotations/justifications, and all required URLs. The account owner completes the policy attestations and selects Submit for review.
9. Approval is separate from publication. After approval, the owner selects Publish.

## Important boundaries

- Do not merge an OAuth or private research project API into the anonymous demo.
- Do not try to host the Qt/SQLite research owner engine inside a Vercel request handler.
- Do not promise the complete paid scientific cockpit or desktop research features inside this first free MCP plugin.
- A 7-day Stripe trial in the GIC web application is separate from the public plugin and does not authorize any purchase within ChatGPT.
- A passing Vercel build does not establish correct MCP protocol behavior, successful ChatGPT integration or submission eligibility.

See https://developers.openai.com/plugins/deploy/submission and https://developers.openai.com/plugins/build/plugins.
