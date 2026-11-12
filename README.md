# play.maximebf.com

A static catalog of my games, served by an assets-only Cloudflare Worker at https://play.maximebf.com.

- `index.html` is the page: one `<li class="tile">` per game.
- `styles.css` holds all the styles.
- `games/` holds the posters: 4:3, 1200×900, WebP. Tiles are at most 350px wide.

## Add a game

1. Put a 1200×900 poster in `games/<slug>.webp`.
2. Copy an existing `<li class="tile">` block in `index.html`, then change the link, image and alt text.
3. Run `npm run deploy` (needs `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in `.env`), then commit and push.

## Hosting

- `cloudflare.config.ts` sets up the `play-maximebf-com` Worker with the custom domain `play.maximebf.com`. `npm run build` copies the site into `dist/`, and `npm run deploy` uploads it.
- Each game has its own subdomain, for example `nanodefenders.play.maximebf.com`, which is a Worker too.
- Don't point `play.maximebf.com` at a CNAME (for example GitHub Pages). Game subdomains would inherit that target's CAA records, and Cloudflare's certificates for them could no longer be issued. See `GAME_TECH_SPEC.md`.
