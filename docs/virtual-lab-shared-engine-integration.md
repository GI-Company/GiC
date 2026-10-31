# VirtualLab shared research engine: hosted, desktop and ChatGPT integration

Status: architecture and acceptance gates only. **This document does not expose an API, enable OAuth, grant lab access, or certify scientific outcomes.**

## Starting point and provenance

Owner-reported local implementation in `GI-Company/virtual-lab`: Qt-independent `virtual_lab/application/`, `ResearchEngine`, `HeadlessWorkspace`, `ResearchClient` and `integrations/shared-engine-contract/`. Verify a pushed commit, the exported schema files and tests before implementing transport. The remote `virtual-lab` main branch did not yet contain these files when this design document was prepared.

The existing GIC website offers a browser reference simulation and a paid scientific cockpit. The product draft branch also has a separate free browser demonstration and a gated **public fixed-reference MCP prototype**. Neither is currently a live client of the shared Python research engine. Existing subscription access must not be weakened in the course of integration.

## Non-negotiable boundaries

1. `ResearchEngine` remains a **trusted instance-owner process** with one owner thread, writer lease, SQLite state, Genesis ledger and artifact root. It is not exposed directly to the internet and is never opened simultaneously from a second desktop or web process.
2. `ResearchClient(surface='web'|'desktop'|'chatgpt')` expresses **diagnostic origin only**. It does not authenticate users or grant permissions. Do not use client-supplied labels, project IDs or subscription claims to authorize operations.
3. The network-facing service terminates authentication and builds a server-issued principal from verified credentials. It selects the authorized organization, instance and project membership, entitlements, data-sharing category and allowed operation before dispatching a contract command.
4. Commands are dispatched on the engine's **owner thread**, not the request handler's arbitrary thread. Numerical work continues in bounded subprocess workers with no database/credential connections. The owner accepts and publishes results.
5. Every request must be scoped to a server-resolved `instance_id` and, where applicable, `project_id`, `experiment_id` and `observation_id`. All returned references, artifact handles and feed cursors are rechecked server-side.
6. An open browser or ChatGPT session may not obtain arbitrary filesystem paths, native instrument control, stored tokens, training rights, or direct database connections.
7. Evidence states remain accurate: `MODEL_ASSUMPTION`, `INFERRED`, `UNKNOWN`, `SIMULATED` are not interchangeable with verified measurements. Forecasts and INTENT candidates never become observations solely because a plugin requests them.
8. Preserve all existing GIC paid accounts until a separately reviewed VirtualLab entitlement migration is complete.

## Three transport patterns

| Client | Connection | Scope |
|---|---|---|
| Hosted Next.js website | Same-origin authenticated server route → trusted research-service API → engine owner thread | Tenant/project membership + capability/entitlement checks |
| ChatGPT private plugin | OAuth-authorized MCP resource server → the same research-service API | Narrow, per-project read/compute scopes; no unchecked training or instruments |
| Paired macOS desktop | Explicit pairing to a selected hosted instance, with revoke/expiry and device identity | Same API and policy as website; local workspaces remain separate until user elects to sync |

A **fourth path** is already separate: the anonymous free website simulation and its future public fixed-reference MCP endpoint. These do not access hosted tenant research instances. Keep them free and use rate limits instead of attaching private credentials.

The Next.js deployment is a web/control-plane surface, **not** a persistent owner process for a SQLite research instance. The Python engine must run in suitable durable compute (e.g. a managed persistent worker/container). Cross-instance moves require explicit import/export or selective sharing, not file-system replication.

## Staged implementation path

### Phase A — Freeze contracts and parity fixtures

- Pin a verified `virtual-lab` commit and schema version.
- Validate exported command/response schemas from `integrations/shared-engine-contract/`.
- Set up bounded **public/synthetic fixtures**: one project, one experiment, one numerical run, one verified report and one feed cursor.
- Confirm web and desktop adapters return equivalent projections and checksum semantics for identical fixture operations. No private BSA or customer data in CI.

