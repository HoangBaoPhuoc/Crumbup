import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PartnerCTAButton from "@/components/PartnerCTAButton";
import ScrollArrow from "@/components/ScrollArrow";

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section
        className="hero-section"
        style={{
          backgroundColor: "var(--cream)",
          backgroundImage: "url('/low-opacity-cumpled-paper.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          overflow: "hidden",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          className="container hero-grid"
          style={{
            gap: 64,
            paddingTop: 73 + 64,
            paddingBottom: 64,
            alignItems: "center",
            width: "100%",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              className="rise rise-1"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                background: "white",
                borderRadius: 999,
                border: "1px solid var(--border)",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--primary)",
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: "var(--accent)",
                }}
              />
              Đang giải cứu 412 box hôm nay
            </div>
            <h1
              className="rise rise-2 hero-title"
              style={{
                fontSize: 64,
                lineHeight: 1.05,
                marginBottom: 24,
                fontWeight: 700,
              }}
            >
              Cứu{" "}
              <em
                style={{
                  color: "var(--primary)",
                  fontStyle: "italic",
                  fontWeight: 800,
                }}
              >
                bánh ngon
              </em>
              <br />
              cuối ngày, săn
              <br />
              deal hời mỗi tối.
            </h1>
            <p
              className="rise rise-3"
              style={{
                fontSize: 17,
                lineHeight: 1.6,
                color: "var(--text-muted)",
                marginBottom: 32,
                maxWidth: 520,
              }}
            >
              Bánh, đồ uống & đồ ăn cuối ngày từ các tiệm bánh, quán cà phê yêu
              thích của bạn — giá siêu hời, giảm lãng phí thực phẩm.
            </p>

            {/* CTA buttons */}
            <div
              className="rise rise-3"
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              <Link href="/discover" className="btn btn-primary btn-lg">
                Khám phá Box ngay →
              </Link>
              <Link href="/about" className="btn btn-ghost btn-lg">
                Tìm hiểu thêm
              </Link>
            </div>

            {/* Marquee tags */}
            <div
              className="rise rise-4 tag-strip"
              style={{ marginTop: 16, width: "100%", overflow: "hidden" }}
            >
              <div className="marquee-wrap">
                <div className="marquee-track">
                  {[
                    { text: "Giảm tới 70%", accent: "primary" },
                    { text: "Thanh toán an toàn", accent: "accent" },
                    { text: "Đa dạng hàng quán", accent: null },
                    { text: "125k+ Box đã cứu", accent: "primary" },
                    { text: "2.850 Đối tác", accent: null },
                    { text: "Hôm nay +312 kg cứu khỏi rác", accent: "accent" },
                    { text: "Giảm tới 70%", accent: "primary" },
                    { text: "Thanh toán an toàn", accent: "accent" },
                    { text: "Đa dạng hàng quán", accent: null },
                    { text: "125k+ Box đã cứu", accent: "primary" },
                    { text: "2.850 Đối tác", accent: null },
                    { text: "Hôm nay +312 kg cứu khỏi rác", accent: "accent" },
                  ].map((tag, i) => (
                    <span
                      key={i}
                      className="tag"
                      style={{ marginRight: 12, flexShrink: 0 }}
                    >
                      <strong
                        style={{
                          color:
                            tag.accent === "primary"
                              ? "var(--primary)"
                              : tag.accent === "accent"
                                ? "var(--accent)"
                                : "inherit",
                        }}
                      >
                        {tag.text}
                      </strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hero image */}
          <div
            className="rise-right rise-img hero-img-col"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src="/box-cake.png"
              alt="Surprise Box"
              style={{
                width: "110%",
                maxWidth: 720,
                height: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 24px 48px rgba(232,119,34,0.22))",
                marginLeft: "-10%",
              }}
            />
          </div>
        </div>

        <ScrollArrow />
      </section>

      {/* ABOUT FOOD WASTE */}
      <section id="how" style={{ padding: "96px 0", background: "var(--ivory)" }}>
        <div className="container">

          {/* Header row */}
          <div
            data-reveal
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 48,
              alignItems: "center",
              marginBottom: 56,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--primary)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Food waste fact
              </div>
              <h2 style={{ fontSize: 44, marginBottom: 20 }}>
                Về lãng phí<br />thực phẩm
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-muted)" }}>
                Một chiếc bánh chưa kịp bán hết khi cửa hàng đóng cửa không chỉ là một món ăn bị bỏ phí — đằng sau là công sức người thợ, nguyên liệu, điện nước mỗi ngày.
              </p>
            </div>

            {/* Pull quote card */}
            <div
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
                borderRadius: 24,
                padding: "36px 40px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -16,
                  right: -16,
                  fontSize: 96,
                  opacity: 0.12,
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                🥐
              </div>
              <div style={{ fontSize: 32, marginBottom: 16, lineHeight: 1 }}>💬</div>
              <p
                style={{
                  fontStyle: "italic",
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: "white",
                  fontWeight: 500,
                  position: "relative",
                }}
              >
                "Chúng tôi không giải cứu đồ hỏng. Chúng tôi kết nối lại những giá trị còn tốt."
              </p>
              <div
                style={{
                  marginTop: 16,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.6)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                — CrumbUp
              </div>
            </div>
          </div>

          {/* FAQ cards — 2×2 grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
            }}
          >
            {[
              {
                emoji: "🌾",
                label: "Định nghĩa",
                q: "Lãng phí thực phẩm là gì?",
                p: "Là sự suy giảm chất lượng hay số lượng thực phẩm ở khâu bán lẻ và tiêu dùng — những chiếc bánh vẫn ngon nhưng chưa gặp đúng người vào đúng lúc.",
                bg: "var(--cream)",
                border: "var(--border)",
                labelColor: "var(--primary)",
                labelBg: "var(--primary-soft)",
              },
              {
                emoji: "🧁",
                label: "Surplus food",
                q: "Thực phẩm dư thừa là gì?",
                p: "Là những sản phẩm vẫn còn tốt nhưng chưa kịp bán hết trước giờ đóng cửa — đóng gói thành Surprise Box, gửi đến bạn với giá tốt nhất trong ngày.",
                bg: "var(--accent-soft)",
                border: "#e8d4b8",
                labelColor: "#784d2e",
                labelBg: "#f0ddc4",
              },
              {
                emoji: "🌍",
                label: "Số liệu toàn cầu",
                q: "Lãng phí thực phẩm có đáng lo?",
                p: "Theo UNEP 2024, thế giới lãng phí hơn 1,05 tỷ tấn thực phẩm mỗi năm — 19% tổng lượng sẵn có. Một chiếc bánh cuối ngày là hành động nhỏ, nhân lên hàng ngàn lần mỗi ngày thì tác động rất thực.",
                bg: "#eef6ef",
                border: "#c8e0ca",
                labelColor: "#2d6a31",
                labelBg: "#d4edda",
              },
              {
                emoji: "♻️",
                label: "Sứ mệnh",
                q: "Từ Food Waste → Food Rescue",
                p: "Cửa hàng đóng gói sản phẩm cuối ngày thành box ưu đãi, khách hàng có lựa chọn ngon hơn và rẻ hơn. Mỗi chiếc bánh được tiếp tục hành trình của mình.",
                bg: "linear-gradient(135deg, #fdf5e6 0%, #fde6d4 100%)",
                border: "#e8cdb0",
                labelColor: "var(--primary)",
                labelBg: "var(--badge)",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="card-hover"
                data-reveal
                data-reveal-delay={String(i + 1)}
                style={{
                  background: item.bg,
                  borderRadius: 24,
                  border: `1px solid ${item.border}`,
                  padding: "36px 36px 32px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Sticker emoji (decorative background) */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -8,
                    right: 16,
                    fontSize: 72,
                    opacity: 0.13,
                    lineHeight: 1,
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                >
                  {item.emoji}
                </div>

                {/* Label badge + foreground emoji */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{item.emoji}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: item.labelColor,
                      background: item.labelBg,
                      padding: "4px 10px",
                      borderRadius: 999,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.label}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 14,
                    color: "var(--text)",
                    lineHeight: 1.3,
                  }}
                >
                  {item.q}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.8,
                    color: "var(--text-muted)",
                    position: "relative",
                  }}
                >
                  {item.p}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITY IMPACT */}
      <section
        style={{
          padding: "96px 0",
          background: "var(--cream)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="container">
          <div data-reveal style={{ textAlign: "center", marginBottom: 56 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--accent)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Cùng nhau làm điều tốt
            </div>
            <h2 style={{ fontSize: 44, marginBottom: 12 }}>
              Tác động cộng đồng
            </h2>
            <p
              style={{
                fontSize: 16,
                color: "var(--text-muted)",
                maxWidth: 520,
                margin: "0 auto",
              }}
            >
              Cùng CrumbUp và cộng đồng giải cứu thực phẩm mỗi ngày — từng
              box nhỏ, tác động lớn.
            </p>
          </div>

          <div className="impact-grid" style={{ gap: 24 }}>
            {[
              { num: "125.430", label: "Box đã được cứu",          sub: "Cập nhật hôm nay",               color: "var(--accent)" },
              { num: "312,6 tấn", label: "Thực phẩm giảm lãng phí", sub: "Tương đương 850 hộ gia đình",   color: "var(--primary)" },
              { num: "2.850+", label: "Cửa hàng đồng hành",         sub: "Trên 18 tỉnh thành",             color: "var(--text)" },
            ].map((s, i) => (
              <div
                key={i}
                className="card-hover"
                data-reveal
                data-reveal-delay={String(i + 1)}
                style={{
                  background: "white",
                  padding: "36px 32px",
                  borderRadius: 24,
                  textAlign: "center",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 800,
                    fontFamily: "var(--font-display)",
                    color: s.color,
                    marginBottom: 8,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {s.num}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNER CTA */}
      <section style={{ padding: "80px 0", background: "white" }}>
        <div className="container">
          <div
            data-reveal
            className="partner-cta-grid"
            style={{
              background:
                "linear-gradient(120deg, var(--badge) 0%, #f7d27a 100%)",
              borderRadius: 28,
              padding: "48px 56px",
              gap: 32,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "relative" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Dành cho đối tác
              </div>
              <h2 style={{ fontSize: 36, marginBottom: 12, lineHeight: 1.15 }}>
                Bạn là chủ tiệm bánh
                <br />
                hoặc quán cà phê?
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--text)",
                  maxWidth: 560,
                  lineHeight: 1.6,
                }}
              >
                Tham gia CrumbUp để tăng doanh thu và cùng chúng tôi giảm
                lãng phí thực phẩm mỗi ngày — không phí khởi tạo, không ràng
                buộc.
              </p>
            </div>
            <PartnerCTAButton />
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
