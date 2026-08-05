"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 15 }}>
      Đăng xuất
    </button>
  );
}
