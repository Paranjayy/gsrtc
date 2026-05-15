/**
 * GSRTC VTS (Vehicle Tracking System) API — Reverse-Engineered
 *
 * Endpoints discovered from live.gsrtc.org network traffic:
 *   POST /api/vehicle/live    → lat/lng + basic telemetry  (~30s poll cadence)
 *   POST /api/vehicle/tooltip → speed, direction, service, depot
 *
 * Auth: Token is stored as a Cloudflare Worker secret (GSRTC_TOKEN).
 * The Worker injects it server-side — the browser never sees the token.
 *
 * Frontend only needs VITE_PROXY_BASE pointing to the Worker URL.
 */

// ── Config ────────────────────────────────────────────────────────────────────

/** Cloudflare Worker URL — set VITE_PROXY_BASE in .env.local or Vercel env vars */
const PROXY_BASE = import.meta.env.VITE_PROXY_BASE ?? "";
const VTS_BASE   = PROXY_BASE ? `${PROXY_BASE}/vts`  : null;
// Correct OPRS path: gsrtc.in/OPRSOnline/jqreq.do (NOT opronline/jgreq.do)
const OPRS_BASE  = PROXY_BASE ? `${PROXY_BASE}/oprs` : null;

const JSON_HEADERS: HeadersInit = { "Content-Type": "application/json" };

// ── Response shapes (inferred from payload sizes + screenshot) ────────────────

// Real API response shape (confirmed from live data):
// [{"departureDateTime":"N/A","lastArrivalDateTime":"N/A","lastBusStation":"N/A",
//   "status":"N/A","routeName":"N/A","nextLocation":"N/A","eta":"N/A",
//   "latitude":"21.121236","longitude":"70.121597"}]
export interface VtsLiveResponse {
  latitude:            string;  // "21.121236"
  longitude:           string;  // "70.121597"
  status:              string;  // "OnTrip" | "N/A"
  routeName:           string;  // "Rajkot to Junagadh"
  nextLocation:        string;  // next stop name
  eta:                 string;  // "14/05/2026 22:03:46"
  lastBusStation:      string;  // last stopped station
  lastArrivalDateTime: string;  // "14/05/2026 19:45:00"
  departureDateTime:   string;
  // Normalised helpers (computed client-side)
  lat?:     number;
  lng?:     number;
}

export interface VtsTooltipResponse {
  vehicleNumber: string;
  speedKmh:      number;
  direction:     "Up" | "Down";
  service:       string;
  depot:         string;
  route?:        string;
  departure?:    string;
}

export interface OprsTripResult {
  serviceCode: string;       // "1800BHJDIUVLV47"
  serviceClass: string;      // "VOLVO" | "AC LUXURY" | …
  departTime: string;        // "00:30"
  origin: string;
  destination: string;
  duration: string;          // "02:00"
  fare: number;
  seatsLeft: number;
  via: string[];
}

// ── Normalise vehicle number ───────────────────────────────────────────────────

