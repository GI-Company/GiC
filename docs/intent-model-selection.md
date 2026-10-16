# Model selection

The LooseMouth model dropdown offers:

- Gemini: the existing Fast / Medium / Enhanced workspace at `/intent`.
- INTENT Facts-500: `/intent?mini=1&checkpoint=facts500`.
- INTENT SFT-1000: `/intent?mini=1&checkpoint=sft1000`.

`/intent/mini?checkpoint=...` also supports both checkpoints. Legacy Mini links
without a checkpoint default to Facts-500. Invalid checkpoint values fall back
to Facts-500. The regular workspace remains the default for `/intent`.

The custom-model studio uses the server-side `/api/intent/mini` route with the
selected checkpoint. Set **`HF_TOKEN`** in Vercel's Production environment (and
Preview if needed), then deploy. The token stays on the server and is sent as a
Bearer header on both Gradio `/gradio_api/call/generate` requests. It is never
passed to the browser, a URL, or the model prompt. Missing tokens fail closed;
there is no anonymous fallback. The direct HF link has separate authentication.
Checkpoint labels and training lineage come from `lib/intent-models.ts`.
Custom model requests use the token owner's shared ZeroGPU quota, independently
of the Gemini workspace subscription modes. Authentication is not unlimited GPU
time; quota exhaustion is still possible. The public studio retains free access
with a persistent limit of 8 requests per IP per hour using the existing quota
RPC. No schema migration is required. The existing Gemini API route,
authentication, and GIC usage limits are unchanged.

## Serving prerequisite

Space: `Hdhhhgfc/INTENT-RLSE-v2`
Dual-checkpoint service revision: `8f3d61d50d3fe8c4cf79cb08e37b22ced4e7a7bb`

The Space loads the original SFT checkpoint and the pinned Facts-500 model repo.
Both checkpoint hashes are verified on startup. Its model selector accepts the
`checkpoint` query parameter and clears conversation history when changed.
The streaming `/generate` Gradio API accepts:
`message, temperature, top_k, max_new_tokens, checkpoint`.
The last argument is `facts500` (default) or `sft1000`.
Both custom models currently use a 512-token serving context.

The native panel defaults to temperature 9, top-K 80 and 96 output tokens.
It streams cumulative plain text via NDJSON, supports both checkpoints, and
handles fragmented SSE, quota/authentication errors, interrupted streams and
timeouts. Each prompt is independent. Stop closes the stream; a GPU job that
already started may still finish. The direct HF studio retains the advanced
telemetry interface. The paid Virtual Lab and its APIs are unchanged.

## Verification

- Next.js production build and TypeScript validation passed.
- ESLint passed for changed UI/model files.
- Agent, conversion, routing, and provider-registry regression suites passed.
- Browser selected SFT-1000, returned to Gemini, and selected Facts-500.
- Embedded service confirmed the requested SFT-1000 checkpoint.
- Both custom checkpoints completed live streaming API requests.
- A live Gemini response was not tested locally: no Gemini API key was configured.

The historical usage migration retains its timestamp/version `20261007`; its
filename suffix and provider-default text now use the current naming. Existing
applied databases are not modified by this repository edit. Current API writes
already specify the provider explicitly.
