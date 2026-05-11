import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Bus, Clock, MapPin, Share2, Shield, Sparkles, Zap } from "lucide-react";
import { popularRoutes } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RouteLive — Track & book GSRTC buses in real time" },
      { name: "description", content: "Live tracking with next-stop ETA and distance, shareable bus links, and clean booking across GSRTC and partners. Made for Gujarat commuters." },
      { property: "og:title", content: "RouteLive — Live GSRTC bus tracking & booking" },
      { property: "og:description", content: "Real-time location, ETA to next stop, distance, occupancy and one-tap sharing." },
    ],
  }),
  component: Home,
});

function Home() {
  const [q, setQ] = useState("");
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, oklch(0.78 0.17 75 / .35), transparent 50%), radial-gradient(circle at 80% 70%, oklch(0.55 0.18 258 / .4), transparent 50%)" }} />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Live tracking · Next-stop ETA · Share with one tap
          </div>
          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            GSRTC, finally <span className="text-accent">tracked right.</span>
          </h1>
          <p className="mt-5 max-w-xl text-balance text-base text-primary-foreground/75 sm:text-lg">
            Real-time bus location with distance to the next stop, refresh-safe links you can share, and clean booking — all in one place.
          </p>

          {/* Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) window.location.href = `/track/${encodeURIComponent(q.trim().replace(/[^A-Za-z0-9]/g, "").toUpperCase())}`;
            }}
            className="mt-8 flex max-w-xl flex-col gap-2 rounded-2xl bg-surface/95 p-2 shadow-elegant backdrop-blur sm:flex-row sm:items-center"
          >
            <div className="flex flex-1 items-center gap-2 px-3">
              <Bus className="h-5 w-5 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="GJ18ZT1838  ·  or  ·  PNR123456"
                className="w-full bg-transparent py-3 text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
              />
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]">
              Track live <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-primary-foreground/70">
            Try:
            {["GJ18ZT1838", "GJ18Z8844", "PNR749203"].map((s) => (
              <Link key={s} to="/track/$id" params={{ id: s }} className="rounded-full border border-white/20 bg-white/5 px-2.5 py-1 hover:bg-white/10">
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: MapPin, title: "Distance to next stop", body: "See exactly how far the next halt is — kilometers and live ETA, not just a dot on a map." },
            { icon: Share2, title: "Shareable, refresh-safe links", body: "Every bus has its own URL. Paste once, share with family — works on refresh." },
            { icon: Zap, title: "All operators, one app", body: "Track GSRTC fleet and book through GSRTC, RedBus, AbhiBus partners — clean, fast, ad-free." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-elegant">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular routes */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Popular GSRTC routes</h2>
            <p className="mt-1 text-sm text-muted-foreground">Most travelled across Gujarat right now.</p>
          </div>
          <Link to="/book" className="text-sm font-medium text-primary hover:underline">Browse all →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popularRoutes.map((r) => (
            <Link
              key={r.id}
              to="/book"
              className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-elegant"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                <span>{r.trips} trips</span>
                <span className="text-primary">From ₹{r.fareFrom}</span>
              </div>
              <div className="mt-2 text-lg font-semibold tracking-tight">{r.from} → {r.to}</div>
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{r.distanceKm} km</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{Math.floor(r.durationMin / 60)}h {r.durationMin % 60}m</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-border bg-surface-elevated">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground"><Shield className="h-5 w-5" /></div>
            <div>
              <div className="font-semibold">No login. No tracking. No ads.</div>
              <div className="text-sm text-muted-foreground">Built by commuters, for commuters.</div>
            </div>
          </div>
          <Link to="/track" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Start tracking <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
