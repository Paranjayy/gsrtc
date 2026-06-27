# GSRTC Bus Booking Clone - Version Changelog

This changelog outlines all technical updates, architectural additions, and user interface improvements made to the GSRTC Bus Booking application from **v0.1** to **v0.5**.

---

## 🚀 v0.5 (Latest Stable / Published)
*Focus: SQLite Database Integration, Interactive Via Tooltips, Instant Date Selector, Class-based Group Sorting, and Mobile Responsive Overhauls*

### 🛠️ Architecture & Backend
- **Local SQLite Station Database**:
  - Implemented `better-sqlite3` inside the Next.js backend, compiling a local relational database (`stations.db`) containing **9,891 official GSRTC station codes** and full names.
  - Added indexes on `code` (shorthand) and `name` fields (case-insensitive `COLLATE NOCASE`) to guarantee sub-millisecond autocomplete and code-resolution query performance.
  - Implemented database singleton connector (`src/lib/stations-db.ts`) with custom global checks to prevent open-connection leaks during development hot-reloads.
  - Added a dedicated database seeder utility script (`scripts/seed-stations.js`) that safely parses `stations_list.json` and populates the database transactional block.
- **Via stops Code Resolution Endpoint**:
  - Created a new Next.js route `/api/via-resolve` to resolve multiple comma/space-separated shorthand station codes (e.g. `ksd,jnd,rjt`) into full user-friendly names (e.g. `KESHOD → JUNAGADH → RAJKOT`).
- **Via Stops Live Parser**:
  - Enhanced the regex inside the `/api/search` router (`parseBusHTML`) to parse the live GSRTC OPRS `[via- ...]` HTML element and bind it as a new `via` string parameter in the `BusService` object structure.

### 🎨 Frontend UI & Layout
- **Slimmer Navigation Header**:
  - Integrated the official `bus-logo.png` logo asset inside `public/`.
  - Scaled down padding from `py-4` to `py-2` and reduced logo container heights to compress top-bar vertical screen real-estate.
- **Double Responsive Layout Split**:
  - Refactored `GSRTCBusList.tsx` to explicitly render different components for mobile (`block md:hidden`) vs desktop (`hidden md:flex`).
  - **Mobile Layout**:
    - Placed Fare and Seat-booking action on the top right, aligned higher next to trip details.
    - Moved the **Route** text to its own dedicated bottom row spanning **100% of the card width**, preventing long station locations from truncating on smaller screens.
- **Fixed Column Grid Layout**:
  - Set fixed widths (`120px` each) for Departure Time and Duration columns on desktop views, maximizing the remaining flexible space for route listings.
  - Tightened layout spacing by changing bus card inner content padding from `p-5 md:p-6` to `px-4 py-3`.

### ⚡ Feature Enhancements
- **Dynamic Instant-Date Selector**:
  - Replaced plain date labels in the search header with a horizontal row of 5 interactive date selection pills.
  - Added custom calendar arithmetic to ensure **past dates are never displayed**; if the selected date is today, the window shifts forward to prevent invalid search payloads.
  - Added CSS-media rules to dynamically hide outer date options on narrow mobile screens.
- **Advanced Bus List Class Sorting**:
  - Grouped and ordered query results by bus service rank: `VOLVO` → `AC LUXURY` → `ELECTRIC AC` → `EXPRESS` → `SLEEPER` → `LUXURY` → `GURJARNAGRI` → `LOCAL ORDINARY`.
  - Added alphabetical grouping fallback for unlisted/unknown bus classes, ensuring they stay grouped together.
  - Implemented secondary chronological sorting by departure time (earliest departure first) inside all groups.
- **Interactive Tooltip for Via Stops**:
  - Added an async hover (web) and toggle-click (mobile) tooltip popover to display full route paths.
  - Switched layout positioning to `position: fixed` calculating positions via `getBoundingClientRect` to break out of the card's `overflow-hidden` constraints and prevent page clipping.
  - Configured word wrapping with max-width boundaries (`max-w-xs`) so long via lists span multiple lines cleanly.

---

## 🏷️ v0.4-mess-from-payment-related
*Focus: Payment Gateway Diagnostic Sandbox*
- **Alternative Branch Sandbox**:
  - Isolated local sandbox scripts and API variations into a temporary branch `v0.4-mess-from-payment-related` for testing transaction loops separate from development commits.

---

## 🏷️ v0.3
*Focus: API Bug Fixes & Architecture Documentation*
- **Row/Column Alignment Correction**:
  - Resolved row and column calculation discrepancies in `/api/seats` to correctly position seating/sleeper grids for seat maps.
- **Documentation**:
  - Created a developer reference file `gsrtc_integration_notes.md` detailing backend OPRS API signatures, request body formats, and HTML-parsing regex patterns.
- **Brand Assets**:
  - Replaced default favicon.ico with a optimized compressed brand favicon.

---

## 🏷️ v0.2
*Focus: Form Experience & TypeScript Compliance*
- **State Persistence & Suggestions**:
  - Enhanced search suggestions inside `GSRTCSearchForm.tsx` to load matching station entries.
  - Added automatic passenger details pre-filling inside checkout forms.
- **Optional Chaining Compiler Patch**:
  - Resolved build-breaking compilation errors by applying optional-chaining checks on the dynamic `selectedBus.serviceInfo` properties inside `src/app/page.tsx`.

---

## 🏷️ v0.1
*Focus: Project Foundation & End-to-End Booking Operations*
- **Design Foundations**:
  - Set up Next.js project structure, layout templates, CSS variables, and basic component shells.
- **Exact Live Fare Calculator**:
  - Added `/api/fare` route which fetches the detailed live fare breakdown (including taxes, tolls, booking fees, and base ticket prices) directly from live servers.
- **Payment Redirect Engine**:
  - Built checkout initiate endpoint `/api/booking/initiate/route.ts` that compiles secure POST bodies, resolves session cookies, and handles real-time handshakes.
  - Implemented dynamic forms that perform auto-POST browser redirects straight to the simulated payment gateway gateway.
- **Post-Payment Ticket Generation**:
  - Designed the dynamic booking confirmation UI showing invoice summaries, generated ticket numbers, and coach details.
  - Integrated custom `@media print` CSS configurations to support printing neat invoice PDFs directly from the browser print menu.
