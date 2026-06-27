# GSRTC Clone Changelog: v0.1 to v0.5

This document details the progress, architectural additions, and user interface refinements implemented from **v0.1** to **v0.5** (current local state).

---

## 🚀 v0.5 (Current Working State - Local Changes)
*Focus: SQLite Integration, Quick-Search Dates, Advanced Sorting, and Mobile-First UI Overhaul*

### 🛠️ Backend & Database Additions
- **SQLite Integration**:
  - Initialized a local SQLite database (`stations.db`) to enable instant lookups of shorthand codes.
  - Seeded SQLite database with all **9,891 GSRTC stations** parsed from `stations_list.json`.
  - Added indexes on both `code` and `name` columns to ensure sub-millisecond query performance.
  - Implemented DB singleton connection pool in `src/lib/stations-db.ts` to prevent open-handle leaks during Next.js hot-reloading.
- **Via Route Code Resolution API**:
  - Created a new backend endpoint `GET /api/via-resolve?codes=...` that queries the SQLite database to map raw station codes (e.g. `ksd,jnd`) into full-text names (e.g. `KESHOD → JUNAGADH`).
- **Live Via Stops Extraction**:
  - Expanded `parseBusHTML` in `/api/search` route to extract the `[via- ...]` metadata block from the live GSRTC HTML response and map it to a new `via` field on the `BusService` model.

### 🎨 UI & Layout Improvements
- **Slimmer Header Bar**:
  - Replaced the generic bus icon with the official `bus-logo.png` logo.
  - Reduced vertical header padding and logo scaling for a compact, professional top-bar design.
- **Mobile-Responsive Bus Cards**:
  - Completely split mobile and desktop rendering paths within `GSRTCBusList.tsx` for optimal mobile layout.
  - **Fare & Seats Button**: Arranged vertically on the right side next to the trip details on mobile, aligned higher up for better utilization of space.
  - **Route Container**: Placed on a full-width lower row on mobile, allowing long station names (e.g. `MOTI MONPARI → Ahmedabad Gita Mandir Bus Port`) to display without being cut off.
- **Polished Search Result Header**:
  - Re-styled the bus type filter dropdown (reduced width and added subtle drop shadows).
  - Replaced the plain "Trips Available" text with a custom highlighted badge pill.

### ⚡ Journey Experience Enhancements
- **Dynamic Instant-Date Selector**:
  - Replaced plain text date labels with 5 horizontal date pills (2 days before, current date, 2 days after).
  - Click-to-search automatically triggers a new fetch.
  - Added smart validation logic in `generateDates` to **never show past dates**; if the selected date is today, the window shifts forward to prevent invalid past booking searches.
  - Mobile screens intelligently hide the outer pills to prevent horizontal wrapping.
- **Advanced Bus List Sorting**:
  - Grouped and sorted buses dynamically using a custom hierarchy array:
    `VOLVO` → `AC LUXURY` → `ELECTRIC AC` → `EXPRESS` → `SLEEPER` → `LUXURY` → `GURJARNAGRI` → `LOCAL ORDINARY`.
  - Unlisted/unknown classes are grouped alphabetically next, before applying the secondary sort criteria.
  - Secondary sorting sorts buses by earliest departure time first.
- **Async Via Tooltip**:
  - Hovering (desktop) or clicking (mobile) the `via <codes>` text triggers a React callback to fetch full city names from the `/api/via-resolve` endpoint.
  - Uses `position: fixed` calculating coordinates from `getBoundingClientRect` to break out of the card's `overflow-hidden` container and prevent clipping.
  - Implemented wrapping container constraints so long routes wrap naturally to 2 or 3 lines.

---

## 📦 v0.4-mess-from-payment-related (Alternative Branch)
*Focus: Payment gateway testing & state checkpoint*
- Created a separate checkpoint branch `v0.4-mess-from-payment-related` containing local experimental scripts and diagnostic endpoints for payment processing validation.

---

## 🏷️ v0.3
*Focus: Layout fixes & Integration notes*
- **Seat Mapping Corrections**:
  - Refined row/column math for the Seat Layout API to correctly align sleeper and seater combinations.
- **Documentation**:
  - Created `gsrtc_integration_notes.md` detailing operational API contracts and scraping guidelines.

---

## 🏷️ v0.2
*Focus: Auto-fill features & TypeScript safety*
- **Form UX Prefilling**:
  - Added automatic station suggestions and state persistence between search cycles.
  - Prefilled passenger details automatically on re-booking to reduce checkout friction.
- **TypeScript Compliance**:
  - Fixed edge-case compilation crashes related to optional chaining on `selectedBus.serviceInfo`.

---

## 🏷️ v0.1
*Focus: Foundation & E2E Checkout Flow*
- **Live Fare Calculator**:
  - Integrated direct scraping logic to pull real-time ticket tariffs.
- **Mock Payment Gateway**:
  - Built an end-to-end checkout flow showing processing states and generating a simulated redirect to an external bank simulator.
- **Ticket Success Summary**:
  - Added a printing and confirmation view featuring a simulated PDF generator.
