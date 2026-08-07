import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ScrollArrow from "@/components/ScrollArrow";

const businessBenefits = [
  {
    tag: "Dòng tiền",
    tagColor: "var(--primary-dark)",
    title: "Thu hồi chi phí, tối ưu dòng tiền",
    desc: "Thay vì chịu lỗ kép, đóng gói hàng dư thành Surprise Box biến khoản chi phí chìm thành nguồn doanh thu ổn định mỗi tháng.",
  },
  {
    tag: "Khách hàng mới",
    tagColor: "var(--primary)",
    title: "Tiếp cận khách hàng tiềm năng",
    desc: "Khách đến lấy box thường mua thêm đồ trong quán, tăng doanh thu mỗi lượt ghé thăm mà không tốn một đồng quảng cáo.",
  },
  {
    tag: "Thương hiệu xanh",
    tagColor: "#2d6a31",
    title: "Thương hiệu xanh chạm đến giới trẻ",
    desc: "Gen Z và Millennials ưu tiên thương hiệu có trách nhiệm môi trường. Mỗi box giải cứu là một điểm cộng hình ảnh không mất phí.",
  },
];

const operationSteps = [
  { step: "01", title: "Đăng ký & Tạo hộp", desc: "Điền form, xác nhận khung giờ và chuyển khoản phí đăng ký." },
  { step: "02", title: "Khách đặt trước", desc: "Người dùng tìm cửa hàng trên bản đồ, đặt trước Surprise Box hoặc chọn Chương trình khuyến mãi." },
  { step: "03", title: "Trao hàng tại quầy", desc: "Kiểm tra mã đơn hàng của khách và trao đúng sản phẩm/ưu đãi." },
  { step: "04", title: "Theo dõi doanh thu", desc: "Quản lý dòng tiền ngay trên app, nhận thanh toán định kỳ." },
];

const storeCategories = [
  { initial: "BK", color: "var(--primary)", label: "Bakery & Café", title: "Tiệm bánh & quán cà phê" },
  { initial: "SM", color: "var(--accent)", label: "Siêu thị & tiện lợi", title: "Siêu thị mini, cửa hàng tiện lợi" },
  { initial: "PR", color: "var(--primary-dark)", label: "Trái cây & rau củ", title: "Cửa hàng trái cây, rau củ quả tươi" },
  { initial: "LS", color: "#2d6a31", label: "Đồ hộp & đặc sản", title: "Đồ hộp, đặc sản đóng gói" },
];

const partnerFaqs = [
  {
    q: "Phí dịch vụ tính như thế nào?",
    a: "Không phí khởi tạo, không phí duy trì. Mức phí hợp tác cụ thể sẽ được tư vấn riêng theo hình thức và quy mô cửa hàng của bạn, liên hệ đội ngũ CrumbUp để nhận báo giá chi tiết.",
  },
  {
    q: "Có cần đầu tư bao bì riêng không?",
    a: "Bạn có thể dùng túi giấy hoặc hộp carton sẵn có. App còn khuyến khích khách tự mang hộp khi chọn hình thức tự đến lấy.",
  },
  {
    q: "Khách đặt rồi không đến lấy thì sao?",
    a: "Khách thanh toán 100% trước, đơn mới hoàn tất. Quá giờ không đến thì đơn vẫn tính thành công, cửa hàng không thiệt.",
  },
  {
    q: "Có thể thay đổi số lượng & giờ mỗi ngày không?",
    a: "Hoàn toàn chủ động. Số lượng box và khung giờ nhận do cửa hàng tự cài đặt mỗi ngày theo lượng hàng dôi dư thực tế.",
  },
  {
    q: "Chương trình khuyến mãi khác Surprise Box thế nào?",
    a: "Surprise Box ẩn nội dung, khách không biết trước sẽ nhận được gì, phù hợp để xử lý hàng dư cuối ngày. Chương trình khuyến mãi thì ngược lại: bạn chủ động chọn đúng deal muốn đăng (giảm giá khung giờ, mua 1 tặng 1...), khách thấy rõ và chọn đúng ưu đãi đó, chạy được bất kỳ lúc nào trong ngày, không chỉ cuối ngày.",
  },
];

