// Mock data — placeholders until real GSRTC APIs are wired in.
export type BusStop = {
  name: string;
  lat: number;
  lng: number;
  arrivedAt?: string;
  eta?: string;
  distanceKm?: number;
};

export type BusInfo = {
  vehicleNumber: string; // e.g. GJ-18-ZT-1838
  pnr?: string;
  service: "Express" | "Volvo" | "Sleeper" | "AC Luxury" | "Local";
  depot: string;
  route: string;
  origin: string;
  destination: string;
  speedKmh: number;
  direction: "Up" | "Down";
  occupancy: "Low" | "Medium" | "High";
  lat: number;
  lng: number;
  updatedAt: string;
  status: "On time" | "Delayed" | "Departed" | "Arrived";
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
    lat: 22.284838,
    lng: 70.80074,
    updatedAt: new Date().toISOString(),
    status: "On time",
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

export type Trip = {
  id: string;
  serviceCode: string;
  type: "Volvo" | "AC Luxury" | "Sleeper" | "Express" | "Local Ordinary";
  departTime: string;
  arriveTime: string;
  durationMin: number;
  origin: string;
  destination: string;
  via: string[];
  fare: number;
  seatsLeft: number;
};

export const mockTrips: Trip[] = [
  { id: "t1", serviceCode: "0700MNDRDADJNVL", type: "Volvo", departTime: "08:00", arriveTime: "10:30", durationMin: 150, origin: "Mendarda", destination: "Surat", via: ["Brd", "Rjt", "Jnd"], fare: 267, seatsLeft: 12 },
  { id: "t2", serviceCode: "0600SMNTABDVL47", type: "AC Luxury", departTime: "09:00", arriveTime: "11:30", durationMin: 150, origin: "Somnath", destination: "Ahmedabad", via: ["Vrl", "Sasangir", "Jnd"], fare: 267, seatsLeft: 4 },
  { id: "t3", serviceCode: "1900SMNTGNDVL47", type: "Volvo", departTime: "21:00", arriveTime: "23:40", durationMin: 160, origin: "Somnath", destination: "Gandhinagar", via: ["Ksd", "Jnd", "Rjt"], fare: 267, seatsLeft: 21 },
  { id: "t4", serviceCode: "2130UNARJTACD45", type: "AC Luxury", departTime: "21:30", arriveTime: "01:10", durationMin: 220, origin: "Una", destination: "Rajkot", via: ["Kdn", "Smnt", "Vrl"], fare: 185, seatsLeft: 8 },
];
