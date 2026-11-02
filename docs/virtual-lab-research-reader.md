# GIC authenticated read-only research reader

Status: implemented on a review branch, default off. This is the website's server-side adapter to the shared Python ResearchEngine. It is not a deployed hosted research instance, private MCP OAuth server, desktop pairing flow or shared-project UI. No local desktop records are discovered or uploaded.

The matching engine is reviewable in [VirtualLab PR #13](https://github.com/GI-Company/virtual-lab/pull/13), commit `0c0f7f3`. GitHub's remote CI currently cannot start because the account is locked due to a billing issue; successful local qualification does not close that remote merge gate.

The new `GET /api/virtual-lab/research/...` route:

1. Requires `VLAB_RESEARCH_READER_ENABLED=true` and an allowlisted read route.
2. Verifies the incoming GIC bearer session through the existing server-side Supabase `/auth/v1/user` lookup. Client `user_id`, user metadata, subscription and surface labels do not select the actor.
3. Rechecks the existing qualifying GIC Paid/Enhanced entitlement or an active/trialing VirtualLab Researcher/Laboratory entitlement. This preserves the existing cockpit's qualifying-account rule. A subscription alone does not grant a research project.
4. Issues a new RS256 service-audience JWT for that verified subject, expiring in 60 seconds with a fresh token ID. The GIC session token and Supabase service credentials never go to the Python engine or response body.
5. Calls one configured HTTPS research-service origin with redirects disabled. The Python service independently resolves project membership, tenant, category sharing and Settings restrictions. It remains the sole owner of its SQLite/artifacts and research logic.
6. Accepts at most 1 MiB and verifies the exact response SHA-256 before forwarding the original JSON bytes and digest. Upstream errors, cookies, private paths, tokens and signer configuration are not relayed.

The route translates `/api/virtual-lab/research/projects` to `/v1/projects`, and `/api/virtual-lab/research/instances/{instance}/projects/{project}/...` to the corresponding `/v1/instances/...` route. Allowed operations are project discovery, experiment metadata, observation metadata, report, bounded spectrum and project change polling. No generic proxy, job polling, mutation, arbitrary URL/path, file upload, instrument control or training endpoint is provided. Changes are polled with a scoped cursor; this does not add live collaboration or conflict handling.

## Operator configuration

These settings are server-only, absent from the browser bundle and independent of `VLAB_PUBLIC_MCP_ENABLED` and paid-checkout flags:

| Variable | Meaning |
| --- | --- |
| `VLAB_RESEARCH_READER_ENABLED` | Default false; enable only in an approved test deployment first |
| `VLAB_RESEARCH_SERVICE_ORIGIN` | One reviewed HTTPS origin without credentials, path, query or fragment |
| `VLAB_RESEARCH_ISSUER` | Pinned HTTPS issuer matching the Python verifier |
| `VLAB_RESEARCH_AUDIENCE` | Dedicated research-service audience matching the Python verifier |
| `VLAB_RESEARCH_KEY_ID` | ID of a separately provisioned RSA verification key |
| `VLAB_RESEARCH_SIGNING_KEY` | PKCS#8 RSA private PEM, at least 2048 bits, stored as a deployment secret |

Generate the production broker key under the deployment operator's control; enroll only its public key in the Python service. Do not reuse the site's Supabase JWT secret or put this key into public environment variables. The Python policy's subject IDs must be the corresponding Supabase user IDs, enrolled explicitly for each hosted project. No new Supabase tables/migrations or production user/plan records are created here.

The existing Supabase user lookup verifies a token's identity; it does not establish immediate global session logout invalidation by itself. Project access is rechecked independently on every engine request. Define and test the production session-revocation policy, including `auth.sessions` if strict logout invalidation is required, before enabling sensitive shared-account access. Neither browser user metadata nor stale tier claims serve as authority.

## Qualification

```bash
npm ci --ignore-scripts
npm run test:research
npm run test:agents
npx tsc --noEmit --incremental false
npm run build
```

The pinned offline source scanner uses `.secrets.baseline` for eleven reviewed non-secret findings: demonstration hash labels, a public Supabase publishable key, placeholder configuration values, and synthetic/rejected credentials in tests. No service/private signing key is present. New candidate values are reported by location only and fail CI. Dependency and source checks execute without production credentials.

The test suite checks the actual production route's identity/entitlement wiring using an offline Supabase stub, service JWT signature/audience/lifetime, exact-byte hashes, no secret/cookie forwarding, default-off behavior, scoped routes, account and project revocation, forged client flags, malformed responses and bounds. It also tests the existing anonymous public MCP route separately: initialization, all fixed presets/digest checks, malformed inputs and rejection of private/commerce tools.

The cross-process qualification needs a reviewed `GI-Company/virtual-lab` checkout and its locked service environment:

```bash
/reviewed-engine/.venv-service/bin/python scripts/qualify-research-reader.py \
  --engine-source /reviewed-engine --output /new/empty/qualification-directory
```

It starts the real Python service and a loopback wrapper over the same website reader function. Ephemeral signing keys travel through stdin only; identities are explicit synthetic stubs. Website/direct-service report bytes must match; an unrelated account and anonymous caller are denied; revocation must block both clients and research files must remain unchanged. This is not a real Supabase login, live website session, real ChatGPT connection or native desktop acceptance. The wrapper requires `--synthetic-qualification` and must never be used as a production authentication service.

## Dependency and access corrections

The existing lockfile's runtime audit reported 12 vulnerable packages, including a critical Next.js advisory. Compatible updates pin Next.js 15.5.28 and PostCSS 8.5.28, with a reviewed PostCSS override to remove the older nested copy. The patched production-dependency audit reports zero known vulnerabilities. This is an advisory snapshot, not a guarantee of vulnerability-free software. Development-only dependency findings remain separate and must be reviewed; no major-version `--force` update was applied.

Regression tests also exposed that `isActiveVirtualLab` accepted an active malformed row with an unrecognized tier. It now requires `researcher` or `laboratory` in addition to `active` or `trialing`. The real table's tier constraint already represents this intended contract. Existing qualifying GIC subscriptions continue through their existing legacy check. Stripe plans, prices, checkout, trials, payment collection and webhook behavior were not changed by this correction.

## Remaining live-release gates

- [ ] Review the Python service commit, deployment policy and project grants.
- [ ] Provision a durable single-owner research host, TLS/private ingress, supervision, backups and quotas.
- [ ] Configure a test-only issuer/key pair and an isolated synthetic hosted project.
- [ ] Exercise actual GIC sign-in, authorized reads, cross-account denial, report parity and revocation through the deployed website.
- [ ] Implement a separate authenticated MCP/OAuth adapter over the same service and perform actual ChatGPT acceptance.
- [ ] Implement explicit expiring/revocable desktop pairing and deliberate transfer consent.
- [ ] Complete full workspace parity and mutation consistency before claiming the full application is shared.

The free public-reference plugin remains a separate release. PR #16's legal/domain-verification pages, real ChatGPT connection/tool scan, a walkthrough recording, domain and developer verification, and owner submission attestations still govern that publication. This branch neither activates public MCP nor submits or publishes a plugin.


## Read-only research workspace (review branch)

The GIC website includes a private research preview at `/virtual-lab/research` under the existing VirtualLab feature, **not a separate website**. This route is a UI over the server-owned `GET /api/virtual-lab/research/...` identity bridge and remains nonfunctional while `VLAB_RESEARCH_READER_ENABLED` is false. The public VirtualLab landing page hides the private-workspace link while the feature flag is disabled. Direct visits still show a non-sensitive unavailable state. It is not a hosted or deployed integration by itself.

- The visitor signs in using the existing GIC Supabase sign-in flow. The return destination is a fixed allowlisted value, including OAuth/email sign-in; never an arbitrary redirect URL.
- After authorization, the UI discovers only projects the private engine permits that principal to inspect. Selecting a project lists experiments. Selecting an experiment lists campaign summaries and observation metadata, and allows inspecting one campaign. Lists use bounded pagination.
- Campaign list, detail and results routes are newly allowlisted **GET only**. The website cannot create, start, pause or cancel campaigns. The corresponding Python host must be explicitly started with `--enable-campaigns` for those views to exist, and project `campaign_read` access must be granted. If the independent campaign endpoint is unavailable/404, the workspace still shows authorized observation reports; authentication, entitlement and integrity failures remain fail-closed.
- Downloaded campaign results and MS reports are independently verified in the browser against the exact server-forwarded `X-Content-SHA256`; the website server also verifies the upstream bytes before forwarding them. A hash only establishes byte integrity; results remain `SIMULATED` or retain their actual epistemic classifications.
- The private workspace disables behavioral analytics. The UI distinguishes sign-out, account/subscription denial, inaccessible project/revocation, integrity failure and unavailable host. Reopening the page or selecting “Refresh access” causes a fresh read; current project authorization is rechecked on each new request.
- No Supabase authorization flags or user metadata are supplied as service grants. No public Free tools, billing flows, entitlement tables, source instruments or native workspace files are modified.

### Qualification before enabling

1. Merge and independently review the Python service branches (#13 and #14) **before** provisioning a supervised private host with durable backup and audited policy. This web branch does not include the service.
2. Keep `VLAB_RESEARCH_READER_ENABLED=false` until the server issuer/public key, service TLS host, entitlement checks, service Settings and tenant/project grants have been reviewed and configured.
3. Run `npm run test:research`, `npx tsc --noEmit --incremental false`, `npm run build` and the separate-process Python service qualification against a synthetic fixture.
4. Sign in with actual GIC User A with an approved project; verify project, experiment, campaign and report. Sign in as unrelated User B, attempt known private IDs and confirm 404/403 with no leaks; revoke User A and confirm new calls fail. Confirm logout/session invalidation policy and all end-to-end audit records.
5. Only then enable in a private nonproduction environment. Do not advertise public hosted campaign execution or ChatGPT OAuth until separately tested.

This branch adds a browser read surface; **long-lived unattended campaign delegation, private ChatGPT OAuth, desktop pairing and campaign writes from GIC accounts remain out of scope**.