export default function ForStoresPage() {
  return (
    <>
      <SiteHeader />

      {/* HERO + Surprise Box cards fill the first screen together; rest sits below the fold */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative" }}>
        {/* HERO — left-aligned, no floating stickers */}
        <section style={{ background: "var(--ivory)", padding: "160px 0 64px" }}>
          <div className="container" style={{ maxWidth: 760 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>
              Dành cho cửa hàng
            </div>
            <h1 style={{ fontSize: 55, marginBottom: 20, lineHeight: 1.15, letterSpacing: "-0.02em", maxWidth: 620 }}>
              Kinh doanh <span style={{ color: "var(--primary)" }}>cả ngày</span>, không chỉ lúc sắp đóng cửa
            </h1>
            <p style={{ fontSize: 18, color: "var(--text-muted)", lineHeight: 1.8, maxWidth: 560, marginBottom: 32 }}>
              Giải cứu hàng dư cuối ngày với Surprise Box, hoặc chủ động thu hút thêm khách hàng bất kỳ giờ nào với Chương trình khuyến mãi, CrumbUp kết nối cửa hàng của bạn với khách hàng xung quanh.
            </p>
            <a href="/register/business" className="btn btn-primary btn-lg">Đăng ký đối tác ngay →</a>
          </div>
        </section>

        {/* 2 HÌNH THỨC HỢP TÁC — Surprise Box vs Chương trình khuyến mãi, side by side */}
        <section style={{ padding: "0 0 80px", background: "var(--ivory)", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="container">
            <div data-reveal style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                2 hình thức hợp tác
              </div>
              <h2 style={{ fontSize: 30 }}>Dù cuối ngày hay giữa trưa, luôn có cách để bán được hàng</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div data-reveal style={{ background: "var(--primary-soft)", borderRadius: 20, padding: "36px 32px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary-dark)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                  🎁 Surprise Box · Cuối ngày
                </div>
                <h3 style={{ fontSize: 25, marginBottom: 12 }}>Giải cứu hàng dư, thu hồi chi phí</h3>
                <p style={{ fontSize: 17, color: "var(--text)", lineHeight: 1.8 }}>
                  Cuối ngày, gom sản phẩm chưa kịp bán vào Surprise Box, nội dung bí ẩn, giá giảm sâu tới 50%. Khách đặt trước trên app, đến nhận đúng giờ.
                </p>
              </div>
              <div data-reveal style={{ background: "#ede9fe", borderRadius: 20, padding: "36px 32px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6d28d9", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                  🎟️ Chương trình khuyến mãi · Bất kỳ giờ nào
                </div>
                <h3 style={{ fontSize: 25, marginBottom: 12 }}>Thu hút thêm khách hàng, kể cả ban ngày</h3>
                <p style={{ fontSize: 17, color: "var(--text)", lineHeight: 1.8 }}>
                  Đăng đúng deal bạn muốn chạy, giảm giá theo khung giờ, mua 1 tặng 1... Khách thấy rõ và chọn đúng ưu đãi, không có yếu tố bất ngờ.
                </p>
              </div>
            </div>
            <p data-reveal style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 24, textAlign: "center" }}>
              Chi tiết hợp tác và chi phí sẽ được đội ngũ CrumbUp tư vấn riêng khi bạn đăng ký.
            </p>
          </div>
        </section>

        <ScrollArrow targetId="business-benefits" />
      </div>

      {/* LỢI ÍCH KINH DOANH — tinted cards with tag pill */}
      <section id="business-benefits" style={{ padding: "80px 0", background: "var(--cream)" }}>
        <div className="container">
          <div data-reveal style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
              Tại sao chọn CrumbUp
            </div>
            <h2 style={{ fontSize: 46 }}>Lợi ích thực tế cho cửa hàng đối tác</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {businessBenefits.map((item, i) => (
              <div key={item.title} className="card-hover" data-reveal data-reveal-delay={String(i + 1)} style={{
                background: "white", borderRadius: 18, padding: "30px 28px",
              }}>
                <span style={{
                  display: "inline-block", fontSize: 11, fontWeight: 800, color: "white",
                  background: item.tagColor, padding: "4px 12px", borderRadius: 999,
                  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16,
                }}>{item.tag}</span>
                <h3 style={{ fontSize: 21, marginBottom: 10, fontWeight: 700, lineHeight: 1.35 }}>{item.title}</h3>
                <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.75 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VẬN HÀNH — hàng ngang chia hairline, số ghost */}
      <section style={{ padding: "80px 0", background: "var(--ivory)" }}>
        <div className="container">
          <div data-reveal style={{ marginBottom: 44 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
              Đơn giản - 4 bước
            </div>
            <h2 style={{ fontSize: 46 }}>Vận hành như thế nào?</h2>
          </div>

          <div data-reveal style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
            {operationSteps.map((item, i) => (
              <div key={item.step} style={{
                paddingLeft: i === 0 ? 0 : 24,
                paddingRight: i === operationSteps.length - 1 ? 0 : 24,
                borderRight: i === operationSteps.length - 1 ? "none" : "1px solid var(--border)",
              }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: "var(--border)", marginBottom: 12 }}>{item.step}</div>
                <h3 style={{ fontSize: 18, marginBottom: 10, fontWeight: 700 }}>{item.title}</h3>
                <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DANH MỤC CỬA HÀNG — flat list with initial badges */}
      <section style={{ padding: "80px 0", background: "var(--cream)" }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div data-reveal style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
              Ai phù hợp?
            </div>
            <h2 style={{ fontSize: 46, marginBottom: 10 }}>Danh mục cửa hàng</h2>
            <p style={{ fontSize: 17, color: "var(--text-muted)" }}>Có hàng dư cuối ngày hay muốn chạy khuyến mãi ban ngày, cửa hàng nào cũng tham gia được.</p>
          </div>

          <div data-reveal style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1,
            background: "var(--border)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden",
          }}>
            {storeCategories.map((cat) => (
              <div key={cat.title} style={{ background: "white", padding: "22px 26px", display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 10, background: cat.color, color: "white",
                  display: "grid", placeItems: "center", fontSize: 15, fontWeight: 800, flexShrink: 0,
                }}>{cat.initial}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text)" }}>{cat.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNER FAQs */}
      <section style={{ padding: "80px 0", background: "var(--ivory)" }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div data-reveal style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
              FAQ
            </div>
            <h2 style={{ fontSize: 46 }}>Câu hỏi thường gặp</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {partnerFaqs.map((item, i) => (
              <details key={i} data-reveal data-reveal-delay={String(Math.min(i + 1, 4))} style={{
                borderTop: "1px solid var(--border)",
                borderBottom: i === partnerFaqs.length - 1 ? "1px solid var(--border)" : undefined,
              }}>
                <summary style={{
                  padding: "20px 0", fontSize: 17, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between", listStyle: "none",
                }}>
                  <span>{item.q}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 23, lineHeight: 1 }}>+</span>
                </summary>
                <div style={{ padding: "0 0 20px", fontSize: 16, color: "var(--text-muted)", lineHeight: 1.8 }}>{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 0 96px", background: "var(--ivory)" }}>
        <div className="container">
          <div data-reveal style={{
            background: "var(--text)", borderRadius: 24, padding: "56px 64px", textAlign: "center",
          }}>
            <h2 style={{ color: "white", fontSize: 41, marginBottom: 16, lineHeight: 1.15 }}>
              Sẵn sàng tham gia CrumbUp?
            </h2>
            <p style={{ fontSize: 17, color: "rgba(253,245,230,0.75)", maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.7 }}>
              Hãy cho sản phẩm cuối ngày của bạn một cơ hội thứ hai, hoặc bắt đầu chạy Chương trình khuyến mãi ngay hôm nay. Không phí khởi tạo, không ràng buộc.
            </p>
            <a href="/register/business" className="btn btn-primary btn-lg">Đăng ký đối tác ngay →</a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
