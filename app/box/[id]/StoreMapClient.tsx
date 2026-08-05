"use client";

import dynamic from "next/dynamic";

const StoreMap = dynamic(() => import("./StoreMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", background: "linear-gradient(135deg,#dcecd9,#c5dcbf)", display: "grid", placeItems: "center", fontSize: 32 }}>🗺️</div>
  ),
});

export default function StoreMapClient({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  return <StoreMap lat={lat} lng={lng} name={name} />;
}
