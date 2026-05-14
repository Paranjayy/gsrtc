# GSRTC Nexus — Deployment

## This project uses TanStack Start + Cloudflare Workers SSR
## → Deploy to **Cloudflare Pages**, NOT Vercel

## Quickest fix: Deploy via Wrangler

```bash
# From the gsrtc directory:
npx wrangler pages deploy dist --project-name gsrtc-nexus

# Or use the Pages dashboard:
# dash.cloudflare.com → Pages → Create → Connect Git → select paranjayy/gsrtc
# Build settings:
#   Framework preset: None
#   Build command:    npm run build
#   Output dir:      dist/client
#   Root dir:        /
```

## Environment Variables (set in Cloudflare Pages dashboard)
```
VITE_PROXY_BASE = https://gsrtc-proxy.gsrtc-proxy.workers.dev
```
(same value as you added in Vercel)
