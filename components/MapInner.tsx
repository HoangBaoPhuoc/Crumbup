"use client";

import { useEffect, useRef, useState } from "react";
import { useLocation } from "@/lib/location-context";
import type { StorePin } from "./MapView";

const HCM: [number, number] = [10.7769, 106.7009];

export default function MapInner({ stores, height, interactive = true, focusStoreId, radiusKm }: { stores: StorePin[]; height?: number | string; interactive?: boolean; focusStoreId?: string | null; radiusKm?: number | null }) {
  const { coords } = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storeMarkersRef = useRef<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const radiusCircleRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Init map once on mount, destroy on unmount
  useEffect(() => {
    if (!containerRef.current) return;

    let map: any; // eslint-disable-line @typescript-eslint/no-explicit-any

    import("leaflet").then((Lm) => {
      const L = Lm.default ?? Lm;
      if (!containerRef.current || mapRef.current) return;

      // Inject Leaflet CSS once
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const center = coords ? [coords.lat, coords.lng] as [number, number] : HCM;

      map = L.map(containerRef.current, {
        center,
        zoom: 13,
        zoomControl: false,
        scrollWheelZoom: interactive,
        dragging: interactive,
        doubleClickZoom: interactive,
        keyboard: interactive,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      // User marker
      if (coords) {
        const userIcon = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;border-radius:50%;background:#e87722;border:3px solid white;box-shadow:0 0 0 4px rgba(232,119,34,0.25),0 2px 8px rgba(0,0,0,0.3)"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        userMarkerRef.current = L.marker([coords.lat, coords.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup("📍 Vị trí của bạn");
      }

      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter on the user's current position — runs whenever coords updates (every
  // click on the location button, not just the first grant) and also once the map
  // finishes its async init, in case coords arrived before that completed.
  useEffect(() => {
    if (!mapReady || !mapRef.current || !coords) return;
    mapRef.current.setView([coords.lat, coords.lng], 14, { animate: true });

    import("leaflet").then((Lm) => {
      const L = Lm.default ?? Lm;
      if (!mapRef.current) return;
      if (userMarkerRef.current) mapRef.current.removeLayer(userMarkerRef.current);
      const userIcon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#e87722;border:3px solid white;box-shadow:0 0 0 4px rgba(232,119,34,0.25),0 2px 8px rgba(0,0,0,0.3)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      userMarkerRef.current = L.marker([coords.lat, coords.lng], { icon: userIcon })
        .addTo(mapRef.current)
        .bindPopup("📍 Vị trí của bạn");
    });
  }, [coords, mapReady]);

  // Rebuild store markers whenever the (possibly filtered) store list changes
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    import("leaflet").then((Lm) => {
      const L = Lm.default ?? Lm;
      if (!mapRef.current) return;

      Object.values(storeMarkersRef.current).forEach((marker) => mapRef.current.removeLayer(marker));
      storeMarkersRef.current = {};

      stores.forEach((s) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#e87722;color:white;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 2px 8px rgba(232,119,34,0.45);border:2px solid white;font-family:sans-serif">🥐 ${s.boxCount}</div>`,
          iconSize: [52, 26],
          iconAnchor: [26, 26],
        });
        storeMarkersRef.current[s.id] = L.marker([s.lat, s.lng], { icon })
          .addTo(mapRef.current)
          .bindPopup(`<strong>${s.name}</strong><br/>${s.boxCount} box còn hôm nay`);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores, mapReady]);

  // Radius filter — draw a translucent circle around the user and zoom the map
  // to fit it exactly, so the selected distance is always fully visible.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    import("leaflet").then((Lm) => {
      const L = Lm.default ?? Lm;
      if (!mapRef.current) return;

      if (radiusCircleRef.current) {
        mapRef.current.removeLayer(radiusCircleRef.current);
        radiusCircleRef.current = null;
      }

      if (radiusKm && coords) {
        radiusCircleRef.current = L.circle([coords.lat, coords.lng], {
          radius: radiusKm * 1000,
          color: "#e87722",
          weight: 1.5,
          fillColor: "#e87722",
          fillOpacity: 0.08,
        }).addTo(mapRef.current);
        mapRef.current.fitBounds(radiusCircleRef.current.getBounds(), { padding: [24, 24] });
      }
    });
  }, [radiusKm, coords, mapReady]);

  // Fly to a store selected from the list panel and pop its marker open
  useEffect(() => {
    if (!mapReady || !mapRef.current || !focusStoreId) return;
    const marker = storeMarkersRef.current[focusStoreId];
    if (!marker) return;
    mapRef.current.flyTo(marker.getLatLng(), 16, { animate: true });
    marker.openPopup();
  }, [focusStoreId, mapReady]);

  return <div ref={containerRef} style={{ height: height ?? "100%", width: "100%" }} />;
}