/** live.gsrtc.org accepts the number without dashes: "GJ18ZT1831" */
export function normaliseVehicleNo(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

// ── API calls ────────────────────────────────────────────────────────────────

/**
 * Fetch live location + status for a vehicle.
 * Mirrors the 30-second poll cadence observed in network traffic.
 */
export async function fetchVtsLive(vehicleNo: string): Promise<VtsLiveResponse> {
  if (!VTS_BASE) throw new Error("No proxy configured — set VITE_PROXY_BASE");
  // API expects { vehicleNo, scheduleDate } — confirmed from 400 error response
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const body  = JSON.stringify({ vehicleNo: normaliseVehicleNo(vehicleNo), scheduleDate: today });
  const res   = await fetch(`${VTS_BASE}/api/vehicle/live`, {
    method:  "POST",
    headers: JSON_HEADERS,
    body,
  });
  if (!res.ok) throw new Error(`VTS live: ${res.status}`);
  return res.json() as Promise<VtsLiveResponse>;
}

/**
 * Fetch tooltip data (speed, direction, service, depot).
 * The official site fires this right after /live — we replicate that pattern.
 */
export async function fetchVtsTooltip(vehicleNo: string): Promise<VtsTooltipResponse> {
  if (!VTS_BASE) throw new Error("No proxy configured — set VITE_PROXY_BASE");
  const today = new Date().toISOString().slice(0, 10);
  const body  = JSON.stringify({ vehicleNo: normaliseVehicleNo(vehicleNo), scheduleDate: today });
  const res   = await fetch(`${VTS_BASE}/api/vehicle/tooltip`, {
    method:  "POST",
    headers: JSON_HEADERS,
    body,
  });
  if (!res.ok) throw new Error(`VTS tooltip: ${res.status}`);
  return res.json() as Promise<VtsTooltipResponse>;
}

/**
 * Combined: live + tooltip in parallel, merged into one object.
 * The live endpoint returns an array — we take the first element.
 * Normalises latitude/longitude strings to numeric lat/lng.
 */
export async function fetchVehicleFull(vehicleNo: string) {
  // Live returns an array; tooltip may 404 for some vehicles — catch independently
  const rawLive = await fetchVtsLive(vehicleNo);
  // API actually returns an array: [{latitude, longitude, ...}]
  const live = Array.isArray(rawLive) ? (rawLive as VtsLiveResponse[])[0] : rawLive;

  let tooltip: Partial<VtsTooltipResponse> = {};
  try {
    const raw = await fetchVtsTooltip(vehicleNo);
    tooltip = Array.isArray(raw) ? (raw as VtsTooltipResponse[])[0] ?? {} : raw;
  } catch { /* tooltip is optional */ }

  // Normalise: string lat/lng → numbers
  const lat = parseFloat((live?.latitude ?? "0").replace(",", "."));
  const lng = parseFloat((live?.longitude ?? "0").replace(",", "."));

  return {
    ...live,
    ...tooltip,
    lat: isNaN(lat) ? null : lat,
    lng: isNaN(lng) ? null : lng,
    // Friendly aliases
    nextStop:    live?.nextLocation    ?? null,
    lastStation: live?.lastBusStation  ?? null,
    lastArrival: live?.lastArrivalDateTime ?? null,
    route:       tooltip?.route ?? live?.routeName ?? null,
    isLive:      !!(lat && lng && live?.latitude !== "N/A"),
  };
}


// ── OPRS schedule search ──────────────────────────────────────────────────────

export interface OprsSearchParams {
  source:      string;
  destination: string;
  date:        string; // "DD/MM/YYYY" or "YYYY-MM-DD" — we normalise
  passengers?: number;
}

/**
 * Search GSRTC schedule via the Worker's /oprs/search endpoint.
 * Worker handles: session → station ID lookup → full OPRS POST
 */
export async function fetchOprsSchedule(params: OprsSearchParams): Promise<OprsTripResult[]> {
  if (!OPRS_BASE) throw new Error("No proxy configured — set VITE_PROXY_BASE");

  // Normalise date to YYYY-MM-DD for the Worker
  let dateISO = params.date;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateISO)) {
    const [d, m, y] = dateISO.split("/");
    dateISO = `${y}-${m}-${d}`;
  }

  const res = await fetch(`${OPRS_BASE}/oprs/search`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ from: params.source, to: params.destination, date: dateISO }),
  });
  if (!res.ok) throw new Error(`OPRS search: ${res.status}`);
  const data = await res.json() as { trips?: OprsTripResult[]; _meta?: unknown } | OprsTripResult[];
  return Array.isArray(data) ? data : (data.trips ?? []);
}

// ── VTS share-link decode ─────────────────────────────────────────────────────

/**
 * The GSRTC share URL format:
 *   https://www.gsrtc.in/Notify/VTS.do?VNO={encrypted}&DOJ={encrypted}
 *
 * VNO and DOJ appear to be AES-encrypted + base64url-encoded server-side tokens.
 * We can't decrypt them on the client, but we can:
 *   1. Link directly to the official status page
 *   2. Or have our proxy accept the raw vehicle number + date and reissue the link
 */
export function buildOfficialStatusUrl(encryptedVno: string, encryptedDoj: string): string {
  return `https://www.gsrtc.in/Notify/VTS.do?VNO=${encryptedVno}&DOJ=${encryptedDoj}`;
}

/** hasProxy — true when VITE_PROXY_BASE is configured */
export const hasProxy = !!PROXY_BASE;
