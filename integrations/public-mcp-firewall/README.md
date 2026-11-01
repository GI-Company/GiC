# Public MCP firewall proposal — NOT APPLIED

The user explicitly chose to keep this unapplied for now. Do not initialize, publish or enforce it without a later instruction.

Scope: POST /api/virtual-lab/mcp only. Initial observation threshold: 600 requests/60 seconds/IP/region, log only. It does not throttle requests. Shared ChatGPT egress may combine many users behind an IP; inspect legitimate traffic before choosing an enforcement threshold. Do not key on caller-controlled forwarding headers in application memory or claim a process-local counter is global protection.

The connected Vercel project is gi-company (prj_0iv0UsoSbDVyYAZ1hGU6WrHvEyrE), team tortorixis-projects (team_slkugprR3QpPdbGUrXXFMMRZ).

Read-only active and draft config requests, and a targeted rules.insert request, returned 404 Seawall Config not found. An attempted initial full-config PUT was rejected by automatic approval review because it can replace the entire project firewall configuration. No firewall modification or publication succeeded. Do not retry through another tool or replace protections as a workaround.

Operator steps:

1. Inspect the project's current configuration and any draft in the Vercel dashboard. Initialize the firewall through the dashboard if necessary; preserve unrelated rules and managed protections.
2. Add the reviewed rule from log-only-rule.json to the draft, then inspect its diff. Publishing requires the user's action under the Vercel Firewall skill.
3. Publish the log-only stage and review traffic matching the rule, including real ChatGPT use. Logs alone are not throttling qualification.
4. Enforce a narrow preview-only test rule, with a deliberately small limit and short window, after the observation stage is reviewed. Make only limit+1 sequential ping requests, confirm a 429, wait one window, and confirm recovery. Do not load-test production or other accounts.
5. Set the reviewed production threshold, publish enforcement, then verify legitimate MCP flows and a bounded isolated-IP 429/recovery check. Record config version, rule ID, time window, statuses and recovery; counters are per region.
6. Recheck for preceding bypass rules and subsequent deployment changes. Keep a rollback that changes this one rule back to log without resetting the entire firewall.

The local 4096-byte/5-second body limit is application protection; it does not replace WAF rate limiting or establish resistance to arbitrary high-volume traffic.

References: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting and https://vercel.com/docs/cli/firewall .
