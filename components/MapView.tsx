"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useLocation } from "@/lib/location-context";

export type StorePin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  boxCount: number;
};

const RADIUS_OPTIONS = [1, 3, 5, 10];

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div style={{
      height: "100%",
      minHeight: 220,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      background: "linear-gradient(135deg, #dcecd9 0%, #c5dcbf 100%)",
    }}>
      <div style={{ fontSize: 37, animation: "pulse 1.5s ease-in-out infinite" }}>🗺️</div>
      <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>Đang tải bản đồ...</div>
    </div>
  ),
});

export default function MapView({ stores, height = 220 }: { stores: StorePin[]; height?: number }) {
  const { coords } = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [focusStoreId, setFocusStoreId] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const filteredStores = useMemo(() => {
    if (!radiusKm || !coords) return stores;
    return stores.filter((s) => distanceKm(coords, s) <= radiusKm);
  }, [stores, radiusKm, coords]);

  function closeModal() {
    setExpanded(false);
    setFocusStoreId(null);
    setRadiusKm(null);
  }

  // Close on Escape key
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  return (
    <>
      {/* ── Small preview map ── */}
      <div style={{ position: "relative" }}>
        <MapInner stores={stores} height={height} interactive={true} />

        {/* Expand button — top-right, above Leaflet layers */}
        <button
          onClick={() => setExpanded(true)}
          title="Phóng to bản đồ"
          style={{
            position: "absolute", top: 10, right: 10, zIndex: 1000,
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(0,0,0,0.1)",
            cursor: "pointer",
            display: "grid", placeItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "white")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.95)")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>

        {/* Locate button — bottom-right, snaps map back to current position */}
        <LocateButton />
      </div>

      {/* ── Expanded modal (portal to body) ── */}
      {mounted && expanded && createPortal(
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(20,20,20,0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
            animation: "fadeIn 0.18s ease",
          }}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "95vw", maxWidth: 1400,
              height: "82vh",
              borderRadius: 20, overflow: "hidden",
              display: "flex",
              background: "white",
              boxShadow: "0 32px 80px rgba(0,0,0,0.45)",
            }}
          >
            {/* Left list — stores with an active box today, scrollable */}
            <div style={{
              width: 300, flexShrink: 0, display: "flex", flexDirection: "column",
              borderRight: "1px solid var(--border)",
            }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>
                  {filteredStores.length} cửa hàng có box hôm nay
                </div>

                {/* Radius filter */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[{ label: "Tất cả", value: null as number | null }, ...RADIUS_OPTIONS.map((r) => ({ label: `${r}km`, value: r }))].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setRadiusKm(opt.value)}
                      disabled={opt.value !== null && !coords}
                      title={opt.value !== null && !coords ? "Bật vị trí để lọc theo khoảng cách" : undefined}
                      style={{
                        padding: "5px 11px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                        border: "1px solid " + (radiusKm === opt.value ? "var(--primary-dark)" : "var(--border)"),
                        background: radiusKm === opt.value ? "var(--primary-dark)" : "white",
                        color: radiusKm === opt.value ? "white" : (opt.value !== null && !coords ? "var(--text-muted)" : "var(--text)"),
                        cursor: opt.value !== null && !coords ? "not-allowed" : "pointer",
                        opacity: opt.value !== null && !coords ? 0.5 : 1,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {!coords && (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, marginBottom: 0 }}>
                    Bật vị trí để lọc theo khoảng cách
                  </p>
                )}
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {filteredStores.length === 0 ? (
                  <div style={{ padding: "24px 18px", fontSize: 15, color: "var(--text-muted)", textAlign: "center" }}>
                    {stores.length === 0 ? "Chưa có cửa hàng nào có box hôm nay" : "Không có cửa hàng nào trong bán kính này"}
                  </div>
                ) : (
                  filteredStores.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setFocusStoreId(s.id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%", padding: "12px 18px", gap: 10,
                        background: focusStoreId === s.id ? "var(--primary-soft)" : "transparent",
                        border: "none", borderBottom: "1px solid var(--border)",
                        cursor: "pointer", textAlign: "left", fontSize: 15,
                        color: "var(--text)", fontWeight: 600,
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.name}
                      </span>
                      <span style={{
                        flexShrink: 0, background: "var(--primary)", color: "white",
                        borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 800,
                      }}>
                        {s.boxCount}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Map */}
            <div style={{ flex: 1, position: "relative" }}>
              <MapInner stores={filteredStores} height="100%" interactive={true} focusStoreId={focusStoreId} radiusKm={radiusKm} />

              {/* Locate button — bottom-right, snaps map back to current position */}
              <LocateButton bottom={14} right={14} />

              {/* Close button */}
              <button
                onClick={closeModal}
                style={{
                  position: "absolute", top: 14, right: 14, zIndex: 1000,
                  width: 38, height: 38, borderRadius: "50%",
                  background: "white", border: "none", cursor: "pointer",
                  display: "grid", placeItems: "center",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.22)",
                  fontSize: 21, color: "var(--text)",
                }}
                title="Đóng (Esc)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function LocateButton({ bottom = 10, right = 10 }: { bottom?: number; right?: number }) {
  const { loading, requestLocation } = useLocation();

  return (
    <button
      onClick={requestLocation}
      disabled={loading}
      title="Về vị trí của tôi"
      style={{
        position: "absolute", bottom, right, zIndex: 1000,
        width: 32, height: 32, borderRadius: 8,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid rgba(0,0,0,0.1)",
        cursor: loading ? "not-allowed" : "pointer",
        display: "grid", placeItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        transition: "background 0.15s",
        color: "var(--primary-dark)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "white")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.95)")}
    >
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        style={loading ? { animation: "spin 0.8s linear infinite" } : undefined}
      >
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    </button>
  );
}
