## 1. Stack

- **Vite + TypeScript (strict)**, plain DOM for menus and **Phaser 3** for the game board. Set `base: './'` so the app works from any path.
- **The rules engine is separate from the drawing** (`src/sim/`): plain TypeScript, no drawing code, running at a fixed 10 ticks per second. The renderer only draws what the simulation reports. This lets you test the rules with **Vitest**, including "every level can be won" solver checks and balance reports.
- **Save data in IndexedDB** through `idb-keyval`, with a versioned save object (`v: 1`). Also call `navigator.storage.persist()` so iOS doesn't clear it.
- All text lives in one content file (`src/content/lines.json`), which is also the input for voice generation.

## 2. Offline-first PWA (no Workbox)

- A small Vite plugin runs after the build and writes `dist/precache.json`, a list of every file with its hash and size, then copies `src/sw-template.js` to `dist/sw.js`.
- **The loading screen downloads the files, not the service worker.** It fetches the list, downloads only missing or changed files (6 at a time, 3 retries each) into Cache Storage, and shows a progress bar. `index.html` is downloaded last so a half-finished update can't load new HTML with old scripts. Files that are no longer in the list get deleted.
- **Service worker:** page navigations try the network for up to 4 seconds and then fall back to the cache. Everything else is served from the cache first.
- **Manifest:** `display: fullscreen`, a fixed orientation, and icons at 192, 512, maskable 512 and the Apple touch icon (made by `gen-icons.mjs` from a character image).
- **iOS meta tags:** `apple-mobile-web-app-capable` and `black-translucent` status bar.
- **Gotcha:** an app added to the iOS Home Screen has its own storage, separate from Safari's, so it downloads everything again on its first launch.

## 3. Touch, iPad and desktop first, phones still work

- Viewport: `user-scalable=no, viewport-fit=cover`. Use the `env(safe-area-inset-*)` values as CSS variables.
- CSS: `touch-action: manipulation` on the page (`none` on drag areas), `user-select: none`, `overscroll-behavior: none`.
- JS: block `dblclick`, `contextmenu` and `gesturestart` so double-tap zoom and long-press menus never appear.
- Use pointer events everywhere. Phaser uses `Scale.FIT` with `CENTER_BOTH`.
- Phones: a compact layout under `@media (max-height: 520px), (max-width: 760px)`, plus a "turn your screen" overlay in portrait.
- Desktop: the Play button calls `requestFullscreen()`. Skip this on iOS, which doesn't support it.
- Optional left-handed mode that mirrors the controls.

## 4. Pausing in the background

- **All sound goes through one `AudioContext`** with separate volume buses for sound effects, music and voice.
- Unlock audio on `touchend`/`click` (iOS ignores `pointerdown`) and play one silent buffer so older iOS versions unlock too.
- Set `navigator.audioSession.type = 'playback'` so sound still plays when the iPad's silent switch is on. The catch: iOS then keeps playing in the background, so on `visibilitychange` you have to call `ctx.suspend()` and `speechSynthesis.pause()` yourself, and resume when the app comes back.
- **What I'd add next time:** on `visibilitychange`, pause the game simulation and open the pause menu, not just the audio. Right now gameplay only stops because the browser stops running frames in the background.

## 5. Gemini asset generation

Each generator is a build-time Node script, never something the game calls at runtime. The API key lives in `.env`, which is git-ignored, and every result is cached so you only pay for new or changed items.

- **Images** (`gen-images.mjs`, model `gemini-3.1-flash-image`):
  - Every prompt starts with the same style description.
  - You can pass an existing image as a style reference so all characters match.
  - Each character is drawn on a flat pure green or magenta background, which `sharp` then removes with a flood fill from the edges. It reads the actual background colour from the corners because the model's colour drifts slightly.
  - Raw outputs are cached in `assets-src/raw/`.
- **Voice** (`gen-voice.mjs`, `gemini-2.5-flash-preview-tts`, voice "Puck"):
  - Each line gets a short style instruction in front of it.
  - The script trims the silence and encodes MP3s with `lamejs`.
  - A manifest stores the text of each generated line, so only changed lines are generated again.
  - At runtime, if a voice file is missing, the game falls back to the device's built-in `speechSynthesis` voice.
  - Note: `gemini-3.8-flash-tts` spoke about twice as slowly.
- **Music:** you'd need to add this. Google's music models are called Lyria. Check their current API availability, generate loops once and cache them like the voice files. Keep music volume low (the bus here is at 0.16).

## 6. Hosting on a Cloudflare Worker

- An assets-only Worker set up in `cloudflare.config.ts` with the `cf` CLI, SPA not-found handling and a custom domain. Deploy with `npm run deploy` (build, then `cf deploy dist`).
- `.env` holds `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` along with the Gemini key.
- **Domain:** each game gets `<game>.play.maximebf.com`, set as the default in `domains` in `cloudflare.config.ts`. On the first deploy, Cloudflare creates the DNS record (an `AAAA 100::`) and orders an advanced certificate from Google (`pki.goog`).
- **CAA records are needed for every game subdomain.** `play.maximebf.com` is a CNAME to `maximebf.github.io`. Certificate authorities look up CAA records by going up the name tree, so `<game>.play.maximebf.com` inherits GitHub's CAA policy, which allows only DigiCert, Let's Encrypt and Sectigo. That blocks Google, and the certificate stays in `pending_validation` with "CAA records block issuance"; browsers then get a TLS handshake failure. Fix: add CAA records on the game's own hostname: `0 issue "pki.goog"`, `0 issuewild "pki.goog"`, `0 issue "letsencrypt.org"`, `0 issuewild "letsencrypt.org"`. Then wait for validation, or restart it under SSL/TLS → Edge Certificates. `marketmath` and `nanodefenders` have these records. Add them when creating a new game; existing games need them for certificate renewals.
- **`public/_headers`:** `no-cache` on `/`, `index.html`, `sw.js`, `precache.json` and the manifest so installed apps pick up updates, and `immutable` on Vite's hashed bundles.

## 7. Other points worth adding

- **Debug shortcuts:** `?level=X` jumps straight to a level, and a parent area unlocks everything.
- **Save export and import**, since clearing an iPad's storage would otherwise lose progress.
- **Keep tuning numbers in one file** (`units.ts`) and **levels as data**, so balancing doesn't mean changing code.
- **Testing on the iPad:** `vite --host` makes the dev server reachable over your local network. Test the installed Home Screen app as well as Safari, because they behave differently.
- **`AGENTS.md`/`SPEC.md` in the repo** so coding agents keep to the design.
- **Asset budget:** this game is about 7 MB. Keep images at 256–512 px and voice at 64 kbps MP3.
- **Things I'd consider adding:**
  - An "update available" message instead of updating silently.
  - Playwright smoke tests, which `@playwright/test` is already installed for.
  - A `prefers-reduced-motion` setting.
