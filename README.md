# Linkedin Feed Blocker

Chrome extension that blocks the LinkedIn infinite feed while keeping search and messaging intact.

## Install (Chrome)
1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.
4. Visit `https://www.linkedin.com/feed/`.

## Build Store Upload ZIP
1. Run:
```bash
./scripts/build-store-zip.sh
```
2. Upload the generated zip from `dist/` to Chrome Web Store.

## Chrome Web Store Submission
1. Create/sign in to a Chrome Web Store Developer account.
2. Click **Add new item** and upload `dist/li-feed-blocker-v<version>.zip`.
3. Fill out listing metadata:
- Name, short description, full description.
- Category and language.
- At least one screenshot (recommended 1280x800 or 640x400).
4. Complete the **Privacy** section:
- This extension does not collect or transmit user data.
- Host permission is limited to `https://www.linkedin.com/*`.
5. Submit for review.

## Versioning
- Increment `version` in `manifest.json` before each new store upload.
- Re-run `./scripts/build-store-zip.sh` for each release.

## Notes
- The blocker only runs on the home feed (including `/feed/` and `/`).
- If LinkedIn changes their DOM, update the selectors in `content.js`.
