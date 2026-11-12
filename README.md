# play.maximebf.com

A static catalog of my games, served by GitHub Pages at https://play.maximebf.com.

- `index.html` is the page: one `<li class="tile">` per game.
- `styles.css` holds all the styles.
- `games/` holds the cover images: 4:3, about 800×600, WebP.

## Add a game

1. Put an 800×600 cover in `games/<slug>.webp`.
2. Copy an existing `<li class="tile">` block in `index.html`, then change the link, image, title, blurb and tags. You can also change `--accent` / `--accent-2` to match the cover.
3. Commit and push. Pages redeploys on its own.

## Hosting

- `CNAME` tells GitHub Pages the custom domain.
- On Cloudflare, `play.maximebf.com` is a DNS-only CNAME to `maximebf.github.io`, so GitHub can issue the HTTPS certificate.
- Each game has its own subdomain, for example `nanodefenders.play.maximebf.com`, which is a Cloudflare Worker.
