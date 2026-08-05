import { prisma } from "@/lib/prisma";
import DatePicker from "./DatePicker";

export const dynamic = "force-dynamic";

function parseDate(str: string | undefined): Date {
  if (str && /^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str + "T00:00:00");
    if (!isNaN(d.getTime())) return d;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export default async function BoxesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateStr } = await searchParams;
  const day     = parseDate(dateStr);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  const boxes = await prisma.box.findMany({
    where: { date: { gte: day, lt: nextDay } },
    orderBy: [{ active: "desc" }, { store: { name: "asc" } }],
    select: {
      id: true, name: true, description: true,
      priceOriginal: true, priceSale: true,
      quantityTotal: true, quantityLeft: true,
      pickupStart: true, pickupEnd: true,
      active: true,
      store: { select: { id: true, name: true, address: true, verified: true } },
      _count: { select: { orderItems: true } },
    },
  });

  const activeCount = boxes.filter((b) => b.active).length;
  const soldTotal   = boxes.reduce((s, b) => s + (b.quantityTotal - b.quantityLeft), 0);
  const totalQty    = boxes.reduce((s, b) => s + b.quantityTotal, 0);
  const isoDate     = day.toISOString().slice(0, 10);
  const displayDate = day.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 25, fontWeight: 900, color: "#3d2f1f", marginBottom: 4 }}>Quan sát Box</h1>
        <p style={{ fontSize: 15, color: "#78716c" }}>{displayDate}</p>
      </div>

      <DatePicker currentDate={isoDate} />

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, margin: "18px 0" }}>
        {[
          { label: "Tổng box",        value: boxes.length },
          { label: "Đang hoạt động",  value: activeCount },
          { label: "Đã bán / Tổng",   value: `${soldTotal}/${totalQty}` },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#ffffff", borderRadius: 12, padding: "14px 18px",
            border: "1px solid #e5d5c8",
          }}>
            <div style={{ fontSize: 25, fontWeight: 900, color: "#3d2f1f" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#78716c", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Box list */}
      {boxes.length === 0 ? (
        <div style={{
          background: "#ffffff", borderRadius: 14, border: "1px solid #e5d5c8",
          padding: "60px 40px", textAlign: "center",
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#3d2f1f", marginBottom: 4 }}>Không có box nào</div>
          <div style={{ fontSize: 15, color: "#78716c" }}>Chưa có cửa hàng nào đăng box cho ngày này</div>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: 14, border: "1px solid #e5d5c8", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fefbf7" }}>
                {["Cửa hàng / Box", "Giá gốc → Sale", "Số lượng", "Giờ lấy", "Đã đặt", "Trạng thái"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {boxes.map((b) => {
                const sold = b.quantityTotal - b.quantityLeft;
                const pct  = b.quantityTotal > 0 ? Math.round((sold / b.quantityTotal) * 100) : 0;
                return (
                  <tr key={b.id} style={{ borderTop: "1px solid #f0e5d8", opacity: b.active ? 1 : 0.5 }}>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: "#78716c", marginTop: 2 }}>
                        {b.store.name}
                        {!b.store.verified && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: "#b87c52", fontWeight: 700 }}>· Chưa duyệt</span>
                        )}
                      </div>
                    </td>
                    <td style={td}>
                      <span style={{ color: "#c4a882", textDecoration: "line-through", fontSize: 12 }}>
                        {b.priceOriginal.toLocaleString("vi-VN")}đ
                      </span>
                      <span style={{ marginLeft: 8, fontWeight: 700, color: "#3d2f1f" }}>
                        {b.priceSale.toLocaleString("vi-VN")}đ
                      </span>
                      <div style={{ fontSize: 11, color: "#b87c52", marginTop: 2 }}>
                        -{Math.round((1 - b.priceSale / b.priceOriginal) * 100)}%
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{b.quantityLeft} còn / {b.quantityTotal}</div>
                      <div style={{ marginTop: 5, height: 5, background: "#f0e5d8", borderRadius: 999, overflow: "hidden", width: 72 }}>
                        <div style={{
                          height: "100%", width: `${pct}%`,
                          background: pct >= 80 ? "#b87c52" : "#c4a882",
                          borderRadius: 999,
                        }} />
                      </div>
                      <div style={{ fontSize: 11, color: "#78716c", marginTop: 2 }}>{pct}% bán</div>
                    </td>
                    <td style={{ ...td, color: "#78716c" }}>{b.pickupStart} – {b.pickupEnd}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{b._count.orderItems}</td>
                    <td style={td}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                        background: b.active ? "#f0e5d8" : "#f1f5f9",
                        color: b.active ? "#b87c52" : "#78716c",
                      }}>
                        {b.active ? "Đang mở" : "Đã đóng"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "10px 20px", textAlign: "left", fontSize: 11,
  fontWeight: 700, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.05em",
};
const td: React.CSSProperties = { padding: "12px 20px", fontSize: 15, color: "#3d2f1f" };
