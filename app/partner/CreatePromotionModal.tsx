"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEAL_TYPE_OPTIONS, PROMOTION_KIND_OPTIONS, type PromotionKindValue } from "@/lib/utils";

const BUCKET = "box-images";

function vnToday() {
  return new Date(Date.now() + 7 * 60 * 60_000).toISOString().slice(0, 10);
}

export default function CreatePromotionModal() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState("");
  const [kind, setKind]         = useState<PromotionKindValue | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", image: "",
    dealType: "PERCENT_OFF", discountValue: "",
    validFrom: vnToday(), validUntil: vnToday(),
    totalCodes: "",
  });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  function reset() {
    setKind(null);
    setForm({ title: "", description: "", image: "", dealType: "PERCENT_OFF", discountValue: "", validFrom: vnToday(), validUntil: vnToday(), totalCodes: "" });
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Chỉ chấp nhận file ảnh"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Ảnh tối đa 5MB"); return; }

    setError("");
    setUploading(true);
    const supabase = createClient();
    const ext  = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
    if (upErr) { setError("Upload thất bại: " + upErr.message); setUploading(false); return; }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    set("image", data.publicUrl);
    setUploading(false);
  }

  async function submit() {
    setError("");
    if (!kind) { setError("Vui lòng chọn loại chương trình"); return; }
    if (!form.title.trim()) { setError("Vui lòng nhập tên chương trình"); return; }
    if (!form.validFrom || !form.validUntil) { setError("Vui lòng nhập thời gian hiệu lực"); return; }
    if (form.validUntil < form.validFrom) { setError("Ngày kết thúc phải sau ngày bắt đầu"); return; }
    if ((form.dealType === "PERCENT_OFF" || form.dealType === "FIXED_AMOUNT_OFF") && !form.discountValue) {
      setError("Vui lòng nhập giá trị chiết khấu"); return;
    }

    setLoading(true);
    const res = await fetch("/api/partner/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        kind,
        discountValue: form.discountValue ? Number(form.discountValue) : null,
        totalCodes: form.totalCodes ? Number(form.totalCodes) : null,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Lỗi tạo chương trình"); return; }
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        padding: "9px 18px", borderRadius: 10,
        background: "white", color: "var(--primary)",
        border: "1.5px solid var(--primary)", fontSize: 15, fontWeight: 700, cursor: "pointer",
      }}>
        🎟️ Tạo chương trình khuyến mãi
      </button>

      {open && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(61,47,31,0.45)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }} onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "white", borderRadius: 20, padding: "32px 32px 28px",
            width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 21, fontWeight: 900, color: "var(--text)" }}>Tạo chương trình khuyến mãi</h2>
              <button onClick={() => setOpen(false)} style={{ fontSize: 21, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>

            {!kind ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 4 }}>Chọn loại chương trình:</p>
                {PROMOTION_KIND_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setKind(opt.value)} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                    borderRadius: 14, border: "1.5px solid var(--border)", background: "white",
                    cursor: "pointer", textAlign: "left",
                  }}>
                    <span style={{ fontSize: 28 }}>{opt.emoji}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {opt.value === "PLATFORM_VOUCHER"
                          ? "Khách lấy mã trên nền tảng, mang tới cửa hàng để đổi ưu đãi"
                          : "Chỉ đăng thông tin quảng cáo, không có mã, không theo dõi sử dụng"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <button onClick={() => setKind(null)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", marginBottom: 16, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  ← Đổi loại chương trình
                </button>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Field label="Tên chương trình" required>
                    <input value={form.title} onChange={(e) => set("title", e.target.value)}
                      placeholder={kind === "PLATFORM_VOUCHER" ? "Giảm 20% cho đơn từ 100k" : "Black Friday - Giảm sốc 50%"} style={inp} />
                  </Field>

                  <Field label="Chi tiết">
                    <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                      placeholder="Điều kiện áp dụng, số lượng có hạn..." rows={2} style={{ ...inp, resize: "vertical" }} />
                  </Field>

                  <div style={{ display: "grid", gridTemplateColumns: form.dealType === "PERCENT_OFF" || form.dealType === "FIXED_AMOUNT_OFF" ? "1fr 1fr" : "1fr", gap: 12 }}>
                    <Field label="Loại ưu đãi" required>
                      <select value={form.dealType} onChange={(e) => set("dealType", e.target.value)} style={inp}>
                        {DEAL_TYPE_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </Field>
                    {(form.dealType === "PERCENT_OFF" || form.dealType === "FIXED_AMOUNT_OFF") && (
                      <Field label={form.dealType === "PERCENT_OFF" ? "Phần trăm giảm (%)" : "Số tiền giảm (đ)"} required>
                        <input type="number" value={form.discountValue} onChange={(e) => set("discountValue", e.target.value)}
                          placeholder={form.dealType === "PERCENT_OFF" ? "25" : "50000"} min="0" style={inp} />
                      </Field>
                    )}
                  </div>

                  {kind === "PLATFORM_VOUCHER" && (
                    <Field label="Số lượng mã tối đa">
                      <input type="number" value={form.totalCodes} onChange={(e) => set("totalCodes", e.target.value)}
                        placeholder="Để trống nếu không giới hạn" min="1" style={inp} />
                    </Field>
                  )}

                  <Field label="Ảnh minh họa">
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
                    {form.image ? (
                      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", height: 140, background: "var(--cream)" }}>
                        <img src={form.image} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button onClick={() => { set("image", ""); if (fileRef.current) fileRef.current.value = ""; }}
                          style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.55)", color: "white", border: "none", cursor: "pointer", fontSize: 16, display: "grid", placeItems: "center" }}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                        style={{ ...inp, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 80, cursor: uploading ? "not-allowed" : "pointer", border: "2px dashed var(--border)", background: "var(--ivory)", color: "var(--text-muted)", fontSize: 15, fontWeight: 600 }}>
                        {uploading ? "Đang upload..." : "Chọn ảnh (tối đa 5MB)"}
                      </button>
                    )}
                  </Field>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Bắt đầu" required>
                      <input type="date" value={form.validFrom} onChange={(e) => set("validFrom", e.target.value)} style={inp} />
                    </Field>
                    <Field label="Kết thúc" required>
                      <input type="date" value={form.validUntil} onChange={(e) => set("validUntil", e.target.value)} min={form.validFrom} style={inp} />
                    </Field>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 15, color: "#b91c1c" }}>
                {error}
              </div>
            )}

            {kind && (
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={() => setOpen(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid var(--border)", background: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", color: "var(--text-muted)" }}>
                  Hủy
                </button>
                <button onClick={submit} disabled={loading} style={{ flex: 2, padding: "11px", borderRadius: 10, background: loading ? "var(--primary-soft)" : "var(--primary)", color: loading ? "var(--primary)" : "white", border: "none", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? "Đang tạo..." : "Tạo chương trình"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
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
