"use client";

import { useEffect, useRef, useState } from "react";

type NominatimResult = { display_name: string; lat: string; lon: string };

interface Props {
  value: string;
  onChange: (v: string) => void;
  onCoords: (lat: number, lng: number) => void;
}

export default function AddressPicker({ value, onChange, onCoords }: Props) {
  const [results, setResults]   = useState<NominatimResult[]>([]);
  const [open, setOpen]         = useState(false);
  const [searching, setSearching] = useState(false);
  const [coords, setCoords]     = useState<{ lat: number; lng: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  function handleInput(v: string) {
    onChange(v);
    clearTimeout(timer.current);
    setCoords(null);
    if (v.length < 4) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(v)}&format=json&limit=5&countrycodes=vn`,
          { headers: { "Accept-Language": "vi", "User-Agent": "CrumbUp/1.0" } }
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch { /* network error — ignore */ }
      setSearching(false);
    }, 1000);
  }

  function pick(r: NominatimResult) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    onChange(r.display_name);
    setCoords({ lat, lng });
    onCoords(lat, lng);
    setResults([]);
    setOpen(false);
  }

  return (
    <div>
      <div style={{ position: "relative" }}>
        <input
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Nhập và chọn địa chỉ từ gợi ý..."
          style={inp}
          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--primary)"; if (results.length) setOpen(true); }}
          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = coords ? "var(--accent)" : "var(--border)"; setTimeout(() => setOpen(false), 150); }}
        />
        {searching && (
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--text-muted)" }}>
            Đang tìm...
          </div>
        )}
        {coords && !searching && (
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--accent)" }}>
            ✓
          </div>
        )}

        {/* Dropdown */}
        {open && results.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
            background: "white", border: "1.5px solid var(--border)", borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden",
          }}>
            {results.map((r, i) => (
              <button key={i} type="button" onMouseDown={() => pick(r)}
                style={{
                  width: "100%", padding: "10px 16px", border: "none",
                  borderBottom: i < results.length - 1 ? "1px solid var(--border)" : "none",
                  background: "white", textAlign: "left", cursor: "pointer", fontSize: 15,
                  lineHeight: 1.4,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--cream)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mini map preview */}
      {coords && (
        <MiniMap
          lat={coords.lat}
          lng={coords.lng}
          onDragEnd={(lat, lng) => {
            setCoords({ lat, lng });
            onCoords(lat, lng);
          }}
        />
      )}

      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
        Nhập địa chỉ rồi chọn từ gợi ý để xác định vị trí trên bản đồ.
      </p>
    </div>
  );
}

function MiniMap({ lat, lng, onDragEnd }: { lat: number; lng: number; onDragEnd: (lat: number, lng: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const markerRef    = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("leaflet").then((Lm) => {
      const L = Lm.default ?? Lm;
      if (!containerRef.current || mapRef.current) return;

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(containerRef.current, {
        center: [lat, lng], zoom: 16,
        zoomControl: true, scrollWheelZoom: false, attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:20px;height:20px;border-radius:50%;background:var(--primary);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:grab"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const { lat: newLat, lng: newLng } = marker.getLatLng();
        onDragEnd(newLat, newLng);
      });

      mapRef.current   = map;
      markerRef.current = marker;
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move marker + recenter when coords change from outside
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], 16, { animate: true });
  }, [lat, lng]);

  return (
    <div style={{ marginTop: 10, borderRadius: 14, overflow: "hidden", border: "1.5px solid var(--border)", height: 180 }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      <div style={{ padding: "6px 12px", background: "var(--ivory)", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text-muted)" }}>
        Kéo ghim để điều chỉnh vị trí chính xác
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: "13px 16px", borderRadius: 12,
  border: "1.5px solid var(--border)", fontSize: 16,
  outline: "none", background: "white", transition: "border-color 0.2s",
  boxSizing: "border-box",
};
