// Assets-only Cloudflare Worker serving the game catalog. Deploy with `npm run deploy`.
// Credentials come from CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN in .env.
import { defineConfig } from 'cf/config';

export default defineConfig({
  worker: {
    name: 'play-maximebf-com',
    compatibilityDate: '2026-11-01',
    domains: ['play.maximebf.com'],
  },
});
