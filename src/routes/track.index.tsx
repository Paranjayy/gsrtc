import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Bus, Clock, Star, Trash2 } from "lucide-react";
import { getFavorites, getRecent } from "@/lib/favorites";

export const Route = createFileRoute("/track/")({
  head: () => ({
    meta: [
      { title: "Track a GSRTC bus — RouteLive" },
      { name: "description", content: "Enter a bus number or PNR to see real-time location, next stop, ETA and distance." },
    ],
  }),
  component: TrackIndex,
});

function TrackIndex() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const favorites = getFavorites();
  const recent = getRecent();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Track a bus</h1>
      <p className="mt-2 text-muted-foreground">Enter the vehicle number or your PNR. We'll keep the link refresh-safe and shareable.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const id = q.trim().replace(/[^A-Za-z0-9]/g, "").toUpperCase();
          if (id) nav({ to: "/track/$id", params: { id } });
        }}
        className="mt-6 flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 sm:flex-row"
      >
        <div className="flex flex-1 items-center gap-2 px-3">
          <Bus className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="GJ18ZT1838  or  PNR123456"
            className="w-full bg-transparent py-3 placeholder:text-muted-foreground/70 focus:outline-none"
          />
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
          Track <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {favorites.length > 0 && (
        <Section title="Saved" icon={<Star className="h-4 w-4 text-accent" />}>
          {favorites.map((f) => (
            <RowLink key={f.id} id={f.id} label={f.label} />
          ))}
        </Section>
      )}

      {recent.length > 0 && (
        <Section title="Recent" icon={<Clock className="h-4 w-4 text-muted-foreground" />}>
          {recent.map((f) => (
            <RowLink key={f.id} id={f.id} label={f.label} />
          ))}
        </Section>
      )}

      {favorites.length === 0 && recent.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No saved or recent buses yet. Track one and tap the star to save it for quick access.
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function RowLink({ id, label }: { id: string; label: string }) {
  return (
    <Link
      to="/track/$id"
      params={{ id }}
      className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
          <Bus className="h-4 w-4" />
        </div>
        <div>
          <div className="font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{id}</div>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
