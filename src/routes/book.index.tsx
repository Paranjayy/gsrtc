import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  ArrowDownUp, ArrowRight, ArrowLeftRight, Calendar, Check, ChevronDown,
  Filter, LayoutList, MapPin, RowsIcon, Sparkles, Ticket, Users, Clock, X, ExternalLink, History, Loader2,
} from "lucide-react";
import { generateTrips, popularRoutes, SERVICE_META, GSRTC_STATIONS, type ServiceClass, type Trip } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { hasProxy, fetchOprsSchedule, type OprsTripResult } from "@/lib/vts-api";

// Build official GSRTC booking deep-link
function officialBookingUrl(from: string, to: string, date: string, serviceCode?: string): string {
  const base = "https://gsrtc.in/site/en/web/booking/new-booking";
  const params = new URLSearchParams({
    src: from,
    dst: to,
    doj: date.split("-").reverse().join("/"), // DD/MM/YYYY
    ...(serviceCode ? { sc: serviceCode } : {}),
  });
  return `${base}?${params.toString()}`;
}

/** Map a scraped OPRS result to our Trip shape */
function oprsToTrip(r: OprsTripResult, from: string, to: string): Trip {
  const code = r.serviceCode ?? "";
  // Service code format: "1800BHJDIUVLV47" — first 4 chars = HHMM departure time
  const rawHour = code.length >= 4 ? parseInt(code.slice(0, 2)) : 0;
  const rawMin  = code.length >= 4 ? parseInt(code.slice(2, 4)) : 0;
  const deptH   = isNaN(rawHour) ? 0 : rawHour;
  const deptM   = isNaN(rawMin)  ? 0 : rawMin;
  const departTime = r.departTime ?? `${String(deptH).padStart(2,"0")}:${String(deptM).padStart(2,"0")}`;

  // Guess service class from service code suffix / fare
  const fare = r.fare ?? 150;
  const svcClass: ServiceClass =
    fare > 250 ? "Volvo" :
    fare > 180 ? "AC Luxury" :
    fare > 150 ? "Sleeper" :
    fare > 130 ? "Luxury" :
    fare > 100 ? "Express" :
    fare > 80  ? "Gurjarnagri" : "Local Ordinary";

  const durationMin = 120; // fallback; OPRS doesn't expose duration directly
  const arrH = (deptH + Math.floor((deptM + durationMin) / 60)) % 24;
  const arrM = (deptM + durationMin) % 60;
  const arriveTime = `${String(arrH).padStart(2,"0")}:${String(arrM).padStart(2,"0")}`;

  return {
    id:           code || Math.random().toString(36).slice(2),
    serviceCode:  code,
    serviceClass: svcClass,
    origin:       from,
    destination:  to,
    departTime,
    arriveTime,
    durationMin,
    fare,
    seatsLeft:    r.seatsLeft ?? 0,
    via:          [],
  };
}

const HISTORY_KEY = "gsrtc_search_history";
type HistoryEntry = { from: string; to: string; date: string; ts: number };

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); } catch { return []; }
}
function saveHistory(e: HistoryEntry) {
  const prev = loadHistory().filter(h => !(h.from === e.from && h.to === e.to));
  localStorage.setItem(HISTORY_KEY, JSON.stringify([e, ...prev].slice(0, 8)));
}


export const Route = createFileRoute("/book/")({
  head: () => ({
    meta: [
      { title: "Book GSRTC bus tickets — RouteLive" },
      { name: "description", content: "Search GSRTC routes, compare timings and book through official or partner channels. Clean, fast, ad-free." },
    ],
  }),
  component: BookIndex,
});

type SortBy = "time" | "fare" | "duration" | "seats";
type GroupBy = "service" | "time-of-day" | "none";
type ViewMode = "list" | "compact";

const ALL_CLASSES = Object.keys(SERVICE_META) as ServiceClass[];

