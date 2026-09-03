# WindHub Facebook Worker

Free Cloudflare Worker endpoint for public Facebook page metadata.

## Deploy

```powershell
cd cloudflare-worker
npx wrangler login
npx wrangler deploy
```

Copy the deployed URL and set this Vite variable before building:

```powershell
$env:VITE_FACEBOOK_WORKER_URL = "https://windhub-facebook-profile.<account>.workers.dev"
npm run build
```

The endpoint is `GET /profile?url=https%3A%2F%2Fwww.facebook.com%2F...`.
It does not use KV, D1, R2, Durable Objects, queues, or cookies. It only fetches a public URL on demand and returns metadata. Set `ALLOWED_ORIGIN` in `wrangler.toml` to the production WindHub origin instead of `*`.
