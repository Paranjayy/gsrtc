# GSRTC Project — Shared Context for All Contributors

> This document captures project setup, workflow conventions, contributor info, and deployment notes for everyone working on this repo — **Yajuvendra (upstream owner)**, **Paranjay (fork contributor)**, and any future contributors.

---

## 🧑‍💻 Contributors

| Alias | GitHub | Role | Branch |
|-------|--------|------|--------|
| Yajuvendra | [yajuvendrasinh](https://github.com/yajuvendrasinh/gsrtc) | Upstream owner, original developer | `v0.8` / `main` |
| Paranjay | [Paranjayy](https://github.com/Paranjayy/gsrtc) | Fork contributor | `kp` |

---

## 🏗️ Repository Layout

```
yajuvendrasinh/gsrtc  (upstream — original repo)
    └── Paranjayy/gsrtc  (fork — Paranjay's working copy)
        └── branch: kp  (single working branch for all Paranjay's work)
```

**Remote names on Paranjay's clone:**
- `origin` → `https://github.com/Paranjayy/gsrtc.git` (push target)
- `upstream` → `https://github.com/yajuvendrasinh/gsrtc.git` (pull from Yajuvendra)

---

## 🌿 Branch Workflow

### Paranjay (fork contributor)
- **Single branch: `kp`** — all work happens here, no per-feature branches
- Pushes to `origin/kp` regularly
- When upstream gets new changes:
  ```bash
  git fetch upstream
  git checkout kp
  git merge upstream/v0.8   # pull his latest
  ```
- Before creating PRs, squash commits to keep upstream clean:
  ```bash
  git rebase -i upstream/v0.8
  # pick first commit, squash/fixup the rest
  git push --force-with-lease origin kp
  ```
- Or use GitHub's **"Squash and merge"** option when creating PRs

### Yajuvendra (upstream owner)
- Maintains version branches: `v0.1` through `v0.8`
- Merges PRs with squash merge to keep main clean

---

## 🚀 Deployment

| What | URL / Status |
|------|-------------|
| Yajuvendra's Vercel | Connected to `yajuvendrasinh/gsrtc` — auto-deploys from his repo. **Paranjay cannot trigger or see this.** |
| Paranjay's Vercel (recommended) | Connect `Paranjayy/gsrtc` fork on Vercel, track `kp` branch — auto-deploys on every push |
| Local testing | `npm run dev` → `http://localhost:3000` |

> ⚠️ **Note:** `better-sqlite3` is a native Node.js module. It compiles during `npm install` and may take a while. The `stations.db` file (638KB) must be committed since it's used at runtime.

---

## 📊 Codebase Stats (cloc)

**Total (excluding node_modules & .next):**
| Language | Files | Code Lines |
|----------|-------|-----------|
| JSON | 10 | 60,251 |
| HTML | 6 | 30,074 |
| TypeScript | 33 | 4,149 |
| JavaScript | 29 | 1,422 |
| Markdown | 8 | 446 |
| CSS | 1 | 128 |
| SVG | 5 | 5 |
| **Total** | **92** | **96,475** |

### Why is there 88% HTML and huge numbers?
The numbers are **misleading** due to two large data files:
1. **`stations_list.json`** (49,456 lines) — every GSRTC station code + name, used to seed the SQLite database. This inflates JSON to ~60K lines.
2. **`automation/` folder** (~46,000 lines) — raw HTML dumps captured during the reverse-engineering of GSRTC's booking flow (seat layouts, search results, booking pages). These are **debug/research artifacts**, not app code.

**Actual app code:** ~4,100 lines of TypeScript + ~200 lines of JavaScript API helpers = **~4,300 lines of real application code.**

### First Commit Breakdown
The initial commit (`5127dd6`) was **113,779 lines** across 83 files. This included:
- The entire Next.js app scaffold (components, API routes, layouts)
- `stations_list.json` (49K lines of station data)
- Full `automation/` folder (all reverse-engineering HTML dumps, Puppeteer scripts, network logs, screenshots)
- The SQLite database seeder and schema

Basically, Yajuvendra dumped his entire research + working app in one initial commit rather than building incrementally from scratch.

---

## 🎨 Changelog Convention

This project uses a structured changelog format. When adding features, follow this pattern in `changelog.md`:

```markdown
## 🚀 vX.Y
*Focus: [one-line theme]*

### 🛠️ Architecture & Backend
- **Feature Name**: Description of what was built and why.

### 🎨 UI & Layout Improvements
- **Component Name**: What changed visually and the reasoning.

### ⚡ Feature Enhancements
- **Feature Name**: What the user-facing improvement is.
```

Categories:
- 🛠️ = Backend / API / Architecture changes
- 🎨 = Visual / UI / Layout changes
- ⚡ = Feature / Enhancement additions
- 🐛 = Bug fixes
- 📝 = Documentation
- 🔧 = Config / Tooling changes

---

## 🗺️ Roadmap & Future Plans

### What Exists (v0.8)
- ✅ Bus search with SQLite autocomplete (9,891 stations)
- ✅ Seat selection layout (upper/lower deck)
- ✅ Passenger form & booking initiation
- ✅ Live bus tracking via Leaflet/OpenStreetMap
- ✅ PNR tracking resolution
- ✅ Via stops tooltip
- ✅ Instant date selector (5-day pill)
- ✅ Dark/Light theme toggle
- ✅ Mobile responsive layout

### Known Limitations
- ❌ **Payment gateway** — GSRTC's Java Struts backend rejects external session submissions (see `gsrtc_integration_notes.md` for 4 attempted approaches)

### Upcoming (Paranjay's Requirements — extracted from conversations)

#### 🎨 Design Enhancements
- **Professional/polish UI overhaul** — KP wants to improve the overall design quality, moving away from card slop toward a cleaner, more polished look (referenced `gsrtc.lovable.app` as having better design)
- **Notion-like DB views** for bus results — sorting/filtering/grouping by properties (bus type, time, fare, availability), similar to Notion database views

#### ⚡ Feature Enhancements
- **Advanced sorting/filtering/grouping** — sort by fare, time, bus type, duration; filter by booked seats, particular time range, bus class; group by time slots or bus type
- **Consolidated daily stats dashboard** — quick glance overview showing total seats remaining, total cost, seat availability across all buses for a particular day/route
- **PNR-based tracking in same input box** — detect if input is PNR (starts with `G` + digits) vs number plate, auto-route to tracking
- **Distance to next stop** — show live distance from bus's current GPS location to the next scheduled stop (variable based on traffic/congestion)
- **Bus fleet bruteforce dashboard** — if GSRTC API allows, iterate number plates to discover all active buses and show fleet-wide stats (total buses running, occupancy, routes, etc.) — inspired by RailRadar's approach for Indian railways
- **Shareable tracking links** — proper slug/URL sharing for live tracking (currently missing, noted as a flaw)

#### 🏗️ Backend Enhancements
- **Virtual WebSocket for live data** — integrate live GSRTC tracking data streams for real-time dashboard updates
- **Bruteforce dataset collection** — systematically query GSRTC vehicle APIs to build a comprehensive dataset of all active GSRTC vehicles, routes, and schedules

#### 🌐 Deployment
- **Connect Paranjay's Vercel to `Paranjayy/gsrtc` fork on `kp` branch** for auto-deploy previews
- **Yajuvendra's live deployments**: `gsrtc.vercel.app` and `gsrtcb.vercel.app` (these are his, not Paranjay's)

### Potential Enhancements (backlog)
- Multi-language support (Hindi/Gujarati)
- Better error states & offline handling
- Search history (localStorage)
- Favorite routes
- Accessibility improvements
- Push notifications for bus alerts
- Group booking
- Payment gateway workaround (iframe handoff / headless browser approaches)

---

## 📝 Git Commit Messages

Follow conventional style (already used by Yajuvendra):
```
Type: Short description

- Detail 1
- Detail 2
```

Types used in this project: `feat`, `fix`, `docs`, `Release vX.Y`

---

*Last updated: 2026-06-29*
