# play.maximebf.com

A static catalog of my games, served by GitHub Pages at https://play.maximebf.com.

- `index.html` is the page: one `<li class="tile">` per game.
- `styles.css` holds all the styles.
- `games/` holds the posters: 4:3, 1200×900, WebP.

## Add a game

1. Put a 1200×900 poster in `games/<slug>.webp`.
2. Copy an existing `<li class="tile">` block in `index.html`, then change the link, image and alt text.
3. Commit and push. Pages redeploys on its own.

## Hosting

- `CNAME` tells GitHub Pages the custom domain.
- On Cloudflare, `play.maximebf.com` is a DNS-only CNAME to `maximebf.github.io`, so GitHub can issue the HTTPS certificate.
- Each game has its own subdomain, for example `nanodefenders.play.maximebf.com`, which is a Cloudflare Worker.
