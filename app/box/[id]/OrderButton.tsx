"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

const BANK = { name: "MB Bank", number: "0987654321", owner: "CONG TY CO PHAN CRUMBUP" };

type BoxInfo   = { id: string; name: string; priceSale: number; pickupStart: string; pickupEnd: string; quantityLeft: number };
type StoreInfo = { name: string; phone: string | null; address: string; email: string | null };

function QtyButton({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 34, height: 34, borderRadius: 8,
      border: `1px solid ${disabled ? "var(--border)" : "var(--primary)"}`,
      background: disabled ? "var(--cream)" : "white",
      color: disabled ? "var(--text-muted)" : "var(--primary)",
      fontSize: 21, fontWeight: 900, cursor: disabled ? "not-allowed" : "pointer",
      display: "grid", placeItems: "center", flexShrink: 0,
    }}>{children}</button>
  );
}

export default function OrderButton({ box, store, isLoggedIn, isExpired }: { box: BoxInfo; store: StoreInfo; isLoggedIn: boolean; isExpired?: boolean }) {
  const router = useRouter();
  const [mounted, setMounted]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [step, setStep]         = useState<"confirm" | "payment">("confirm");
  const [loading, setLoading]   = useState(false);
  const [agreed, setAgreed]     = useState(false);
  const [error, setError]       = useState("");
  const [quantity, setQuantity] = useState(1);
  const [payRef, setPayRef]     = useState("");

  useEffect(() => setMounted(true), []);

  function openModal() {
    setStep("confirm"); setAgreed(false); setError(""); setQuantity(1); setPayRef("");
    setOpen(true);
  }

  function goToPayment() {
    // Generate a temporary transfer reference; order is NOT created yet
    setPayRef(Math.random().toString(36).slice(2, 10).toUpperCase());
    setStep("payment");
  }

  function tryClose() {
    if (step === "payment") {
      if (!window.confirm("Bạn chắc chắn muốn hủy đặt hàng?\n\nNếu đã chuyển khoản, vui lòng liên hệ cửa hàng để được hoàn tiền.")) return;
    }
    setOpen(false);
  }

  const total = box.priceSale * quantity;

  // Called only when user clicks "Đã chuyển khoản" — THIS is when the order is created.
  // Order lands in PENDING ("chờ cửa hàng xác nhận"); send the user straight to
  // "Đơn hàng của tôi" so they can track it instead of showing an in-modal summary.
  async function confirmPayment() {
    setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxId: box.id, quantity }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Lỗi tạo đơn. Vui lòng thử lại."); setLoading(false); return; }
      setOpen(false);
      router.push("/orders");
    } catch { setError("Lỗi kết nối. Vui lòng thử lại."); }
    setLoading(false);
  }

  const shortId = payRef;

  if (isExpired) {
    return (
      <div style={{
        marginTop: 16, padding: 16, borderRadius: 12, textAlign: "center",
        background: "#f3f4f6", color: "#9ca3af", fontSize: 16, fontWeight: 700,
      }}>
        Đã hết giờ nhận hàng
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Link href={`/login?redirect=/box/${box.id}`} style={{
        display: "block", width: "100%", marginTop: 16, padding: 16, fontSize: 17,
        fontWeight: 700, borderRadius: 12, background: "var(--primary)", color: "white",
        textAlign: "center", textDecoration: "none",
      }}>
        Đăng nhập để đặt hàng
      </Link>
    );
  }

  return (
    <>
      <button onClick={openModal} className="btn btn-primary btn-lg"
        style={{ width: "100%", marginTop: 16, padding: 16, fontSize: 17 }}>
        Đặt ngay
      </button>

      {mounted && open && createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={tryClose}
        >
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "white", borderRadius: 24, width: "100%", maxWidth: 480,
            maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          }}>
            {/* Header */}
            <div style={{ padding: "22px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {step === "confirm" ? "Xác nhận đơn" : "Thông tin thanh toán"}
              </div>
              <button onClick={tryClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--border)", background: "white", cursor: "pointer", display: "grid", placeItems: "center", fontSize: 15 }}>✕</button>
            </div>

            <div style={{ padding: "16px 24px 28px" }}>

              {/* ── STEP 1: CONFIRM ── */}
              {step === "confirm" && (
                <>
                  <h2 style={{ fontSize: 23, fontWeight: 900, marginBottom: 4 }}>{box.name}</h2>
                  <p style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 16 }}>{store.name}</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    {[
                      { ic: "🕒", lbl: "Giờ nhận hàng", val: `${box.pickupStart} – ${box.pickupEnd}` },
                      { ic: "📍", lbl: "Địa điểm",      val: store.address },
                      { ic: "💳", lbl: "Thanh toán",     val: "Chuyển khoản ngân hàng" },
                    ].map((r) => (
                      <div key={r.lbl} style={{ display: "flex", gap: 10, padding: "10px 14px", background: "var(--cream)", borderRadius: 10, alignItems: "flex-start" }}>
                        <span style={{ flexShrink: 0 }}>{r.ic}</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0, minWidth: 90 }}>{r.lbl}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, flex: 1, textAlign: "right" }}>{r.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Quantity selector */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--cream)", borderRadius: 10, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>Số lượng</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Còn {box.quantityLeft} box</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <QtyButton onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>−</QtyButton>
                      <span style={{ fontSize: 23, fontWeight: 900, minWidth: 24, textAlign: "center" }}>{quantity}</span>
                      <QtyButton onClick={() => setQuantity(q => Math.min(box.quantityLeft, q + 1))} disabled={quantity >= box.quantityLeft}>+</QtyButton>
                    </div>
                  </div>

                  {/* Total */}
                  <div style={{ padding: "14px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
                    {quantity > 1 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatPrice(box.priceSale)} × {quantity}</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatPrice(total)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 16, fontWeight: 700 }}>Tổng thanh toán</span>
                      <span style={{ fontSize: 30, fontWeight: 900, color: "var(--primary)" }}>{formatPrice(total)}</span>
                    </div>
                  </div>

                  <button onClick={goToPayment} style={{
                    width: "100%", padding: 14, borderRadius: 12,
                    background: "var(--text)", color: "white",
                    border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer",
                  }}>
                    Tiến hành thanh toán →
                  </button>
                </>
              )}

              {/* ── STEP 2: PAYMENT ── */}
              {step === "payment" && (
                <>
                  <h2 style={{ fontSize: 21, fontWeight: 900, marginBottom: 4 }}>Chuyển khoản ngân hàng</h2>
                  <p style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 18 }}>
                    Chuyển khoản đúng nội dung, sau đó bấm xác nhận để hoàn tất đặt hàng
                  </p>

                  {/* VietQR */}
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                    <img
                      src={`https://img.vietqr.io/image/MB-${BANK.number}-compact2.png?amount=${total}&addInfo=CRUMBUP%20${shortId}&accountName=${encodeURIComponent(BANK.owner)}`}
                      alt="QR chuyển khoản"
                      style={{ width: 220, height: 220, borderRadius: 14, border: "1px solid var(--border)" }}
                    />
                  </div>

                  {/* Bank info */}
                  <div style={{ background: "var(--cream)", borderRadius: 14, padding: 18, marginBottom: 16 }}>
                    {[
                      { lbl: "Ngân hàng",     val: BANK.name,             mono: false, highlight: false },
                      { lbl: "Số tài khoản",  val: BANK.number,           mono: true,  highlight: false },
                      { lbl: "Chủ tài khoản", val: BANK.owner,            mono: false, highlight: false },
                      ...(quantity > 1 ? [{ lbl: "Đơn giá × SL", val: `${formatPrice(box.priceSale)} × ${quantity}`, mono: false, highlight: false }] : []),
                      { lbl: "Số tiền",       val: formatPrice(total),    mono: false, highlight: true  },
                      { lbl: "Nội dung CK",   val: `CRUMBUP ${shortId}`,  mono: true,  highlight: false },
                    ].map((r) => (
                      <div key={r.lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "7px 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{r.lbl}</span>
                        <span style={{ fontSize: 15, fontWeight: 800, fontFamily: r.mono ? "monospace" : "inherit", color: r.highlight ? "var(--primary)" : "var(--text)", textAlign: "right" }}>{r.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Agreement */}
                  <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", marginBottom: 18, padding: "12px 14px", background: "var(--cream)", borderRadius: 12 }}>
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: "var(--primary)", marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>
                      Tôi xác nhận đã chuyển khoản đúng số tiền và nội dung, và cam kết đến nhận hàng trong khung giờ <strong>{box.pickupStart} – {box.pickupEnd}</strong>.
                    </span>
                  </label>

                  {error && <div style={{ padding: "10px 14px", background: "#fef2f2", borderRadius: 10, fontSize: 15, color: "#b91c1c", marginBottom: 14 }}>{error}</div>}

                  <button onClick={confirmPayment} disabled={!agreed || loading} style={{
                    width: "100%", padding: 14, borderRadius: 12,
                    background: agreed && !loading ? "var(--accent)" : "var(--cream)",
                    color: agreed && !loading ? "white" : "var(--text-muted)",
                    border: "none", fontSize: 16, fontWeight: 700,
                    cursor: agreed && !loading ? "pointer" : "not-allowed", transition: "all 0.2s",
                  }}>
                    {loading ? "Đang xử lý..." : "Tôi đã chuyển khoản ✓"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
