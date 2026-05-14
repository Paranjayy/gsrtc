/**
 * GSRTC VTS (Vehicle Tracking System) API — Reverse-Engineered
 *
 * Endpoints discovered from live.gsrtc.org network traffic:
 *   POST /api/vehicle/live    → lat/lng + basic telemetry  (~30s poll cadence)
 *   POST /api/vehicle/tooltip → speed, direction, service, depot
 *
 * Auth: gsrtc_auth_token from localStorage is sent as a Bearer token.
 *
 * CORS NOTE: Both endpoints live on live.gsrtc.org which doesn't allow
 * cross-origin requests. In production, proxy via a Cloudflare Worker or
 * a Vite dev-proxy entry in vite.config.ts.
 *
 * OPRS Schedule: gsrtc.in/opronline/jgreq.do — similarly CORS-restricted.
 */

// ── Config ────────────────────────────────────────────────────────────────────

/** Set to your Cloudflare Worker / backend proxy URL in .env */
const PROXY_BASE = import.meta.env.VITE_PROXY_BASE ?? "";
const VTS_BASE   = PROXY_BASE ? `${PROXY_BASE}/vts`  : "https://live.gsrtc.org";
const OPRS_BASE  = PROXY_BASE ? `${PROXY_BASE}/oprs` : "https://gsrtc.in/opronline";

function authHeader(): HeadersInit {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("gsrtc_auth_token")
    : null;
  return token
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

// ── Response shapes (inferred from payload sizes + screenshot) ────────────────

export interface VtsLiveResponse {
  vehicleNumber: string;     // "GJ-18-ZT-1831"
  lat: number;               // 23.568742
  lng: number;               // 72.955152
  updatedAt: string;         // ISO string
  status: string;            // "OnTrip" | "Arrived" | "Departed"
  /** May be absent on first call */
  nextStop?: string;
  nextStopEta?: string;      // "14/05/2026 22:03:46"
  lastStation?: string;
  lastArrival?: string;
}

export interface VtsTooltipResponse {
  vehicleNumber: string;     // "GJ-18-ZT-1831"
  speedKmh: number;          // 10
  direction: "Up" | "Down";  // "Up"
  service: string;           // "Express"
  depot: string;             // "Mangroi"
  route?: string;            // "Ambaji to Rajpipla Via Prantij"
  departure?: string;        // "14/05/2026 19:30:00"
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
  const body = JSON.stringify({ vehicleNumber: normaliseVehicleNo(vehicleNo) });
  const res  = await fetch(`${VTS_BASE}/api/vehicle/live`, {
    method:  "POST",
    headers: authHeader(),
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
  const body = JSON.stringify({ vehicleNumber: normaliseVehicleNo(vehicleNo) });
  const res  = await fetch(`${VTS_BASE}/api/vehicle/tooltip`, {
    method:  "POST",
    headers: authHeader(),
    body,
  });
  if (!res.ok) throw new Error(`VTS tooltip: ${res.status}`);
  return res.json() as Promise<VtsTooltipResponse>;
}

/**
 * Combined: live + tooltip in parallel, merged into one object.
 * This is the primary hook used by the track page.
 */
export async function fetchVehicleFull(vehicleNo: string) {
  const [live, tooltip] = await Promise.all([
    fetchVtsLive(vehicleNo),
    fetchVtsTooltip(vehicleNo),
  ]);
  return { ...live, ...tooltip };
}

// ── OPRS schedule search ──────────────────────────────────────────────────────

export interface OprsSearchParams {
  source:      string;
  destination: string;
  date:        string; // "DD/MM/YYYY"
  passengers?: number;
}

/**
 * Search GSRTC schedule via the OPRS endpoint.
 * URL: POST /opronline/jgreq.do?hiddenaction=searchserviceforhome
 *
 * The official site uses a form POST with URL-encoded body.
 */
export async function fetchOprsSchedule(params: OprsSearchParams): Promise<OprsTripResult[]> {
  const body = new URLSearchParams({
    hiddenaction: "searchserviceforhome",
    src:          params.source,
    dst:          params.destination,
    doj:          params.date,         // "DD/MM/YYYY"
    noOfPassenger: String(params.passengers ?? 1),
  });

  const res = await fetch(`${OPRS_BASE}/jgreq.do?hiddenaction=searchserviceforhome`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", ...authHeader() },
    body:    body.toString(),
  });
  if (!res.ok) throw new Error(`OPRS search: ${res.status}`);
  // Response is HTML — will need server-side scraping or proxy to return JSON.
  // When proxy is set up, return res.json(); for now return [].
  return [];
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

// ── Token management ──────────────────────────────────────────────────────────

export function getAuthToken(): string | null {
  return typeof window !== "undefined"
    ? localStorage.getItem("gsrtc_auth_token")
    : null;
}

export function setAuthToken(token: string) {
  localStorage.setItem("gsrtc_auth_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("gsrtc_auth_token");
}
