# site.md — SIDE web

This repository is the deployable web surface for SIDE. It replaces the earlier Next.js/Neon demo. The previous prototype remains recoverable in Git history, not in this branch's runtime tree.

## Run

```sh
npm ci
npm run dev
```

The application opens Finder by default and has Pages, Dictation and the Sides-first Waterline. Waterline supports named Sides, multi-Side source links, Whole/INTRA/EXTRA/INSIDEOUTs/Pending lists, factual TL, and manually assigned 3×4 ATL with Order controls. A click on the Pages microphone starts a browser-supported speech-recognition session. Recording is transcribed at Stop and inserted into the document cursor. The editor uses system SF Pro on Apple devices; no Apple font file is redistributed.

## Vercel

Connect the **existing** GitHub repository to its already-configured Vercel project. Keep the **Root Directory at `./`**, use **Vite**, and let the root `vercel.json` run `npm ci` and `npm run build`. Build output is `vs/dictation/dist`. Existing domain configuration in Vercel is not modified by this source commit.

Verify Vercel **Deployment Protection** before uploading private content or sending a site URL. This static application contains **no account login or server-side document permission checks** and should not be used with private data on an unprotected deployment. Neither a public demo URL nor its access protection is established merely by a Git push.

## Source contract

- **Canonical UI source:** `sideMD/side@39e2dc5be651d5e442813f6301c21b971c9813f4`, under `vs/dictation/src` and `vs/images/logo`.
- **This repository:** web deployment mirror. Future UI changes in SIDE should be deliberately synced and build-tested here.
- **MM/SGPU:** no remote MM persistence or live SGPU process is implied by the static site.
- **Speech:** browser `SpeechRecognition` when supported, not local Whisper or NVIDIA NIM in Vercel. Remote ASR requires a separate authenticated backend; keep all keys server-only.

The web repository currently lives at `sideMD/side.md`, mirroring the canonical `sideMD/side` VS sources. Keep the domain mapping in the connected deployment project.

## Waterline checks

```sh
node --test vs/dictation/tests/*.test.mjs
npm run build
```

SIDE is the root collection; additional named Sides are created on demand and link source references without duplicating originals. INTRA/EXTRA and ATL choices are stored locally in the user's browser until the SIDE-managed shared service provides authenticated read/write.
