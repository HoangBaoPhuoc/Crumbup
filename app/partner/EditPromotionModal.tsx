"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEAL_TYPE_OPTIONS, promotionKindLabel, PROMO_IMAGE_ASPECT } from "@/lib/utils";
import ImageCropper from "./ImageCropper";

const BUCKET = "box-images";
const IMAGE_ASPECT = PROMO_IMAGE_ASPECT;

function vnToday() {
  return new Date(Date.now() + 7 * 60 * 60_000).toISOString().slice(0, 10);
}

type PromotionData = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  image: string | null;
  dealType: string | null;
  discountValue: number | null;
  validFrom: Date | string;
  validUntil: Date | string;
  totalCodes: number | null;
};

export default function EditPromotionModal({ promotion, onClose }: { promotion: PromotionData; onClose: () => void }) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const [cropSource, setCropSource] = useState<File | string | null>(null);
  const [publishMode, setPublishMode] = useState<"now" | "schedule">(
    new Date(promotion.validFrom).toISOString().slice(0, 10) > vnToday() ? "schedule" : "now"
  );
  const [form, setForm] = useState({
    title:         promotion.title,
    description:   promotion.description ?? "",
    image:         promotion.image ?? "",
    dealType:      promotion.dealType ?? "OTHER",
    discountValue: promotion.discountValue != null ? String(promotion.discountValue) : "",
    validFrom:     new Date(promotion.validFrom).toISOString().slice(0, 10),
    validUntil:    new Date(promotion.validUntil).toISOString().slice(0, 10),
    totalCodes:    promotion.totalCodes != null ? String(promotion.totalCodes) : "",
  });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Chỉ chấp nhận file ảnh"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Ảnh tối đa 5MB"); return; }
    setError("");
    setCropSource(file);
  }

  async function handleCropped(blob: Blob) {
    setCropSource(null);
    if (fileRef.current) fileRef.current.value = "";
    setUploading(true);
    const supabase = createClient();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: false, contentType: "image/jpeg" });
    if (upErr) { setError("Upload thất bại: " + upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    set("image", data.publicUrl);
    setUploading(false);
  }

  async function submit() {
    setError("");
    if (!form.title.trim()) { setError("Vui lòng nhập tên chương trình"); return; }
    if (form.validUntil < form.validFrom) { setError("Ngày kết thúc phải sau ngày bắt đầu"); return; }
    if ((form.dealType === "PERCENT_OFF" || form.dealType === "FIXED_AMOUNT_OFF") && !form.discountValue) {
      setError("Vui lòng nhập giá trị chiết khấu"); return;
    }
    if (promotion.kind === "STORE_ANNOUNCEMENT" && !form.image) { setError("Vui lòng chọn ảnh minh họa"); return; }
    if (promotion.kind === "PLATFORM_VOUCHER") {
      const oldTotal = promotion.totalCodes;
      const newTotal = form.totalCodes ? Number(form.totalCodes) : null;
      if (oldTotal == null && newTotal != null) {
        setError("Chương trình đang không giới hạn số mã — không thể đặt giới hạn thấp hơn"); return;
      }
      if (oldTotal != null && newTotal != null && newTotal < oldTotal) {
        setError(`Không thể giảm số lượng mã (hiện tại: ${oldTotal}), chỉ được tăng`); return;
      }
    }

    setLoading(true);
    const res = await fetch(`/api/partner/promotions/${promotion.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        discountValue: form.discountValue ? Number(form.discountValue) : null,
        totalCodes: form.totalCodes ? Number(form.totalCodes) : null,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Lỗi cập nhật chương trình"); return; }
    onClose();
    router.refresh();
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(61,47,31,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "white", borderRadius: 20, padding: "32px 32px 28px",
        width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ fontSize: 21, fontWeight: 900, color: "var(--text)" }}>Sửa chương trình khuyến mãi</h2>
          <button onClick={onClose} style={{ fontSize: 21, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "var(--ivory)", borderRadius: 999, fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 20 }}>
          {promotionKindLabel(promotion.kind)}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Tên chương trình" required>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} style={inp} />
          </Field>

          <Field label="Chi tiết">
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={2} style={{ ...inp, resize: "vertical" }} />
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
                <input type="number" value={form.discountValue} onChange={(e) => set("discountValue", e.target.value)} min="0" style={inp} />
              </Field>
            )}
          </div>

          {promotion.kind === "PLATFORM_VOUCHER" && (
            <Field label="Số lượng mã tối đa">
              <input type="number" value={form.totalCodes} onChange={(e) => set("totalCodes", e.target.value)}
                placeholder={promotion.totalCodes != null ? "Không giới hạn" : "Để trống nếu không giới hạn"}
                min={promotion.totalCodes ?? 1} style={inp} />
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                {promotion.totalCodes != null
                  ? `Hiện tại: ${promotion.totalCodes} mã. Chỉ có thể tăng, không thể giảm.`
                  : "Chương trình đang không giới hạn số mã."}
              </div>
            </Field>
          )}

          {promotion.kind === "STORE_ANNOUNCEMENT" && (
            <Field label="Ảnh minh họa" required>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
              {cropSource ? (
                <ImageCropper source={cropSource} aspect={IMAGE_ASPECT}
                  onCancel={() => { setCropSource(null); if (fileRef.current) fileRef.current.value = ""; }}
                  onCropped={handleCropped} />
              ) : form.image ? (
                <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: IMAGE_ASPECT, background: "var(--cream)" }}>
                  <img src={form.image} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={() => { set("image", ""); if (fileRef.current) fileRef.current.value = ""; }}
                    style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.55)", color: "white", border: "none", cursor: "pointer", fontSize: 16, display: "grid", placeItems: "center" }}>✕</button>
                  <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => setCropSource(form.image)} disabled={uploading}
                      style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(0,0,0,0.55)", color: "white", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                      Chỉnh sửa
                    </button>
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                      style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(0,0,0,0.55)", color: "white", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                      {uploading ? "Đang upload..." : "Đổi ảnh"}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  style={{ ...inp, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 80, cursor: uploading ? "not-allowed" : "pointer", border: "2px dashed var(--border)", background: "var(--ivory)", color: "var(--text-muted)", fontSize: 15, fontWeight: 600 }}>
                  {uploading ? "Đang upload..." : "Chọn ảnh"}
                </button>
              )}
            </Field>
          )}

          <Field label="Thời điểm đăng" required>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => { setPublishMode("now"); set("validFrom", vnToday()); }}
                style={publishMode === "now" ? toggleBtnActive : toggleBtn}>
                Đăng ngay lập tức
              </button>
              <button type="button" onClick={() => setPublishMode("schedule")}
                style={publishMode === "schedule" ? toggleBtnActive : toggleBtn}>
                Lên lịch đăng
              </button>
            </div>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: publishMode === "schedule" ? "1fr 1fr" : "1fr", gap: 12 }}>
            {publishMode === "schedule" && (
              <Field label="Ngày bắt đầu" required>
                <input type="date" value={form.validFrom} min={vnToday()} onChange={(e) => set("validFrom", e.target.value)} style={inp} />
              </Field>
            )}
            <Field label="Kết thúc" required>
              <input type="date" value={form.validUntil} onChange={(e) => set("validUntil", e.target.value)} min={form.validFrom} style={inp} />
            </Field>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 15, color: "#b91c1c" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid var(--border)", background: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", color: "var(--text-muted)" }}>
            Hủy
          </button>
          <button onClick={submit} disabled={loading} style={{ flex: 2, padding: "11px", borderRadius: 10, background: loading ? "var(--primary-soft)" : "var(--primary)", color: loading ? "var(--primary)" : "white", border: "none", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
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

const toggleBtn: React.CSSProperties = {
  flex: 1, padding: "10px 12px", borderRadius: 10,
  border: "1px solid var(--border)", background: "var(--ivory)",
  fontSize: 13, fontWeight: 600, color: "var(--text-muted)", cursor: "pointer",
};

const toggleBtnActive: React.CSSProperties = {
  ...toggleBtn,
  border: "1.5px solid var(--primary)", background: "var(--primary-soft)", color: "var(--primary-dark)",
};
