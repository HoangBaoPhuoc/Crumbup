"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STAR_LABELS = ["Tệ", "Không hài lòng", "Bình thường", "Hài lòng", "Tuyệt vời"];

export default function ReviewForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [rating, setRating]   = useState(0);
  const [hover, setHover]     = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function submit() {
    if (rating < 1) { setError("Vui lòng chọn số sao đánh giá"); return; }
    setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Có lỗi xảy ra, vui lòng thử lại."); setLoading(false); return; }
      router.push("/orders");
      router.refresh();
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
      setLoading(false);
    }
  }

  const shown = hover || rating;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} sao`}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 34, lineHeight: 1, padding: 2,
                color: n <= shown ? "var(--primary)" : "var(--border)",
                transition: "color 0.15s",
              }}
            >★</button>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginTop: 6, minHeight: 18 }}>
          {shown > 0 ? STAR_LABELS[shown - 1] : "Chọn số sao"}
        </div>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Chia sẻ cảm nhận của bạn về box này (không bắt buộc)..."
        maxLength={1000}
        rows={4}
        style={{
          width: "100%", marginTop: 16, padding: 14, borderRadius: 12,
          border: "1px solid var(--border)", fontSize: 13, fontFamily: "inherit",
          resize: "vertical", boxSizing: "border-box", color: "var(--text)",
        }}
      />

      {error && (
        <div style={{ padding: "10px 14px", background: "#fef2f2", borderRadius: 10, fontSize: 13, color: "#b91c1c", marginTop: 14 }}>
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading}
        style={{
          width: "100%", marginTop: 16, padding: 14, borderRadius: 12,
          background: loading ? "var(--cream)" : "var(--primary)",
          color: loading ? "var(--text-muted)" : "white",
          border: "none", fontSize: 14, fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Đang gửi..." : "Gửi đánh giá"}
      </button>
    </div>
  );
}
