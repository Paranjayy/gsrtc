import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Gauge, MapPin, Navigation, RefreshCw, Share2, Star, Users, Zap } from "lucide-react";
import { BusMap } from "@/components/bus-map";
import { getMockBus, type BusInfo } from "@/lib/mock-data";
import { isFavorite, pushRecent, toggleFavorite } from "@/lib/favorites";
import { cn } from "@/lib/utils";
import { fetchVehicleFull } from "@/lib/vts-api";

export const Route = createFileRoute("/track/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Live tracking · RouteLive` },
      { name: "description", content: `Live location, next-stop ETA, distance and speed for ${params.id}.` },
    ],
  }),
  component: TrackDetail,
});

function usePolledBus(id: string, intervalMs = 30_000) {
  const [bus, setBus]          = useState<BusInfo>(() => getMockBus(id ?? ""));
  const [isLive, setIsLive]    = useState(false);
  const [lastRefresh, setLast] = useState(Date.now());
  const timerRef               = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const refresh = async () => {
    try {
      const vts = await fetchVehicleFull(id);
      setBus(prev => ({
        ...prev,
        lat:      vts.lat      ?? prev.lat,
        lng:      vts.lng      ?? prev.lng,
        speedKmh: (vts as {speedKmh?: number}).speedKmh ?? prev.speedKmh,
        direction:((vts as {direction?: string}).direction ?? prev.direction) as BusInfo["direction"],
        service:  ((vts as {service?: string}).service   ?? prev.service)   as BusInfo["service"],
        depot:    (vts as {depot?: string}).depot      ?? prev.depot,
        // Map real API status values
        status:   vts.status === "OnTrip"  ? "On time"
                : vts.status === "Arrived" ? "Arrived"
                : vts.status && vts.status !== "N/A" ? vts.status as BusInfo["status"]
                : prev.status,
        // Map real API stop fields
        updatedAt: new Date().toISOString(),
      }));
      setIsLive(!!(vts.isLive));
    } catch {
      setBus(prev => ({
        ...prev,
        speedKmh: Math.max(0, prev.speedKmh + Math.round((Math.random() - 0.4) * 12)),
        distanceToNextKm: Math.max(0, prev.distanceToNextKm - (Math.random() * 0.8)),
        updatedAt: new Date().toISOString(),
      }));
      setIsLive(false);
    }
    setLast(Date.now());
  };

  useEffect(() => {
    void refresh();
    timerRef.current = setInterval(() => void refresh(), intervalMs);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, intervalMs]);

  return { bus, isLive, lastRefresh, refresh };
}

