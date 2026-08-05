import SiteHeader from "@/components/SiteHeader";
import CountUpNumber from "@/components/CountUpNumber";
import SiteFooter from "@/components/SiteFooter";
import ScrollArrow from "@/components/ScrollArrow";

const coreValues = [
  {
    title: "We Win Together",
    subtitle: "Hệ sinh thái cùng thắng",
    desc: "Tối ưu lợi ích tổng thể thay vì lợi nhuận cá nhân — giúp chủ cửa hàng thu hồi vốn, khách tiết kiệm, môi trường giảm rác.",
  },
  {
    title: "We Keep It Simple",
    subtitle: "Tối giản vận hành",
    desc: "Công nghệ tinh gọn, mô hình tự đến nhận (Self-pickup) triệt tiêu hoàn toàn chi phí logistics và rủi ro bom hàng.",
  },
  {
    title: "We Raise The Bar",
    subtitle: "Không ngừng nâng chuẩn",
    desc: "Mỗi Surprise Box trao đi phải đảm bảo tuyệt đối an toàn vệ sinh và trọn vẹn vị ngon — không thỏa hiệp.",
  },
  {
    title: "We Care",
    subtitle: "Lan tỏa sự tử tế",
    desc: "Thấu hiểu từng khoản tổn thất của chủ cửa hàng và áp lực chi tiêu của người trẻ. Tiêu dùng có trách nhiệm bắt đầu từ sự thấu cảm.",
  },
  {
    title: "We Build a Legacy",
    subtitle: "Kiến tạo tương lai xanh",
    desc: "CrumbUp đồng hành cùng lộ trình đưa Đà Nẵng trở thành đô thị sinh thái không rác thải thực phẩm.",
  },
];

const journey = [
  {
    tag: "Khởi đầu · 2026",
    color: "var(--primary)",
    title: "CrumbUp thành lập tại Đà Nẵng",
    desc: "Ra đời với một sứ mệnh duy nhất: chống lãng phí thực phẩm.",
  },
  {
    tag: "Nghịch lý",
    color: "var(--accent)",
    title: "Ba vấn đề, một thời điểm",
    desc: "Thực phẩm tươi bị hủy cuối ngày, người trẻ thắt chặt chi tiêu, cửa hàng mất biên lợi nhuận vận hành.",
  },
  {
    tag: "Giải pháp",
    color: "#2d6a31",
    title: "Một nền tảng tác động xã hội",
    desc: "Kết nối lợi ích kinh tế với giá trị nhân văn và bảo vệ môi trường — không chỉ là một ứng dụng thương mại.",
  },
  {
    tag: "Mục tiêu tới",
    color: "var(--primary-dark)",
    title: "Đà Nẵng — đô thị không rác thải thực phẩm",
    desc: "Mục tiêu giải cứu 1.000+ phần thực phẩm dôi dư mỗi năm, đồng hành cùng lộ trình đô thị sinh thái.",
  },
];

const esgPillars = [
  {
    initial: "E",
    stat: "15.000+",
    end: 15000, decimals: 0, suffix: "+",
    title: "Môi trường",
    desc: "Phần thực phẩm dôi dư được giải cứu mỗi năm, cắt giảm rác thải hữu cơ và khí nhà kính.",
    bg: "#dcefdf",
    badge: "#2d6a31",
    statColor: "#2d6a31",
    textColor: "#3d5c40",
  },
  {
    initial: "S",
    stat: "50–70%",
    title: "Xã hội",
    desc: "Chi phí thực phẩm người trẻ tiết kiệm được, hỗ trợ cửa hàng đối tác thu hồi biên lợi nhuận.",
    bg: "#f7e6c4",
    badge: "var(--primary)",
    statColor: "#8a5327",
    textColor: "#6b4a2c",
  },
  {
    initial: "G",
    stat: "100%",
    end: 100, decimals: 0, suffix: "%",
    title: "Quản trị",
    desc: "Thanh toán trước, số hóa dữ liệu thời gian thực, quy chuẩn kiểm định nghiêm ngặt.",
    bg: "#faf0c8",
    badge: "#a9830a",
    statColor: "#8a6a08",
    textColor: "#6b5507",
  },
];

