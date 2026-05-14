# GSRTC Nexus — Feature Roadmap

## 🔧 Proxy Setup (Unlock live data — do this first)

### Cloudflare Worker — Cost

| Tier | Requests/day | Cost |
|------|-------------|------|
| **Free** | 100,000 | ₹0/month |
| Paid | 10 million | $5/month |

**100k/day is more than enough** — at 30s poll interval, a single user = 2,880 req/day. So you can handle ~34 concurrent users on free. Since this is a personal/portfolio project, free is plenty.

> [!NOTE]
> You already have a Cloudflare domain → you can route the worker under a subdomain like `proxy.yourdomain.com` instead of the default `.workers.dev` URL. Completely optional but looks cleaner.

### Deploy Steps (5 minutes)

```bash
# 1. Install
cd /Users/paranjay/Developer/gsrtc-proxy
npm install

# 2. Login to Cloudflare (opens browser)
npx wrangler login

# 3. Update ALLOWED_ORIGINS in src/index.ts with your actual Vercel URL

# 4. Deploy
npx wrangler deploy

# You'll get a URL like: https://gsrtc-proxy.YOUR-SUBDOMAIN.workers.dev
```

Then in your gsrtc app:
```bash
# /Users/paranjay/Developer/gsrtc/.env.local
VITE_PROXY_BASE=https://gsrtc-proxy.YOUR-SUBDOMAIN.workers.dev
```

### Auth Token
The GSRTC VTS requires `gsrtc_auth_token`. To get it:
1. Open `https://live.gsrtc.org` in browser
2. DevTools → Application → Local Storage → copy `gsrtc_auth_token`
3. Add to your `.env.local`:
   ```
   VITE_GSRTC_TOKEN=eyJhbGci...
   ```

---

## 🚀 Feasible Features — Priority List

### ✅ Already Built
- Live tracking with real API attempt + graceful mock fallback
- Mock data banner (amber ⚠️)
- Speed, next stop, occupancy, progress
- Favorites + recents
- Share URL

---

### 🟢 Easy — can build now (no API needed)

#### 1. Speed Sparkline
Mini chart of last N speed readings, drawn as SVG polyline. No library needed.
```
[── 45 ─── 60 ── 72 ── 68 ── 55 ──]  █ sparkline above stat
```

#### 2. ETA Countdown Timer
Live `X min Y sec` countdown to next stop using `distanceToNextKm / avgSpeed`.
Updates every second in UI. Already have the data, just need the math.

#### 3. Route Timeline Scrollview
Vertical stop list, current stop highlighted, completed stops grayed out.
Swipe/scroll on mobile. Already partially done — make it richer with durations.

#### 4. Trip Comparison (book page)
Side-by-side compare mode for 2 selected trips (fare, duration, seats, service class).
Triggered by long-press / checkbox on trip cards.

#### 5. Smart Filters Memory
Persist last-used filters (service class, time range, sort) to localStorage.
Next visit auto-applies them.

---

### 🟡 Medium — need proxy working

#### 6. Real Schedule Search
OPRS endpoint + Worker scraper → real fares, real seat counts, real departure times.
Replace the mock book page with live data.

#### 7. Vehicle Search by Route Number
Type "Ahmedabad→Surat" or route `AS25` → get all vehicles currently on that route.
Calls `POST /api/vehicle/live` with route filter.

#### 8. Depot-level Fleet View
All buses currently at/near a depot. Useful for checking which buses are running today.
Needs ~50 parallel calls or a single fleet endpoint (need to confirm from DOM).

---

### 🔴 Hard / Future

#### 9. Push Notifications (PWA)
"Your bus GJ18ZT1831 is 2 stops away" — needs Service Worker + Web Push API.
Cloudflare Worker can act as the push relay.

#### 10. PNR Status Lookup
Paste your PNR → get booking status, bus, seat, departure.
Endpoint: `POST /Notify/VTS.do` (seen in DOM, params are encrypted server-side).

#### 11. Aggregated Fleet Stats
All buses running right now, avg speed by route, on-time % today.
Requires brute-forcing 100s of vehicle numbers — feasible with Worker batching,
but burns request quota. Better as a nightly cron job storing results in Cloudflare KV.

---

## 📦 Repo Structure

```
/Users/paranjay/Developer/
├── gsrtc/              ← Frontend (Vite + React)
│   ├── .env.local      ← VITE_PROXY_BASE + VITE_GSRTC_TOKEN (never commit)
│   └── src/lib/vts-api.ts
│
└── gsrtc-proxy/        ← Cloudflare Worker (new)
    ├── src/index.ts    ← Proxy + OPRS scraper
    └── wrangler.toml
```

---

## 🎯 Recommended Next Session Order

1. `npx wrangler login && npx wrangler deploy` → get proxy URL
2. Copy `gsrtc_auth_token` from `live.gsrtc.org` → `.env.local`
3. Speed sparkline (30 min, high visual impact)
4. Real schedule search via OPRS proxy (1–2 hrs)
5. ETA countdown (20 min)
