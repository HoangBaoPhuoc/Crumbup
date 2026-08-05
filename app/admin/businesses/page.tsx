import { prisma } from "@/lib/prisma";
import AdminSearch from "../AdminSearch";

export const dynamic = "force-dynamic";

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page: pageStr = "1" } = await searchParams;
  const page  = Math.max(1, Number(pageStr));
  const limit = 20;

  const where = q ? {
    role: "BUSINESS" as const,
    OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { email: { contains: q, mode: "insensitive" as const } },
      { phone: { contains: q } },
    ],
  } : { role: "BUSINESS" as const };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, email: true, phone: true, createdAt: true,
        stores: {
          select: {
            id: true, name: true, address: true, verified: true,
            _count: { select: { boxes: true, orders: true } },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 25, fontWeight: 900, color: "#3d2f1f", marginBottom: 4 }}>Cửa hàng</h1>
        <p style={{ fontSize: 15, color: "#78716c" }}>{total.toLocaleString()} tài khoản doanh nghiệp</p>
      </div>

      <AdminSearch placeholder="Tìm theo tên, email, SĐT..." defaultValue={q} />

      <div style={{ background: "#ffffff", borderRadius: 14, border: "1px solid #e5d5c8", overflow: "hidden", marginTop: 14 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fefbf7" }}>
              {["Chủ tài khoản", "Email", "Cửa hàng", "Trạng thái", "Box / Đơn", "Ngày đăng ký"].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const store = u.stores[0];
              return (
                <tr key={u.id} style={{ borderTop: "1px solid #f0e5d8" }}>
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    {u.phone && <div style={{ fontSize: 12, color: "#78716c", marginTop: 2 }}>{u.phone}</div>}
                  </td>
                  <td style={{ ...td, color: "#78716c" }}>{u.email ?? "—"}</td>
                  <td style={td}>
                    {store ? (
                      <>
                        <div style={{ fontWeight: 600 }}>{store.name}</div>
                        <div style={{ fontSize: 12, color: "#78716c", marginTop: 2 }}>{store.address}</div>
                      </>
                    ) : (
                      <span style={{ color: "#c4a882" }}>Chưa có cửa hàng</span>
                    )}
                  </td>
                  <td style={td}>
                    {store ? (
                      <span style={{
                        padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                        background: store.verified ? "#dcfce7" : "#fef3c7",
                        color: store.verified ? "#15803d" : "#92400e",
                      }}>
                        {store.verified ? "Đã duyệt" : "Chờ duyệt"}
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ ...td, color: "#78716c" }}>
                    {store ? `${store._count.boxes} / ${store._count.orders}` : "—"}
                  </td>
                  <td style={{ ...td, color: "#78716c" }}>
                    {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#78716c", fontSize: 15 }}>Không có kết quả</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pages={pages} q={q} base="/admin/businesses" />
    </div>
  );
}

function Pagination({ page, pages, q, base }: { page: number; pages: number; q: string; base: string }) {
  if (pages <= 1) return null;
  const qs = q ? `&q=${encodeURIComponent(q)}` : "";
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 24 }}>
      {page > 1 && <a href={`${base}?page=${page - 1}${qs}`} style={pgBtn}>← Trước</a>}
      <span style={{ padding: "8px 14px", fontSize: 15, color: "#78716c" }}>Trang {page} / {pages}</span>
      {page < pages && <a href={`${base}?page=${page + 1}${qs}`} style={pgBtn}>Tiếp →</a>}
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "10px 20px", textAlign: "left", fontSize: 11,
  fontWeight: 700, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.05em",
};
const td: React.CSSProperties = { padding: "12px 20px", fontSize: 15, color: "#3d2f1f" };
const pgBtn: React.CSSProperties = {
  padding: "8px 14px", borderRadius: 8, background: "#ffffff",
  border: "1px solid #e5d5c8", fontSize: 15, fontWeight: 600,
  color: "#3d2f1f", textDecoration: "none",
};