const faqs = [
  {
    q: "Surprise Box là gì, có biết trước món không?",
    a: "Là hộp 'bí ẩn' gồm sản phẩm cuối ngày do cửa hàng tự chọn. Bạn không biết chính xác nhưng giá trị luôn cao hơn số tiền trả 2–3 lần.",
  },
  {
    q: "Hình thức tự đến lấy hoạt động như nào?",
    a: "Sau khi cửa hàng xác nhận chuyển khoản, bạn nhận mã đơn hàng riêng. Đến trong khung giờ đã đặt, xuất trình mã cho nhân viên — xong!",
  },
  {
    q: "Tôi có thể hủy đơn sau khi đã thanh toán không?",
    a: "Có thể hủy miễn phí trước khung giờ nhận ít nhất 2 tiếng. Sau thời điểm đó, đơn không thể hủy vì cửa hàng đã chuẩn bị Box.",
  },
  {
    q: "Cửa hàng hết box hoặc sản phẩm không đạt chất lượng?",
    a: "Bạn được hoàn 100% tiền hoặc đổi box tương đương. Với lỗi chất lượng, phản ánh kèm ảnh trong 24h để được hỗ trợ.",
  },
  {
    q: "CrumbUp có an toàn thực phẩm không?",
    a: "Có. Tất cả sản phẩm đều mới làm trong ngày, chưa bán hết trước giờ đóng cửa. Cửa hàng có nghĩa vụ kiểm tra chất lượng trước khi đóng Box.",
  },
];

const sectionStyle: React.CSSProperties = { scrollMarginTop: 100 };

