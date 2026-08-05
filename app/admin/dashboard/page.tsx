import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDay = new Date(today);
  nextDay.setDate(nextDay.getDate() + 1);

  const [customers, businesses, pendingStores, todayBoxes, newUsersToday, recentUsers] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "BUSINESS" } }),
    prisma.store.count({ where: { verified: false } }),
    prisma.box.count({ where: { date: { gte: today, lt: nextDay }, active: true } }),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  const stats = [
    { label: "Khách hàng",       value: customers,      href: "/admin/customers",  alert: false },
    { label: "Cửa hàng",         value: businesses,     href: "/admin/businesses", alert: false },
    { label: "Chờ duyệt",        value: pendingStores,  href: "/admin/pending",    alert: pendingStores > 0 },
    { label: "Box hôm nay",      value: todayBoxes,     href: "/admin/boxes",      alert: false },
    { label: "Đăng ký hôm nay",  value: newUsersToday,  href: "/admin/customers",  alert: false },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 25, fontWeight: 900, color: "#3d2f1f", marginBottom: 4 }}>Tổng quan</h1>
        <p style={{ fontSize: 15, color: "#78716c" }}>
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 36 }}>
        {stats.map((s) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
            <div style={{
              background: "#ffffff", borderRadius: 14, padding: "18px 20px",
              border: s.alert ? "2px solid #b87c52" : "1px solid #e5d5c8",
              boxShadow: "0 1px 4px rgba(61,47,31,0.05)",
              cursor: "pointer",
            }}>
              <div style={{ fontSize: 35, fontWeight: 900, color: s.alert ? "#b87c52" : "#3d2f1f", lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: "#78716c", marginTop: 6, fontWeight: 500 }}>{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent signups */}
      <div style={{ background: "#ffffff", borderRadius: 14, border: "1px solid #e5d5c8", overflow: "hidden" }}>
        <div style={{
          padding: "16px 22px", borderBottom: "1px solid #f0e5d8",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#3d2f1f" }}>Đăng ký gần đây</h2>
          <Link href="/admin/customers" style={{ fontSize: 15, color: "#b87c52", fontWeight: 600 }}>Xem tất cả →</Link>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fefbf7" }}>
              {["Tên", "Email", "Loại tài khoản", "Ngày đăng ký"].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u) => (
              <tr key={u.id} style={{ borderTop: "1px solid #f0e5d8" }}>
                <td style={td}><span style={{ fontWeight: 600 }}>{u.name}</span></td>
                <td style={{ ...td, color: "#78716c" }}>{u.email ?? "—"}</td>
                <td style={td}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                    background: u.role === "BUSINESS" ? "#fef3c7" : "#e8f4fd",
                    color: u.role === "BUSINESS" ? "#92400e" : "#1e40af",
                  }}>
                    {u.role === "BUSINESS" ? "Cửa hàng" : "Khách hàng"}
                  </span>
                </td>
                <td style={{ ...td, color: "#78716c" }}>
                  {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                </td>
              </tr>
            ))}
            {recentUsers.length === 0 && (
              <tr><td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "#78716c", fontSize: 15 }}>Chưa có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "10px 22px", textAlign: "left", fontSize: 11,
  fontWeight: 700, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.05em",
};
const td: React.CSSProperties = { padding: "12px 22px", fontSize: 15, color: "#3d2f1f" };
