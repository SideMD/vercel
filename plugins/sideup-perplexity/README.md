# SideMinD SideUp plugin (Perplexity / Agent Plugins)

This plugin declares a public read-only MCP server at `https://api.side.md/mcp`.

## Install in Perplexity

Perplexity's **Import plugin from GitHub** supports a public repository/folder URL.

Import this folder:

https://github.com/SideMD/vercel/tree/main/plugins/sideup-perplexity

Or copy the plugin files into the root of a dedicated public repository.

## Tools

- `sideup_status`: Render SideUp web resource and local health status.
- `sideup_web_health`: asks the Render bridge to consult Vercel `/api/health`, which reports the Neon database connection.

This plugin is **read-only**. It does not send chat messages to the personal Hippocampus, read emails, access Outlook or invoke paid external AI providers. All such writes require per-person authentication/authorization and explicit consent.

## Deployment requirement

Publish **SideMD/render** commit adding `/mcp`. Before Render deploys it, the plugin cannot complete MCP handshake. Validate with a JSON-RPC `initialize` POST and `tools/list` after deployment.

No credentials are stored in this repository. Outlook sign-in does not grant Perplexity API access.
