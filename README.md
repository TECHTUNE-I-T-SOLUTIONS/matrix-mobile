# Matrix (Mobile) — Matrix-New

This repository contains the mobile application code for Matrix (Expo + React Native).

Purpose
- Provide the mobile app source used for Android (APK) builds via EAS.
- Provide a GitHub Actions workflow to publish a build artifact (APK) into a GitHub Release by supplying a build URL.

Important security note
- Do NOT commit personal access tokens, secrets, or private keys into the repository.
- Use repository Secrets (Settings → Secrets -> Actions) or environment variables on your server/host to store tokens.

Versioning
- App version is declared in `app.json` under `expo.version`.
- Android `versionCode` must be incremented for every Play Store / internal build; this is kept in `app.json` as `android.versionCode`.
- Package version is mirrored in `package.json`'s `version` field.

Files added by this change
- `.github/workflows/release-apk.yml` — A manual (workflow_dispatch) action that downloads an APK from a provided URL and creates a GitHub Release with the APK attached.
- `README.md` — this file.
- `.env.example` — shows environment variables that should be set (never commit actual tokens).

How the release workflow works
1. Build Android APK with EAS (or produce an APK URL by any other means).
2. Copy the direct APK download URL (EAS will give this after build completes).
3. Go to GitHub → Actions → select `Publish APK to Release` → Run workflow. Provide:
   - `apk_url` — the direct download URL to the APK
   - `release_tag` — the tag to attach to the release (e.g. `v1.0.1`)
   - `release_name` — (optional) human-friendly release title
4. The workflow downloads the APK and creates a release with the asset uploaded.

Notes about public access and private repos
- GitHub releases and assets on private repositories require authentication to download. If your repository is private, users visiting a release asset URL will be prompted to authenticate.
- To serve the APK publicly without GitHub auth, host the APK on a public storage/CDN (S3, Cloudflare, or a public GitHub repository) or make a server-side download proxy on your website that uses a server-side token to fetch the asset and then exposes it to visitors.

Recommended safe pattern
1. Use the Action to upload the APK to a GitHub Release in this repo.
2. Do NOT store PATs in files; instead store them as `secrets` in GitHub and set server env vars for your website host.
3. Implement a server-side endpoint on your website that uses a secret (server env var) to fetch the private release asset from GitHub and streams it to clients. This way the token never appears client-side.

EAS build example
1. Install and log into EAS:
```bash
npx eas login
```
2. Kick off an Android build (example):
```bash
npx eas build -p android --profile production
```
3. After the build completes, copy the APK download link from the EAS build details.

Running the GitHub workflow manually
1. Go to this repository on GitHub.
2. Go to Actions → `Publish APK to Release` → Run workflow.
3. Enter `apk_url` and `release_tag`.

CI / Secrets
- Use `secrets.GITHUB_TOKEN` or create a `secrets.PERSONAL_GITHUB_TOKEN` with `repo` and `packages` scopes if you need broader access.
- For website proxying, set `GITHUB_DOWNLOAD_TOKEN` (or similarly named) at the host (Vercel/Netlify/DigitalOcean) as an environment variable and never commit it.

Version bump
- Bumped `expo.version` and `package.json` `version`. Also incremented `android.versionCode`.

Support and next steps
- If you want the workflow to automatically trigger after an EAS build completes, we can add an automation step to post the artifact link back to GitHub (via EAS webhooks or by scripting `eas build:list`), but it requires credentials and extra automation.
- If you'd like, I can add the website proxy route and the download page to `matrix-app` next.

If you want me to push, tag, or run builds, tell me and provide explicit permission — I won't run external commands or push/publish without your approval.
"# matrix-mobile" 
