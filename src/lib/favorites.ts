const KEY = "gsrtc.favorites.v1";
const RECENT_KEY = "gsrtc.recent.v1";

export type Favorite = { id: string; label: string; kind: "vehicle" | "pnr"; addedAt: string };

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(k) || "") as T; } catch { return fallback; }
}
function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}

export const getFavorites = (): Favorite[] => read<Favorite[]>(KEY, []);
export const toggleFavorite = (f: Omit<Favorite, "addedAt">): Favorite[] => {
  const list = getFavorites();
  const exists = list.find((x) => x.id === f.id);
  const next = exists ? list.filter((x) => x.id !== f.id) : [...list, { ...f, addedAt: new Date().toISOString() }];
  write(KEY, next);
  return next;
};
export const isFavorite = (id: string) => getFavorites().some((f) => f.id === id);

export const getRecent = (): Favorite[] => read<Favorite[]>(RECENT_KEY, []);
export const pushRecent = (f: Omit<Favorite, "addedAt">) => {
  const list = getRecent().filter((x) => x.id !== f.id);
  const next = [{ ...f, addedAt: new Date().toISOString() }, ...list].slice(0, 8);
  write(RECENT_KEY, next);
  return next;
};
