import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Calendar, Clock, MapPin, Sparkles, Ticket, Users } from "lucide-react";
import { mockTrips, popularRoutes } from "@/lib/mock-data";

export const Route = createFileRoute("/book/")({
  head: () => ({
    meta: [
      { title: "Book GSRTC bus tickets — RouteLive" },
      { name: "description", content: "Search GSRTC routes, compare timings and book through official or partner channels. Clean, fast, ad-free." },
    ],
  }),
  component: BookIndex,
});

function BookIndex() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [searched, setSearched] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl bg-gradient-hero p-6 text-primary-foreground sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-accent" /> GSRTC · RedBus · AbhiBus — one search
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Book your next ride</h1>
        <p className="mt-2 text-primary-foreground/75">No login walls. No surprise fees. Compare and book in seconds.</p>

        <form
          onSubmit={(e) => { e.preventDefault(); setSearched(true); }}
          className="mt-6 grid gap-2 rounded-2xl bg-surface p-2 text-foreground shadow-elegant md:grid-cols-[1fr_1fr_180px_auto]"
        >
          <Field icon={<MapPin className="h-4 w-4 text-muted-foreground" />} placeholder="From — e.g. Ahmedabad" value={from} onChange={setFrom} />
          <Field icon={<MapPin className="h-4 w-4 text-muted-foreground" />} placeholder="To — e.g. Rajkot" value={to} onChange={setTo} />
          <Field icon={<Calendar className="h-4 w-4 text-muted-foreground" />} type="date" value={date} onChange={setDate} />
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
            Search <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      {searched ? (
        <div className="mt-8">
          <h2 className="text-xl font-semibold tracking-tight">{mockTrips.length} buses found</h2>
          <p className="text-sm text-muted-foreground">{from || "Ahmedabad"} → {to || "Rajkot"} · {new Date(date).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}</p>

          <div className="mt-4 space-y-3">
            {mockTrips.map((t) => (
              <div key={t.id} className="grid items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-elegant md:grid-cols-[1fr_auto_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-secondary-foreground">{t.type}</span>
                    <span className="text-xs text-muted-foreground">{t.serviceCode}</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-3">
                    <div className="text-2xl font-semibold tabular-nums tracking-tight">{t.departTime}</div>
                    <div className="text-xs text-muted-foreground">{t.origin}</div>
                    <div className="text-muted-foreground">→</div>
                    <div className="text-2xl font-semibold tabular-nums tracking-tight">{t.arriveTime}</div>
                    <div className="text-xs text-muted-foreground">{t.destination}</div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{Math.floor(t.durationMin/60)}h {t.durationMin%60}m</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{t.seatsLeft} seats left</span>
                    <span>Via {t.via.join(", ")}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold tracking-tight">₹{t.fare}</div>
                  <div className="text-[11px] text-muted-foreground">incl. taxes</div>
                </div>
                <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                  <Ticket className="h-4 w-4" /> Select seats
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Popular routes</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popularRoutes.map((r) => (
              <button
                key={r.id}
                onClick={() => { setFrom(r.from); setTo(r.to); setSearched(true); }}
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

function Field({ icon, placeholder, value, onChange, type = "text" }: { icon: React.ReactNode; placeholder?: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl px-3 hover:bg-secondary/50">
      {icon}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent py-3 text-sm focus:outline-none"
      />
    </div>
  );
}