const TIME_BANDS = [
  { label: "Early morning", from: 0,  to: 6  },
  { label: "Morning",       from: 6,  to: 12 },
  { label: "Afternoon",     from: 12, to: 17 },
  { label: "Evening",       from: 17, to: 21 },
  { label: "Night",         from: 21, to: 24 },
];

function tripHour(t: Trip) { return parseInt(t.departTime.split(":")[0]); }

function StationCombo({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() =>
    GSRTC_STATIONS.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8),
    [value]
  );
  return (
    <div className="relative flex flex-1 items-center gap-2 rounded-xl px-3 hover:bg-secondary/50">
      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        id={id}
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full bg-transparent py-3 text-sm focus:outline-none"
      />
      {open && value && suggestions.length > 0 && (
        <ul className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-elegant">
          {suggestions.map(s => (
            <li
              key={s}
              onMouseDown={() => { onChange(s); setOpen(false); }}
              className="cursor-pointer px-4 py-2.5 text-sm hover:bg-secondary"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SeatsBar({ seats }: { seats: number }) {
  const pct = Math.min(100, (seats / 45) * 100);
  const color = seats > 15 ? "bg-success" : seats > 5 ? "bg-accent" : "bg-destructive";
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs font-medium tabular-nums",
        seats > 15 ? "text-success" : seats > 5 ? "text-accent" : "text-destructive"
      )}>{seats}</span>
    </div>
  );
}

function TripCard({ trip, from, to, date, compact }: { trip: Trip; from: string; to: string; date: string; compact: boolean }) {
  const meta = SERVICE_META[trip.serviceClass];
  const hrs = Math.floor(trip.durationMin / 60);
  const mins = trip.durationMin % 60;
  const bookUrl = officialBookingUrl(from, to, date, trip.serviceCode);

  if (compact) {
    return (
      <div className="grid items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-secondary/40 md:grid-cols-[90px_1fr_80px_80px_80px_auto]">
        <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: meta.color, background: meta.bgColor }}>
          {trip.serviceClass}
        </span>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold tabular-nums">{trip.departTime}</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-semibold tabular-nums">{trip.arriveTime}</span>
          {trip.via.length > 0 && (
            <span className="hidden text-xs text-muted-foreground md:block">via {trip.via.join(", ")}</span>
          )}
        </div>
        <span className="text-sm text-muted-foreground">{hrs}h {mins}m</span>
        <SeatsBar seats={trip.seatsLeft} />
        <span className="text-sm font-semibold">₹{trip.fare}</span>
        <a
          href={bookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          <Ticket className="h-3.5 w-3.5" /> Book
        </a>
      </div>
    );
  }

  return (
    <div className="grid items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-elegant md:grid-cols-[1fr_auto_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: meta.color, background: meta.bgColor }}>
            {trip.serviceClass}
          </span>
          <span className="font-mono text-xs text-muted-foreground">{trip.serviceCode}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="text-2xl font-semibold tabular-nums tracking-tight">{trip.departTime}</span>
          <span className="text-xs text-muted-foreground">{trip.origin}</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-2xl font-semibold tabular-nums tracking-tight">{trip.arriveTime}</span>
          <span className="text-xs text-muted-foreground">{trip.destination}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{hrs}h {mins}m</span>
          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{trip.seatsLeft} seats</span>
          {trip.via.length > 0 && <span>via {trip.via.join(", ")}</span>}
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-semibold tracking-tight">₹{trip.fare}</div>
        <div className="text-[11px] text-muted-foreground">incl. taxes</div>
        <div className="mt-1"><SeatsBar seats={trip.seatsLeft} /></div>
      </div>
      <a
        href={bookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] hover:opacity-90"
      >
        <ExternalLink className="h-4 w-4" /> Book on GSRTC
      </a>
    </div>
  );
}

function BookIndex() {
  const [from, setFrom]       = useState("");
  const [to, setTo]           = useState("");
  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [searched, setSearch] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const doSearch = () => {
    if (!from || !to) return;
    const entry = { from, to, date, ts: Date.now() };
    saveHistory(entry);
    setHistory(loadHistory());
    setSearch(true);
  };

  const swapStations = () => { setFrom(to); setTo(from); };

  // Filter / sort / group state
  const [enabledClasses, setClasses] = useState<Set<ServiceClass>>(new Set(ALL_CLASSES));
  const [sortBy, setSortBy]   = useState<SortBy>("time");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [groupBy, setGroupBy] = useState<GroupBy>("service");
  const [viewMode, setView]   = useState<ViewMode>("list");
  const [maxFare, setMaxFare] = useState(300);
  const [minSeats, setSeats]  = useState(0);
  const [afterHour, setAfter] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [isLoading, setLoading] = useState(false);
  const [isLive, setIsLive]     = useState(false);
  const [rawTrips, setRawTrips] = useState<Trip[]>([]);

  const runSearch = useCallback(async (f: string, t: string, d: string) => {
    setLoading(true);
    setRawTrips([]);
    try {
      const results = await fetchOprsSchedule({
        source:      f,
        destination: t,
        date:        d.split("-").reverse().join("/"), // YYYY-MM-DD → DD/MM/YYYY
      });
      if (results.length > 0) {
        setRawTrips(results.map(r => oprsToTrip(r, f, t)));
        setIsLive(true);
        setLoading(false);
        return;
      }
    } catch {
      // proxy error — fall through to mock
    }
    // fallback: mock data
    setRawTrips(generateTrips(f || "Ahmedabad", t || "Rajkot"));
    setIsLive(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (searched && from && to) void runSearch(from, to, date);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searched]);


  const filtered = useMemo(() => {
    let t = rawTrips
      .filter(x => enabledClasses.has(x.serviceClass))
      .filter(x => x.fare <= maxFare)
      .filter(x => x.seatsLeft >= minSeats)
      .filter(x => tripHour(x) >= afterHour);

    t.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "time")     return a.departTime.localeCompare(b.departTime) * dir;
      if (sortBy === "fare")     return (a.fare - b.fare) * dir;
      if (sortBy === "duration") return (a.durationMin - b.durationMin) * dir;
      if (sortBy === "seats")    return (a.seatsLeft - b.seatsLeft) * dir;
      return 0;
    });

    return t;
  }, [rawTrips, enabledClasses, maxFare, minSeats, afterHour, sortBy, sortDir]);

  // Grouped results
  const grouped = useMemo(() => {
    if (groupBy === "none") return [{ label: "All buses", trips: filtered }];
    if (groupBy === "service") {
      const map = new Map<ServiceClass, Trip[]>();
      filtered.forEach(t => {
        const arr = map.get(t.serviceClass) ?? [];
        arr.push(t);
        map.set(t.serviceClass, arr);
      });
      return [...map.entries()].map(([label, trips]) => ({ label, trips }));
    }
    if (groupBy === "time-of-day") {
      return TIME_BANDS
        .map(band => ({
          label: band.label,
          trips: filtered.filter(t => { const h = tripHour(t); return h >= band.from && h < band.to; }),
        }))
        .filter(g => g.trips.length > 0);
    }
    return [];
  }, [filtered, groupBy]);

  const toggleClass = (cls: ServiceClass) => {
    setClasses(prev => {
      const next = new Set(prev);
      next.has(cls) ? next.delete(cls) : next.add(cls);
      return next;
    });
  };

  const activeFilterCount = (ALL_CLASSES.length - enabledClasses.size) + (maxFare < 300 ? 1 : 0) + (minSeats > 0 ? 1 : 0) + (afterHour > 0 ? 1 : 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Search hero */}
      <div className="rounded-3xl bg-gradient-hero p-6 text-primary-foreground sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-accent" /> GSRTC schedule &amp; pricing — all service classes
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Find your ride</h1>
        <p className="mt-2 text-primary-foreground/75">Compare timings, fares &amp; availability across all GSRTC service classes.</p>

        {/* Search form */}
        <form
          onSubmit={(e) => { e.preventDefault(); doSearch(); }}
          className="mt-6 grid gap-2 rounded-2xl bg-surface p-2 text-foreground shadow-elegant md:grid-cols-[1fr_auto_1fr_180px_auto]"
        >
          <StationCombo id="from" placeholder="From — e.g. Ahmedabad" value={from} onChange={v => { setFrom(v); setSearch(false); }} />
          <button type="button" onClick={swapStations} title="Swap stations"
            className="flex items-center justify-center rounded-xl p-2 hover:bg-secondary/50 transition-colors">
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <StationCombo id="to"   placeholder="To — e.g. Rajkot"     value={to}   onChange={v => { setTo(v); setSearch(false); }} />
          <div className="flex items-center gap-2 rounded-xl px-3 hover:bg-secondary/50">
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-transparent py-3 text-sm focus:outline-none" />
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
            Search <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Recent searches */}
        {!searched && history.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-primary-foreground/60">
              <History className="h-3 w-3" /> Recent:
            </span>
            {history.slice(0, 5).map(h => (
              <button
                key={h.ts}
                type="button"
                onClick={() => { setFrom(h.from); setTo(h.to); setDate(h.date); doSearch(); }}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs hover:bg-white/20 transition-colors"
              >
                {h.from} → {h.to}
              </button>
            ))}
          </div>
        )}
      </div>

      {searched && (
        <div className="mt-8">
          {/* Loading state */}
          {isLoading && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Fetching live schedules from GSRTC…</span>
            </div>
          )}

          {/* Live data badge */}
          {!isLoading && isLive && (
            <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
              <span className="text-base">🟢</span>
              <span><strong>Live GSRTC data</strong> — real-time availability from gsrtc.in</span>
            </div>
          )}

          {/* Mock data banner */}
          {!isLoading && !isLive && (
            <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent-foreground">
              <span className="text-base">⚠️</span>
              <span>
                <strong>Estimated schedules</strong> — timings, fares and seat counts are sample data, not live GSRTC availability.{" "}
                <a
                  href={officialBookingUrl(from, to, date)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:opacity-80"
                >
                  Book on official site →
                </a>
              </span>
            </div>
          )}

          {/* Toolbar */}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                {filtered.length} buses found
              </h2>
              <p className="text-sm text-muted-foreground">
                {from || "Ahmedabad"} → {to || "Rajkot"} · {new Date(date + "T00:00:00").toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(v => !v)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                  showFilters || activeFilterCount > 0
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-secondary"
                )}
              >
                <Filter className="h-4 w-4" />
                Filter {activeFilterCount > 0 && <span className="rounded-full bg-white/20 px-1.5 text-xs">{activeFilterCount}</span>}
              </button>

              {/* Group by */}
              <div className="relative">
                <select
                  value={groupBy}
                  onChange={e => setGroupBy(e.target.value as GroupBy)}
                  className="appearance-none rounded-full border border-border bg-card py-2 pl-3 pr-8 text-sm font-medium focus:outline-none"
                >
                  <option value="service">Group: Service</option>
                  <option value="time-of-day">Group: Time</option>
                  <option value="none">No grouping</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortBy)}
                  className="appearance-none rounded-full border border-border bg-card py-2 pl-3 pr-8 text-sm font-medium focus:outline-none"
                >
                  <option value="time">Sort: Departure</option>
                  <option value="fare">Sort: Price</option>
                  <option value="duration">Sort: Duration</option>
                  <option value="seats">Sort: Seats</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              <button
                onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
                className="rounded-full border border-border bg-card p-2 transition-colors hover:bg-secondary"
                title="Toggle sort direction"
              >
                <ArrowDownUp className={cn("h-4 w-4 transition-transform", sortDir === "desc" && "rotate-180")} />
              </button>

              {/* View mode */}
              <div className="flex rounded-full border border-border bg-card p-1">
                <button onClick={() => setView("list")} className={cn("rounded-full p-1.5 transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>
                  <LayoutList className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setView("compact")} className={cn("rounded-full p-1.5 transition-colors", viewMode === "compact" ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>
                  <RowsIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mb-6 rounded-2xl border border-border bg-card p-5">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Service class chips */}
                <div className="sm:col-span-2 lg:col-span-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service class</div>
                  <div className="flex flex-wrap gap-2">
                    {ALL_CLASSES.map(cls => {
                      const meta = SERVICE_META[cls];
                      const active = enabledClasses.has(cls);
                      return (
                        <button
                          key={cls}
                          onClick={() => toggleClass(cls)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                            active ? "border-transparent" : "border-border bg-card opacity-50"
                          )}
                          style={active ? { color: meta.color, background: meta.bgColor, borderColor: meta.color + "55" } : {}}
                        >
                          {active && <Check className="h-3 w-3" />}
                          {cls}
                        </button>
                      );
                    })}
                    <button onClick={() => setClasses(new Set(ALL_CLASSES))} className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:bg-secondary">
                      <X className="h-3 w-3" /> Reset
                    </button>
                  </div>
                </div>

                {/* Max fare */}
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Max fare</span><span className="font-mono text-foreground">₹{maxFare}</span>
                  </div>
                  <input type="range" min={50} max={300} step={5} value={maxFare} onChange={e => setMaxFare(+e.target.value)}
                    className="w-full accent-primary" />
                </div>

                {/* Min seats */}
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Min seats</span><span className="font-mono text-foreground">{minSeats}</span>
                  </div>
                  <input type="range" min={0} max={30} step={1} value={minSeats} onChange={e => setSeats(+e.target.value)}
                    className="w-full accent-primary" />
                </div>

                {/* Depart after */}
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Depart after</span>
                    <span className="font-mono text-foreground">{String(afterHour).padStart(2,"0")}:00</span>
                  </div>
                  <input type="range" min={0} max={23} step={1} value={afterHour} onChange={e => setAfter(+e.target.value)}
                    className="w-full accent-primary" />
                </div>
              </div>
            </div>
          )}

          {/* Service class summary strip */}
          <div className="mb-5 flex flex-wrap gap-2">
            {ALL_CLASSES.map(cls => {
              const count = filtered.filter(t => t.serviceClass === cls).length;
              if (!count) return null;
              const meta = SERVICE_META[cls];
              return (
                <button key={cls} onClick={() => { setGroupBy("service"); setSortBy("time"); }}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                  style={{ color: meta.color, background: meta.bgColor, borderColor: meta.color + "44" }}>
                  {cls}: {count}
                </button>
              );
            })}
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No buses match your filters. Try relaxing some constraints.
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.map(group => (
                <div key={group.label}>
                  {groupBy !== "none" && (
                    <div className="mb-3 flex items-center gap-3">
                      <h3 className="text-sm font-semibold tracking-tight">{group.label}</h3>
                      <span className="text-xs text-muted-foreground">{group.trips.length} bus{group.trips.length !== 1 ? "es" : ""}</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  {viewMode === "compact" ? (
                    <div className="overflow-hidden rounded-2xl border border-border bg-card">
                      {group.trips.map(t => <TripCard key={t.id} trip={t} from={from} to={to} date={date} compact />)}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {group.trips.map(t => <TripCard key={t.id} trip={t} from={from} to={to} date={date} compact={false} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Popular routes (pre-search) */}
      {!searched && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Popular routes</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popularRoutes.map(r => (
              <button
                key={r.id}
                onClick={() => { setFrom(r.from); setTo(r.to); setSearch(true); }}
                className="group rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-elegant"
              >
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{r.trips} trips · from ₹{r.fareFrom}</div>
                <div className="mt-1 text-lg font-semibold tracking-tight">{r.from} → {r.to}</div>
                <div className="mt-2 text-sm text-muted-foreground">{r.distanceKm} km · {Math.floor(r.durationMin/60)}h {r.durationMin%60}m</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
