import { redirect } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import MessengerView from "@/components/chat/MessengerView";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <SiteHeader />
      <main style={{ height: "100vh", background: "var(--ivory)", paddingTop: 80, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ maxWidth: 1600, width: "100%", margin: "0 auto", padding: "24px 32px 32px", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ marginBottom: 18, flexShrink: 0 }}>
            <Link href="/orders" style={{ fontSize: 15, color: "var(--text-muted)", fontWeight: 600, textDecoration: "none" }}>
              ← Đơn hàng của tôi
            </Link>
            <h1 style={{ fontSize: 25, fontWeight: 900, color: "var(--text)", marginTop: 8, marginBottom: 0 }}>
              Tin nhắn
            </h1>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <MessengerView emptyText="Chưa có cuộc trò chuyện nào. Mở một cửa hàng hoặc box và nhấn “Nhắn tin” để liên hệ khi cần." />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
