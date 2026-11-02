# VirtualLab unified website studio (review implementation)

The existing **GIC website** route `/virtual-lab/demo` now renders a single light-mode, desktop-inspired scientific workspace. This replaces the old standalone paid-demo page layout, **not** the real native Qt desktop implementation and not the independent shared Python ResearchEngine. The public `/virtual-lab/free` route remains supported.

## Capability and entitlement map

| Capability | Free (guest/account) | Researcher (or qualifying GIC Paid/Enhanced) | Laboratory |
| --- | --- | --- | --- |
| Free reference numerical sweep, local hashes & exports | Available | Available | Available |
| Paid RK4 simulation, RHO, optical frames, structure viewer, isotope calculator | Upgrade | Available | Available |
| Local CSV/JSONL inspector and session-level evidence notebook | Upgrade | Available | Available |
| Local laboratory pilot planner and JSON draft export | Upgrade | Upgrade | Available |
| Private research projects and campaign inspection | Upgrade | **Disabled until private host configured and authorized** | **Disabled until private host configured and authorized** |
| Real research campaign writes / instruments / shared desktop files | Not available | Not available | Not available |

The website's existing `GET /api/virtual-lab` endpoint authenticates the Supabase bearer session and checks current entitlements. **That endpoint is authoritative**; the client-side module catalog only chooses what to render. Existing active GIC Paid/Enhanced subscriptions retain their supported paid cockpit access, but are not silently treated as separate Laboratory subscriptions. No Stripe prices, trials or entitlement tables are modified.

## User-facing integration

- All tiers use the same light-mode main navigation, home dashboard, and honest availability labels.
- Free visitors can run the real previously deployed browser-local reference simulation from inside `/virtual-lab/demo`, without signing in.
- Qualified paid users use the **existing ScientificCockpit components** embedded in the new navigation: multi-scale biology, RHO, reference & AI, optical sandbox, isotope envelope calculator, local numeric file inspector, and session evidence notebook. Reuse preserves existing execution approvals, server-side quotas, report semantics, simulated/unknown labels and hashes.
- A qualified Laboratory subscription unlocks a local protocol-planning UI. It exports a `DRAFT_NOT_SUBMITTED` JSON file, not a campaign request. The draft is tab-local; the browser does not persist or upload it. No confidential-data handling guarantees are implied.
- The existing server-scoped research reader remains **default-off**, checks project/tenant authorization separately, and allows only GET read paths. The studio's project screen shows an unavailable state if the reader is off. It does not expose private mutations, real campaign execution, desktop pairing, or file sync.
- Existing GIC sign-in, checkout, email/Google return destination, and VirtualLab subscription pages remain in use.

## Security and release boundaries

1. Public browser selection of `tier`, a module or a plan name is **not authorization**. Paid mutations remain subject to the existing `/api/virtual-lab` entitlement validation. The private project reader independently verifies GIC bearer identity, subscription eligibility, project membership, request allowlist and exact-byte integrity.
2. Neither the private signing key nor Supabase secret/service key are bundled in the browser. Project data is not placed in browser storage by this change. Entering the private project workspace opts out of behavioral analytics for the lab session.
3. Free results are local and labeled SIMULATED; the numeric import UI labels source UNKNOWN; calculated spectra are not measured data; source hashes do not prove biological validity.
4. User-typed Laboratory pilot notes should remain nonconfidential and on-device until qualified handling is in place. Local draft export does not signify approval or run an experiment.
5. The desktop is a separate Python/Qt process. Desktop instrument drivers, canonical Genesis-ledger package signing, native installers, long-lived campaign delegation, ChatGPT OAuth and multi-user live synchronization are not represented as live website capabilities.

## Review and acceptance

Before merging, run `npm run test:research`, `npm run test:conversion`, `npm run test:agents`, `npx tsc --noEmit --incremental false`, and `npm run build`. CI also checks lockfile/audit and secrets.

Manual browser acceptance on the preview deployment:
1. Guest visits `/virtual-lab/demo`; sees light-mode studio and successfully runs/exports/locally verifies the Free experiment.
2. Guest attempts paid simulation and Laboratory planner; sees actionable but nonbypassable upgrade states.
3. Existing GIC Paid/Enhanced user logs in; the paid cockpit works, new module navigation does not drop the active experiment, and Laboratory planner stays locked.
4. Active VirtualLab Researcher accesses scientific tools; Laboratory planner remains locked. Laboratory entitlement opens the local planner, validates the checklist, and exports only a draft JSON.
5. With research reader **off**, private projects shows a host-off state with no backend request. With reader enabled in isolated staging, verify User A project reads; User B denial; report byte parity; permission revocation, and analytics suppression. Real hosted qualification is a **separate** test.
6. Verify mobile navigation, keyboard focus, screen reader tab names, empty/error messages, and source-label clarity.

No merge into `main`, live backend enablement, or academic/student deployment is implied by opening this draft PR.
