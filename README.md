# site.md — SIDE web

This repository is the deployable web surface for SIDE. It replaces the earlier Next.js/Neon demo. The previous prototype remains recoverable in Git history, not in this branch's runtime tree.

## Run

```sh
npm ci
npm run dev
```

The application opens Finder by default and has Pages, Dictation and Waterline. A click on the Pages microphone starts a browser-supported speech-recognition session. Recording is transcribed at Stop and inserted into the document cursor. The editor uses system SF Pro on Apple devices; no Apple font file is redistributed.

## Vercel

Connect the **existing** GitHub repository to its already-configured Vercel project. Keep the **Root Directory at `./`**, use **Vite**, and let the root `vercel.json` run `npm ci` and `npm run build`. Build output is `vs/dictation/dist`. Existing domain configuration in Vercel is not modified by this source commit.

Verify Vercel **Deployment Protection** before uploading private content or sending a site URL. This static application contains **no account login or server-side document permission checks** and should not be used with private data on an unprotected deployment. Neither a public demo URL nor its access protection is established merely by a Git push.

## Source contract

- **Canonical UI source:** `sideMD/side@cdf0188ccacbd71e2597a749f5f3deed550d3d8f`, under `vs/dictation/src` and `vs/images/logo`.
- **This repository:** web deployment mirror. Future UI changes in SIDE should be deliberately synced and build-tested here.
- **MM/SGPU:** no remote MM persistence or live SGPU process is implied by the static site.
- **Speech:** browser `SpeechRecognition` when supported, not local Whisper or NVIDIA NIM in Vercel. Remote ASR requires a separate authenticated backend; keep all keys server-only.

To rename the GitHub repository, use its Settings → General → Repository name. The intended name is `site.md`; GitHub/Vercel integration may need verification after the rename.