// Relative time "X sec ago"
function useRelativeTime(ts: number) {
  const [label, setLabel] = useState("just now");
  useEffect(() => {
    const update = () => {
      const s = Math.floor((Date.now() - ts) / 1000);
      setLabel(s < 5 ? "just now" : s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [ts]);
  return label;
}

function speedColor(kmh: number) {
  if (kmh < 30) return "text-muted-foreground";
  if (kmh < 60) return "text-success";
  if (kmh < 90) return "text-accent";
  return "text-destructive";
}

function OccupancyBar({ pct }: { pct: number }) {
  const color = pct < 40 ? "bg-success" : pct < 75 ? "bg-accent" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/20">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold">{pct}%</span>
    </div>
  );
}

function TrackDetail() {
  const { id }    = useParams({ from: "/track/$id" });
  const { bus, isLive, lastRefresh, refresh } = usePolledBus(id);
  const [fav, setFav]     = useState(false);
  const [copied, setCopied] = useState(false);
  const ago = useRelativeTime(lastRefresh);

  const nextStop    = bus.stops[bus.currentStopIndex + 1];
  const currentStop = bus.stops[bus.currentStopIndex];
  const progressPct = useMemo(() => {
    const total = bus.stops.length - 1;
    return total > 0 ? Math.round((bus.currentStopIndex / total) * 100) : 0;
  }, [bus.currentStopIndex, bus.stops.length]);

  useEffect(() => {
    setFav(isFavorite(id));
    pushRecent({ id, label: bus.route, kind: id.startsWith("PNR") ? "pnr" : "vehicle" });
  }, [id, bus.route]);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `Tracking ${bus.vehicleNumber}`, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Mock data banner — shown when CORS proxy is not configured */}
      {!isLive && (
        <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent-foreground">
          <span className="text-base">⚠️</span>
          <span>
            <strong>Simulated data</strong> — positions, speed and ETA are demo values, not real.{" "}
            <a
              href="https://live.gsrtc.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-80"
            >
              View official tracker →
            </a>
          </span>
        </div>
      )}

      {/* Nav bar */}

      <div className="mb-4 flex items-center justify-between">
        <Link to="/track" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { toggleFavorite({ id, label: bus.route, kind: id.startsWith("PNR") ? "pnr" : "vehicle" }); setFav(isFavorite(id)); }}
            className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition",
              fav ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:bg-secondary")}
          >
            <Star className={cn("h-4 w-4", fav && "fill-current")} /> {fav ? "Saved" : "Save"}
          </button>
          <button onClick={share} className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-sm font-medium text-background">
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </div>

      {/* Hero card */}
      <div className="rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-elegant sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary-foreground/70">
              <span className="relative flex h-2 w-2">
                <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", isLive ? "bg-success" : "bg-accent")} />
                <span className={cn("relative inline-flex h-2 w-2 rounded-full", isLive ? "bg-success" : "bg-accent")} />
              </span>
              Live · {ago}
            </div>
            <h1 className="mt-2 font-mono text-3xl font-semibold tracking-tight sm:text-4xl">{bus.vehicleNumber}</h1>
            <p className="mt-1 text-primary-foreground/75">{bus.route}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Chip>{bus.service}</Chip>
            <Chip>{bus.depot}</Chip>
            <Chip>Dir: {bus.direction}</Chip>
            <Chip>{bus.status}</Chip>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs hover:bg-white/20"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Gauge className="h-4 w-4" />}
            label="Speed"
            value={<span className={cn("text-lg font-semibold tabular-nums", speedColor(bus.speedKmh))}>{bus.speedKmh} <span className="text-sm font-normal opacity-70">km/h</span></span>}
          />
          <StatCard
            icon={<MapPin className="h-4 w-4" />}
            label="Next stop in"
            value={<span className="text-lg font-semibold tabular-nums">{bus.distanceToNextKm.toFixed(1)} <span className="text-sm font-normal opacity-70">km</span></span>}
          />
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Occupancy"
            value={<OccupancyBar pct={bus.occupancyPct} />}
          />
          <StatCard
            icon={<Zap className="h-4 w-4" />}
            label="Route progress"
            value={
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="text-sm font-semibold">{progressPct}%</span>
              </div>
            }
          />
        </div>

        {/* Next stop callout */}
        {nextStop && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
            <Navigation className="h-5 w-5 shrink-0" />
            <div>
              <div className="text-xs text-primary-foreground/70">Next stop</div>
              <div className="font-semibold">{nextStop.name}</div>
            </div>
            <div className="ml-auto text-right text-sm">
              <div className="font-mono font-semibold">{nextStop.eta}</div>
              {nextStop.distanceKm && <div className="text-xs opacity-70">{nextStop.distanceKm} km</div>}
            </div>
          </div>
        )}
      </div>

      {/* Map + route timeline */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="h-[480px] overflow-hidden rounded-3xl border border-border bg-card lg:h-[540px]">
          <BusMap bus={bus} />
        </div>

        <div className="flex flex-col gap-4">
          {/* Current stop */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last checked stop</div>
            <div className="text-lg font-semibold">{currentStop?.name ?? "—"}</div>
            {currentStop?.arrivedAt && <div className="text-sm text-muted-foreground">Arrived {currentStop.arrivedAt}</div>}
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Route timeline</div>
            <ol className="relative space-y-4 border-l-2 border-dashed border-border pl-5">
              {bus.stops.map((s, i) => {
                const passed  = i <= bus.currentStopIndex;
                const current = i === bus.currentStopIndex;
                return (
                  <li key={s.name} className="relative">
                    <span className={cn(
                      "absolute -left-[27px] top-1 grid h-4 w-4 place-items-center rounded-full border-2",
                      current ? "border-accent bg-accent" : passed ? "border-primary bg-primary" : "border-border bg-background"
                    )}>
                      {passed && !current && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </span>
                    <div className={cn("text-sm font-medium", !passed && "text-muted-foreground")}>{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.arrivedAt ? `Arrived ${s.arrivedAt}` : s.eta ? `ETA ${s.eta}` : ""}
                      {s.distanceKm && !s.arrivedAt ? ` · ${s.distanceKm} km` : ""}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>

      {/* Coords bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm">
        <div className="text-muted-foreground">
          Coordinates: <span className="font-mono text-foreground">{bus.lat.toFixed(6)}, {bus.lng.toFixed(6)}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(`${bus.lat},${bus.lng}`); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
          </button>
          <a
            href={`https://www.google.com/maps?q=${bus.lat},${bus.lng}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary"
          >
            <MapPin className="h-3.5 w-3.5" /> Maps
          </a>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {isLive
          ? "✓ Live data from GSRTC VTS · Updates every 30s"
          : "Simulated data — set VITE_PROXY_BASE to enable live GSRTC API"}
      </p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 backdrop-blur">{children}</span>;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
      <div className="flex items-center gap-1.5 text-xs text-primary-foreground/70">{icon}{label}</div>
      <div className="mt-2">{value}</div>
    </div>
  );
}
