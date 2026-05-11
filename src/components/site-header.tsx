import { Link, useLocation } from "@tanstack/react-router";
import { Bus, Search, Star, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { pathname } = useLocation();
  const nav = [
    { to: "/", label: "Home", icon: Bus },
    { to: "/track", label: "Track", icon: Search },
    { to: "/book", label: "Book", icon: Ticket },
    { to: "/favorites", label: "Saved", icon: Star },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-elegant">
            <Bus className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">RouteLive</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">GSRTC Tracker</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <Link
          to="/track"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <Search className="h-4 w-4" />
          Track bus
        </Link>
      </div>

      <nav className="flex items-center justify-around border-t border-border/60 bg-background/60 py-1.5 md:hidden">
        {nav.map((n) => {
          const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
