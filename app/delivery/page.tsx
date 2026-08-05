import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ScrollArrow from "@/components/ScrollArrow";

const pickupSteps = [
  { n: 1, ic: "📱", title: "Nhận mã đơn hàng", desc: "Sau khi cửa hàng xác nhận chuyển khoản, mã đơn hàng riêng của bạn sẽ được kích hoạt trong tab \"Đơn hàng của tôi\"." },
  { n: 2, ic: "🕒", title: "Đến cửa hàng đúng giờ", desc: "Đến cửa hàng trong khung giờ nhận đã đặt. Bạn có thể xem địa chỉ và bản đồ trong chi tiết đơn." },
  { n: 3, ic: "✨", title: "Xuất trình mã đơn hàng", desc: "Cho nhân viên xem mã đơn hàng để xác nhận và nhận Surprise Box của bạn." },
  { n: 4, ic: "💚", title: "Đánh giá & tận hưởng", desc: "Đừng quên đánh giá cửa hàng và chia sẻ trải nghiệm để giúp cộng đồng nhé!" },
];

const rules = [
  { ic: "⏰", title: "Đến trễ giờ nhận", desc: "Đơn hàng sẽ được tự động hủy sau 15 phút quá giờ hẹn và không hoàn tiền. Vui lòng đến đúng giờ.", strong: true },
  { ic: "❌", title: "Không đến nhận hàng", desc: "Nếu bạn không đến nhận trong khung giờ, đơn sẽ tính là không hoàn thành và không được hoàn tiền.", strong: true },
  { ic: "🔄", title: "Đổi giờ nhận", desc: "Bạn có thể đổi giờ nhận miễn phí 1 lần trước khung giờ ban đầu ít nhất 1 tiếng." },
  { ic: "💔", title: "Cửa hàng hết box", desc: "Trường hợp hiếm gặp do trùng đơn — bạn sẽ được hoàn 100% tiền hoặc đổi box tương đương." },
  { ic: "⚠️", title: "Sản phẩm không đạt chất lượng", desc: "Nếu phát hiện lỗi từ phía cửa hàng, vui lòng phản ánh trong 24h kèm hình ảnh để được hỗ trợ." },
];

