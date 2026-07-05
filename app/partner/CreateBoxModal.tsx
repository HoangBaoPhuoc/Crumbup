"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FOOD_CATEGORIES } from "@/lib/utils";

const BUCKET = "box-images";

function vnToday() {
  const d = new Date(Date.now() + 7 * 60 * 60_000);
  return d.toISOString().slice(0, 10);
}
function vnNowHHMM() {
  const d = new Date(Date.now() + 7 * 60 * 60_000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export default function CreateBoxModal({ storeAddress }: { storeAddress: string }) {
  const router    = useRouter();
  const fileRef   = useRef<HTMLInputElement>(null);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState("");
  const [form, setForm]         = useState({
    name: "", description: "", image: "",
    category: FOOD_CATEGORIES[0].value as string,
    priceOriginal: "", priceSale: "",
    quantityTotal: "5",
    pickupStart: "17:00", pickupEnd: "20:00",
    date: vnToday(),
  });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  const discount = form.priceOriginal && form.priceSale
    ? Math.round((1 - Number(form.priceSale) / Number(form.priceOriginal)) * 100)
    : null;

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
    if (!form.name.trim()) { setError("Vui lòng nhập tên box"); return; }
    if (!form.image) { setError("Vui lòng upload ảnh bìa"); return; }
    if (!form.priceOriginal || !form.priceSale) { setError("Vui lòng nhập giá"); return; }
    if (Number(form.priceSale) >= Number(form.priceOriginal)) { setError("Giá bán phải nhỏ hơn giá gốc"); return; }
    if (!form.quantityTotal || Number(form.quantityTotal) < 1) { setError("Số lượng phải ít nhất 1"); return; }
    if (form.pickupEnd <= form.pickupStart) { setError("Giờ kết thúc phải sau giờ bắt đầu"); return; }
    if (form.date === vnToday() && form.pickupEnd <= vnNowHHMM()) {
      setError("Giờ kết thúc nhận hàng đã qua — vui lòng cập nhật giờ"); return;
    }

    setLoading(true);
    const res = await fetch("/api/partner/boxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        priceOriginal: Number(form.priceOriginal),
        priceSale:     Number(form.priceSale),
        quantityTotal: Number(form.quantityTotal),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Lỗi tạo box"); return; }
    setOpen(false);
    setForm({ name: "", description: "", image: "", category: FOOD_CATEGORIES[0].value, priceOriginal: "", priceSale: "", quantityTotal: "5", pickupStart: "17:00", pickupEnd: "20:00", date: vnToday() });
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        padding: "9px 18px", borderRadius: 10,
        background: "var(--primary)", color: "white",
        border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
      }}>
        + Tạo box mới
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}>Tạo Surprise Box</h2>
              <button onClick={() => setOpen(false)} style={{ fontSize: 18, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Store address (read-only) */}
              <div style={{ padding: "10px 14px", background: "var(--ivory)", borderRadius: 10, border: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)" }}>
                <span style={{ fontWeight: 700, color: "var(--text)" }}>Địa chỉ nhận hàng: </span>{storeAddress}
              </div>

              <Field label="Tên box" required>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Box Bánh Ngọt Cuối Ngày" style={inp} />
              </Field>

              <Field label="Mô tả">
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                  placeholder="Nội dung bên trong box..." rows={2} style={{ ...inp, resize: "vertical" }} />
              </Field>

              <Field label="Loại đồ ăn" required>
                <select value={form.category} onChange={(e) => set("category", e.target.value)} style={inp}>
                  {FOOD_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Ảnh bìa" required>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile}
                  style={{ display: "none" }} />
                {form.image ? (
                  <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", height: 140, background: "var(--cream)" }}>
                    <img src={form.image} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button onClick={() => { set("image", ""); if (fileRef.current) fileRef.current.value = ""; }}
                      style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.55)", color: "white", border: "none", cursor: "pointer", fontSize: 14, display: "grid", placeItems: "center" }}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    style={{ ...inp, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 80, cursor: uploading ? "not-allowed" : "pointer", border: "2px dashed var(--border)", background: "var(--ivory)", color: "var(--text-muted)", fontSize: 13, fontWeight: 600 }}>
                    {uploading ? (
                      <>
                        <span style={{ width: 16, height: 16, border: "2px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                        Đang upload...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        Chọn ảnh (tối đa 5MB)
                      </>
                    )}
                  </button>
                )}
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Giá gốc (đ)" required>
                  <input type="number" value={form.priceOriginal} onChange={(e) => set("priceOriginal", e.target.value)} placeholder="120000" min="0" style={inp} />
                </Field>
                <Field label="Giá bán (đ)" required>
                  <input type="number" value={form.priceSale} onChange={(e) => set("priceSale", e.target.value)} placeholder="59000" min="0" style={inp} />
                  {discount !== null && discount > 0 && (
                    <p style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, marginTop: 4 }}>Giảm {discount}%</p>
                  )}
                </Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <Field label="Số lượng" required>
                  <input type="number" value={form.quantityTotal} onChange={(e) => set("quantityTotal", e.target.value)} min="1" max="100" style={inp} />
                </Field>
                <Field label="Nhận từ">
                  <input type="time" value={form.pickupStart} onChange={(e) => set("pickupStart", e.target.value)} style={inp} />
                </Field>
                <Field label="Đến">
                  <input type="time" value={form.pickupEnd} onChange={(e) => set("pickupEnd", e.target.value)} style={inp} />
                </Field>
              </div>

              <Field label="Ngày bán" required>
                <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} min={vnToday()} style={inp} />
              </Field>
            </div>

            {error && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#b91c1c" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setOpen(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid var(--border)", background: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--text-muted)" }}>
                Hủy
              </button>
              <button onClick={submit} disabled={loading} style={{ flex: 2, padding: "11px", borderRadius: 10, background: loading ? "var(--primary-soft)" : "var(--primary)", color: loading ? "var(--primary)" : "white", border: "none", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Đang tạo..." : "Tạo box"}
              </button>
            </div>
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
  border: "1px solid var(--border)", fontSize: 13,
  outline: "none", background: "var(--ivory)",
  boxSizing: "border-box", color: "var(--text)",
};

