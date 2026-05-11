import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Bus, Clock, Star } from "lucide-react";
import { getFavorites, getRecent, type Favorite } from "@/lib/favorites";

export const Route = createFileRoute("/favorites/")({
  head: () => ({
    meta: [
      { title: "Saved buses — RouteLive" },
      { name: "description", content: "Quick access to your saved buses and recently tracked vehicles." },
    ],
  }),
  component: Favorites,
});

function Favorites() {
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [recent, setRecent] = useState<Favorite[]>([]);

  useEffect(() => {
    setFavs(getFavorites());
    setRecent(getRecent());
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Saved</h1>
      <p className="mt-2 text-muted-foreground">Your starred buses live here for one-tap tracking.</p>

      <Group title="Favorites" icon={<Star className="h-4 w-4 text-accent" />} items={favs} empty="Star a bus on its tracking page to save it." />
      <Group title="Recently tracked" icon={<Clock className="h-4 w-4 text-muted-foreground" />} items={recent} empty="Track any bus to see it appear here." />
    </div>
  );
}

function Group({ title, icon, items, empty }: { title: string; icon: React.ReactNode; items: Favorite[]; empty: string }) {
  return (
    <div className="mt-10">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">{icon}{title}</div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">{empty}</div>
      ) : (
        <div className="space-y-2">
          {items.map((f) => (
            <Link
              key={f.id}
              to="/track/$id"
              params={{ id: f.id }}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                  <Bus className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">{f.label}</div>
                  <div className="text-xs text-muted-foreground">{f.id}</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