### Phase B — Research service boundary

- Implement a **separate, private** server process with no public ingress to the raw engine.
- Provide only allowlisted operations, beginning with `project.list`, `experiment.get`, scoped observation retrieval, job status, bounded change-feed polling and artifact download by opaque handle.
- Require server-verified identity and membership before dispatch, plus entitlement and project-level sharing policy.
- In-process adapter dispatch must happen on the owner thread. Add structured audit: actor, surface, scope, operation, request ID, outcome and model/data classification; do not log full spectra or secrets.
- For first deployment, prefer a single-writer instance. Do not claim cross-store atomic transactions, globally serializable writes, or live multi-user collaboration.

### Phase C — Read-only website integration

- Keep GIC sign-in and existing subscription access. Use a server-side token-to-principal translation; never relay the site's powerful service credentials to the browser.
- Add a **feature-gated** web reader for projects, experiments, observations, status and hash-verified reports.
- Show clear unavailable states for native-only features.
- Keep the currently working browser simulation available while new engine-backed views are tested.

### Phase D — ChatGPT paid/project MCP

- Add a separate **authenticated MCP server** which uses the exact same server policy and projections as the website. Authenticate via OAuth appropriate for the selected ChatGPT workspace.
- Start with read-only project discovery, experiment metadata, approved spectra and report retrieval; only then consider idempotent bounded compute.
- Enforce revocation, resource/audience validation, account tiers and consent at the service; no plan purchases or paid checkout inside ChatGPT.
- Test cross-tenant/project denial, stale-token handling, tool allowlists and revocation before offering a user plugin.

### Phase E — Paired desktop

- Pair an explicit desktop identity to one account and instance using expiring authorization and user consent.
- Desktop client uses service API for server-owned data; never opens server SQLite or silently uploads local artifacts.
- Reconcile project change cursors after reconnect; use optimistic revisions for mutable remote operations. Treat missing revision/conflict support as **read-only**.
- Keep offline local records independent until a deliberate import/export/merge path is designed.

### Phase F — Mutation consistency and observability

- Implement idempotency keys for all externally writable operations, not only numerical jobs.
- Introduce transactional state changes or an outbox/reconciliation mechanism for artifacts, observation registration and Genesis events.
- Add retries, cancellation, bounded pagination, transport-level deadlines, rate limits, tenant quotas, and replay/conflict tests.
- Verify exactly what happens on partial failure; do not claim distributed atomicity until demonstrated.

## Minimum end-to-end acceptance script

1. Sign in as User A. View Project A on the website. Fetch its experiment and a hash-verified report through the service.
2. Use an independently authenticated ChatGPT session for User A. Read the *same* instance/project/experiment IDs through MCP. Return the same bounded evidence projection.
3. Pair an independent desktop client for User A. Fetch the same report and persisted cursor; reconnect and resume the feed without opening server DB files.
4. Sign in as User B (no membership), forge the Project A ID and a feed cursor, and confirm all three surfaces deny access.
5. Revoke User A's project access and re-test new calls. Existing chat messages are not retroactively withdrawn.
6. Submit a permitted numerical job from one surface, switch projects, poll from another surface and confirm the job remains bound to its original project. Verify idempotency/cancellation/restart behavior.
7. Disable a capability and confirm the backend refuses requests even if a client spoofs its UI flags.
8. Verify classifications, resource limits, and provenance against the same pinned engine build. Capture versions, schema, normalized tool responses, audit records and test evidence.

## Explicit exclusions from this milestone

No live-instrument access, server-side machine-learning training, automatic INTENT checkpoint promotion, private laboratory-data cloud fallback, unreviewed external data exports, claims of validated biological prediction, or public multi-user release.

The next coding task should be a **small read-only service adapter + tests against an isolated synthetic fixture** after the local shared-engine branch is pushed and inspectable. Do not invent endpoint behavior or copy the equations to TypeScript.
