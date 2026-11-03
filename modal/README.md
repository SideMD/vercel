# SideMinD — Modal CPU probe

Minimal proof of processing that uses a real, authenticated Modal CPU container. No LLM is claimed.

1. Install the Modal CLI from the official docs and run `modal setup` in the `sidemd` workspace.
2. Run `modal deploy modal/sideup_probe.py` from this repository.
3. Copy the HTTPS POST URL issued by Modal (often `<workspace>--sidemind-sideup-probe.modal.run`) into Vercel's `MODAL_ENDPOINT_URL`. Never invent the URL; use the exact one shown by the deploy.
4. In Modal **workspace proxy tokens**, create an **endpoint proxy key** (`wk-`) and **endpoint proxy secret** (`ws-`). They are *not* the Modal API key/secret pair (`ak-/as-`) used for deployments.
5. Set `MODAL_PROXY_KEY` and `MODAL_PROXY_SECRET` in Vercel's environment variables, plus `SIDE_INFERENCE_GATE_KEY`.
6. Redeploy Vercel and select **Modal CPU** in the SideUp UI. Send a short test message and expect JSON from Modal.
7. The endpoint is set to `requires_proxy_auth=True`. No unauthenticated public writes.

At this stage Modal performs a CPU-backed echo/length test to validate the execution chain. A separate authenticated inference container can later run actual models, with clear GPU cost constraints. This is not NVIDIA DGX or a persistent model.
