// Mock data — placeholders until real GSRTC APIs are wired in.

// ── Types ────────────────────────────────────────

export type ServiceClass =
  | "Volvo"
  | "AC Luxury"
  | "Sleeper"
  | "Luxury"
  | "Express"
  | "Gurjarnagri"
  | "Electric AC"
  | "Local Ordinary";

export type BusStop = {
  name: string;
  lat: number;
  lng: number;
  arrivedAt?: string;
  eta?: string;
  distanceKm?: number;
};

export type BusInfo = {
  vehicleNumber: string;
  pnr?: string;
  service: ServiceClass;
  depot: string;
  route: string;
  origin: string;
  destination: string;
  speedKmh: number;
  direction: "Up" | "Down";
  occupancy: "Low" | "Medium" | "High";
  occupancyPct: number; // 0–100
  lat: number;
  lng: number;
  updatedAt: string;
  status: "On time" | "Delayed" | "Departed" | "Arrived";
  delayMin: number;
  distanceToNextKm: number;
  stops: BusStop[];
  currentStopIndex: number;
};

export function getMockBus(vehicleOrPnr: string): BusInfo {
  return {
    vehicleNumber: vehicleOrPnr.startsWith("PNR") ? "GJ-18-ZT-1838" : vehicleOrPnr,
    pnr: vehicleOrPnr.startsWith("PNR") ? vehicleOrPnr : undefined,
    service: "Express",
    depot: "Radhanpur",
    route: "Radhanpur → Ahmedabad",
    origin: "Radhanpur",
    destination: "Ahmedabad",
    speedKmh: 52,
    direction: "Down",
    occupancy: "Medium",
    occupancyPct: 64,
    lat: 23.284838,
    lng: 72.130074,
    updatedAt: new Date().toISOString(),
    status: "On time",
    delayMin: 0,
    distanceToNextKm: 18.4,
    currentStopIndex: 2,
    stops: [
      { name: "Radhanpur", lat: 23.83, lng: 71.6, arrivedAt: "05:30" },
      { name: "Patan", lat: 23.85, lng: 72.12, arrivedAt: "06:45" },
      { name: "Mehsana", lat: 23.6, lng: 72.39, arrivedAt: "07:50", distanceKm: 0 },
      { name: "Kalol", lat: 23.24, lng: 72.49, eta: "08:35", distanceKm: 28 },
      { name: "Gandhinagar", lat: 23.22, lng: 72.65, eta: "09:05", distanceKm: 48 },
      { name: "Ahmedabad", lat: 23.03, lng: 72.58, eta: "09:45", distanceKm: 72 },
    ],
  };
}

// ── Popular routes ───────────────────────────────

export type Route = {
  id: string;
  from: string;
  to: string;
  distanceKm: number;
  durationMin: number;
  fareFrom: number;
  trips: number;
};

export const popularRoutes: Route[] = [
  { id: "ahm-rjt", from: "Ahmedabad", to: "Rajkot", distanceKm: 215, durationMin: 295, fareFrom: 184, trips: 171 },
  { id: "rjt-ahm", from: "Rajkot", to: "Ahmedabad", distanceKm: 215, durationMin: 284, fareFrom: 187, trips: 174 },
  { id: "pal-ahm", from: "Palanpur", to: "Ahmedabad", distanceKm: 145, durationMin: 185, fareFrom: 137, trips: 164 },
  { id: "bhv-ahm", from: "Bhavnagar", to: "Ahmedabad", distanceKm: 177, durationMin: 242, fareFrom: 157, trips: 88 },
  { id: "jun-rjt", from: "Junagadh", to: "Rajkot", distanceKm: 102, durationMin: 145, fareFrom: 72, trips: 230 },
  { id: "vad-srt", from: "Vadodara", to: "Surat", distanceKm: 150, durationMin: 195, fareFrom: 165, trips: 142 },
];

// ── Trip / schedule ──────────────────────────────

export type Trip = {
  id: string;
  serviceCode: string;
  serviceClass: ServiceClass;
  departTime: string; // "HH:MM"
  arriveTime: string; // "HH:MM"
  durationMin: number;
  origin: string;
  destination: string;
  via: string[];
  fare: number;
  seatsLeft: number;
};

// Service class display metadata
export const SERVICE_META: Record<
  ServiceClass,
  { color: string; bgColor: string; fareBase: number; sortPriority: number }