export default function AboutPage() {
  return (
    <>
      <SiteHeader />

      {/* Clears the fixed glass header with a plain strip before the dark hero starts */}
      <div style={{ height: 73, background: "var(--ivory)" }} />

      {/* HERO + intro fill the first screen; Mission/Vision sits below the fold until scrolled to */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 73px)", position: "relative" }}>
        {/* HERO — full-width dark block, high contrast, no fabricated stats */}
        <section style={{
          background: "#2f2115",
          padding: "76px 24px",
          textAlign: "center",
        }}>
          <div className="container" style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 12, fontWeight: 700, color: "#2f2115",
              letterSpacing: "0.06em", textTransform: "uppercase",
              background: "var(--badge)", padding: "6px 14px", borderRadius: 999,
              marginBottom: 24,
            }}>
              Câu chuyện của chúng tôi
            </div>
            <h1 style={{ fontSize: 60, marginBottom: 20, lineHeight: 1.12, color: "var(--ivory)", letterSpacing: "-0.02em" }}>
              Save Every Crumb,<br />Share Every Value
            </h1>
            <p style={{ fontSize: 20, color: "rgba(253,245,230,0.72)", lineHeight: 1.8, maxWidth: 620, margin: "0 auto", fontStyle: "italic" }}>
              "Một mẩu bánh vụn không làm nên bữa ăn, nhưng triệu cánh tay gom nhặt sẽ thay đổi cả một số phận."
            </p>
          </div>
        </section>

        {/* GIỚI THIỆU — heading only; centers in the remaining viewport height */}
        <section id="about" style={{ ...sectionStyle, padding: "64px 0", background: "var(--ivory)", flex: 1, display: "flex", alignItems: "center" }}>
          <div className="container">
            <div data-reveal style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
                Our Identity
              </div>
              <h2 style={{ fontSize: 51, marginBottom: 16 }}>Giới thiệu chung</h2>
              <p style={{ fontSize: 18, color: "var(--text-muted)", maxWidth: 680, margin: "0 auto", lineHeight: 1.8 }}>
                CrumbUp là nền tảng công nghệ tác động xã hội tiên phong tại miền Trung Việt Nam, kết nối cửa hàng thực phẩm với người tiêu dùng để giải cứu thực phẩm dư cuối ngày và mang ưu đãi đến mọi thời điểm trong ngày — biến lãng phí thành giá trị.
              </p>
            </div>
          </div>
        </section>

        <ScrollArrow targetId="mission-vision" />
      </div>

      {/* MISSION / VISION — bold solid cards with initial badges */}
      <section id="mission-vision" style={{ padding: "56px 0 96px", background: "var(--ivory)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div data-reveal className="card-hover" style={{ background: "var(--primary-soft)", borderRadius: 20, padding: "40px 36px" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: "var(--primary)", color: "white",
                display: "grid", placeItems: "center", fontSize: 23, fontWeight: 800, marginBottom: 20,
              }}>M</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Sứ mệnh</div>
              <h3 style={{ fontSize: 28, marginBottom: 12 }}>Our Mission</h3>
              <p style={{ fontSize: 17, color: "var(--text)", lineHeight: 1.8 }}>
                Giải pháp công nghệ tinh gọn giúp cửa hàng — từ tiệm bánh, siêu thị đến hàng trái cây, đặc sản — tối ưu nguồn cung dôi dư giờ chót và chủ động thu hút khách bất kỳ lúc nào trong ngày, đồng thời giúp người trẻ tiếp cận thực phẩm chất lượng với chi phí tiết kiệm.
              </p>
            </div>
            <div data-reveal className="card-hover" style={{ background: "#e1f0e2", borderRadius: 20, padding: "40px 36px" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: "#2d6a31", color: "white",
                display: "grid", placeItems: "center", fontSize: 23, fontWeight: 800, marginBottom: 20,
              }}>V</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#2d6a31", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Tầm nhìn</div>
              <h3 style={{ fontSize: 28, marginBottom: 12 }}>Our Vision</h3>
              <p style={{ fontSize: 17, color: "var(--text)", lineHeight: 1.8 }}>
                Trở thành hệ sinh thái giải cứu thực phẩm dẫn dắt thị trường, định hình lối sống xanh và tiêu dùng có trách nhiệm tại các đô thị thông minh Việt Nam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HÀNH TRÌNH — dot + line timeline, clear numbered dots */}
      <section id="history" style={{ ...sectionStyle, padding: "96px 0", background: "var(--cream)" }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div data-reveal style={{ marginBottom: 44 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
              Our History
            </div>
            <h2 style={{ fontSize: 51, marginBottom: 10 }}>Hành trình CrumbUp</h2>
            <p style={{ fontSize: 17, color: "var(--text-muted)" }}>Từ một nghịch lý hằng ngày đến một nền tảng tác động xã hội</p>
          </div>

          <div data-reveal style={{ display: "flex", flexDirection: "column" }}>
            {journey.map((item, i) => (
              <div key={item.title} style={{ display: "grid", gridTemplateColumns: "32px 1fr", columnGap: 18 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 999, background: item.color,
                    display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, color: "white",
                    fontVariantNumeric: "tabular-nums", flexShrink: 0,
                  }}>{String(i + 1).padStart(2, "0")}</span>
                  {i < journey.length - 1 && (
                    <span style={{ width: 1, flex: 1, background: "var(--border-strong)", marginTop: 4 }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < journey.length - 1 ? 32 : 0 }}>
                  <span style={{
                    display: "inline-block", fontSize: 11, fontWeight: 800, color: "white",
                    background: item.color, padding: "4px 12px", borderRadius: 999,
                    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12,
                  }}>{item.tag}</span>
                  <h3 style={{ fontSize: 21, marginBottom: 8, fontWeight: 700 }}>{item.title}</h3>
                  <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GIÁ TRỊ CỐT LÕI — hairline numbered list */}
      <section id="values" style={{ ...sectionStyle, padding: "96px 0", background: "var(--ivory)" }}>
        <div className="container">
          <div data-reveal style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
              Our Core Values
            </div>
            <h2 style={{ fontSize: 51 }}>Năm giá trị cốt lõi</h2>
          </div>

          <div data-reveal style={{ display: "flex", flexDirection: "column" }}>
            {coreValues.map((v, i) => (
              <div key={v.title} style={{
                display: "grid", gridTemplateColumns: "40px 1fr 2fr", gap: 24,
                padding: "20px 0", borderTop: "1px solid var(--border)",
                borderBottom: i === coreValues.length - 1 ? "1px solid var(--border)" : undefined,
              }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--border-strong)", fontVariantNumeric: "tabular-nums" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{v.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{v.subtitle}</div>
                </div>
                <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESG — bold tinted stat cards */}
      <section id="esg" style={{ ...sectionStyle, padding: "96px 0", background: "var(--ivory)" }}>
        <div className="container">
          <div data-reveal style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
              Tiêu chuẩn ESG
            </div>
            <h2 style={{ fontSize: 51 }}>Cam kết bền vững</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {esgPillars.map((pillar, i) => (
              <div key={pillar.initial} className="card-hover" data-reveal data-reveal-delay={String(i + 1)} style={{
                background: pillar.bg, borderRadius: 20, padding: "32px 28px",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, background: pillar.badge, color: "white",
                  display: "grid", placeItems: "center", fontSize: 18, fontWeight: 800, marginBottom: 16,
                }}>{pillar.initial}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: pillar.statColor, marginBottom: 4 }}>
                  {pillar.end != null ? <CountUpNumber end={pillar.end} decimals={pillar.decimals} suffix={pillar.suffix} /> : pillar.stat}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: pillar.statColor, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>
                  {pillar.title}
                </div>
                <p style={{ fontSize: 16, color: pillar.textColor, lineHeight: 1.7 }}>{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MÔ HÌNH KINH DOANH */}
      <section id="business" style={{ ...sectionStyle, padding: "96px 0", background: "var(--cream)" }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div data-reveal style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
              Business Model
            </div>
            <h2 style={{ fontSize: 51, marginBottom: 10 }}>Mô hình Win — Win — Win</h2>
            <p style={{ fontSize: 17, color: "var(--text-muted)" }}>Vì con người, lợi nhuận và hành tinh</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 28 }}>
            {[
              { who: "Cửa hàng đối tác", win: "Tối ưu doanh thu từ hàng hao hụt giờ chót, đồng thời thu hút thêm khách bất kỳ giờ nào trong ngày." },
              { who: "Khách hàng", win: "Thực phẩm chất lượng cao, giá giảm 50–70%, giao dịch minh bạch." },
              { who: "Môi trường", win: "Mỗi box giải cứu là một bước nhỏ giảm rác thải hữu cơ và khí nhà kính." },
            ].map((item, i) => (
              <div key={i} className="card-hover" data-reveal data-reveal-delay={String(i + 1)} style={{
                background: "white", borderRadius: 20, padding: "28px 24px",
                border: "1px solid var(--border)", textAlign: "center",
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{item.who}</div>
                <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7 }}>{item.win}</p>
              </div>
            ))}
          </div>

          <div data-reveal style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1,
            background: "var(--border)", border: "1px solid var(--border)", borderRadius: 16,
            overflow: "hidden", marginBottom: 28,
          }}>
            <div style={{ background: "white", padding: "22px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary-dark)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                🎁 Hoa hồng Surprise Box
              </div>
              <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, margin: 0 }}>
                CrumbUp trích % nhỏ trên mỗi đơn giải cứu thành công — chỉ thu khi cửa hàng có doanh thu thực tế.
              </p>
            </div>
            <div style={{ background: "white", padding: "22px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6d28d9", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                🎟️ Phí niêm yết khuyến mãi
              </div>
              <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, margin: 0 }}>
                Cửa hàng trả phí như hình thức quảng cáo để đăng Chương trình khuyến mãi — chạy được bất kỳ lúc nào trong ngày, không chỉ cuối ngày.
              </p>
            </div>
          </div>

          <div data-reveal style={{
            borderLeft: "4px solid var(--accent)", padding: "24px 28px",
            background: "white", borderRadius: "0 16px 16px 0",
          }}>
            <p style={{ fontSize: 17, color: "var(--text)", lineHeight: 1.8, marginBottom: 8 }}>
              <strong>Giảm thiểu rác thải thực phẩm</strong> là hành động thiết thực nhất để đẩy lùi khủng hoảng khí hậu — góp phần vào mục tiêu giới hạn nhiệt độ Trái Đất dưới 2°C vào 2100.
            </p>
            <p style={{ fontSize: 15, color: "var(--text-muted)", fontStyle: "italic" }}>— Theo Project Drawdown</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ ...sectionStyle, padding: "96px 0", background: "var(--ivory)" }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div data-reveal style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontSize: 51 }}>Câu hỏi thường gặp</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {faqs.map((f, i) => (
              <details key={i} data-reveal data-reveal-delay={String(Math.min(i + 1, 4))} style={{
                borderTop: "1px solid var(--border)",
                borderBottom: i === faqs.length - 1 ? "1px solid var(--border)" : undefined,
              }}>
                <summary style={{
                  padding: "20px 0", fontSize: 17, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between", listStyle: "none",
                }}>
                  <span>{f.q}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 23, lineHeight: 1 }}>+</span>
                </summary>
                <div style={{ padding: "0 0 20px", fontSize: 16, color: "var(--text-muted)", lineHeight: 1.8 }}>{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 0 96px", background: "var(--ivory)" }}>
        <div className="container">
          <div data-reveal style={{
            background: "var(--text)", borderRadius: 24, padding: "64px 48px", textAlign: "center",
          }}>
            <h2 style={{ color: "white", fontSize: 46, marginBottom: 16, lineHeight: 1.15 }}>
              Sẵn sàng cứu món đầu tiên của bạn?
            </h2>
            <p style={{ fontSize: 18, color: "rgba(253,245,230,0.75)", maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.7 }}>
              Tham gia cộng đồng CrumbUp đang ăn ngon, tiết kiệm và sống xanh mỗi ngày.
            </p>
            <a href="/discover" className="btn btn-primary btn-lg">Khám phá Box ngay →</a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
