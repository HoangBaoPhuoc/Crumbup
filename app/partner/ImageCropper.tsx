"use client";

import { useEffect, useRef, useState } from "react";

type Offset = { x: number; y: number };
type Rect = { left: number; top: number; width: number; height: number };

// Crop rect is inset within the stage so the untouched, dimmed edges of the
// image stay visible — that's what signals "this part won't be included".
const INSET = 0.82;

export default function ImageCropper({
  source, aspect, onCancel, onCropped,
}: {
  /** A freshly-picked file, or the URL of an already-uploaded image to re-crop. */
  source: File | string; aspect: number; onCancel: () => void; onCropped: (blob: Blob) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef   = useRef<HTMLImageElement>(null);
  const dragRef  = useRef<{ startX: number; startY: number; from: Offset } | null>(null);

  const isExisting = typeof source === "string";

  const [imgUrl, setImgUrl]         = useState("");
  const [stageSize, setStageSize]   = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom]             = useState(1);
  const [offset, setOffset]         = useState<Offset>({ x: 0, y: 0 });
  const [cropError, setCropError]   = useState("");

  useEffect(() => {
    if (typeof source === "string") { setImgUrl(source); return; }
    const url = URL.createObjectURL(source);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [source]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setStageSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cropRect: Rect = {
    left:   stageSize.width * (1 - INSET) / 2,
    top:    stageSize.height * (1 - INSET) / 2,
    width:  stageSize.width * INSET,
    height: stageSize.height * INSET,
  };

  const baseScale = naturalSize && cropRect.width > 0
    ? Math.max(cropRect.width / naturalSize.width, cropRect.height / naturalSize.height)
    : 1;
  const scale = baseScale * zoom;
  const dispW = naturalSize ? naturalSize.width * scale : 0;
  const dispH = naturalSize ? naturalSize.height * scale : 0;

  function clamp(o: Offset): Offset {
    const minX = cropRect.left + cropRect.width - dispW;
    const maxX = cropRect.left;
    const minY = cropRect.top + cropRect.height - dispH;
    const maxY = cropRect.top;
    return { x: Math.min(maxX, Math.max(minX, o.x)), y: Math.min(maxY, Math.max(minY, o.y)) };
  }

  // Re-clamp whenever zoom, stage size, or the loaded image changes.
  useEffect(() => {
    setOffset((o) => clamp(o));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, stageSize.width, stageSize.height, naturalSize?.width, naturalSize?.height]);

  function handleImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const el = e.currentTarget;
    setNaturalSize({ width: el.naturalWidth, height: el.naturalHeight });
    setZoom(1);
    setOffset({ x: cropRect.left, y: cropRect.top });
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, from: offset };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(clamp({ x: dragRef.current.from.x + dx, y: dragRef.current.from.y + dy }));
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  function confirm() {
    if (!naturalSize || !imgRef.current) return;
    setCropError("");
    const outW = 1000;
    const outH = Math.round(outW / aspect);
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, outW, outH);
    const sx = (cropRect.left - offset.x) / scale;
    const sy = (cropRect.top - offset.y) / scale;
    const sw = cropRect.width / scale;
    const sh = cropRect.height / scale;
    try {
      ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, outW, outH);
      canvas.toBlob((blob) => {
        if (blob) onCropped(blob);
        else setCropError("Không thể xử lý ảnh này, vui lòng thử lại.");
      }, "image/jpeg", 0.9);
    } catch {
      setCropError("Không thể cắt ảnh này. Vui lòng chọn ảnh khác.");
    }
  }

  return (
    <div>
      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          width: "100%", aspectRatio: aspect, position: "relative", overflow: "hidden",
          borderRadius: 12, background: "var(--cream)", cursor: "grab", touchAction: "none",
          border: "1px solid var(--border)",
        }}
      >
        {imgUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={imgUrl}
            crossOrigin={isExisting ? "anonymous" : undefined}
            onLoad={handleImgLoad}
            draggable={false}
            alt=""
            style={{
              position: "absolute", left: offset.x, top: offset.y,
              width: dispW || undefined, height: dispH || undefined,
              maxWidth: "none", userSelect: "none", pointerEvents: "none",
            }}
          />
        )}

        {/* Dims everything outside the crop rect via a huge spread box-shadow —
            stage's overflow:hidden clips it back down to the visible area. */}
        <div style={{
          position: "absolute", left: cropRect.left, top: cropRect.top,
          width: cropRect.width, height: cropRect.height,
          boxShadow: "0 0 0 9999px rgba(20, 15, 10, 0.6)",
          border: "1.5px solid rgba(255,255,255,0.9)",
          pointerEvents: "none",
        }}>
          {[1, 2].map((i) => (
            <div key={`v${i}`} style={{ position: "absolute", left: `${(i / 3) * 100}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.55)" }} />
          ))}
          {[1, 2].map((i) => (
            <div key={`h${i}`} style={{ position: "absolute", top: `${(i / 3) * 100}%`, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.55)" }} />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Phóng to</span>
        <input type="range" min={1} max={3} step={0.01} value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))} style={{ flex: 1 }} />
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
        Kéo ảnh để di chuyển, dùng thanh trượt để phóng to. Vùng tối sẽ không hiển thị trong ảnh.
      </div>

      {cropError && (
        <div style={{ marginTop: 8, padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#b91c1c" }}>
          {cropError}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button type="button" onClick={onCancel}
          style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid var(--border)", background: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--text-muted)" }}>
          Hủy
        </button>
        <button type="button" onClick={confirm}
          style={{ flex: 2, padding: "9px", borderRadius: 10, background: "var(--primary)", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Xong
        </button>
      </div>
    </div>
  );
}
