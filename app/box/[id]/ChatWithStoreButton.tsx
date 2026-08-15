"use client";

import Link from "next/link";
import { openChat } from "@/components/chat/chatBus";

export default function ChatWithStoreButton({
  storeId, boxId, isLoggedIn,
}: {
  storeId: string; boxId: string; isLoggedIn: boolean;
}) {
  if (!isLoggedIn) {
    return (
      <Link href={`/login?redirect=/box/${boxId}`} style={{
        display: "block", width: "100%", marginTop: 10, padding: 13, fontSize: 15,
        fontWeight: 700, borderRadius: 12, border: "1px solid var(--border)", color: "var(--text-muted)",
        textAlign: "center", textDecoration: "none",
      }}>
        Đăng nhập để nhắn tin với cửa hàng
      </Link>
    );
  }

  return (
    <button onClick={() => openChat({ storeId })} style={{
      display: "block", width: "100%", marginTop: 10, padding: 13, fontSize: 15,
      fontWeight: 700, borderRadius: 12, border: "1px solid var(--border)", color: "var(--text-muted)",
      background: "white", cursor: "pointer", textAlign: "center",
    }}>
      Nhắn tin với cửa hàng
    </button>
  );
}
