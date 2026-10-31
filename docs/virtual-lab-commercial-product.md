# VirtualLab product rollout (draft)

This branch introduces a **separate product surface** for VirtualLab without changing LooseMouth's existing plans, price IDs, subscribers, checkout routes or webhook behavior.

## Product areas

- `/virtual-lab`: researched product overview and capability states.
- `/virtual-lab/demo`: original approved simulation demo, kept working on existing GIC Paid/Enhanced entitlements during transition.
- `/virtual-lab/plans`: two **VirtualLab-only** subscription plans (Researcher and Laboratory).
- `/virtual-lab/beta`: macOS DMG download placeholder (disabled until a real release artifact, version and SHA-256 are configured) plus authenticated beta feedback.
- `/api/virtual-lab/feedback`: Supabase-authenticated, RLS-scoped beta feedback.
- `/api/virtual-lab/billing`: Stripe price discovery and hosted Checkout (only when configured).
- `/api/virtual-lab/billing/webhook`: Stripe webhook synchronizing separate VirtualLab entitlements.
- `/api/virtual-lab/billing/portal`: existing customer billing portal.

## Required environment variables

- Existing: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
- New: `VLAB_STRIPE_RESEARCHER_PRICE_ID`, `VLAB_STRIPE_LABORATORY_PRICE_ID`.
- New: `VLAB_STRIPE_WEBHOOK_SECRET` for a separately configured Stripe webhook destination pointing at `/api/virtual-lab/billing/webhook`.
- Optional beta publication **after independent build test**: `VLAB_BETA_DMG_URL`, `VLAB_BETA_DMG_SHA256`, `VLAB_BETA_VERSION`.

The pricing route validates that both Stripe price IDs are unique, monthly recurring, USD denominated, active and distinct from the existing LooseMouth price IDs. It stays disabled otherwise. Do not switch to production/live checkout until pricing, tax settings, refunds, cancellation and webhook recovery tests have been approved.

## Runbook

1. Review the branch and deploy to a **preview environment**, not production.
2. Review and apply `supabase/migrations/20261031_virtual_lab_product_beta.sql` in the appropriate staging database after verifying RLS and permissions.
3. Create **two new products** with monthly recurring prices in Stripe test mode; keep existing LooseMouth products unchanged. Configure the VLAB price IDs and a new webhook destination in preview/staging.
4. Complete Stripe test scenarios: checkout, failed payment, subscription update, cancel, duplicate webhook and out-of-order event; ensure no existing subscription is affected.
5. Verify two signed-in accounts cannot see each other's VirtualLab entitlements or feedback; verify anonymous feedback is rejected.
6. Only after successful pilot build, ad-hoc signature verification and clean-user install, publish a public GitHub Release asset and set the beta URL/version/SHA-256. Mac Gatekeeper may require user approval. Ad-hoc signing is not Apple notarization.
7. Perform an external usability review before opening live purchases.

## Python and scientific compute

PyScript/Pyodide is an **optional compute adapter** for deterministic browser-side, compatible Python numerical algorithms. Do not try to load the PySide6 desktop GUI or arbitrary native dependencies in the browser. Keep scientific evidence schemas, timestamps and hashes stable across adapters. For larger/long-running simulations, use a guarded backend job queue and worker. The current website only operates its existing parameter-sweep reference simulation; it does not claim parity with the desktop research application.

## ChatGPT plugin

A ChatGPT plugin may read authorized VirtualLab project information through governed MCP tools. It **must not** initiate or promote digital subscription checkout in ChatGPT. Users purchase subscriptions on the GIC website separately, then authenticate an existing account. Enforce entitlements at the MCP server, not only inside UI.

## Outstanding work

- Align the existing web workbench's access checker with standalone VirtualLab entitlements **after** customer transition design and regression tests (existing Paid/Enhanced users retain access for now).
- Integrate the verified read-only BSA MCP service and lab-scoped authorization into the hosted backend. No live laboratory datasets are enabled by this branch.
- Add durable project storage, spectrum upload, report generation, and research engine API support to reach desktop functional coverage.
- Add a real public macOS DMG release artifact and documented beta feedback triage before enabling downloads.
- Full automated CI, TypeScript build and staging e2e tests are pending; source changes alone are not a deployed product.
