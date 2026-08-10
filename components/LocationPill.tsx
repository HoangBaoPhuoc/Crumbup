"use client";

import { useLocation } from "@/lib/location-context";

export default function LocationPill({ bar = false }: { bar?: boolean } = {}) {
  const { coords, address, loading, requestLocation } = useLocation();

  return (
    <button
      className={`addr-pill${bar ? " location-pill-bar" : ""}`}
      data-reveal={bar || undefined}
      data-reveal-delay={bar ? "2" : undefined}
      onClick={requestLocation}
      title={coords ? "Cập nhật vị trí" : "Bật vị trí để tìm cửa hàng gần bạn"}
      style={{
        cursor: "pointer", border: "none", transition: bar ? undefined : "background 0.2s",
        ...(bar && {
          width: "100%", justifyContent: "center",
          background: "white", color: "var(--primary-dark)", fontWeight: 700,
          border: "1.5px solid var(--primary-dark)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }),
      }}
    >
      {loading ? (
        <>
          <span>Đang xác định...</span>
        </>
      ) : coords ? (
        address && address.length > 22 ? (
          <span className="addr-marquee">
            <span className="addr-marquee-track">
              <span className="addr-marquee-item">{address}</span>
              <span className="addr-marquee-item" aria-hidden="true">{address}</span>
            </span>
          </span>
        ) : (
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {address ?? "Vị trí của bạn"}
          </span>
        )
      ) : (
        <span>Bật vị trí</span>
      )}
    </button>
  );
}
