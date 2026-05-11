import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, MapPin, Navigation, Share2, Star, Users, Zap } from "lucide-react";
import { BusMap } from "@/components/bus-map";
import { getMockBus } from "@/lib/mock-data";
import { isFavorite, pushRecent, toggleFavorite } from "@/lib/favorites";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/track/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Live tracking · RouteLive` },
      { name: "description", content: `Live location, next-stop ETA, distance and speed for ${params.id}. Share this link — it works on refresh.` },
      { property: "og:title", content: `Tracking ${params.id} live` },
      { property: "og:description", content: "Real-time GSRTC bus location with next-stop ETA and distance." },
    ],
  }),
  component: TrackDetail,
});

function TrackDetail() {
  const { id } = useParams({ from: "/track/$id" });
  const bus = useMemo(() => getMockBus(id), [id]);
  const [fav, setFav] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setFav(isFavorite(id));
    pushRecent({ id, label: bus.route, kind: id.startsWith("PNR") ? "pnr" : "vehicle" });
  }, [id, bus.route]);

  const nextStop = bus.stops[bus.currentStopIndex + 1];
  const currentStop = bus.stops[bus.currentStopIndex];

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Tracking ${bus.vehicleNumber} live: ${bus.route}`;
    if (navigator.share) {
      try { await navigator.share({ title: text, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/track" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { toggleFavorite({ id, label: bus.route, kind: id.startsWith("PNR") ? "pnr" : "vehicle" }); setFav(isFavorite(id)); }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition",
              fav ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-foreground hover:bg-secondary"
            )}
          >
            <Star className={cn("h-4 w-4", fav && "fill-current")} />
            {fav ? "Saved" : "Save"}
          </button>
          <button onClick={share} className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-sm font-medium text-background">
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </div>

      {/* Header card */}
      <div className="rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-elegant sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary-foreground/70">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-success" /></span>
              Live · Updated {new Date(bus.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{bus.vehicleNumber}</h1>
            <p className="mt-1 text-primary-foreground/75">{bus.route}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Chip>{bus.service}</Chip>
            <Chip>{bus.depot}</Chip>
            <Chip>Direction: {bus.direction}</Chip>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<Zap className="h-4 w-4" />} label="Speed" value={`${bus.speedKmh} km/h`} />
          <Stat icon={<Navigation className="h-4 w-4" />} label="Status" value={bus.status} />
          <Stat icon={<Users className="h-4 w-4" />} label="Occupancy" value={bus.occupancy} />
          <Stat icon={<MapPin className="h-4 w-4" />} label="Next stop in" value={nextStop ? `${nextStop.distanceKm} km` : "—"} />
        </div>
      </div>

      {/* Map + stops */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="h-[480px] overflow-hidden rounded-3xl border border-border bg-card lg:h-[560px]">
          <BusMap bus={bus} />
        </div>

        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next stop</div>
          <div className="text-xl font-semibold tracking-tight">{nextStop?.name ?? "Destination reached"}</div>
          {nextStop && (
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span>{nextStop.distanceKm} km away</span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
              <span>ETA {nextStop.eta}</span>
            </div>
          )}

          <div className="mt-5 border-t border-border pt-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Route timeline</div>
            <ol className="relative space-y-4 border-l-2 border-dashed border-border pl-5">
              {bus.stops.map((s, i) => {
                const passed = i <= bus.currentStopIndex;
                const current = i === bus.currentStopIndex;
                return (
                  <li key={s.name} className="relative">
                    <span
                      className={cn(
                        "absolute -left-[27px] top-1 grid h-4 w-4 place-items-center rounded-full border-2",
                        current ? "border-accent bg-accent" : passed ? "border-primary bg-primary" : "border-border bg-background"
                      )}
                    >
                      {passed && !current && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </span>
                    <div className={cn("text-sm font-medium", current ? "text-foreground" : passed ? "text-muted-foreground" : "text-foreground")}>{s.name}</div>
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

      {/* Coords + copy */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm">
        <div className="text-muted-foreground">
          Coordinates: <span className="font-mono text-foreground">{bus.lat.toFixed(6)}, {bus.lng.toFixed(6)}</span>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(`${bus.lat},${bus.lng}`); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          Copy
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Showing sample data — share the API endpoint/DOM and we'll wire it live.
      </p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 backdrop-blur">{children}</span>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
      <div className="flex items-center gap-1.5 text-xs text-primary-foreground/70">{icon}{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}