export default function DeliveryPage() {
  return (
    <>
      <SiteHeader />

      {/* HERO + Pickup steps fill the first screen together; rest sits below the fold */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative" }}>
        {/* HERO */}
        <section style={{ backgroundColor: "var(--cream)", paddingTop: 145, paddingBottom: 56, textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div className="container" style={{ position: "relative" }}>
            <div className="rise rise-1" style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>
              Hướng dẫn nhận hàng
            </div>
            <h1 className="rise rise-2 delivery-hero-title" style={{ fontSize: 64, marginBottom: 16, lineHeight: 1.1 }}>
              Đơn giản — chỉ <em style={{ color: "var(--primary)", fontStyle: "italic" }}>4 bước</em><br />
              để nhận Surprise Box
            </h1>
            <p className="rise rise-3" style={{ fontSize: 18, color: "var(--text-muted)", maxWidth: 560, margin: "0 auto" }}>
              Hiện tại CrumbUp hỗ trợ hình thức <strong style={{ color: "var(--text)" }}>tự đến lấy tại cửa hàng (Pick-up)</strong>.
              Giao tận nơi đang được phát triển.
            </p>
          </div>
        </section>

        {/* PICKUP STEPS — fills remaining viewport space */}
        <section style={{ padding: "72px 0", background: "var(--ivory)", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="container">
            <h2 data-reveal style={{ fontSize: 41, textAlign: "center", marginBottom: 48 }}>Quy trình tự đến lấy</h2>

            <div className="steps-grid" style={{ gap: 20, position: "relative" }}>
              {/* Connecting dashed line — hidden on mobile via .steps-connector class */}
              <svg className="steps-connector" style={{ position: "absolute", top: 50, left: "12%", right: "12%", height: 2, width: "76%", zIndex: 0 }}>
                <line x1="0" y1="1" x2="100%" y2="1" stroke="var(--border-strong)" strokeWidth="2" strokeDasharray="6 6" />
              </svg>

              {pickupSteps.map((s) => (
                <div key={s.n} className="card-hover" data-reveal data-reveal-delay={String(s.n)} style={{ position: "relative", textAlign: "center", zIndex: 1, padding: "36px 16px 28px", borderRadius: 20, border: "1px solid var(--border)", background: "white" }}>
                  <div style={{
                    position: "absolute",
                    top: -16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    background: "var(--primary)",
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 15,
                  }}>{s.n}</div>
                  <h3 style={{ fontSize: 21, marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ScrollArrow targetId="order-code" />
      </div>

      {/* ORDER CODE */}
      <section id="order-code" style={{ padding: "72px 0", background: "var(--ivory)" }}>
        <div className="container">
          <div data-reveal className="right-auto-grid" style={{
            background: "white",
            borderRadius: 28,
            padding: "48px 56px",
            gap: 48,
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md)",
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
                Mã đơn hàng riêng
              </div>
              <h2 style={{ fontSize: 41, marginBottom: 16, lineHeight: 1.2 }}>
                Một mã — một đơn hàng — một lần dùng.
              </h2>
              <p style={{ fontSize: 17, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 24 }}>
                Sau khi cửa hàng xác nhận chuyển khoản thành công, mã đơn hàng của bạn được kích hoạt
                và lưu trong tab "Đơn hàng của tôi". Xuất trình mã cho nhân viên khi đến nhận —
                nhanh chóng, không nhầm lẫn.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Kích hoạt sau khi cửa hàng xác nhận chuyển khoản",
                  "Mã dùng 1 lần, tự động hết hiệu lực sau khi nhận",
                  "Xem được offline, không cần mạng khi đến nhận",
                ].map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)", flexShrink: 0 }} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone mockup — float up, bottom half hidden */}
            <div style={{
              position: "relative",
              width: 220,
              /* show ~58% of phone height: 220*(1513/742)*0.58 ≈ 276 */
              height: 276,
              overflow: "hidden",
              flexShrink: 0,
              /* drop shadow to give floating feel */
              filter: "drop-shadow(0 24px 48px rgba(61,47,31,0.22))",
            }}>
              {/* Phone image — sits behind content */}
              <img
                src="/phone-front.png"
                alt=""
                style={{
                  position: "absolute",
                  top: 0, left: 0,
                  width: 220,
                  height: "auto",
                  pointerEvents: "none",
                  zIndex: 1,
                  userSelect: "none",
                }}
              />

              {/* Screen content overlay
                  phone image 742×1513 displayed at 220px wide → scale = 220/742 = 0.2965
                  screen left bezel ≈ 28px orig → 8px display
                  screen top (below status bar) ≈ 130px orig → 39px display
                  screen width ≈ 686px orig → 203px display */}
              <div style={{
                position: "absolute",
                top: 39,
                left: 13,
                width: 195,
                zIndex: 2,
                textAlign: "center",
                fontFamily: "var(--font-body)",
                background: "var(--ivory)",
              }}>
                {/* App bar */}
                <div style={{
                  background: "white",
                  padding: "9px 12px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  marginBottom: 14,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6,
                    background: "var(--primary)",
                    display: "grid", placeItems: "center",
                    fontSize: 10, flexShrink: 0,
                  }}>🥐</div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text)" }}>CrumbUp</span>
                </div>

                <div style={{ padding: "0 12px" }}>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Mã đơn hàng
                  </div>

                  {/* Code card */}
                  <div style={{
                    background: "white",
                    borderRadius: 12,
                    padding: "14px 10px",
                    border: "1px solid var(--border)",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
                    marginBottom: 10,
                  }}>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 8 }}>Đơn hàng của bạn</div>
                    <div style={{
                      fontFamily: "monospace",
                      fontSize: 25,
                      fontWeight: 900,
                      letterSpacing: "0.14em",
                      color: "var(--text)",
                      marginBottom: 10,
                    }}>BH24507</div>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: "#d4edda", color: "#2d6a31",
                      fontSize: 9, fontWeight: 700,
                      padding: "4px 10px", borderRadius: 999,
                    }}>✓ Đã xác nhận</div>
                  </div>

                  <div style={{ fontSize: 9, color: "var(--text-muted)" }}>
                    Nhận trước 19:30 hôm nay
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RULES */}
      <section style={{ padding: "72px 0", background: "var(--ivory)" }}>
        <div className="container">
          <div data-reveal style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
              Lưu ý quan trọng
            </div>
            <h2 style={{ fontSize: 41 }}>Quy định xử lý rủi ro</h2>
            <p style={{ fontSize: 17, color: "var(--text-muted)", maxWidth: 540, margin: "12px auto 0" }}>
              Để cả khách hàng và cửa hàng đều có trải nghiệm tốt nhất, vui lòng đọc kỹ các điều khoản dưới đây.
            </p>
          </div>

          <div className="two-col-grid" style={{ gap: 16, maxWidth: 1000, margin: "0 auto" }}>
            {rules.map((r, i) => (
              <div key={r.title} className="card-hover" data-reveal data-reveal-delay={String(Math.min(i + 1, 4))} style={{
                background: r.strong ? "var(--cream)" : "white",
                border: r.strong ? "1px solid var(--badge)" : "1px solid var(--border)",
                borderRadius: 16,
                padding: 22,
              }}>
                <h3 style={{ fontSize: 17, marginBottom: 6, fontFamily: "var(--font-body)" }}>{r.title}</h3>
                <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMING SOON DELIVERY */}
      <section style={{ padding: "56px 0 96px", background: "var(--ivory)" }}>
        <div className="container">
          <div data-reveal className="right-auto-grid" style={{
            background: "linear-gradient(120deg, var(--badge) 0%, #f7d27a 100%)",
            borderRadius: 24,
            padding: "48px 56px",
            gap: 32,
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
                Sắp ra mắt
              </div>
              <h2 style={{ fontSize: 37, marginBottom: 12 }}>
                Giao tận nơi — sắp có!
              </h2>
              <p style={{ fontSize: 17, color: "var(--text)", lineHeight: 1.6, maxWidth: 560 }}>
                Chúng tôi đang phát triển mạng lưới shipper riêng để bạn có thể nhận Surprise Box mà không cần ra khỏi nhà.
                Đăng ký nhận thông báo khi tính năng ra mắt nhé!
              </p>
            </div>
            <button className="btn btn-dark" style={{ whiteSpace: "nowrap" }}>Đăng ký nhận tin →</button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
