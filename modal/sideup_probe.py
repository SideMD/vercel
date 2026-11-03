"""SideMinD SideUp: first authenticated Modal CPU compute test.

Deploy with: modal deploy modal/sideup_probe.py
This uses Modal account credentials locally; calling the endpoint from
Vercel uses separate Modal PROXY tokens (wk-/ws-), never ak-/as- keys.
"""
import modal

app = modal.App("sidemind-sideup")
image = modal.Image.debian_slim(python_version="3.12").pip_install("fastapi[standard]")


@app.function(image=image, cpu=0.125, timeout=20)
@modal.fastapi_endpoint(method="POST", requires_proxy_auth=True)
def probe(payload: dict):
    text = payload.get("text", "")
    if not isinstance(text, str) or not 1 <= len(text) <= 2000:
        return {"status": "invalid_input", "message": "Expected text from 1 to 2000 characters."}
    return {
        "status": "processed",
        "service": "SideMinD",
        "provider": "modal",
        "compute": "cpu",
        "summary": text.strip(),
        "characters": len(text),
    }