> = {
  Volvo:           { color: "oklch(0.65 0.18 258)", bgColor: "oklch(0.36 0.15 258 / 0.12)", fareBase: 267, sortPriority: 1 },
  "AC Luxury":     { color: "oklch(0.62 0.16 155)", bgColor: "oklch(0.4 0.14 155 / 0.12)", fareBase: 185, sortPriority: 2 },
  Sleeper:         { color: "oklch(0.64 0.17 290)", bgColor: "oklch(0.4 0.15 290 / 0.12)", fareBase: 185, sortPriority: 3 },
  Luxury:          { color: "oklch(0.72 0.17 75)",  bgColor: "oklch(0.5 0.14 75 / 0.12)",  fareBase: 160, sortPriority: 4 },
  Express:         { color: "oklch(0.78 0.17 55)",  bgColor: "oklch(0.55 0.14 55 / 0.12)", fareBase: 123, sortPriority: 5 },
  Gurjarnagri:     { color: "oklch(0.68 0.16 190)", bgColor: "oklch(0.45 0.13 190 / 0.12)",fareBase: 122, sortPriority: 6 },
  "Electric AC":   { color: "oklch(0.65 0.17 165)", bgColor: "oklch(0.42 0.14 165 / 0.12)",fareBase: 150, sortPriority: 7 },
  "Local Ordinary":{ color: "oklch(0.6 0.014 240)", bgColor: "oklch(0.4 0.01 240 / 0.12)", fareBase: 0,   sortPriority: 8 },
};

// Realistic GSRTC station list
export const GSRTC_STATIONS: string[] = [
  "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Junagadh",
  "Jamnagar", "Gandhinagar", "Anand", "Nadiad", "Morbi", "Surendranagar",
  "Mehsana", "Patan", "Palanpur", "Himmatnagar", "Godhra", "Dahod",
  "Bharuch", "Navsari", "Valsad", "Vapi", "Porbandar", "Amreli",
  "Botad", "Dwarka", "Somnath", "Veraval", "Bhuj", "Gandhidham",
  "Anjar", "Wankaner", "Gondal", "Jetpur", "Dhoraji", "Idar",
  "Modasa", "Unjha", "Siddhpur", "Visnagar", "Radhanpur", "Deesa",
];

function pad(n: number) { return String(n).padStart(2, "0"); }

/** Generate realistic mock trips for a given route */
export function generateTrips(from: string, to: string): Trip[] {
  const seed = (from + to).split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  const plans: { cls: ServiceClass; times: string[]; fares: number[] }[] = [
    {
      cls: "Volvo",
      times: ["07:00", "09:30", "13:00", "21:30"],
      fares: [267, 267, 267, 267],
    },
    {
      cls: "AC Luxury",
      times: ["06:00", "08:30", "11:00", "14:00", "22:00"],
      fares: [185, 185, 185, 185, 185],
    },
    {
      cls: "Sleeper",
      times: ["19:00", "21:00", "22:30"],
      fares: [185, 185, 185],
    },
    {
      cls: "Luxury",
      times: ["06:30", "08:00", "10:30", "13:30", "16:00", "18:00", "20:30"],
      fares: [160, 160, 160, 165, 165, 165, 160],
    },
    {
      cls: "Express",
      times: ["05:30", "07:00", "08:00", "09:00", "10:00", "11:30", "13:00", "15:00", "17:00", "19:00"],
      fares: [123, 123, 123, 123, 123, 123, 123, 123, 123, 123],
    },
    {
      cls: "Gurjarnagri",
      times: ["06:15", "10:15", "14:15", "18:15"],
      fares: [122, 122, 122, 122],
    },
    {
      cls: "Electric AC",
      times: ["07:30", "11:30", "15:30"],
      fares: [150, 150, 150],
    },
    {
      cls: "Local Ordinary",
      times: ["05:00", "06:00", "07:30", "09:00", "11:00", "13:00", "15:30", "17:30"],
      fares: [72, 72, 72, 72, 72, 72, 72, 72],
    },
  ];

  const trips: Trip[] = [];

  plans.forEach(({ cls, times, fares }) => {
    const durationMin = 100 + (seed % 60) + SERVICE_META[cls].sortPriority * 5;
    times.forEach((departTime, i) => {
      const [h, m] = departTime.split(":").map(Number);
      const arrMins = h * 60 + m + durationMin;
      const arrH = Math.floor(arrMins / 60) % 24;
      const arrM = arrMins % 60;
      const seatsLeft = Math.max(0, 40 - ((seed * (i + 1) * SERVICE_META[cls].sortPriority) % 45));

      const viaPool = GSRTC_STATIONS.filter(s => s !== from && s !== to);
      const viaCount = cls === "Local Ordinary" ? 3 : cls === "Express" ? 1 : 2;
      const via = Array.from({ length: viaCount }, (_, k) => viaPool[(seed + k * 7 + i) % viaPool.length]);

      trips.push({
        id: `${cls}-${departTime}-${i}`,
        serviceCode: `${pad(h)}${pad(m)}${from.slice(0, 3).toUpperCase()}${to.slice(0, 3).toUpperCase()}`,
        serviceClass: cls,
        departTime,
        arriveTime: `${pad(arrH)}:${pad(arrM)}`,
        durationMin,
        origin: from,
        destination: to,
        via: [...new Set(via)],
        fare: fares[i] ?? fares[0],
        seatsLeft,
      });
    });
  });

  return trips.sort((a, b) => a.departTime.localeCompare(b.departTime));
}

// For backwards compat with book.index.tsx that uses mockTrips
export const mockTrips: Trip[] = generateTrips("Ahmedabad", "Rajkot");
