import { prisma } from "@/lib/prisma";
import AdminSearch from "../AdminSearch";
import PendingActions from "./PendingActions";

export const dynamic = "force-dynamic";

export default async function PendingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page: pageStr = "1" } = await searchParams;
  const page  = Math.max(1, Number(pageStr));
  const limit = 20;

  const where = q ? {
    verified: false,
    OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { address: { contains: q, mode: "insensitive" as const } },
      { owner: { name: { contains: q, mode: "insensitive" as const } } },
      { owner: { email: { contains: q, mode: "insensitive" as const } } },
    ],
  } : { verified: false };

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, address: true, phone: true,
        description: true, openHours: true, createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.store.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 25, fontWeight: 900, color: "#3d2f1f", marginBottom: 4 }}>Phê duyệt cửa hàng</h1>
        <p style={{ fontSize: 15, color: total > 0 ? "#b87c52" : "#78716c", fontWeight: total > 0 ? 600 : 400 }}>
          {total > 0 ? `${total.toLocaleString()} cửa hàng chờ duyệt` : "Không có cửa hàng nào chờ duyệt"}
        </p>
      </div>

      <AdminSearch placeholder="Tìm theo tên cửa hàng, địa chỉ, chủ cửa hàng..." defaultValue={q} />

      {stores.length === 0 ? (
        <div style={{
          background: "#ffffff", borderRadius: 14, border: "1px solid #e5d5c8",
          padding: "60px 40px", textAlign: "center", marginTop: 14,
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#3d2f1f", marginBottom: 4 }}>Tất cả đã được xử lý</div>
          <div style={{ fontSize: 15, color: "#78716c" }}>Không có cửa hàng nào đang chờ phê duyệt</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          {stores.map((s) => (
            <div key={s.id} style={{
              background: "#ffffff", borderRadius: 14, border: "1px solid #e5d5c8",
              padding: "20px 24px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#3d2f1f", margin: 0 }}>{s.name}</h3>
                    <span style={{
                      padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                      background: "#fef3c7", color: "#92400e",
                    }}>
                      Chờ duyệt
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "6px 24px" }}>
                    <Info label="Địa chỉ" value={s.address} />
                    <Info label="Điện thoại" value={s.phone ?? "—"} />
                    <Info label="Giờ mở cửa" value={s.openHours ?? "—"} />
                    <Info label="Chủ sở hữu" value={`${s.owner.name} · ${s.owner.email ?? "—"}`} />
                    <Info label="Đăng ký" value={new Date(s.createdAt).toLocaleString("vi-VN")} />
                  </div>

                  {s.description && (
                    <div style={{
                      marginTop: 10, padding: "9px 12px", background: "#fefbf7",
                      borderRadius: 8, fontSize: 15, color: "#78716c", border: "1px solid #f0e5d8",
                    }}>
                      {s.description}
                    </div>
                  )}
                </div>

                <PendingActions storeId={s.id} storeName={s.name} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pages={pages} q={q} base="/admin/pending" />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ fontSize: 15 }}>
      <span style={{ color: "#78716c", fontWeight: 600 }}>{label}: </span>
      <span style={{ color: "#3d2f1f" }}>{value}</span>
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

const pgBtn: React.CSSProperties = {
  padding: "8px 14px", borderRadius: 8, background: "#ffffff",
  border: "1px solid #e5d5c8", fontSize: 15, fontWeight: 600,
  color: "#3d2f1f", textDecoration: "none",
};
