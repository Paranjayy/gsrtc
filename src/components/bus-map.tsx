import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { BusInfo } from "@/lib/mock-data";

// Custom bus marker icon (inline SVG)
const busIcon = L.divIcon({
  className: "",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  html: `
    <div style="position:relative;width:44px;height:44px;display:grid;place-items:center;">
      <div style="position:absolute;inset:0;border-radius:9999px;background:oklch(0.78 0.17 75 / .35);animation:pulse-ring 1.8s cubic-bezier(.215,.61,.355,1) infinite;"></div>
      <div style="position:relative;width:32px;height:32px;border-radius:9999px;background:linear-gradient(135deg,oklch(0.36 0.15 258),oklch(0.55 0.18 258));display:grid;place-items:center;box-shadow:0 6px 16px -4px rgba(0,0,0,.35);border:2px solid white;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8a1.7 1.7 0 0 0 .2-.7v-5a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v9a1 1 0 0 0 1 1h1"/><circle cx="7" cy="18" r="2"/><circle cx="15" cy="18" r="2"/></svg>
      </div>
    </div>`,
});

const stopIcon = L.divIcon({
  className: "",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  html: `<div style="width:12px;height:12px;border-radius:9999px;background:white;border:3px solid oklch(0.55 0.18 258);box-shadow:0 1px 4px rgba(0,0,0,.2);"></div>`,
});

interface Props {
  bus: BusInfo;
  height?: string;
}

export function BusMap({ bus, height = "100%" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const map = L.map(ref.current, {
      center: [bus.lat, bus.lng],
      zoom: 9,
      zoomControl: true,
      attributionControl: false,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Route polyline through stops
    const coords = bus.stops.map((s) => [s.lat, s.lng] as [number, number]);
    L.polyline(coords, { color: "oklch(0.55 0.18 258)", weight: 4, opacity: 0.7, dashArray: "1 8", lineCap: "round" }).addTo(map);

    // Stops
    bus.stops.forEach((s, i) => {
      L.marker([s.lat, s.lng], { icon: stopIcon })
        .bindTooltip(`${i + 1}. ${s.name}`, { direction: "top", offset: [0, -6] })
        .addTo(map);
    });

    // Bus marker
    L.marker([bus.lat, bus.lng], { icon: busIcon, zIndexOffset: 1000 })
      .bindPopup(
        `<div style="font-family:inherit;min-width:180px;">
          <div style="font-weight:600;margin-bottom:4px;">🚌 ${bus.vehicleNumber}</div>
          <div style="font-size:12px;color:#666;">${bus.speedKmh} km/h • ${bus.direction}</div>
          <div style="font-size:12px;color:#666;">${bus.service} • ${bus.depot}</div>
        </div>`
      )
      .addTo(map);

    map.fitBounds(L.latLngBounds(coords).pad(0.2));

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} style={{ height, width: "100%" }} className="rounded-2xl overflow-hidden" />;
}
