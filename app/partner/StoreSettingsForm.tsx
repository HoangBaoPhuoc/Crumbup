"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INDUSTRY_OPTIONS } from "@/lib/utils";

type StoreInfo = {
  name: string;
  address: string;
  phone: string | null;
  openHours: string | null;
  description: string | null;
  industry: string;
};

export default function StoreSettingsForm({ store }: { store: StoreInfo }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: store.name,
    address: store.address,
    phone: store.phone ?? "",
    openHours: store.openHours ?? "",
    description: store.description ?? "",
    industry: store.industry,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [saved, setSaved]     = useState(false);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); setSaved(false); }

  async function submit() {
    setError("");
    if (!form.name.trim()) { setError("Vui lòng nhập tên cửa hàng"); return; }
    if (!form.address.trim()) { setError("Vui lòng nhập địa chỉ cửa hàng"); return; }

    setLoading(true);
    const res = await fetch("/api/partner/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Lỗi lưu thông tin"); return; }
    setSaved(true);
    router.refresh();
  }

  return (
    <section style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", padding: "24px 28px", maxWidth: 560 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Tên cửa hàng" required>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} style={inp} />
        </Field>

        <Field label="Địa chỉ" required>
          <input value={form.address} onChange={(e) => set("address", e.target.value)} style={inp} />
        </Field>

        <Field label="Ngành hàng" required>
          <select value={form.industry} onChange={(e) => set("industry", e.target.value)} style={{ ...inp, appearance: "none", cursor: "pointer" }}>
            {INDUSTRY_OPTIONS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Quyết định danh mục sản phẩm có thể chọn khi tạo box</p>
        </Field>

        <Field label="Số điện thoại">
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={inp} />
        </Field>

        <Field label="Giờ mở – đóng cửa">
          <input value={form.openHours} onChange={(e) => set("openHours", e.target.value)} placeholder="07:00 – 22:00" style={inp} />
        </Field>

        <Field label="Mô tả ngắn">
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={{ ...inp, resize: "vertical" }} />
        </Field>
      </div>

      {error && (
        <div style={{ marginTop: 14, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 15, color: "#b91c1c" }}>
          {error}
        </div>
      )}
      {saved && !error && (
        <div style={{ marginTop: 14, padding: "10px 14px", background: "#e0f2fe", border: "1px solid #7dd3fc", borderRadius: 10, fontSize: 15, color: "#0369a1" }}>
          Đã lưu thông tin cửa hàng
        </div>
      )}

      <button onClick={submit} disabled={loading} style={{
        marginTop: 20, padding: "11px 22px", borderRadius: 10,
        background: loading ? "var(--primary-soft)" : "var(--primary)",
        color: loading ? "var(--primary)" : "white",
        border: "none", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
      }}>
        {loading ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>
        {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: "1px solid var(--border)", fontSize: 15,
  outline: "none", background: "var(--ivory)",
  boxSizing: "border-box", color: "var(--text)",
};

