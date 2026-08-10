import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PartnerCTAButton from "@/components/PartnerCTAButton";
import ScrollArrow from "@/components/ScrollArrow";
import CountUpNumber from "@/components/CountUpNumber";

const facts = [
  { n: "01", q: "Lãng phí thực phẩm là gì?", p: "Những sản phẩm vẫn tốt nhưng chưa gặp đúng người vào đúng lúc." },
  { n: "02", q: "Thực phẩm dư thừa là gì?", p: "Sản phẩm còn tốt, chưa kịp bán hết, được đóng gói thành Surprise Box giá tốt." },
  { n: "03", q: "Lãng phí có đáng lo?", p: "UNEP 2024: hơn 1,05 tỷ tấn thực phẩm lãng phí mỗi năm (19% tổng lượng sẵn có).", featured: true },
  { n: "04", q: "Food Waste → Food Rescue", p: "Cửa hàng đóng gói cuối ngày thành box ưu đãi, khách có lựa chọn ngon hơn, rẻ hơn." },
];

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
                  background: "var(--primary)",
                }}
              />
              Có thể giải cứu tới 400+ box mỗi ngày
            </div>
            <h1
              className="rise rise-2 hero-title"
              style={{
                fontSize: 74,
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
                món ngon
              </em>
              <br />
              cuối ngày, săn
              <br />
              deal hời mỗi tối.
            </h1>
            <p
              className="rise rise-3"
              style={{
                fontSize: 20,
                lineHeight: 1.6,
                color: "var(--text-muted)",
                marginBottom: 32,
                maxWidth: 520,
              }}
            >
              Thực phẩm và đồ uống cuối ngày từ các cửa hàng yêu thích, từ
              tiệm bánh, siêu thị đến cửa hàng trái cây, đặc sản đóng gói,
              giá siêu hời, giảm lãng phí thực phẩm.
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

            <p
              className="rise rise-3"
              style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 24 }}
            >
              Không thích bất ngờ?{" "}
              <Link href="/discover?type=PROMOTION" style={{ color: "var(--primary)", fontWeight: 700 }}>
                Xem ưu đãi rõ ràng từ Chương trình khuyến mãi →
              </Link>
            </p>

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
                    { text: "Cứu tới 125k+ Box", accent: "primary" },
                    { text: "Tới 2.850+ Đối tác", accent: null },
                    { text: "Giảm tới 312kg rác/ngày", accent: "accent" },
                    { text: "Giảm tới 70%", accent: "primary" },
                    { text: "Thanh toán an toàn", accent: "accent" },
                    { text: "Đa dạng hàng quán", accent: null },
                    { text: "Cứu tới 125k+ Box", accent: "primary" },
                    { text: "Tới 2.850+ Đối tác", accent: null },
                    { text: "Giảm tới 312kg rác/ngày", accent: "accent" },
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
                                ? "var(--primary)"
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
                width: "230%",
                maxWidth: 1080,
                height: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 24px 48px rgba(134,21,25,0.22))",
                marginLeft: "-15%",
              }}
            />
          </div>
        </div>

        <ScrollArrow />
      </section>

      {/* ABOUT FOOD WASTE */}
      <section id="how" style={{ padding: "96px 0", background: "var(--ivory)" }}>
  <div className="container">
    <div style={{
      fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
      letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8,
    }}>Food waste fact</div>

    <div data-reveal style={{
      display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 56, alignItems: "end",
      marginBottom: 56, paddingBottom: 40, borderBottom: "1px solid var(--border)",
    }}>
      <div>
        <h2 style={{ fontSize: 41, marginBottom: 16, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
          Về lãng phí thực phẩm - vì sao mỗi phần thực phẩm cuối ngày đều đáng cứu
        </h2>
        <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.8, maxWidth: 480 }}>
          Thực phẩm chưa kịp bán hết khi cửa hàng đóng cửa không đơn thuần là đồ bỏ đi,
          đằng sau đó là công sức, nguyên liệu và chi phí vận hành mỗi ngày.
        </p>
      </div>
      <div>
        <div style={{ fontSize: 74, fontWeight: 800, color: "var(--primary)", letterSpacing: "-0.03em", lineHeight: 1 }}>
          <CountUpNumber end={1.05} decimals={2} suffix=" tỷ" />
        </div>
        <div style={{ fontSize: 15, color: "var(--text)", fontWeight: 600, marginTop: 8 }}>tấn thực phẩm lãng phí toàn cầu mỗi năm</div>
        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>Nguồn: UNEP Food Waste Index 2024</div>
      </div>
    </div>

    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 48 }}>
      <div style={{ width: 32, height: 2, background: "var(--primary)", marginTop: 10, flexShrink: 0 }} />
      <p style={{ fontStyle: "italic", fontSize: 18, lineHeight: 1.7, color: "var(--text)", maxWidth: 640, margin: 0 }}>
        "Chúng tôi không giải cứu đồ hỏng. Chúng tôi kết nối lại những giá trị còn tốt."{" "}
        <span style={{ fontStyle: "normal", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          - CrumbUp
        </span>
      </p>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      {facts.map((f) => (
        <div
          key={f.n}
          className="card-hover fact-card"
          data-reveal
          style={{
            background: f.featured ? "var(--primary)" : "var(--cream)",
            borderRadius: 14,
            padding: "24px 22px",
            transition: "transform .2s ease, box-shadow .2s ease",
          }}
        >
          <div style={{
            fontSize: 12, fontWeight: 800, fontVariantNumeric: "tabular-nums", marginBottom: 14,
            color: f.featured ? "rgba(255,255,255,0.7)" : "var(--text-muted)",
          }}>{f.n}</div>
          <h3 style={{ fontSize: 17, marginBottom: 8, fontWeight: 700, color: f.featured ? "white" : "var(--text)" }}>{f.q}</h3>
          <p style={{ fontSize: 12, lineHeight: 1.65, margin: 0, color: f.featured ? "rgba(255,255,255,0.85)" : "var(--text-muted)" }}>{f.p}</p>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* COMMUNITY IMPACT */}
      <section
        style={{
          padding: "96px 0",
          background: "var(--ivory)",
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
                color: "var(--primary)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Cùng nhau làm điều tốt
            </div>
            <h2 style={{ fontSize: 51, marginBottom: 12 }}>
              Tác động cộng đồng
            </h2>
            <p
              style={{
                fontSize: 18,
                color: "var(--text-muted)",
                maxWidth: 520,
                margin: "0 auto",
              }}
            >
              Mỗi box được giải cứu qua CrumbUp góp phần tạo tác động lớn
              cho cộng đồng và môi trường.
            </p>
          </div>

          <div className="impact-grid" style={{ gap: 24 }}>
            {[
              { end: 125430, decimals: 0, suffix: "",     label: "Box có thể được cứu",        sub: "Tiềm năng mỗi năm",                     color: "var(--accent)" },
              { end: 312.6,  decimals: 1, suffix: " tấn",  label: "Thực phẩm có thể giảm lãng phí", sub: "Ước tính tương đương 850 hộ gia đình", color: "var(--primary)" },
              { end: 2850,   decimals: 0, suffix: "+",    label: "Cửa hàng có thể đồng hành",  sub: "Mục tiêu 18 tỉnh thành",                color: "var(--text)" },
            ].map((s, i) => (
              <div
                key={i}
                className="card-hover"
                data-reveal
                data-reveal-delay={String(i + 1)}
                style={{
                  background: i === 0 ? "var(--accent-soft)" : i === 1 ? "var(--primary)" : "white",
                  padding: "36px 32px",
                  borderRadius: 24,
                  textAlign: "center",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    fontSize: 46,
                    fontWeight: 800,
                    fontFamily: "var(--font-display)",
                    color: i === 1 ? "white" : i === 0 ? "var(--text)" : s.color,
                    marginBottom: 8,
                    letterSpacing: "-0.03em",
                  }}
                >
                  <CountUpNumber end={s.end} decimals={s.decimals} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 600, color: i === 1 ? "white" : "var(--text)", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: i === 1 ? "rgba(255,255,255,0.75)" : "var(--text-muted)" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNER CTA */}
      <section style={{ padding: "80px 0", background: "var(--ivory)" }}>
        <div className="container">
          <div
            data-reveal
            className="partner-cta-grid"
            style={{
              background: "#faf0c8",
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
              <h2 style={{ fontSize: 41, marginBottom: 12, lineHeight: 1.15 }}>
                Bạn đang kinh doanh
                <br />
                thực phẩm hoặc đồ uống?
              </h2>
              <p
                style={{
                  fontSize: 17,
                  color: "var(--text)",
                  maxWidth: 560,
                  lineHeight: 1.6,
                }}
              >
                Giải cứu hàng dư cuối ngày với Surprise Box, hoặc chủ động
                kéo khách bất kỳ giờ nào với Chương trình khuyến mãi, không
                phí khởi tạo, không ràng buộc.
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
