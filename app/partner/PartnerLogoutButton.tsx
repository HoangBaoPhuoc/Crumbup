"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PartnerLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={logout}
      disabled={busy}
      className="partner-logout-btn"
      style={{
        width: "100%", padding: "8px 0", borderRadius: 8,
        border: "1px solid var(--border)",
        fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
        cursor: busy ? "not-allowed" : "pointer",
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? "Đang đăng xuất..." : "Đăng xuất"}
    </button>
  );
}
